import { mysqlTable, serial, varchar, text, int, timestamp, decimal, mysqlEnum, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Uses snake_case for MySQL compatibility.
 */

// MySQL enums are defined inline in the column definition
export const users = mysqlTable("user", {
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
  password_hash: varchar("password_hash", { length: 255 }).notNull(),
  /** Email verification status */
  email_verified: int("email_verified").notNull().default(0),
  /** Login method: 'email' for our own auth system */
  login_method: mysqlEnum("login_method", ["email", "oauth"]).notNull().default("email"),
  role: mysqlEnum("role", ["user", "admin", "super_admin"]).default("user").notNull(),
  /** Trial period end date - 7 days from registration */
  trial_ends_at: timestamp("trial_ends_at"),
  /** Whether user has purchased lifetime access */
  has_lifetime_access: int("has_lifetime_access").notNull().default(0),
  /** Subscription plan: free, pro, or business */
  subscription_plan: mysqlEnum("subscription_plan", ["free", "pro", "business"]).notNull().default("free"),
  /** Subscription status */
  subscription_status: mysqlEnum("subscription_status", ["active", "cancelled", "past_due", "trialing"]).default("active"),
  /** Subscription end date */
  subscription_ends_at: timestamp("subscription_ends_at"),
  stripe_customer_id: varchar("stripe_customer_id", { length: 255 }),
  stripe_payment_id: varchar("stripe_payment_id", { length: 255 }),
  stripe_subscription_id: varchar("stripe_subscription_id", { length: 255 }),
  /** Two-factor authentication secret (base32 encoded) */
  two_factor_secret: varchar("two_factor_secret", { length: 255 }),
  /** Whether 2FA is enabled for this user */
  two_factor_enabled: int("two_factor_enabled").notNull().default(0),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
  last_signed_in: timestamp("last_signed_in").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Clients table - stores client information for invoicing and reminders
 */
export const clients = mysqlTable("clients", {
  id: serial("id").primaryKey(),
  user_id: int("user_id").notNull(), // Owner of the client
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 50 }).notNull(),
  company: varchar("company", { length: 255 }),
  billing_cycle: mysqlEnum("billing_cycle", ["monthly", "quarterly", "yearly", "custom"]).notNull(),
  custom_cycle_days: int("custom_cycle_days"),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  next_payment_date: timestamp("next_payment_date").notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("USD"),
  reminder_days: int("reminder_days").notNull().default(7),
  status: mysqlEnum("status", ["active", "inactive", "overdue"]).notNull().default("active"),
  archived: boolean("archived").notNull().default(false),
  notes: text("notes"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
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
  id: serial("id").primaryKey(),
  user_id: int("user_id").notNull(),
  client_id: int("client_id").notNull(),
  invoice_number: varchar("invoice_number", { length: 50 }).notNull().unique(),
  issue_date: timestamp("issue_date").notNull(),
  due_date: timestamp("due_date").notNull(),
  items: text("items").notNull(), // JSON string of InvoiceItem[]
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  tax: decimal("tax", { precision: 10, scale: 2 }).notNull().default("0"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("USD"),
  paid_amount: decimal("paid_amount", { precision: 10, scale: 2 }).notNull().default("0"),
  balance: decimal("balance", { precision: 10, scale: 2 }).notNull(),
  status: mysqlEnum("status", ["draft", "sent", "payment_sent", "paid", "overdue", "cancelled"]).notNull().default("draft"),
  payment_token: varchar("payment_token", { length: 64 }).unique(),
  payment_link: text("payment_link"),
  client_comment: text("client_comment"),
  notes: text("notes"),
  // Recurring invoice fields
  is_recurring: boolean("is_recurring").notNull().default(false),
  recurrence_frequency: mysqlEnum("recurrence_frequency", ["monthly", "biweekly", "annual", "custom"]),
  recurrence_interval: int("recurrence_interval"), // For custom frequency (days)
  next_generation_date: timestamp("next_generation_date"),
  parent_invoice_id: int("parent_invoice_id"), // Reference to original recurring invoice
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = typeof invoices.$inferInsert;

/**
 * Transactions table - stores income and expense records
 */
export const transactions = mysqlTable("transactions", {
  id: serial("id").primaryKey(),
  user_id: int("user_id").notNull(),
  type: mysqlEnum("type", ["income", "expense"]).notNull(),
  category: mysqlEnum("category", [
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
  ]).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("USD"),
  description: text("description").notNull(),
  date: timestamp("date").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = typeof transactions.$inferInsert;

/**
 * Savings Goals table - stores user savings goals
 */
export const savingsGoals = mysqlTable("savings_goals", {
  id: serial("id").primaryKey(),
  user_id: int("user_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  target_amount: decimal("target_amount", { precision: 10, scale: 2 }).notNull(),
  current_amount: decimal("current_amount", { precision: 10, scale: 2 }).notNull().default("0"),
  currency: varchar("currency", { length: 3 }).notNull().default("USD"),
  target_date: timestamp("target_date"),
  status: mysqlEnum("status", ["active", "completed", "cancelled"]).notNull().default("active"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export type SavingsGoal = typeof savingsGoals.$inferSelect;
export type InsertSavingsGoal = typeof savingsGoals.$inferInsert;

/**
 * Support Tickets table - stores user support requests
 */
export const supportTickets = mysqlTable("support_tickets", {
  id: serial("id").primaryKey(),
  user_id: int("user_id").notNull(),
  subject: text("subject").notNull(),
  status: mysqlEnum("status", ["open", "in_progress", "waiting_user", "waiting_agent", "resolved", "closed"]).notNull().default("open"),
  priority: mysqlEnum("priority", ["low", "medium", "high", "urgent"]).notNull().default("medium"),
  assigned_to: int("assigned_to"),
  has_unread_user: int("has_unread_user").notNull().default(0),
  has_unread_agent: int("has_unread_agent").notNull().default(0),
  resolved_at: timestamp("resolved_at"),
  closed_at: timestamp("closed_at"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export type SupportTicket = typeof supportTickets.$inferSelect;
export type InsertSupportTicket = typeof supportTickets.$inferInsert;

/**
 * Support Messages table - stores messages in support tickets
 */
export const supportMessages = mysqlTable("support_messages", {
  id: serial("id").primaryKey(),
  ticket_id: int("ticket_id").notNull(),
  sender_id: int("sender_id").notNull(),
  sender_type: mysqlEnum("sender_type", ["user", "agent", "ai"]).notNull().default("user"),
  message: text("message").notNull(),
  is_read: int("is_read").notNull().default(0),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export type SupportMessage = typeof supportMessages.$inferSelect;
export type InsertSupportMessage = typeof supportMessages.$inferInsert;

/**
 * Market Favorites table - stores user's favorite market assets
 */
export const marketFavorites = mysqlTable("market_favorites", {
  id: serial("id").primaryKey(),
  user_id: int("user_id").notNull(),
  symbol: varchar("symbol", { length: 20 }).notNull(),
  type: mysqlEnum("type", ["crypto", "stock", "forex", "commodity"]).notNull(),
  is_dashboard_widget: int("is_dashboard_widget").notNull().default(0),
  position: int("position").notNull().default(0),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export type MarketFavorite = typeof marketFavorites.$inferSelect;
export type InsertMarketFavorite = typeof marketFavorites.$inferInsert;

/**
 * Password Reset Tokens table - stores temporary tokens for password recovery
 */
export const passwordResetTokens = mysqlTable("password_reset_tokens", {
  id: serial("id").primaryKey(),
  user_id: int("user_id").notNull(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  expires_at: timestamp("expires_at").notNull(),
  used: int("used").notNull().default(0),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type InsertPasswordResetToken = typeof passwordResetTokens.$inferInsert;

/**
 * Price Alerts table - stores user configured price alerts
 */
export const priceAlerts = mysqlTable("price_alerts", {
  id: serial("id").primaryKey(),
  user_id: int("user_id").notNull(),
  symbol: varchar("symbol", { length: 20 }).notNull(),
  type: mysqlEnum("type", ["crypto", "stock", "forex", "commodity"]).notNull(),
  target_price: decimal("target_price", { precision: 20, scale: 8 }).notNull(),
  condition: mysqlEnum("condition", ["above", "below"]).notNull(),
  is_active: int("is_active").notNull().default(1),
  last_triggered_at: timestamp("last_triggered_at"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export type PriceAlert = typeof priceAlerts.$inferSelect;
export type InsertPriceAlert = typeof priceAlerts.$inferInsert;

/**
 * Dashboard Widgets table - stores user's dashboard widget preferences
 */
export const dashboardWidgets = mysqlTable("dashboard_widgets", {
  id: serial("id").primaryKey(),
  user_id: int("user_id").notNull(),
  widget_type: varchar("widget_type", { length: 50 }).notNull(), // 'clients', 'invoices', 'income', 'expenses', 'savings', 'reminders', 'market'
  widget_data: text("widget_data"), // JSON data for market widgets (symbol, type)
  position: int("position").notNull().default(0), // Order position
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export type DashboardWidget = typeof dashboardWidgets.$inferSelect;
export type InsertDashboardWidget = typeof dashboardWidgets.$inferInsert;

/**
 * Verification Tokens table - stores temporary tokens for email verification
 */
export const verificationTokens = mysqlTable("verification_tokens", {
  id: serial("id").primaryKey(),
  user_id: int("user_id").notNull(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  expires_at: timestamp("expires_at").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export type VerificationToken = typeof verificationTokens.$inferSelect;
export type InsertVerificationToken = typeof verificationTokens.$inferInsert;

