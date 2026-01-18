import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { ENV } from "./_core/env";
import { users, clients, invoices, transactions, savingsGoals, supportTickets, supportMessages } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

let pool: mysql.Pool | undefined;
let db: ReturnType<typeof drizzle> | undefined;

/**
 * Get or create database connection pool and Drizzle instance
 */
export async function getDb() {
  if (db) return db;

  try {
    pool = mysql.createPool(ENV.databaseUrl);
    db = drizzle(pool);
    console.log("[Database] Connected successfully");
    return db;
  } catch (error) {
    console.error("[Database] Connection failed:", error);
    return undefined;
  }
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

    // Set trial end date (7 days from now)
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 7);

    // Insert user
    const result = await db.insert(users).values({
      name: data.name,
      email: data.email,
      passwordHash,
      emailVerified: 0,
      loginMethod: "email",
      role: "user",
      trialEndsAt: trialEnd,
      hasLifetimeAccess: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
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
    const isValid = await bcrypt.compare(password, user.passwordHash);

    if (!isValid) {
      return null; // Invalid password
    }

    // Update last signed in
    await db.update(users)
      .set({ lastSignedIn: new Date() })
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
export async function grantLifetimeAccess(userId: number, stripeCustomerId?: string, stripePaymentId?: string) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  try {
    await db.update(users)
      .set({
        hasLifetimeAccess: 1,
        stripeCustomerId,
        stripePaymentId,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  } catch (error) {
    console.error("[Database] Failed to grant lifetime access:", error);
    throw error;
  }
}

/**
 * Check if user has active access (trial or lifetime)
 */
export async function hasActiveAccess(userId: number): Promise<boolean> {
  const user = await getUserById(userId);
  if (!user) return false;

  // Check if user has lifetime access
  if (user.hasLifetimeAccess === 1) {
    return true;
  }

  // Check if trial is still active
  if (user.trialEndsAt) {
    const now = new Date();
    return now < user.trialEndsAt;
  }

  return false;
}

export { users, clients, invoices, transactions, savingsGoals };

// ============================================
// Savings Goals Functions
// ============================================

export async function getSavingsGoalById(id: number, userId: number) {
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
  if (!goal || goal.userId !== userId) {
    return null;
  }
  
  return goal;
}

export async function createSavingsGoal(data: any) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db.insert(savingsGoals).values(data);
}

export async function updateSavingsGoal(id: number, userId: number, data: any) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // Verify ownership
  const goal = await getSavingsGoalById(id, userId);
  if (!goal) {
    throw new Error("Savings goal not found or access denied");
  }

  await db
    .update(savingsGoals)
    .set(data)
    .where(eq(savingsGoals.id, id));
}

export async function deleteSavingsGoal(id: number, userId: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // Verify ownership
  const goal = await getSavingsGoalById(id, userId);
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

export async function updateTransaction(id: number, userId: number, data: any) {
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
  if (!transaction || transaction.userId !== userId) {
    throw new Error("Transaction not found or access denied");
  }

  await db
    .update(transactions)
    .set(data)
    .where(eq(transactions.id, id));
}

export async function deleteTransaction(id: number, userId: number) {
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
  if (!transaction || transaction.userId !== userId) {
    throw new Error("Transaction not found or access denied");
  }

  await db
    .delete(transactions)
    .where(eq(transactions.id, id));
}

export async function getSavingsGoalsByUserId(userId: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  return await db
    .select()
    .from(savingsGoals)
    .where(eq(savingsGoals.userId, userId));
}


// ============================================
// Invoices Functions
// ============================================

export async function updateInvoice(id: number, userId: number, data: any) {
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
  if (!invoice || invoice.userId !== userId) {
    throw new Error("Invoice not found or access denied");
  }

  await db
    .update(invoices)
    .set(data)
    .where(eq(invoices.id, id));
}

export async function deleteInvoice(id: number, userId: number) {
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
  if (!invoice || invoice.userId !== userId) {
    throw new Error("Invoice not found or access denied");
  }

  await db
    .delete(invoices)
    .where(eq(invoices.id, id));
}

export async function getTransactionsByUserId(userId: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  return await db
    .select()
    .from(transactions)
    .where(eq(transactions.userId, userId));
}

export async function getTransactionById(id: number, userId: number) {
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
  if (!transaction || transaction.userId !== userId) {
    return null;
  }
  
  return transaction;
}


// ============================================
// Clients Functions
// ============================================

export async function deleteClient(id: number, userId: number) {
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
  if (!client || client.userId !== userId) {
    throw new Error("Client not found or access denied");
  }

  await db
    .delete(clients)
    .where(eq(clients.id, id));
}

export async function getInvoicesByUserId(userId: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  return await db
    .select()
    .from(invoices)
    .where(eq(invoices.userId, userId));
}

export async function getInvoiceById(id: number, userId: number) {
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
  if (!invoice || invoice.userId !== userId) {
    return null;
  }
  
  return invoice;
}

export async function createInvoice(data: any) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db.insert(invoices).values(data);
}


export async function getClientsByUserId(userId: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  return await db
    .select()
    .from(clients)
    .where(eq(clients.userId, userId));
}

export async function getClientById(id: number, userId: number) {
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
  if (!client || client.userId !== userId) {
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

export async function updateClient(id: number, userId: number, data: any) {
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
  if (!client || client.userId !== userId) {
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
  userId: number;
  subject: string;
  priority?: "low" | "medium" | "high" | "urgent";
}) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db.insert(supportTickets).values({
    userId: data.userId,
    subject: data.subject,
    status: "open",
    priority: data.priority || "medium",
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // Get the last inserted ticket
  const tickets = await db
    .select()
    .from(supportTickets)
    .where(eq(supportTickets.userId, data.userId))
    .orderBy(supportTickets.id)
    .limit(1);

  return tickets[0];
}

export async function getSupportTicketsByUserId(userId: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  return await db
    .select()
    .from(supportTickets)
    .where(eq(supportTickets.userId, userId))
    .orderBy(supportTickets.createdAt);
}

export async function getAllSupportTickets() {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  return await db
    .select()
    .from(supportTickets)
    .orderBy(supportTickets.createdAt);
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
    .set({ status, updatedAt: new Date() })
    .where(eq(supportTickets.id, id));
}

// ============================================
// Support Messages Functions
// ============================================

export async function createSupportMessage(data: {
  ticketId: number;
  senderId: number;
  message: string;
  isAdminReply: boolean;
}) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db.insert(supportMessages).values({
    ticketId: data.ticketId,
    senderId: data.senderId,
    message: data.message,
    isAdminReply: data.isAdminReply ? 1 : 0,
    createdAt: new Date(),
  });

  // Update ticket's updatedAt timestamp
  await db
    .update(supportTickets)
    .set({ updatedAt: new Date() })
    .where(eq(supportTickets.id, data.ticketId));

  return result;
}

export async function getSupportMessagesByTicketId(ticketId: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  return await db
    .select()
    .from(supportMessages)
    .where(eq(supportMessages.ticketId, ticketId))
    .orderBy(supportMessages.createdAt);
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
      trialEndsAt: users.trialEndsAt,
      hasLifetimeAccess: users.hasLifetimeAccess,
      createdAt: users.createdAt,
      lastSignedIn: users.lastSignedIn,
    })
    .from(users)
    .orderBy(users.createdAt);
}

export async function updateUserLifetimeAccess(userId: number, hasAccess: boolean) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db
    .update(users)
    .set({ hasLifetimeAccess: hasAccess ? 1 : 0, updatedAt: new Date() })
    .where(eq(users.id, userId));
}
