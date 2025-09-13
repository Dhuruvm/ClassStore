import { sql } from "drizzle-orm";
import { pgTable, text, varchar, decimal, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  class: integer("class").notNull(),
  section: text("section").notNull(),
  imageUrl: text("image_url"),
  sellerName: text("seller_name").notNull(),
  sellerPhone: text("seller_phone").notNull(),
  sellerEmail: text("seller_email"),
  sellerId: text("seller_id"), // For tracking seller across sessions
  likes: integer("likes").default(0),
  isActive: boolean("is_active").default(true),
  isSoldOut: boolean("is_sold_out").default(false),
  approvalStatus: text("approval_status", { enum: ["pending", "approved", "rejected"] }).default("pending"),
  approvedAt: timestamp("approved_at"),
  approvedBy: text("approved_by"),
  rejectionReason: text("rejection_reason"),
  category: text("category").default("General"),
  condition: text("condition").default("Good"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").references(() => products.id).notNull(),
  buyerName: text("buyer_name").notNull(),
  buyerClass: integer("buyer_class").notNull(),
  buyerSection: text("buyer_section").notNull(),
  buyerEmail: text("buyer_email").notNull(),
  buyerPhone: text("buyer_phone").notNull(),
  buyerId: text("buyer_id"), // For tracking buyer across sessions
  pickupLocation: text("pickup_location").notNull(),
  pickupTime: text("pickup_time").notNull(),
  additionalNotes: text("additional_notes"),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status", { enum: ["pending", "confirmed", "delivered", "cancelled"] }).default("pending"),
  cancelledBy: text("cancelled_by"), // "buyer" or "admin"
  cancellationReason: text("cancellation_reason"),
  deliveryConfirmedAt: timestamp("delivery_confirmed_at"),
  invoiceGenerated: boolean("invoice_generated").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const admins = pgTable("admins", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  totpSecret: text("totp_secret"),
  isSetup: boolean("is_setup").default(false),
});

export const settings = pgTable("settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  description: text("description"),
  updatedAt: timestamp("updated_at").defaultNow(),
  updatedBy: text("updated_by"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  likes: true,
  isActive: true,
  isSoldOut: true,
  createdAt: true,
}).extend({
  class: z.number().min(6).max(12),
  price: z.string().regex(/^\d+(\.\d{2})?$/),
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  status: true,
  cancelledBy: true,
  cancellationReason: true,
  deliveryConfirmedAt: true,
  invoiceGenerated: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  buyerClass: z.string().transform((val) => parseInt(val)).pipe(z.number().min(6).max(12)),
  buyerEmail: z.string().email(),
  buyerPhone: z.string().min(10),
  pickupLocation: z.string().min(1),
  pickupTime: z.string().min(1),
  additionalNotes: z.string().optional(),
  amount: z.string().regex(/^\d+(\.\d{2})?$/).transform((val) => parseFloat(val)),
});

export const insertAdminSchema = createInsertSchema(admins).pick({
  username: true,
  password: true,
});

export const insertSettingSchema = createInsertSchema(settings).omit({
  id: true,
  updatedAt: true,
}).extend({
  key: z.string().min(1),
  value: z.string(),
  description: z.string().optional(),
  updatedBy: z.string().optional(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Admin = typeof admins.$inferSelect;
export type InsertAdmin = z.infer<typeof insertAdminSchema>;
export type Setting = typeof settings.$inferSelect;
export type InsertSetting = z.infer<typeof insertSettingSchema>;