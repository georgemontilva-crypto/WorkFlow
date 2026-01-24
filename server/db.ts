import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { ENV } from "./_core/env";
import { users, clients, invoices, transactions, savingsGoals, supportTickets, supportMessages, marketFavorites, priceAlerts, dashboardWidgets, verificationTokens, companyProfiles, reminders, alerts } from "../drizzle/schema";
import { eq, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";

// Initialize MySQL connection pool
const pool = mysql.createPool({
  uri: ENV.databaseUrl,
});

const db = drizzle(pool);

/**
 * Get database instance
 */
export async function getDb() {
  return db;
}

/**
 * Create a new user with email and password
 */
export async function createUser(data: {
  name: string;
  email: string;
  password: string;
}) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  try {
    // Check if user already exists
    const existing = await db.select().from(users).where(eq(users.email, data.email)).limit(1);
    if (existing.length > 0) {
      throw new Error("User with this email already exists");
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 10);

    // Insert user
    const result = await db.insert(users).values({
      name: data.name,
      email: data.email,
      password_hash: passwordHash,
      email_verified: 0,
      login_method: "email",
      role: "user",
      subscription_plan: "free",
      subscription_status: "active",
      has_lifetime_access: 0,
      created_at: new Date(),
      updated_at: new Date(),
      last_signed_in: new Date(),
    });

    // Get the created user
    const newUser = await db.select().from(users).where(eq(users.email, data.email)).limit(1);
    return newUser[0];
  } catch (error) {
    console.error("[Database] Failed to create user:", error);
    throw error;
  }
}

/**
 * Verify user credentials and return user if valid
 */
export async function verifyUserCredentials(email: string, password: string) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  try {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    
    if (result.length === 0) {
      return null; // User not found
    }

    const user = result[0];
    const isValid = await bcrypt.compare(password, user.password_hash);

    if (!isValid) {
      return null; // Invalid password
    }

    // Update last signed in
    await db.update(users)
      .set({ last_signed_in: new Date() })
      .where(eq(users.id, user.id));

    return user;
  } catch (error) {
    console.error("[Database] Failed to verify credentials:", error);
    throw error;
  }
}

/**
 * Get user by ID
 */
export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

/**
 * Update user's lifetime access status
 */
export async function grantLifetimeAccess(user_id: number, stripeCustomerId?: string, stripePaymentId?: string) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  try {
    await db.update(users)
      .set({
        has_lifetime_access: 1,
        stripe_customer_id: stripeCustomerId,
        stripe_payment_id: stripePaymentId,
        updated_at: new Date(),
      })
      .where(eq(users.id, user_id));
  } catch (error) {
    console.error("[Database] Failed to grant lifetime access:", error);
    throw error;
  }
}

/**
 * Check if user has active access based on subscription plan
 */
export async function hasActiveAccess(user_id: number): Promise<boolean> {
  const user = await getUserById(user_id);
  if (!user) return false;

  // Check if user has lifetime access
  if (user.has_lifetime_access === 1) {
    return true;
  }

  // Check if subscription is active
  if (user.subscription_status === 'active') {
    return true;
  }

  return false;
}

/**
 * Update user's 2FA secret
 */
export async function updateUser2FASecret(user_id: number, secret: string) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  try {
    await db.update(users)
      .set({
        two_factor_secret: secret,
        updated_at: new Date(),
      })
      .where(eq(users.id, user_id));
  } catch (error) {
    console.error("[Database] Failed to update 2FA secret:", error);
    throw error;
  }
}

/**
 * Enable 2FA for user
 */
export async function enable2FA(user_id: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  try {
    await db.update(users)
      .set({
        two_factor_enabled: 1,
        updated_at: new Date(),
      })
      .where(eq(users.id, user_id));
  } catch (error) {
    console.error("[Database] Failed to enable 2FA:", error);
    throw error;
  }
}

/**
 * Disable 2FA for user
 */
export async function disable2FA(user_id: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  try {
    await db.update(users)
      .set({
        two_factor_enabled: 0,
        two_factor_secret: null,
        updated_at: new Date(),
      })
      .where(eq(users.id, user_id));
  } catch (error) {
    console.error("[Database] Failed to disable 2FA:", error);
    throw error;
  }
}

