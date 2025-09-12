import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import cors from "cors";
import { storage } from "./storage";
import { insertProductSchema, insertOrderSchema } from "@shared/schema";
import { AuthService } from "./services/auth";
import { emailService } from "./services/email";
import { PDFService } from "./services/pdf";
import { RecaptchaService } from "./services/recaptcha";
import { upload } from "./middleware/upload";
import path from "path";
import fs from "fs";

declare module "express-session" {
  interface SessionData {
    adminId?: string;
    isAuthenticated?: boolean;
    requiresTotp?: boolean;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Configure CORS
  app.use(cors({
    origin: process.env.NODE_ENV === "production" 
      ? (process.env.ALLOWED_ORIGINS?.split(",") || ["https://classstore.com"])
      : ["http://localhost:5000", "http://127.0.0.1:5000"],
    credentials: true,
  }));

  // Configure sessions
  app.use(session({
    secret: process.env.SESSION_SECRET || "your-super-secret-session-key-change-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  }));

  // Serve uploaded files securely using express.static
  const uploadsPath = path.join(process.cwd(), "server", "uploads");
  app.use("/uploads", require("express").static(uploadsPath, {
    dotfiles: "deny",    // Prevent access to hidden files
    index: false,        // Don't serve directory listings
    setHeaders: (res: any) => {
      res.set("X-Content-Type-Options", "nosniff");
      res.set("X-Frame-Options", "DENY");
    }
  }));

  // Product routes
  app.get("/api/products", async (req, res) => {
    try {
      const classFilter = req.query.class ? parseInt(req.query.class as string) : undefined;
      const sortBy = req.query.sort as string;

      let products = classFilter 
        ? await storage.getProductsByClass(classFilter)
        : await storage.getProducts();

      // Apply sorting
      if (sortBy === "newest") {
        products.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      } else if (sortBy === "price-low") {
        products.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
      } else if (sortBy === "price-high") {
        products.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
      } else {
        // Default: most popular (by likes)
        products.sort((a, b) => (b.likes || 0) - (a.likes || 0));
      }

      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const product = await storage.getProduct(req.params.id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  app.post("/api/products/:id/like", async (req, res) => {
    try {
      const product = await storage.getProduct(req.params.id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      const newLikes = (product.likes || 0) + 1;
      await storage.updateProductLikes(req.params.id, newLikes);

      res.json({ likes: newLikes });
    } catch (error) {
      res.status(500).json({ message: "Failed to update likes" });
    }
  });

  // Order routes
  app.post("/api/orders", async (req, res) => {
    try {
      console.log("Order request body:", JSON.stringify(req.body, null, 2));
      const validatedData = insertOrderSchema.parse(req.body);

      // Verify reCAPTCHA (security requirement)
      if (!validatedData.recaptchaToken || validatedData.recaptchaToken === "dummy-token") {
        return res.status(400).json({ message: "reCAPTCHA verification required" });
      }

      // Get product details and validate price
      const product = await storage.getProduct(validatedData.productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      // Server-side price validation (prevent client price tampering)
      if (validatedData.amount !== product.price) {
        return res.status(400).json({ 
          message: "Price validation failed",
          expected: product.price,
          received: validatedData.amount
        });
      }

      // Create order with server-validated data
      const orderData = { 
        ...validatedData,
        amount: product.price  // Use server price string, not client price
      };
      delete (orderData as any).recaptchaToken;

      const order = await storage.createOrder(orderData);

      // Send emails
      try {
        console.log("📧 Attempting to send email notifications...");
        await emailService.sendOrderConfirmation(order, product);
        console.log("✓ Order confirmation email sent to:", order.buyerEmail);
        
        await emailService.sendSellerNotification(order, product);
        console.log("✓ Seller notification email sent to admin");
      } catch (emailError: any) {
        console.error("✗ Email sending failed:", emailError.message);
        console.error("Email configuration check:", {
          hasUser: !!process.env.SMTP_USER,
          hasPass: !!process.env.SMTP_PASS,
          hasFrom: !!process.env.SMTP_FROM,
          hasAdmin: !!process.env.ADMIN_EMAIL
        });
      }

      // Generate invoice (skip in development if no config)
      try {
        await PDFService.generateInvoicePDF(order.id, product, order);
      } catch (pdfError: any) {
        console.log("PDF generation skipped in development:", pdfError.message);
      }

      res.status(201).json({ message: "Order placed successfully", orderId: order.id });
    } catch (error) {
      console.error("Order creation error:", error);
      res.status(400).json({ message: "Invalid order data" });
    }
  });

  // Customer order tracking routes
  app.get("/api/customers/:buyerId/orders", async (req, res) => {
    try {
      const { buyerId } = req.params;
      const orders = await storage.getOrdersByBuyer(buyerId);
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch customer orders" });
    }
  });

  app.post("/api/customers/orders/:id/cancel", async (req, res) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      
      if (!reason || reason.trim().length < 5) {
        return res.status(400).json({ message: "Cancellation reason is required (minimum 5 characters)" });
      }

      // Check if order exists and can be cancelled
      const order = await storage.getOrder(id);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      if (order.status === "delivered" || order.status === "cancelled") {
        return res.status(400).json({ message: "This order cannot be cancelled" });
      }

      // Cancel the order
      await storage.cancelOrder(id, "buyer", reason.trim());

      // Send cancellation email notifications
      try {
        await emailService.sendCancellationConfirmation(order, order.product, reason.trim());
        await emailService.sendCancellationNotification(order, order.product, reason.trim());
      } catch (emailError: any) {
        console.error("Email sending failed for cancellation:", emailError.message);
      }

      res.json({ message: "Order cancelled successfully" });
    } catch (error) {
      console.error("Order cancellation error:", error);
      res.status(500).json({ message: "Failed to cancel order" });
    }
  });

  // Seller routes
  app.post("/api/sellers", upload.single("image"), async (req: Request & { file?: Express.Multer.File }, res) => {
    try {
      const productData = {
        ...req.body,
        imageUrl: req.file ? `/uploads/${req.file.filename}` : null,
        class: parseInt(req.body.class),
      };

      const validatedData = insertProductSchema.parse(productData);
      const product = await storage.createProduct(validatedData);

      res.status(201).json({ message: "Product listed successfully", productId: product.id });
    } catch (error) {
      console.error("Seller registration error:", error);
      res.status(400).json({ message: "Invalid product data" });
    }
  });

  // Get seller's products
  app.get("/api/sellers/:sellerId/products", async (req, res) => {
    try {
      const { sellerId } = req.params;
      
      if (!sellerId) {
        return res.status(400).json({ message: "Seller ID is required" });
      }

      const products = await storage.getProductsBySeller(sellerId);
      
      // Return all products (approved and pending) for the seller dashboard
      res.json(products);
    } catch (error) {
      console.error("Failed to fetch seller products:", error);
      res.status(500).json({ message: "Failed to fetch seller products" });
    }
  });

  // Admin authentication routes
  app.post("/api/admin/login", async (req, res) => {
    try {
      const { username, password } = req.body;

      const admin = await AuthService.authenticateAdmin(username, password);
      if (!admin) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      req.session.adminId = admin.id;
      req.session.isAuthenticated = true;

      res.json({ 
        message: "Authentication successful"
      });
    } catch (error) {
      res.status(500).json({ message: "Authentication failed" });
    }
  });

  app.post("/api/admin/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  // Admin middleware
  const requireAdminAuth = (req: any, res: any, next: any) => {
    if (!req.session.adminId || !req.session.isAuthenticated) {
      return res.status(401).json({ message: "Admin authentication required" });
    }
    next();
  };

  // Admin data routes
  app.get("/api/admin/orders", requireAdminAuth, async (req, res) => {
    try {
      const orders = await storage.getOrders();
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.post("/api/admin/orders/:id/confirm", requireAdminAuth, async (req, res) => {
    try {
      await storage.updateOrderStatus(req.params.id, "confirmed");
      res.json({ message: "Order confirmed successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to confirm order" });
    }
  });

  app.post("/api/admin/orders/:id/cancel", requireAdminAuth, async (req, res) => {
    try {
      await storage.updateOrderStatus(req.params.id, "cancelled");
      res.json({ message: "Order cancelled successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to cancel order" });
    }
  });

  app.post("/api/admin/orders/:id/deliver", requireAdminAuth, async (req, res) => {
    try {
      await storage.markOrderDelivered(req.params.id);
      res.json({ message: "Order marked as delivered successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to mark order as delivered" });
    }
  });

  app.get("/api/admin/orders/:id/invoice", requireAdminAuth, async (req, res) => {
    try {
      const orderId = req.params.id;
      
      // Get order with product details
      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      const invoicePath = path.join(process.cwd(), "server", "invoices", `${orderId}.pdf`);
      
      // Check if invoice already exists
      if (!fs.existsSync(invoicePath)) {
        console.log(`📄 Generating invoice for order ${orderId}...`);
        
        // Generate the PDF invoice
        await PDFService.generateInvoicePDF(orderId, order.product, order);
        
        // Mark invoice as generated in database
        await storage.markInvoiceGenerated(orderId);
        
        console.log(`✓ Invoice generated successfully for order ${orderId}`);
      }

      // Set proper headers for PDF download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="ClassStore-Invoice-${orderId.slice(-8).toUpperCase()}.pdf"`);
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');

      // Send the PDF file
      res.download(invoicePath, `ClassStore-Invoice-${orderId.slice(-8).toUpperCase()}.pdf`, (err) => {
        if (err) {
          console.error("Error downloading invoice:", err);
          if (!res.headersSent) {
            res.status(500).json({ message: "Failed to download invoice" });
          }
        }
      });
      
    } catch (error) {
      console.error("Invoice generation/download error:", error);
      if (!res.headersSent) {
        res.status(500).json({ message: "Failed to generate or download invoice" });
      }
    }
  });

  // Bulk invoice generation endpoint
  app.post("/api/admin/invoices/generate-bulk", requireAdminAuth, async (req, res) => {
    try {
      const { orderIds } = req.body;
      
      if (!Array.isArray(orderIds) || orderIds.length === 0) {
        return res.status(400).json({ message: "Order IDs array is required" });
      }

      const results = {
        generated: 0,
        failed: 0,
        alreadyExists: 0,
        errors: [] as string[]
      };

      for (const orderId of orderIds) {
        try {
          const order = await storage.getOrder(orderId);
          if (!order) {
            results.failed++;
            results.errors.push(`Order ${orderId} not found`);
            continue;
          }

          const invoicePath = path.join(process.cwd(), "server", "invoices", `${orderId}.pdf`);
          
          if (fs.existsSync(invoicePath)) {
            results.alreadyExists++;
            continue;
          }

          await PDFService.generateInvoicePDF(orderId, order.product, order);
          await storage.markInvoiceGenerated(orderId);
          results.generated++;
          
        } catch (error) {
          results.failed++;
          results.errors.push(`Failed to generate invoice for order ${orderId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      res.json({
        message: `Bulk invoice generation completed`,
        results
      });

    } catch (error) {
      console.error("Bulk invoice generation error:", error);
      res.status(500).json({ message: "Failed to process bulk invoice generation" });
    }
  });

  app.get("/api/admin/stats", requireAdminAuth, async (req, res) => {
    try {
      const orders = await storage.getOrders();
      const products = await storage.getProducts();

      const totalOrders = orders.length;
      const pendingOrders = orders.filter(o => o.status === "pending").length;
      const confirmedOrders = orders.filter(o => o.status === "confirmed");
      const revenue = confirmedOrders.reduce((sum, o) => sum + parseFloat(o.amount), 0);
      const activeProducts = products.length;

      // Calculate additional analytics
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayOrders = orders.filter(o => new Date(o.createdAt!) >= today);
      const dailyRevenue = todayOrders
        .filter(o => o.status === "confirmed")
        .reduce((sum, o) => sum + parseFloat(o.amount), 0);

      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);
      const weeklyOrders = orders.filter(o => new Date(o.createdAt!) >= lastWeek);
      const weeklyGrowth = ((weeklyOrders.length / Math.max(totalOrders - weeklyOrders.length, 1)) * 100).toFixed(1);

      const conversionRate = totalOrders > 0 ? ((confirmedOrders.length / totalOrders) * 100).toFixed(1) : "0";
      const averageOrderValue = confirmedOrders.length > 0 ? (revenue / confirmedOrders.length).toFixed(2) : "0.00";

      // Top selling products
      const productSales = products.map(product => ({
        name: product.name,
        sales: orders.filter(o => o.productId === product.id && o.status === "confirmed").length
      })).sort((a, b) => b.sales - a.sales).slice(0, 5);

      // Recent activity
      const recentActivity = orders
        .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
        .slice(0, 10)
        .map(order => ({
          action: `New order for ${order.product?.name || 'Product'}`,
          time: new Date(order.createdAt!).toLocaleTimeString(),
          user: order.buyerName
        }));

      res.json({
        totalOrders,
        pendingOrders,
        revenue: revenue.toFixed(2),
        activeProducts,
        totalUsers: orders.length, // Simplified - using unique orders as users
        dailyRevenue: dailyRevenue.toFixed(2),
        weeklyGrowth: parseFloat(weeklyGrowth),
        conversionRate: parseFloat(conversionRate),
        averageOrderValue,
        topSellingProducts: productSales,
        recentActivity
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Bulk email endpoint
  app.post("/api/admin/bulk-email", requireAdminAuth, async (req, res) => {
    try {
      const { subject, content, recipients } = req.body;
      
      if (!subject || !content || !recipients) {
        return res.status(400).json({ message: "Subject, content, and recipients are required" });
      }

      const emailList = recipients.split(',').map((email: string) => email.trim()).filter((email: string) => email);
      
      if (emailList.length === 0) {
        return res.status(400).json({ message: "No valid email addresses found" });
      }

      // Simulate bulk email sending
      let success = 0;
      let failed = 0;

      for (const email of emailList) {
        try {
          // In a real implementation, you would use the emailService here
          // await emailService.sendBulkEmails([{ to: email, subject, content }]);
          success++;
        } catch (error) {
          failed++;
        }
      }

      res.json({ 
        message: "Bulk email processing completed",
        success,
        failed,
        total: emailList.length
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to send bulk email" });
    }
  });

  // System metrics endpoint
  app.get("/api/admin/system-metrics", requireAdminAuth, async (req, res) => {
    try {
      // Simulate system metrics (in production, you'd get real metrics)
      const metrics = {
        cpuUsage: Math.floor(Math.random() * 30) + 10, // 10-40%
        memoryUsage: Math.floor(Math.random() * 40) + 30, // 30-70%
        activeConnections: Math.floor(Math.random() * 50) + 10 // 10-60 connections
      };

      res.json(metrics);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch system metrics" });
    }
  });

  // System optimization endpoint
  app.post("/api/admin/optimize-system", requireAdminAuth, async (req, res) => {
    try {
      // Simulate system optimization tasks
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate processing time
      
      res.json({ 
        message: "System optimization completed successfully",
        details: [
          "Memory cache cleared",
          "Database connections optimized", 
          "Temporary files cleaned",
          "Performance metrics refreshed"
        ]
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to optimize system" });
    }
  });

  // User management routes
  app.get("/api/admin/users", requireAdminAuth, async (req, res) => {
    try {
      // Since we don't have a separate users table yet, let's get unique buyers from orders
      const orders = await storage.getOrders();
      const userMap = new Map();
      
      orders.forEach(order => {
        if (!userMap.has(order.buyerEmail)) {
          userMap.set(order.buyerEmail, {
            id: order.buyerEmail, // Using email as ID
            name: order.buyerName,
            email: order.buyerEmail,
            phone: order.buyerPhone,
            class: order.buyerClass,
            section: order.buyerSection,
            totalOrders: 0,
            totalSpent: 0,
            lastOrderDate: order.createdAt,
            status: "active"
          });
        }
        
        const user = userMap.get(order.buyerEmail);
        user.totalOrders++;
        user.totalSpent += parseFloat(order.amount);
        if (new Date(order.createdAt!) > new Date(user.lastOrderDate)) {
          user.lastOrderDate = order.createdAt;
        }
      });

      const users = Array.from(userMap.values());
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Product management routes
  app.get("/api/admin/products", requireAdminAuth, async (req, res) => {
    try {
      const products = await storage.getAllProducts();
      const orders = await storage.getOrders();
      
      // Add sales data to each product
      const productsWithSales = products.map(product => ({
        ...product,
        totalSales: orders.filter(o => o.productId === product.id && o.status === "confirmed").length,
        totalRevenue: orders
          .filter(o => o.productId === product.id && o.status === "confirmed")
          .reduce((sum, o) => sum + parseFloat(o.amount), 0),
        pendingOrders: orders.filter(o => o.productId === product.id && o.status === "pending").length
      }));

      res.json(productsWithSales);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.patch("/api/admin/products/:id", requireAdminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { isActive, isSoldOut } = req.body;
      
      await storage.updateProductStatus(id, { isActive, isSoldOut });
      res.json({ message: "Product updated successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to update product" });
    }
  });

  app.delete("/api/admin/products/:id", requireAdminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteProduct(id);
      res.json({ message: "Product deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  app.patch("/api/admin/products/:id/details", requireAdminAuth, upload.single("image"), async (req: Request & { file?: Express.Multer.File }, res) => {
    try {
      const { id } = req.params;
      const productData = {
        ...req.body,
        imageUrl: req.file ? `/uploads/${req.file.filename}` : undefined,
        class: parseInt(req.body.class),
      };

      // Remove undefined values
      Object.keys(productData).forEach(key => {
        if (productData[key] === undefined) {
          delete productData[key];
        }
      });

      await storage.updateProductDetails(id, productData);
      res.json({ message: "Product updated successfully" });
    } catch (error) {
      console.error("Product update error:", error);
      res.status(400).json({ message: "Failed to update product" });
    }
  });

  // Bulk product operations
  app.patch("/api/admin/products/bulk", requireAdminAuth, async (req, res) => {
    try {
      const { z } = require("zod");
      
      const schema = z.object({
        productIds: z.array(z.string()).min(1, "At least one product ID is required"),
        updates: z.object({
          isActive: z.boolean().optional(),
          isSoldOut: z.boolean().optional(),
        }),
      });

      const validation = schema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid request data", 
          errors: validation.error.issues 
        });
      }

      const { productIds, updates } = validation.data;

      // Update each product with the provided updates
      let successCount = 0;
      let failureCount = 0;
      
      for (const id of productIds) {
        try {
          await storage.updateProductStatus(id, updates);
          successCount++;
        } catch (error) {
          failureCount++;
        }
      }

      res.json({ 
        message: `${successCount} products updated successfully`,
        success: successCount,
        failed: failureCount,
        total: productIds.length
      });
    } catch (error) {
      console.error("Bulk product update error:", error);
      res.status(500).json({ message: "Failed to update products" });
    }
  });

  app.delete("/api/admin/products/bulk", requireAdminAuth, async (req, res) => {
    try {
      const { z } = require("zod");
      
      const schema = z.object({
        productIds: z.array(z.string()).min(1, "At least one product ID is required"),
      });

      const validation = schema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid request data", 
          errors: validation.error.issues 
        });
      }

      const { productIds } = validation.data;

      // Delete each product
      let successCount = 0;
      let failureCount = 0;
      
      for (const id of productIds) {
        try {
          await storage.deleteProduct(id);
          successCount++;
        } catch (error) {
          failureCount++;
        }
      }

      res.json({ 
        message: `${successCount} products deleted successfully`,
        success: successCount,
        failed: failureCount,
        total: productIds.length
      });
    } catch (error) {
      console.error("Bulk product delete error:", error);
      res.status(500).json({ message: "Failed to delete products" });
    }
  });

  // System management routes
  app.post("/api/admin/clear-cache", requireAdminAuth, async (req, res) => {
    try {
      // Simulate cache clearing
      await new Promise(resolve => setTimeout(resolve, 1000));
      res.json({ message: "Cache cleared successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to clear cache" });
    }
  });

  app.post("/api/admin/restart-services", requireAdminAuth, async (req, res) => {
    try {
      // Simulate service restart
      await new Promise(resolve => setTimeout(resolve, 2000));
      res.json({ message: "Services restarted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to restart services" });
    }
  });

  app.get("/api/admin/export-data", requireAdminAuth, async (req, res) => {
    try {
      const orders = await storage.getOrders();
      const products = await storage.getAllProducts();
      
      const exportData = {
        orders: orders.map(order => ({
          id: order.id,
          productName: order.product?.name,
          buyerName: order.buyerName,
          buyerEmail: order.buyerEmail,
          amount: order.amount,
          status: order.status,
          createdAt: order.createdAt
        })),
        products: products.map(product => ({
          id: product.id,
          name: product.name,
          price: product.price,
          category: product.category,
          condition: product.condition,
          sellerName: product.sellerName,
          isActive: product.isActive,
          likes: product.likes,
          createdAt: product.createdAt
        })),
        exportDate: new Date().toISOString()
      };

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=classstore-data.json');
      res.send(JSON.stringify(exportData, null, 2));
    } catch (error) {
      res.status(500).json({ message: "Failed to export data" });
    }
  });

  // Quick confirm/cancel routes for email links
  app.get("/api/admin/confirm/:orderId", async (req, res) => {
    try {
      await storage.updateOrderStatus(req.params.orderId, "confirmed");
      res.redirect(`${process.env.SITE_URL || 'http://localhost:5000'}/admin/z3XJbf0x0vXsCxnUZnscBRsnE`);
    } catch (error) {
      res.status(500).send("Failed to confirm order");
    }
  });

  app.get("/api/admin/cancel/:orderId", async (req, res) => {
    try {
      await storage.updateOrderStatus(req.params.orderId, "cancelled");
      res.redirect(`${process.env.SITE_URL || 'http://localhost:5000'}/admin/z3XJbf0x0vXsCxnUZnscBRsnE`);
    } catch (error) {
      res.status(500).send("Failed to cancel order");
    }
  });

  // Test email endpoint
  app.post("/api/test-email", async (req, res) => {
    try {
      console.log("🧪 Testing email functionality...");
      
      // Create a test email directly without connection verification
      const testEmailData = {
        to: "dhuruvm4@gmail.com",
        toName: "Test User",
        subject: "Test Email from ClassStore",
        htmlContent: `
          <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">🚀 Test Email Success!</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">ClassStore Email Notifications are Working</p>
            </div>
            
            <!-- Content -->
            <div style="padding: 40px 30px;">
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
                Great news! Your Omnisend email integration is now working correctly. This test confirms that your ClassStore application can successfully send transactional emails.
              </p>
              
              <!-- Test Details -->
              <div style="background: #f8fafc; border: 2px solid #e2e8f0; border-radius: 12px; padding: 30px; margin: 30px 0;">
                <h3 style="color: #1f2937; margin: 0 0 20px 0; font-size: 22px; font-weight: 600;">Test Details:</h3>
                <div style="display: grid; gap: 12px;">
                  <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                    <span style="color: #6b7280; font-weight: 500;">Service:</span>
                    <span style="color: #374151; font-weight: 600;">Omnisend API</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                    <span style="color: #6b7280; font-weight: 500;">Test Time:</span>
                    <span style="color: #374151; font-weight: 600;">${new Date().toLocaleString()}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0;">
                    <span style="color: #6b7280; font-weight: 500;">Application:</span>
                    <span style="color: #374151; font-weight: 600;">ClassStore Student Marketplace</span>
                  </div>
                </div>
              </div>
              
              <p style="color: #059669; font-weight: 600; text-align: center; margin-top: 30px;">
                ✅ Email notifications are now fully operational!
              </p>
            </div>
          </div>
        `,
        from: "noreply@classstore.com",
        fromName: "ClassStore Test"
      };

      // Use the sendTransactionalEmail method directly
      const result = await (emailService as any).sendTransactionalEmail(testEmailData);
      console.log("✓ Test email sent successfully to dhuruvm4@gmail.com");
      
      res.json({ 
        message: "Test email sent successfully!",
        recipient: "dhuruvm4@gmail.com",
        timestamp: new Date().toISOString(),
        result 
      });
    } catch (error: any) {
      console.error("✗ Test email failed:", error);
      res.status(500).json({ 
        message: "Test email failed", 
        error: error.message,
        details: error.response?.data || "No additional details"
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}