import { mysqlTable, serial, varchar, text, int, bigint, timestamp, decimal, mysqlEnum, boolean } from "drizzle-orm/mysql-core";

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
  /** Primary currency for the user - used globally across the platform */
  primary_currency: varchar("primary_currency", { length: 3 }).notNull().default("USD"),
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
  user_id: int("user_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  company: varchar("company", { length: 255 }),
  status: mysqlEnum("status", ["active", "inactive"]).notNull().default("active"),
  archived: boolean("archived").notNull().default(false),
  notes: text("notes"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export type Client = typeof clients.$inferSelect;
export type InsertClient = typeof clients.$inferInsert;

/**
 * Invoices table - REBUILT FROM SCRATCH
 * Clean, simple, predictable invoice system
 */
export const invoices = mysqlTable("invoices", {
  id: serial("id").primaryKey(),
  user_id: int("user_id").notNull(),
  client_id: int("client_id").notNull(),
  invoice_number: varchar("invoice_number", { length: 50 }).notNull().unique(),
  status: mysqlEnum("status", ["draft", "sent", "paid", "cancelled"]).notNull().default("draft"),
  currency: varchar("currency", { length: 3 }).notNull().default("USD"),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  issue_date: timestamp("issue_date").notNull(),
  due_date: timestamp("due_date").notNull(),
  notes: text("notes"),
  terms: text("terms"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = typeof invoices.$inferInsert;

/**
 * Invoice Items table - SEPARATE TABLE (not JSON)
 * Each invoice can have multiple items
 */
export const invoiceItems = mysqlTable("invoice_items", {
  id: serial("id").primaryKey(),
  invoice_id: int("invoice_id").notNull(),
  description: text("description").notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
  unit_price: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export type InvoiceItem = typeof invoiceItems.$inferSelect;
export type InsertInvoiceItem = typeof invoiceItems.$inferInsert;

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
  status: mysqlEnum("status", ["active", "voided"]).notNull().default("active"),
  invoice_id: int("invoice_id"),
  voided_at: timestamp("voided_at"),
  void_reason: text("void_reason"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = typeof transactions.$inferInsert;

/**
 * Savings Goals table - REBUILT: Independent savings module
 * Each goal has its OWN currency (not inherited from user)
 * No automatic conversions, no financial impacts
 */
export const savingsGoals = mysqlTable("savings_goals", {
  id: serial("id").primaryKey(),
  user_id: int("user_id").notNull(),
  /** Name of the savings goal */
  name: varchar("name", { length: 255 }).notNull(),
  /** Target amount to save */
  target_amount: decimal("target_amount", { precision: 10, scale: 2 }).notNull(),
  /** Current saved amount */
  current_amount: decimal("current_amount", { precision: 10, scale: 2 }).notNull().default("0"),
  /** Currency of THIS goal - MUST be explicitly selected, NO default */
  currency: varchar("currency", { length: 3 }).notNull(),
  /** Optional deadline for the goal */
  deadline: timestamp("deadline"),
  /** Optional description */
  description: text("description"),
  /** Status of the goal */
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
  notify_email: int("notify_email").notNull().default(1),
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


/**
 * Company Profiles table - stores business information for invoice customization
 */
export const companyProfiles = mysqlTable("company_profiles", {
  id: serial("id").primaryKey(),
  user_id: int("user_id").notNull().unique(), // One profile per user
  company_name: varchar("company_name", { length: 255 }).notNull(),
  logo_url: text("logo_url"), // URL to uploaded logo image
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  website: varchar("website", { length: 255 }),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 100 }),
  postal_code: varchar("postal_code", { length: 20 }),
  country: varchar("country", { length: 100 }),
  tax_id: varchar("tax_id", { length: 100 }), // RIF, NIT, Tax ID, etc.
  bank_name: varchar("bank_name", { length: 255 }),
  bank_account: varchar("bank_account", { length: 100 }),
  bank_routing: varchar("bank_routing", { length: 100 }),
  payment_instructions: text("payment_instructions"), // Custom payment instructions
  invoice_footer: text("invoice_footer"), // Custom footer text for invoices
  
  // Financial Profile fields
  business_type: mysqlEnum("business_type", ["freelancer", "empresa", "agencia"]), // Type of activity
  base_currency: varchar("base_currency", { length: 3 }).default("USD"), // ISO currency code
  monthly_income_goal: decimal("monthly_income_goal", { precision: 15, scale: 2 }), // Monthly income target
  goal_currency: varchar("goal_currency", { length: 3 }), // Currency for the goal (defaults to base_currency)
  
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export type CompanyProfile = typeof companyProfiles.$inferSelect;
export type InsertCompanyProfile = typeof companyProfiles.$inferInsert;


/**
 * Custom Reminders table - stores user-created reminders/events
 */
export const reminders = mysqlTable("reminders", {
  id: serial("id").primaryKey(),
  user_id: int("user_id").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  reminder_date: timestamp("reminder_date").notNull(),
  reminder_time: varchar("reminder_time", { length: 10 }), // HH:MM format
  category: mysqlEnum("category", ["payment", "meeting", "deadline", "personal", "other"]).notNull().default("other"),
  priority: mysqlEnum("priority", ["low", "medium", "high"]).notNull().default("medium"),
  status: mysqlEnum("status", ["pending", "completed", "cancelled"]).notNull().default("pending"),
  notify_email: int("notify_email").notNull().default(1), // Send email notification
  notify_days_before: int("notify_days_before").notNull().default(1), // Days before to send notification
  email_sent: int("email_sent").notNull().default(0), // Whether email has been sent
  calendar_exported: int("calendar_exported").notNull().default(0), // Whether exported to calendar
  related_client_id: int("related_client_id"), // Optional link to client
  related_invoice_id: int("related_invoice_id"), // Optional link to invoice
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export type Reminder = typeof reminders.$inferSelect;
export type InsertReminder = typeof reminders.$inferInsert;

/**
 * Alerts table - Sistema de alertas robusto con toasts y centro de alertas
 * Almacena todas las alertas generadas por el sistema
 */
export const alerts = mysqlTable("alerts", {
  id: serial("id").primaryKey(),
  user_id: bigint("user_id", { mode: "number", unsigned: true }).notNull(),
  /** Tipo de alerta: info, warning, critical */
  type: mysqlEnum("type", ["info", "warning", "critical"]).notNull(),
  /** Evento que generó la alerta */
  event: varchar("event", { length: 100 }).notNull(),
  /** Mensaje descriptivo de la alerta */
  message: text("message").notNull(),
  /** Si la alerta debe persistir en el centro de alertas */
  persistent: int("persistent").notNull().default(1),
  /** Si la alerta debe mostrarse como toast (1 = sí, 0 = no) */
  shown_as_toast: int("shown_as_toast").notNull().default(0),
  /** Si la alerta fue leída por el usuario */
  is_read: int("is_read").notNull().default(0),
  /** Acción asociada (URL o identificador) */
  action_url: varchar("action_url", { length: 255 }),
  /** Texto del botón de acción */
  action_text: varchar("action_text", { length: 50 }),
  /** Plan requerido para la funcionalidad (si aplica) */
  required_plan: mysqlEnum("required_plan", ["free", "pro", "business"]),
  /** ID relacionado (factura, cliente, etc.) */
  related_id: bigint("related_id", { mode: "number", unsigned: true }),
  /** Tipo de entidad relacionada */
  related_type: varchar("related_type", { length: 50 }),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export type Alert = typeof alerts.$inferSelect;
export type InsertAlert = typeof alerts.$inferInsert;

/**
 * Notifications table - PERSISTENT NOTIFICATIONS SYSTEM
 * Built from scratch - Clean, reliable, side panel only
 * NO auto-popups, NO toasts, NO AI (yet)
 */
export const notifications = mysqlTable("notifications", {
  id: serial("id").primaryKey(),
  user_id: bigint("user_id", { mode: "number", unsigned: true }).notNull(),
  
  /** Notification type: info, success, warning, error */
  type: mysqlEnum("type", ["info", "success", "warning", "error"]).notNull(),
  
  /** Notification title (REQUIRED - NO optional) */
  title: varchar("title", { length: 255 }).notNull(),
  
  /** Notification message (REQUIRED - NO optional) */
  message: text("message").notNull(),
  
  /** Source of notification: invoice, savings, system */
  source: mysqlEnum("source", ["invoice", "savings", "system"]).notNull(),
  
  /** Source ID (nullable) - ID of the related entity (invoice_id, savings_goal_id, etc) */
  source_id: bigint("source_id", { mode: "number", unsigned: true }),
  
  /** Whether the notification was read by the user */
  is_read: int("is_read").notNull().default(0),
  
  /** Creation timestamp */
  created_at: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userReadIdx: index("idx_user_read").on(table.user_id, table.is_read),
  userCreatedIdx: index("idx_user_created").on(table.user_id, table.created_at),
  sourceIdx: index("idx_source").on(table.source, table.source_id),
}));

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;