/**
 * Update user password
 */
export async function updateUserPassword(user_id: number, password_hash: string) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  try {
    await db.update(users)
      .set({
        password_hash: password_hash,
        updated_at: new Date(),
      })
      .where(eq(users.id, user_id));
  } catch (error) {
    console.error("[Database] Failed to update password:", error);
    throw error;
  }
}

export { users, clients, invoices, transactions, savingsGoals, priceAlerts };

// ============================================
// Price Alerts Functions
// ============================================

export async function createPriceAlert(data: any) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // Ensure id is not present to let DB handle autoincrement
  const { id, ...insertData } = data;
  const result = await db.insert(priceAlerts).values(insertData);
  return { id: Number(result[0].insertId) };
}

export async function getPriceAlertsByUserId(user_id: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  return await db
    .select()
    .from(priceAlerts)
    .where(eq(priceAlerts.user_id, user_id));
}

export async function deletePriceAlert(id: number, user_id: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // Verify ownership
  const result = await db
    .select()
    .from(priceAlerts)
    .where(eq(priceAlerts.id, id))
    .limit(1);
  
  const alert = result[0];
  if (!alert || alert.user_id !== user_id) {
    throw new Error("Alert not found or access denied");
  }

  await db
    .delete(priceAlerts)
    .where(eq(priceAlerts.id, id));
}

export async function getAllActivePriceAlerts() {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  return await db
    .select()
    .from(priceAlerts)
    .where(eq(priceAlerts.is_active, 1));
}

export async function updatePriceAlertLastTriggered(id: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db
    .update(priceAlerts)
    .set({ last_triggered_at: new Date() })
    .where(eq(priceAlerts.id, id));
}

// ============================================
// Savings Goals Functions
// ============================================

export async function getSavingsGoalById(id: number, user_id: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db
    .select()
    .from(savingsGoals)
    .where(eq(savingsGoals.id, id))
    .limit(1);
  
  const goal = result[0];
  if (!goal || goal.user_id !== user_id) {
    return null;
  }
  
  return goal;
}

export async function createSavingsGoal(data: any) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db.insert(savingsGoals).values(data);
  return { id: Number(result[0].insertId) };
}

export async function updateSavingsGoal(id: number, user_id: number, data: any) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // Verify ownership
  const goal = await getSavingsGoalById(id, user_id);
  if (!goal) {
    throw new Error("Savings goal not found or access denied");
  }

  await db
    .update(savingsGoals)
    .set(data)
    .where(eq(savingsGoals.id, id));
}

export async function deleteSavingsGoal(id: number, user_id: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // Verify ownership
  const goal = await getSavingsGoalById(id, user_id);
  if (!goal) {
    throw new Error("Savings goal not found or access denied");
  }

  await db
    .delete(savingsGoals)
    .where(eq(savingsGoals.id, id));
}


// ============================================
// Transactions Functions
// ============================================

export async function createTransaction(data: any) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db.insert(transactions).values(data);
}

export async function updateTransaction(id: number, user_id: number, data: any) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // Verify ownership
  const result = await db
    .select()
    .from(transactions)
    .where(eq(transactions.id, id))
    .limit(1);
  
  const transaction = result[0];
  if (!transaction || transaction.user_id !== user_id) {
    throw new Error("Transaction not found or access denied");
  }

  await db
    .update(transactions)
    .set(data)
    .where(eq(transactions.id, id));
}

export async function deleteTransaction(id: number, user_id: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // Verify ownership
  const result = await db
    .select()
    .from(transactions)
    .where(eq(transactions.id, id))
    .limit(1);
  
  const transaction = result[0];
  if (!transaction || transaction.user_id !== user_id) {
    throw new Error("Transaction not found or access denied");
  }

  await db
    .delete(transactions)
    .where(eq(transactions.id, id));
}

export async function voidTransaction(id: number, user_id: number, reason: string) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // Verify ownership
  const result = await db
    .select()
    .from(transactions)
    .where(eq(transactions.id, id))
    .limit(1);
  
  const transaction = result[0];
  if (!transaction || transaction.user_id !== user_id) {
    throw new Error("Transaction not found or access denied");
  }

  await db
    .update(transactions)
    .set({
      status: 'voided',
      voided_at: new Date(),
      void_reason: reason,
    })
    .where(eq(transactions.id, id));
  
  return transaction;
}

