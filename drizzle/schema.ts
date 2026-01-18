import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, json } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** User's full name */
  name: text("name").notNull(),
  /** User's email address - unique identifier for login */
  email: varchar("email", { length: 320 }).notNull().unique(),
  /** Hashed password using bcrypt */
  passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
  /** Whether email has been verified */
  emailVerified: int("emailVerified").notNull().default(0), // 0 = false, 1 = true
  /** Login method: 'email' for our own auth system */
  loginMethod: varchar("loginMethod", { length: 64 }).notNull().default("email"),
  role: mysqlEnum("role", ["user", "admin", "super_admin"]).default("user").notNull(),
  /** Trial period end date - 7 days from registration */
  trialEndsAt: timestamp("trialEndsAt"),
  /** Whether user has purchased lifetime access */
  hasLifetimeAccess: int("hasLifetimeAccess").notNull().default(0), // 0 = false, 1 = true
  /** Stripe customer ID for payment tracking */
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
  /** Stripe payment intent ID for lifetime purchase */
  stripePaymentId: varchar("stripePaymentId", { length: 255 }),
  /** Two-factor authentication secret (base32 encoded) */
  twoFactorSecret: varchar("twoFactorSecret", { length: 255 }),
  /** Whether 2FA is enabled for this user */
  twoFactorEnabled: int("twoFactorEnabled").notNull().default(0), // 0 = false, 1 = true
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Clients table - stores client information for invoicing and reminders
 */
export const clients = mysqlTable("clients", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // Owner of the client
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 50 }).notNull(),
  company: varchar("company", { length: 255 }),
  billingCycle: mysqlEnum("billingCycle", ["monthly", "quarterly", "yearly", "custom"]).notNull(),
  customCycleDays: int("customCycleDays"),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  nextPaymentDate: timestamp("nextPaymentDate").notNull(),
  reminderDays: int("reminderDays").notNull().default(7),
  status: mysqlEnum("status", ["active", "inactive", "overdue"]).notNull().default("active"),
  archived: int("archived").notNull().default(0), // 0 = false, 1 = true
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Client = typeof clients.$inferSelect;
export type InsertClient = typeof clients.$inferInsert;

/**
 * Invoice items - stored as JSON in invoices table
 */
export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

/**
 * Invoices table - stores invoice information
 */
export const invoices = mysqlTable("invoices", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // Owner of the invoice
  clientId: int("clientId").notNull(),
  invoiceNumber: varchar("invoiceNumber", { length: 100 }).notNull().unique(),
  issueDate: timestamp("issueDate").notNull(),
  dueDate: timestamp("dueDate").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  paidAmount: decimal("paidAmount", { precision: 10, scale: 2 }).default("0.00"),
  status: mysqlEnum("status", ["pending", "paid", "overdue", "cancelled", "archived"]).notNull().default("pending"),
  items: json("items").$type<InvoiceItem[]>().notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = typeof invoices.$inferInsert;

/**
 * Transactions table - stores financial transactions
 */
export const transactions = mysqlTable("transactions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // Owner of the transaction
  type: mysqlEnum("type", ["income", "expense"]).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description").notNull(),
  date: timestamp("date").notNull(),
  clientId: int("clientId"),
  invoiceId: int("invoiceId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
});

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = typeof transactions.$inferInsert;

/**
 * Savings goals table - stores savings goals
 */
export const savingsGoals = mysqlTable("savingsGoals", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // Owner of the goal
  name: varchar("name", { length: 255 }).notNull(),
  targetAmount: decimal("targetAmount", { precision: 10, scale: 2 }).notNull(),
  currentAmount: decimal("currentAmount", { precision: 10, scale: 2 }).notNull().default("0.00"),
  deadline: timestamp("deadline").notNull(),
  status: mysqlEnum("status", ["active", "completed", "cancelled"]).notNull().default("active"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SavingsGoal = typeof savingsGoals.$inferSelect;
export type InsertSavingsGoal = typeof savingsGoals.$inferInsert;

/**
 * Support tickets table - stores support requests from users
 */
export const supportTickets = mysqlTable("supportTickets", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // User who created the ticket
  subject: varchar("subject", { length: 255 }).notNull(),
  status: mysqlEnum("status", ["open", "in_progress", "resolved", "closed"]).notNull().default("open"),
  priority: mysqlEnum("priority", ["low", "medium", "high", "urgent"]).notNull().default("medium"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SupportTicket = typeof supportTickets.$inferSelect;
export type InsertSupportTicket = typeof supportTickets.$inferInsert;

/**
 * Support messages table - stores messages within support tickets
 */
export const supportMessages = mysqlTable("supportMessages", {
  id: int("id").autoincrement().primaryKey(),
  ticketId: int("ticketId").notNull(), // Reference to support ticket
  senderId: int("senderId").notNull(), // User ID of sender (can be user or admin)
  message: text("message").notNull(),
  isAdminReply: int("isAdminReply").notNull().default(0), // 0 = user message, 1 = admin reply
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SupportMessage = typeof supportMessages.$inferSelect;
export type InsertSupportMessage = typeof supportMessages.$inferInsert;