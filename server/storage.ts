import { type User, type InsertUser, type Product, type InsertProduct, type Order, type InsertOrder, type Admin, type InsertAdmin } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Product methods
  getProducts(): Promise<Product[]>;
  getAllProducts(): Promise<Product[]>;
  getApprovedProducts(): Promise<Product[]>;
  getPendingProducts(): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProductLikes(id: string, likes: number): Promise<void>;
  getProductsByClass(classNum: number): Promise<Product[]>;
  getProductsBySeller(sellerId: string): Promise<Product[]>;
  updateProductStatus(id: string, status: { isActive?: boolean; isSoldOut?: boolean }): Promise<void>;
  updateProductApproval(id: string, status: "approved" | "rejected", adminId: string, reason?: string): Promise<void>;
  deleteProduct(id: string): Promise<void>;
  updateProductDetails(id: string, updates: Partial<Product>): Promise<void>;

  // Order methods
  getOrders(): Promise<(Order & { product: Product })[]>;
  getOrdersByBuyer(buyerId: string): Promise<(Order & { product: Product })[]>;
  getOrder(id: string): Promise<(Order & { product: Product }) | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrderStatus(id: string, status: "pending" | "confirmed" | "delivered" | "cancelled", cancelledBy?: string, reason?: string): Promise<void>;
  markOrderDelivered(id: string): Promise<void>;
  cancelOrder(id: string, cancelledBy: string, reason: string): Promise<void>;
  markInvoiceGenerated(id: string): Promise<void>;

  // Admin methods
  getAdmin(id: string): Promise<Admin | undefined>;
  getAdminByUsername(username: string): Promise<Admin | undefined>;
  createAdmin(admin: InsertAdmin): Promise<Admin>;
  updateAdminTotpSecret(id: string, secret: string): Promise<void>;
  setAdminSetup(id: string): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private products: Map<string, Product>;
  private orders: Map<string, Order>;
  private admins: Map<string, Admin>;

  constructor() {
    this.users = new Map();
    this.products = new Map();
    this.orders = new Map();
    this.admins = new Map();
    this.seedData();
  }

  private seedData() {
    // Create sample products
    const sampleProducts: Product[] = [
      {
        id: randomUUID(),
        name: "Advanced Mathematics Textbook",
        description: "Grade 10 mathematics textbook in excellent condition",
        price: "45.00",
        class: 10,
        section: "A",
        imageUrl: "https://images.unsplash.com/photo-1509228468518-180dd4864904?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250",
        sellerName: "Sarah Wilson",
        sellerPhone: "+1234567890",
        sellerEmail: "sarah.wilson@school.edu",
        sellerId: "seller_001",
        likes: 15,
        isActive: true,
        isSoldOut: false,
        approvalStatus: "approved",
        approvedAt: new Date(),
        approvedBy: "admin_001",
        rejectionReason: null,
        category: "Textbooks",
        condition: "Excellent",
        createdAt: new Date(),
      },
      {
        id: randomUUID(),
        name: "Complete Stationery Set",
        description: "Brand new stationery set with pens, pencils, ruler, and notebooks",
        price: "25.00",
        class: 8,
        section: "B",
        imageUrl: "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250",
        sellerName: "Mike Johnson",
        sellerPhone: "+1234567891",
        sellerEmail: "mike.johnson@school.edu",
        sellerId: "seller_002",
        likes: 8,
        isActive: true,
        isSoldOut: false,
        approvalStatus: "approved",
        approvedAt: new Date(),
        approvedBy: "admin_001",
        rejectionReason: null,
        category: "Stationery",
        condition: "New",
        createdAt: new Date(),
      },
      {
        id: randomUUID(),
        name: "Scientific Calculator TI-84",
        description: "Barely used TI-84 calculator perfect for advanced mathematics",
        price: "120.00",
        class: 11,
        section: "C",
        imageUrl: "https://images.unsplash.com/photo-1611224923853-80b023f02d71?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250",
        sellerName: "Emma Davis",
        sellerPhone: "+1234567892",
        sellerEmail: "emma.davis@school.edu",
        sellerId: "seller_003",
        likes: 23,
        isActive: true,
        isSoldOut: false,
        approvalStatus: "approved",
        approvedAt: new Date(),
        approvedBy: "admin_001",
        rejectionReason: null,
        category: "Electronics",
        condition: "Like New",
        createdAt: new Date(),
      },
      {
        id: randomUUID(),
        name: "Chemistry Lab Kit",
        description: "Complete chemistry lab equipment set",
        price: "85.00",
        class: 12,
        section: "A",
        imageUrl: "https://images.unsplash.com/photo-1582719471384-894fbb16e074?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250",
        sellerName: "Alex Chen",
        sellerPhone: "+1234567893",
        sellerEmail: "alex.chen@school.edu",
        sellerId: "seller_004",
        likes: 12,
        isActive: true,
        isSoldOut: false,
        approvalStatus: "approved",
        approvedAt: new Date(),
        approvedBy: "admin_001",
        rejectionReason: null,
        category: "Lab Equipment",
        condition: "Good",
        createdAt: new Date(),
      },
      // Add some inactive products to test admin panel
      {
        id: randomUUID(),
        name: "Old Physics Textbook (SOLD)",
        description: "Physics textbook - already sold to another student",
        price: "35.00",
        class: 11,
        section: "B",
        imageUrl: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250",
        sellerName: "John Smith",
        sellerPhone: "+1234567894",
        sellerEmail: "john.smith@school.edu",
        sellerId: "seller_005",
        likes: 5,
        isActive: false,
        isSoldOut: true,
        approvalStatus: "approved",
        approvedAt: new Date(),
        approvedBy: "admin_001",
        rejectionReason: null,
        category: "Textbooks",
        condition: "Good",
        createdAt: new Date(),
      },
      {
        id: randomUUID(),
        name: "Deactivated Art Supplies",
        description: "Art supplies set - temporarily deactivated by admin",
        price: "15.00",
        class: 9,
        section: "A",
        imageUrl: "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250",
        sellerName: "Lisa Brown",
        sellerPhone: "+1234567895",
        sellerEmail: "lisa.brown@school.edu",
        sellerId: "seller_006",
        likes: 3,
        isActive: false,
        isSoldOut: false,
        approvalStatus: "approved",
        approvedAt: new Date(),
        approvedBy: "admin_001",
        rejectionReason: null,
        category: "Art Supplies",
        condition: "Good",
        createdAt: new Date(),
      },
    ];

    sampleProducts.forEach(product => {
      this.products.set(product.id, product);
    });

    // Create admin user - generate fresh hash
    const adminId = randomUUID();
    this.admins.set(adminId, {
      id: adminId,
      username: "admin",
      password: "$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi", // password
      totpSecret: null,
      isSetup: false,
    });
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Product methods
  async getProducts(): Promise<Product[]> {
    return Array.from(this.products.values()).filter(p => p.isActive);
  }

  async getAllProducts(): Promise<Product[]> {
    return Array.from(this.products.values());
  }

  async getProduct(id: string): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const id = randomUUID();
    const product: Product = {
      ...insertProduct,
      id,
      description: insertProduct.description || null,
      imageUrl: insertProduct.imageUrl || null,
      sellerEmail: insertProduct.sellerEmail || null,
      sellerId: insertProduct.sellerId || null,
      category: insertProduct.category || "General",
      condition: insertProduct.condition || "Good",
      likes: 0,
      isActive: true,
      isSoldOut: false,
      approvalStatus: "pending",
      approvedAt: null,
      approvedBy: null,
      rejectionReason: null,
      createdAt: new Date(),
    };
    this.products.set(id, product);
    return product;
  }

  async updateProductLikes(id: string, likes: number): Promise<void> {
    const product = this.products.get(id);
    if (product) {
      product.likes = likes;
      this.products.set(id, product);
    }
  }

  async getApprovedProducts(): Promise<Product[]> {
    return Array.from(this.products.values()).filter(p => p.approvalStatus === "approved");
  }

  async getPendingProducts(): Promise<Product[]> {
    return Array.from(this.products.values()).filter(p => p.approvalStatus === "pending");
  }

  async getProductsByClass(classNum: number): Promise<Product[]> {
    return Array.from(this.products.values()).filter(p => p.class === classNum && p.isActive);
  }

  async getProductsBySeller(sellerId: string): Promise<Product[]> {
    return Array.from(this.products.values()).filter(p => p.sellerId === sellerId);
  }

  async updateProductStatus(id: string, status: { isActive?: boolean; isSoldOut?: boolean }): Promise<void> {
    const product = this.products.get(id);
    if (product) {
      if (status.isActive !== undefined) {
        product.isActive = status.isActive;
      }
      if (status.isSoldOut !== undefined) {
        product.isSoldOut = status.isSoldOut;
      }
      this.products.set(id, product);
    }
  }

  async updateProductApproval(id: string, status: "approved" | "rejected", adminId: string, reason?: string): Promise<void> {
    const product = this.products.get(id);
    if (product) {
      product.approvalStatus = status;
      product.approvedBy = adminId;
      if (status === "approved") {
        product.approvedAt = new Date();
        product.rejectionReason = null;
      } else {
        product.approvedAt = null;
        product.rejectionReason = reason || null;
      }
      this.products.set(id, product);
    }
  }

  async deleteProduct(id: string): Promise<void> {
    this.products.delete(id);
  }

  async updateProductDetails(id: string, updates: Partial<Product>): Promise<void> {
    const product = this.products.get(id);
    if (!product) {
      throw new Error("Product not found");
    }

    const updatedProduct = { ...product, ...updates };
    this.products.set(id, updatedProduct);
  }

  // Order methods
  async getOrders(): Promise<(Order & { product: Product })[]> {
    return Array.from(this.orders.values()).map(order => {
      const product = this.products.get(order.productId)!;
      return { ...order, product };
    });
  }

  async getOrder(id: string): Promise<(Order & { product: Product }) | undefined> {
    const order = this.orders.get(id);
    if (!order) return undefined;
    const product = this.products.get(order.productId);
    if (!product) return undefined;
    return { ...order, product };
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const id = randomUUID();
    const order: Order = {
      ...insertOrder,
      amount: typeof insertOrder.amount === 'number' ? insertOrder.amount.toString() : insertOrder.amount,
      buyerId: insertOrder.buyerId || null,
      additionalNotes: insertOrder.additionalNotes || null,
      id,
      status: "pending",
      cancelledBy: null,
      cancellationReason: null,
      deliveryConfirmedAt: null,
      invoiceGenerated: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.orders.set(id, order);
    return order;
  }

  async getOrdersByBuyer(buyerId: string): Promise<(Order & { product: Product })[]> {
    return Array.from(this.orders.values())
      .filter(order => order.buyerId === buyerId)
      .map(order => {
        const product = this.products.get(order.productId)!;
        return { ...order, product };
      });
  }

  async updateOrderStatus(id: string, status: "pending" | "confirmed" | "delivered" | "cancelled", cancelledBy?: string, reason?: string): Promise<void> {
    const order = this.orders.get(id);
    if (order) {
      order.status = status;
      order.updatedAt = new Date();
      if (status === "cancelled" && cancelledBy && reason) {
        order.cancelledBy = cancelledBy;
        order.cancellationReason = reason;
      }
      this.orders.set(id, order);
    }
  }

  async markOrderDelivered(id: string): Promise<void> {
    const order = this.orders.get(id);
    if (order) {
      order.status = "delivered";
      order.deliveryConfirmedAt = new Date();
      order.updatedAt = new Date();
      this.orders.set(id, order);
    }
  }

  async cancelOrder(id: string, cancelledBy: string, reason: string): Promise<void> {
    const order = this.orders.get(id);
    if (order) {
      order.status = "cancelled";
      order.cancelledBy = cancelledBy;
      order.cancellationReason = reason;
      order.updatedAt = new Date();
      this.orders.set(id, order);
    }
  }

  async markInvoiceGenerated(id: string): Promise<void> {
    const order = this.orders.get(id);
    if (order) {
      order.invoiceGenerated = true;
      order.updatedAt = new Date();
      this.orders.set(id, order);
    }
  }

  // Admin methods
  async getAdmin(id: string): Promise<Admin | undefined> {
    return this.admins.get(id);
  }

  async getAdminByUsername(username: string): Promise<Admin | undefined> {
    return Array.from(this.admins.values()).find(admin => admin.username === username);
  }

  async createAdmin(insertAdmin: InsertAdmin): Promise<Admin> {
    const id = randomUUID();
    const admin: Admin = {
      ...insertAdmin,
      id,
      totpSecret: null,
      isSetup: false,
    };
    this.admins.set(id, admin);
    return admin;
  }

  async updateAdminTotpSecret(id: string, secret: string): Promise<void> {
    const admin = this.admins.get(id);
    if (admin) {
      admin.totpSecret = secret;
      this.admins.set(id, admin);
    }
  }

  async setAdminSetup(id: string): Promise<void> {
    const admin = this.admins.get(id);
    if (admin) {
      admin.isSetup = true;
      this.admins.set(id, admin);
    }
  }
}

export const storage = new MemStorage();