export async function getSavingsGoalsByUserId(user_id: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  return await db
    .select()
    .from(savingsGoals)
    .where(eq(savingsGoals.user_id, user_id));
}


// ============================================
// Invoices Functions
// ============================================

export async function updateInvoice(id: number, user_id: number, data: any) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // Verify ownership
  const result = await db
    .select()
    .from(invoices)
    .where(eq(invoices.id, id))
    .limit(1);
  
  const invoice = result[0];
  if (!invoice || invoice.user_id !== user_id) {
    throw new Error("Invoice not found or access denied");
  }

  // Don't manually set updated_at, let the database handle it
  await db
    .update(invoices)
    .set(data)
    .where(eq(invoices.id, id));
}

export async function deleteInvoice(id: number, user_id: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // Verify ownership
  const result = await db
    .select()
    .from(invoices)
    .where(eq(invoices.id, id))
    .limit(1);
  
  const invoice = result[0];
  if (!invoice || invoice.user_id !== user_id) {
    throw new Error("Invoice not found or access denied");
  }

  await db
    .delete(invoices)
    .where(eq(invoices.id, id));
}

export async function getTransactionsByUserId(user_id: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  return await db
    .select()
    .from(transactions)
    .where(eq(transactions.user_id, user_id))
    .orderBy(desc(transactions.created_at));
}

export async function getTransactionById(id: number, user_id: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db
    .select()
    .from(transactions)
    .where(eq(transactions.id, id))
    .limit(1);
  
  const transaction = result[0];
  if (!transaction || transaction.user_id !== user_id) {
    return null;
  }
  
  return transaction;
}


// ============================================
// Clients Functions
// ============================================

export async function deleteClient(id: number, user_id: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // Verify ownership
  const result = await db
    .select()
    .from(clients)
    .where(eq(clients.id, id))
    .limit(1);
  
  const client = result[0];
  if (!client || client.user_id !== user_id) {
    throw new Error("Client not found or access denied");
  }

  await db
    .delete(clients)
    .where(eq(clients.id, id));
}

export async function getInvoicesByUserId(user_id: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  return await db
    .select()
    .from(invoices)
    .where(and(
      eq(invoices.user_id, user_id),
      eq(invoices.archived, 0)
    ));
}

export async function getInvoiceById(id: number, user_id: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db
    .select()
    .from(invoices)
    .where(eq(invoices.id, id))
    .limit(1);
  
  const invoice = result[0];
  if (!invoice || invoice.user_id !== user_id) {
    return null;
  }
  
  return invoice;
}

export async function createInvoice(data: any) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db.insert(invoices).values(data);
  return { id: Number(result[0].insertId) };
}

export async function getInvoiceByPaymentToken(token: string) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db
    .select()
    .from(invoices)
    .where(eq(invoices.payment_token, token))
    .limit(1);
  
  return result[0] || null;
}

export async function updateInvoiceStatus(id: number, user_id: number, status: string) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db
    .update(invoices)
    .set({ 
      status: status as any,
      updated_at: new Date()
    })
    .where(eq(invoices.id, id));
}


export async function getClientsByUserId(user_id: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  return await db
    .select()
    .from(clients)
    .where(eq(clients.user_id, user_id));
}

export async function getClientById(id: number, user_id: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db
    .select()
    .from(clients)
    .where(eq(clients.id, id))
    .limit(1);
  
  const client = result[0];
  if (!client || client.user_id !== user_id) {
    return null;
  }
  
  return client;
}

export async function createClient(data: any) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db.insert(clients).values(data);
}

export async function updateClient(id: number, user_id: number, data: any) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // Verify ownership
  const result = await db
    .select()
    .from(clients)
    .where(eq(clients.id, id))
    .limit(1);
  
  const client = result[0];
  if (!client || client.user_id !== user_id) {
    throw new Error("Client not found or access denied");
  }

  await db
    .update(clients)
    .set(data)
    .where(eq(clients.id, id));
}

// ============================================
// Support Tickets Functions
// ============================================

