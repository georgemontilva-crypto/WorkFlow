import { pgTable, serial, text, varchar, integer, timestamp, decimal, pgEnum } from "drizzle-orm/pg-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */

// Enums
export const roleEnum = pgEnum("role", ["user", "admin", "super_admin"]);
export const loginMethodEnum = pgEnum("login_method", ["email", "oauth"]);
export const billingCycleEnum = pgEnum("billing_cycle", ["monthly", "quarterly", "yearly", "custom"]);
export const clientStatusEnum = pgEnum("client_status", ["active", "inactive", "overdue"]);
export const invoiceStatusEnum = pgEnum("invoice_status", ["draft", "sent", "paid", "overdue", "cancelled"]);
export const transactionTypeEnum = pgEnum("transaction_type", ["income", "expense"]);
export const transactionCategoryEnum = pgEnum("transaction_category", [
  "salary",
  "freelance",
  "investment",
  "other_income",
  "rent",
  "utilities",
  "food",
  "transportation",
  "healthcare",
  "entertainment",
  "other_expense"
]);
export const goalStatusEnum = pgEnum("goal_status", ["active", "completed", "cancelled"]);
export const ticketStatusEnum = pgEnum("ticket_status", ["open", "in_progress", "resolved", "closed"]);
export const ticketPriorityEnum = pgEnum("ticket_priority", ["low", "medium", "high", "urgent"]);

export const users = pgTable("user", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: serial("id").primaryKey(),
  /** User's full name */
  name: text("name").notNull(),
  /** User's email address - unique identifier for login */
  email: varchar("email", { length: 320 }).notNull().unique(),
  /** Hashed password using bcrypt */
  passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
  /** Whether email has been verified */
  emailVerified: integer("emailVerified").notNull().default(0), // 0 = false, 1 = true
  /** Login method: 'email' for our own auth system */
  loginMethod: loginMethodEnum("loginMethod").notNull().default("email"),
  role: roleEnum("role").default("user").notNull(),
  /** Trial period end date - 7 days from registration */
  trialEndsAt: timestamp("trialEndsAt"),
  /** Whether user has purchased lifetime access */
  hasLifetimeAccess: integer("hasLifetimeAccess").notNull().default(0), // 0 = false, 1 = true
  /** Stripe customer ID for payment tracking */
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
  /** Stripe payment intent ID for lifetime purchase */
  stripePaymentId: varchar("stripePaymentId", { length: 255 }),
  /** Two-factor authentication secret (base32 encoded) */
  twoFactorSecret: varchar("twoFactorSecret", { length: 255 }),
  /** Whether 2FA is enabled for this user */
  twoFactorEnabled: integer("twoFactorEnabled").notNull().default(0), // 0 = false, 1 = true
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Clients table - stores client information for invoicing and reminders
 */
export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(), // Owner of the client
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 50 }).notNull(),
  company: varchar("company", { length: 255 }),
  billingCycle: billingCycleEnum("billingCycle").notNull(),
  customCycleDays: integer("customCycleDays"),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  nextPaymentDate: timestamp("nextPaymentDate").notNull(),
  reminderDays: integer("reminderDays").notNull().default(7),
  status: clientStatusEnum("status").notNull().default("active"),
  archived: integer("archived").notNull().default(0), // 0 = false, 1 = true
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
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
 * Invoices table - stores invoices for clients
 */
export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(), // Owner of the invoice
  clientId: integer("clientId").notNull(),
  invoiceNumber: varchar("invoiceNumber", { length: 50 }).notNull().unique(),
  issueDate: timestamp("issueDate").notNull(),
  dueDate: timestamp("dueDate").notNull(),
  items: text("items").notNull(), // JSON string of InvoiceItem[]
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  tax: decimal("tax", { precision: 10, scale: 2 }).notNull().default("0"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  status: invoiceStatusEnum("status").notNull().default("draft"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = typeof invoices.$inferInsert;

/**
 * Transactions table - stores income and expenses
 */
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(), // Owner of the transaction
  type: transactionTypeEnum("type").notNull(),
  category: transactionCategoryEnum("category").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description").notNull(),
  date: timestamp("date").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = typeof transactions.$inferInsert;

/**
 * Savings Goals table - stores user savings goals
 */
export const savingsGoals = pgTable("savings_goals", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(), // Owner of the goal
  name: varchar("name", { length: 255 }).notNull(),
  targetAmount: decimal("targetAmount", { precision: 10, scale: 2 }).notNull(),
  currentAmount: decimal("currentAmount", { precision: 10, scale: 2 }).notNull().default("0"),
  deadline: timestamp("deadline"),
  status: goalStatusEnum("status").notNull().default("active"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type SavingsGoal = typeof savingsGoals.$inferSelect;
export type InsertSavingsGoal = typeof savingsGoals.$inferInsert;

/**
 * Support Tickets table - stores user support requests
 */
export const supportTickets = pgTable("support_tickets", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(), // User who created the ticket
  subject: varchar("subject", { length: 255 }).notNull(),
  status: ticketStatusEnum("status").notNull().default("open"),
  priority: ticketPriorityEnum("priority").notNull().default("medium"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type SupportTicket = typeof supportTickets.$inferSelect;
export type InsertSupportTicket = typeof supportTickets.$inferInsert;

/**
 * Support Messages table - stores messages within support tickets
 */
export const supportMessages = pgTable("support_messages", {
  id: serial("id").primaryKey(),
  ticketId: integer("ticketId").notNull(), // Reference to support ticket
  userId: integer("userId").notNull(), // User who sent the message
  message: text("message").notNull(),
  isStaff: integer("isStaff").notNull().default(0), // 0 = user, 1 = staff
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SupportMessage = typeof supportMessages.$inferSelect;
export type InsertSupportMessage = typeof supportMessages.$inferInsert;
