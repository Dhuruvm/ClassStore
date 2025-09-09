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
  likes: integer("likes").default(0),
  isActive: boolean("is_active").default(true),
  isSoldOut: boolean("is_sold_out").default(false),
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
  buyerAddress: text("buyer_address").notNull(),
  buyerCity: text("buyer_city").notNull(),
  buyerPincode: text("buyer_pincode").notNull(),
  deliveryInstructions: text("delivery_instructions"),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status", { enum: ["pending", "confirmed", "delivered", "cancelled"] }).default("pending"),
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
  createdAt: true,
  updatedAt: true,
}).extend({
  buyerClass: z.string().transform((val) => parseInt(val)).pipe(z.number().min(6).max(12)),
  buyerEmail: z.string().email(),
  buyerPhone: z.string().min(10),
  buyerAddress: z.string().min(5),
  buyerCity: z.string().min(2),
  buyerPincode: z.string().min(6).max(6),
  deliveryInstructions: z.string().optional(),
  amount: z.string().regex(/^\d+(\.\d{2})?$/).transform((val) => parseFloat(val)),
  recaptchaToken: z.string().optional(),
});

export const insertAdminSchema = createInsertSchema(admins).pick({
  username: true,
  password: true,
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Admin = typeof admins.$inferSelect;
export type InsertAdmin = z.infer<typeof insertAdminSchema>;