export async function createSupportTicket(data: {
  user_id: number;
  subject: string;
  priority?: "low" | "medium" | "high" | "urgent";
}) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db.insert(supportTickets).values({
    user_id: data.user_id,
    subject: data.subject,
    status: "open",
    priority: data.priority || "medium",
    created_at: new Date(),
    updated_at: new Date(),
  });

  // Get the last inserted ticket
  const tickets = await db
    .select()
    .from(supportTickets)
    .where(eq(supportTickets.user_id, data.user_id))
    .orderBy(supportTickets.id)
    .limit(1);

  return tickets[0];
}

export async function getSupportTicketsByUserId(user_id: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  return await db
    .select()
    .from(supportTickets)
    .where(eq(supportTickets.user_id, user_id))
    .orderBy(supportTickets.created_at);
}

export async function getAllSupportTickets() {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  return await db
    .select()
    .from(supportTickets)
    .orderBy(supportTickets.created_at);
}

export async function getSupportTicketById(id: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db
    .select()
    .from(supportTickets)
    .where(eq(supportTickets.id, id))
    .limit(1);

  return result[0] || null;
}

export async function updateSupportTicketStatus(
  id: number,
  status: "open" | "in_progress" | "resolved" | "closed"
) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db
    .update(supportTickets)
    .set({ status, updated_at: new Date() })
    .where(eq(supportTickets.id, id));
}

// ============================================
// Support Messages Functions
// ============================================

export async function createSupportMessage(data: {
  ticket_id: number;
  user_id: number;
  message: string;
  is_staff: boolean;
}) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db.insert(supportMessages).values({
    ticket_id: data.ticket_id,
    user_id: data.user_id,
    message: data.message,
    is_staff: data.is_staff ? 1 : 0,
    created_at: new Date(),
  });

  // Update ticket's updatedAt timestamp
  await db
    .update(supportTickets)
    .set({ updated_at: new Date() })
    .where(eq(supportTickets.id, data.ticket_id));

  return result;
}

export async function getSupportMessagesByTicketId(ticket_id: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  return await db
    .select()
    .from(supportMessages)
    .where(eq(supportMessages.ticket_id, ticket_id))
    .orderBy(supportMessages.created_at);
}

// ============================================
// Admin Functions
// ============================================

export async function getAllUsers() {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  return await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      subscription_plan: users.subscription_plan,
      subscription_status: users.subscription_status,
      has_lifetime_access: users.has_lifetime_access,
      created_at: users.created_at,

    })
    .from(users)
    .orderBy(users.created_at);
}

export async function updateUserLifetimeAccess(user_id: number, hasAccess: boolean) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db
    .update(users)
    .set({ has_lifetime_access: hasAccess ? 1 : 0 })
    .where(eq(users.id, user_id));
}


// ============================================
// Market Favorites Functions
// ============================================

export async function getMarketFavoritesByUserId(user_id: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  return await db
    .select()
    .from(marketFavorites)
    .where(eq(marketFavorites.user_id, user_id))
    .orderBy(marketFavorites.created_at);
}

export async function getDashboardWidgets(user_id: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  return await db
    .select()
    .from(marketFavorites)
    .where(eq(marketFavorites.user_id, user_id))
    .where(eq(marketFavorites.is_dashboard_widget, 1))
    .orderBy(marketFavorites.position);
}

export async function addMarketFavorite(data: {
  user_id: number;
  symbol: string;
  type: 'crypto' | 'stock' | 'forex' | 'commodity';
}) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  
  // Check if already exists
  const existing = await db
    .select()
    .from(marketFavorites)
    .where(eq(marketFavorites.user_id, data.user_id))
    .where(eq(marketFavorites.symbol, data.symbol))
    .limit(1);
  
  if (existing.length > 0) {
    throw new Error("This asset is already in your favorites");
  }
  
  // Calcular la siguiente posición disponible
  const maxPosition = await db
    .select({ maxPos: sql<number>`COALESCE(MAX(position), -1)` })
    .from(marketFavorites)
    .where(eq(marketFavorites.user_id, data.user_id));
  
  const nextPosition = (maxPosition[0]?.maxPos ?? -1) + 1;
  
  await db.insert(marketFavorites).values({
    ...data,
    position: nextPosition
  });
}

