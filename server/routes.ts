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

  // Serve uploaded files
  app.use("/uploads", (req, res, next) => {
    const uploadsPath = path.join(process.cwd(), "server", "uploads");
    const filePath = path.join(uploadsPath, req.path);

    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.status(404).json({ message: "File not found" });
    }
  });

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

      // CAPTCHA verification removed for simplified authentication

      // Get product details
      const product = await storage.getProduct(validatedData.productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      // Create order
      const orderData = { ...validatedData };
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

  app.get("/api/admin/orders/:id/invoice", requireAdminAuth, async (req, res) => {
    try {
      const invoicePath = path.join(process.cwd(), "server", "invoices", `${req.params.id}.pdf`);

      if (fs.existsSync(invoicePath)) {
        res.download(invoicePath);
      } else {
        res.status(404).json({ message: "Invoice not found" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to download invoice" });
    }
  });

  app.get("/api/admin/stats", requireAdminAuth, async (req, res) => {
    try {
      const orders = await storage.getOrders();
      const products = await storage.getProducts();

      const totalOrders = orders.length;
      const pendingOrders = orders.filter(o => o.status === "pending").length;
      const revenue = orders
        .filter(o => o.status === "confirmed")
        .reduce((sum, o) => sum + parseFloat(o.amount), 0);
      const activeProducts = products.length;

      res.json({
        totalOrders,
        pendingOrders,
        revenue: revenue.toFixed(2),
        activeProducts,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch stats" });
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

  const httpServer = createServer(app);
  return httpServer;
}