export async function removeMarketFavorite(user_id: number, symbol: string) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  await db
    .delete(marketFavorites)
    .where(eq(marketFavorites.user_id, user_id))
    .where(eq(marketFavorites.symbol, symbol));
}

export async function toggleDashboardWidget(user_id: number, symbol: string) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  
  // Get current status
  const existing = await db
    .select()
    .from(marketFavorites)
    .where(eq(marketFavorites.user_id, user_id))
    .where(eq(marketFavorites.symbol, symbol))
    .limit(1);
    
  if (existing.length === 0) {
    throw new Error("Asset not found in favorites");
  }
  
  const newStatus = existing[0].is_dashboard_widget === 1 ? 0 : 1;
  
  // Si se está activando (añadiendo al dashboard), calcular la siguiente posición
  let updateData: any = { is_dashboard_widget: newStatus };
  
  if (newStatus === 1) {
    // Calcular la máxima posición actual entre todos los widgets del dashboard
    const maxDashboardPos = await db
      .select({ maxPos: sql<number>`COALESCE(MAX(position), -1)` })
      .from(marketFavorites)
      .where(eq(marketFavorites.user_id, user_id))
      .where(eq(marketFavorites.is_dashboard_widget, 1));
    
    const maxWidgetPos = await db
      .select({ maxPos: sql<number>`COALESCE(MAX(position), -1)` })
      .from(dashboardWidgets)
      .where(eq(dashboardWidgets.user_id, user_id));
    
    const maxMarketPos = maxDashboardPos[0]?.maxPos ?? -1;
    const maxDashPos = maxWidgetPos[0]?.maxPos ?? -1;
    const nextPosition = Math.max(maxMarketPos, maxDashPos) + 1;
    
    updateData.position = nextPosition;
  }
  
  await db
    .update(marketFavorites)
    .set(updateData)
    .where(eq(marketFavorites.user_id, user_id))
    .where(eq(marketFavorites.symbol, symbol));
    
  return { is_dashboard_widget: newStatus };
}

/**
 * Password Reset Token Functions
 */

/**
 * Create a password reset token for a user
 */
export async function createPasswordResetToken(userId: number, token: string) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  try {
    const { passwordResetTokens } = await import("../drizzle/schema");
    
    // Token expires in 1 hour
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    await db.insert(passwordResetTokens).values({
      user_id: userId,
      token,
      expires_at: expiresAt,
      used: 0,
      created_at: new Date(),
    });

    return { success: true };
  } catch (error) {
    console.error("[Database] Failed to create password reset token:", error);
    throw error;
  }
}

/**
 * Get password reset token by token string
 */
export async function getPasswordResetToken(token: string) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  try {
    const { passwordResetTokens } = await import("../drizzle/schema");
    const result = await db.select()
      .from(passwordResetTokens)
      .where(eq(passwordResetTokens.token, token))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    return result[0];
  } catch (error) {
    console.error("[Database] Failed to get password reset token:", error);
    throw error;
  }
}

/**
 * Mark password reset token as used
 */
export async function markPasswordResetTokenAsUsed(tokenId: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  try {
    const { passwordResetTokens } = await import("../drizzle/schema");
    await db.update(passwordResetTokens)
      .set({ used: 1 })
      .where(eq(passwordResetTokens.id, tokenId));

    return { success: true };
  } catch (error) {
    console.error("[Database] Failed to mark token as used:", error);
    throw error;
  }
}


/**
 * Dashboard Widgets Functions
 */

/**
 * Get all dashboard widgets for a user
 */
export async function getUserDashboardWidgets(user_id: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  
  const widgets = await db
    .select()
    .from(dashboardWidgets)
    .where(eq(dashboardWidgets.user_id, user_id))
    .orderBy(dashboardWidgets.position);
    
  return widgets;
}

/**
 * Add a dashboard widget
 */
export async function addDashboardWidget(data: {
  user_id: number;
  widget_type: string;
  widget_data?: string;
}) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  
  // Calcular la máxima posición actual entre todos los widgets del dashboard
  const maxDashboardPos = await db
    .select({ maxPos: sql<number>`COALESCE(MAX(position), -1)` })
    .from(marketFavorites)
    .where(eq(marketFavorites.user_id, data.user_id))
    .where(eq(marketFavorites.is_dashboard_widget, 1));
  
  const maxWidgetPos = await db
    .select({ maxPos: sql<number>`COALESCE(MAX(position), -1)` })
    .from(dashboardWidgets)
    .where(eq(dashboardWidgets.user_id, data.user_id));
  
  const maxMarketPos = maxDashboardPos[0]?.maxPos ?? -1;
  const maxDashPos = maxWidgetPos[0]?.maxPos ?? -1;
  const nextPosition = Math.max(maxMarketPos, maxDashPos) + 1;
  
  await db.insert(dashboardWidgets).values({
    user_id: data.user_id,
    widget_type: data.widget_type,
    widget_data: data.widget_data || null,
    position: nextPosition,
  });
  
  return { success: true };
}

/**
 * Remove a dashboard widget
 */
export async function removeDashboardWidget(user_id: number, widget_id: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  
  await db
    .delete(dashboardWidgets)
    .where(eq(dashboardWidgets.id, widget_id))
    .where(eq(dashboardWidgets.user_id, user_id));
    
  return { success: true };
}

/**
 * Update dashboard widgets order
 */
export async function updateDashboardWidgetsOrder(user_id: number, widgetIds: (number | string)[]) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  
  // Update position for each widget
  for (let i = 0; i < widgetIds.length; i++) {
    const widgetId = widgetIds[i];
    
    // Si es un market widget (string con prefijo "market-"), extraer el ID numérico
    if (typeof widgetId === 'string' && widgetId.startsWith('market-')) {
      const numericId = parseInt(widgetId.replace('market-', ''));
      // Actualizar en la tabla marketFavorites
      await db
        .update(marketFavorites)
        .set({ position: i })
        .where(eq(marketFavorites.id, numericId))
        .where(eq(marketFavorites.user_id, user_id));
    } else if (typeof widgetId === 'string' && widgetId.startsWith('widget-')) {
      // Widget normal con prefijo "widget-"
      const numericId = parseInt(widgetId.replace('widget-', ''));
      await db
        .update(dashboardWidgets)
        .set({ position: i })
        .where(eq(dashboardWidgets.id, numericId))
        .where(eq(dashboardWidgets.user_id, user_id));
    } else {
      // Widget normal sin prefijo (por compatibilidad)
      await db
        .update(dashboardWidgets)
        .set({ position: i })
        .where(eq(dashboardWidgets.id, widgetId as number))
        .where(eq(dashboardWidgets.user_id, user_id));
    }
  }
  
  return { success: true };
}

/**
 * Create verification token for email verification
 */
export async function createVerificationToken(userId: number): Promise<string> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  try {
    // Generate random token
    const crypto = await import('crypto');
    const token = crypto.randomBytes(32).toString('hex');

    // Set expiration (24 hours from now)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // Delete any existing tokens for this user
    await db.delete(verificationTokens).where(eq(verificationTokens.user_id, userId));

    // Insert new token
    await db.insert(verificationTokens).values({
      user_id: userId,
      token,
      expires_at: expiresAt,
    });

    return token;
  } catch (error) {
    console.error("[DB] Error creating verification token:", error);
    throw new Error("Failed to create verification token");
  }
}

/**
 * Verify email token and mark user as verified
 */
export async function verifyEmailToken(token: string) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  try {
    // Find token
    const tokenRecords = await db
      .select()
      .from(verificationTokens)
      .where(eq(verificationTokens.token, token))
      .limit(1);

    if (tokenRecords.length === 0) {
      return null;
    }

    const tokenRecord = tokenRecords[0];

    // Check if expired
    if (new Date() > new Date(tokenRecord.expires_at)) {
      // Delete expired token
      await db.delete(verificationTokens).where(eq(verificationTokens.id, tokenRecord.id));
      return null;
    }

    // Get user
    const userRecords = await db
      .select()
      .from(users)
      .where(eq(users.id, tokenRecord.user_id))
      .limit(1);

    if (userRecords.length === 0) {
      return null;
    }

    const user = userRecords[0];

    // Mark email as verified
    await db
      .update(users)
      .set({ email_verified: 1 })
      .where(eq(users.id, user.id));

    // Delete token
    await db.delete(verificationTokens).where(eq(verificationTokens.id, tokenRecord.id));

    return {
      ...user,
      email_verified: 1,
    };
  } catch (error) {
    console.error("[DB] Error verifying email token:", error);
    throw new Error("Failed to verify email token");
  }
}

/**
 * Get all recurring invoices that need generation
 */
export async function getRecurringInvoicesDueForGeneration() {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const today = new Date();
  
  return await db
    .select()
    .from(invoices)
    .where(
      sql`${invoices.is_recurring} = 1 
          AND ${invoices.next_generation_date} IS NOT NULL 
          AND ${invoices.next_generation_date} <= ${today}
          AND ${invoices.status} != 'cancelled'`
    );
}

/**
 * Get recurring invoice template (parent invoice)
 */
export async function getRecurringInvoiceTemplate(id: number, user_id: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db
    .select()
    .from(invoices)
    .where(
      sql`${invoices.id} = ${id} 
          AND ${invoices.user_id} = ${user_id}
          AND ${invoices.is_recurring} = 1`
    )
    .limit(1);

  return result[0] || null;
}

/**
 * Get all invoices generated from a recurring template
 */
export async function getRecurringInvoiceHistory(parentInvoiceId: number, user_id: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  return await db
    .select()
    .from(invoices)
    .where(
      sql`${invoices.parent_invoice_id} = ${parentInvoiceId} 
          AND ${invoices.user_id} = ${user_id}`
    )
    .orderBy(sql`${invoices.created_at} DESC`);
}

/**
 * Update next generation date for recurring invoice
 */
export async function updateRecurringInvoiceNextDate(id: number, nextDate: Date) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db
    .update(invoices)
    .set({ 
      next_generation_date: nextDate,
      updated_at: new Date()
    })
    .where(eq(invoices.id, id));
}

/**
 * Stop recurring invoice (mark as cancelled)
 */
export async function stopRecurringInvoice(id: number, user_id: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db
    .update(invoices)
    .set({ 
      is_recurring: false,
      next_generation_date: null,
      status: 'cancelled',
      updated_at: new Date()
    })
    .where(
      sql`${invoices.id} = ${id} AND ${invoices.user_id} = ${user_id}`
    );
}

/**
 * Create company profile for a new user
 */
export async function createCompanyProfile(data: {
  user_id: number;
  company_name: string;
  email: string;
  business_type?: "freelancer" | "agencia" | "empresa";
}) {
  const dbInstance = await getDb();
  
  try {
    await dbInstance.insert(companyProfiles).values({
      user_id: data.user_id,
      company_name: data.company_name,
      email: data.email,
      business_type: data.business_type || null,
      created_at: new Date(),
      updated_at: new Date(),
    });
    
    return await getCompanyProfile(data.user_id);
  } catch (error) {
    console.error('[DB] Error creating company profile:', error);
    throw error;
  }
}

/**
 * Get company profile for a user
 */
export async function getCompanyProfile(userId: number) {
  try {
    const dbInstance = await getDb();
    const profiles = await dbInstance
      .select()
      .from(companyProfiles)
      .where(eq(companyProfiles.user_id, userId))
      .limit(1);
    
    return profiles[0] || null;
  } catch (error) {
    console.error('[DB] Error getting company profile:', error);
    // Return null if table doesn't exist or has missing columns
    return null;
  }
}

/**
 * Create or update company profile
 */
export async function upsertCompanyProfile(userId: number, data: any) {
  const dbInstance = await getDb();
  
  // Check if profile exists
  const existing = await getCompanyProfile(userId);
  
  if (existing) {
    // Update existing profile
    await dbInstance
      .update(companyProfiles)
      .set({
        ...data,
        updated_at: new Date(),
      })
      .where(eq(companyProfiles.user_id, userId));
    
    return await getCompanyProfile(userId);
  } else {
    // Create new profile
    await dbInstance.insert(companyProfiles).values({
      user_id: userId,
      ...data,
    });
    
    return await getCompanyProfile(userId);
  }
}

/**
 * Update company profile logo
 */
export async function updateCompanyProfileLogo(userId: number, logoUrl: string) {
  const dbInstance = await getDb();
  
  await dbInstance
    .update(companyProfiles)
    .set({
      logo_url: logoUrl,
      updated_at: new Date(),
    })
    .where(eq(companyProfiles.user_id, userId));
  
  return await getCompanyProfile(userId);
}


// ============================================
// Reminders Functions
// ============================================

import { desc, and, gte, lte } from "drizzle-orm";

/**
 * Get all reminders for a user
 */
export async function getRemindersByUserId(user_id: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  return await db
    .select()
    .from(reminders)
    .where(eq(reminders.user_id, user_id))
    .orderBy(desc(reminders.reminder_date));
}

/**
 * Get a single reminder by ID
 */
export async function getReminderById(id: number, user_id: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db
    .select()
    .from(reminders)
    .where(and(eq(reminders.id, id), eq(reminders.user_id, user_id)))
    .limit(1);

  return result[0] || null;
}

/**
 * Create a new reminder
 */
export async function createReminder(data: {
  user_id: number;
  title: string;
  description?: string;
  reminder_date: Date;
  reminder_time?: string;
  category?: "payment" | "meeting" | "deadline" | "personal" | "other";
  priority?: "low" | "medium" | "high";
  notify_email?: boolean;
  notify_days_before?: number;
  related_client_id?: number;
  related_invoice_id?: number;
}) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db.insert(reminders).values({
    user_id: data.user_id,
    title: data.title,
    description: data.description || null,
    reminder_date: data.reminder_date,
    reminder_time: data.reminder_time || null,
    category: data.category || "other",
    priority: data.priority || "medium",
    status: "pending",
    notify_email: data.notify_email !== false ? 1 : 0,
    notify_days_before: data.notify_days_before || 1,
    email_sent: 0,
    calendar_exported: 0,
    related_client_id: data.related_client_id || null,
    related_invoice_id: data.related_invoice_id || null,
    created_at: new Date(),
    updated_at: new Date(),
  });

  // Get the created reminder
  const result = await db
    .select()
    .from(reminders)
    .where(eq(reminders.user_id, data.user_id))
    .orderBy(desc(reminders.id))
    .limit(1);

  return result[0];
}

/**
 * Update a reminder
 */
export async function updateReminder(id: number, user_id: number, data: {
  title?: string;
  description?: string;
  reminder_date?: Date;
  reminder_time?: string;
  category?: "payment" | "meeting" | "deadline" | "personal" | "other";
  priority?: "low" | "medium" | "high";
  status?: "pending" | "completed" | "cancelled";
  notify_email?: boolean;
  notify_days_before?: number;
}) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // Verify ownership
  const existing = await getReminderById(id, user_id);
  if (!existing) {
    throw new Error("Reminder not found or access denied");
  }

  const updateData: any = {
    updated_at: new Date(),
  };

  if (data.title !== undefined) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.reminder_date !== undefined) updateData.reminder_date = data.reminder_date;
  if (data.reminder_time !== undefined) updateData.reminder_time = data.reminder_time;
  if (data.category !== undefined) updateData.category = data.category;
  if (data.priority !== undefined) updateData.priority = data.priority;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.notify_email !== undefined) updateData.notify_email = data.notify_email ? 1 : 0;
  if (data.notify_days_before !== undefined) updateData.notify_days_before = data.notify_days_before;

  await db
    .update(reminders)
    .set(updateData)
    .where(and(eq(reminders.id, id), eq(reminders.user_id, user_id)));

  return await getReminderById(id, user_id);
}

/**
 * Delete a reminder
 */
export async function deleteReminder(id: number, user_id: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // Verify ownership
  const existing = await getReminderById(id, user_id);
  if (!existing) {
    throw new Error("Reminder not found or access denied");
  }

  await db
    .delete(reminders)
    .where(and(eq(reminders.id, id), eq(reminders.user_id, user_id)));

  return { success: true };
}

/**
 * Mark reminder as calendar exported
 */
export async function markReminderCalendarExported(id: number, user_id: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db
    .update(reminders)
    .set({ calendar_exported: 1, updated_at: new Date() })
    .where(and(eq(reminders.id, id), eq(reminders.user_id, user_id)));
}

/**
 * Mark reminder email as sent
 */
export async function markReminderEmailSent(id: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db
    .update(reminders)
    .set({ email_sent: 1, updated_at: new Date() })
    .where(eq(reminders.id, id));
}
