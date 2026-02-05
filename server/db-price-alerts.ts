import { eq, and, sql } from "drizzle-orm";
import { priceAlerts } from "../drizzle/schema";
import { getDb } from "./db";

/**
 * Price Alerts Database Functions
 * Handles CRUD operations for cryptocurrency price alerts
 */

/**
 * Create a new price alert
 */
export async function createPriceAlert(data: {
  user_id: number;
  symbol: string;
  type: "crypto" | "stock" | "forex" | "commodity";
  target_price: string;
  condition: "above" | "below";
  notify_email?: boolean;
  notify_app?: boolean;
}) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db.insert(priceAlerts).values({
    user_id: data.user_id,
    symbol: data.symbol.toUpperCase(),
    type: data.type,
    target_price: data.target_price,
    condition: data.condition,
    is_active: 1,
    notify_email: data.notify_email !== false ? 1 : 0,
    notify_app: data.notify_app !== false ? 1 : 0,
    created_at: new Date(),
  });

  const insertId = Number(result[0].insertId);
  const newAlert = await db
    .select()
    .from(priceAlerts)
    .where(eq(priceAlerts.id, insertId))
    .limit(1);

  return newAlert[0];
}

/**
 * Get all alerts for a user
 */
export async function getUserPriceAlerts(userId: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  return await db
    .select()
    .from(priceAlerts)
    .where(eq(priceAlerts.user_id, userId))
    .orderBy(sql`${priceAlerts.created_at} DESC`);
}

/**
 * Get active alerts for a user
 */
export async function getActivePriceAlerts(userId: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  return await db
    .select()
    .from(priceAlerts)
    .where(
      and(
        eq(priceAlerts.user_id, userId),
        eq(priceAlerts.is_active, 1)
      )
    )
    .orderBy(sql`${priceAlerts.created_at} DESC`);
}

/**
 * Get all active alerts across all users (for monitoring service)
 */
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

/**
 * Get alerts for a specific symbol and user
 */
export async function getUserAlertsBySymbol(userId: number, symbol: string) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  return await db
    .select()
    .from(priceAlerts)
    .where(
      and(
        eq(priceAlerts.user_id, userId),
        eq(priceAlerts.symbol, symbol.toUpperCase())
      )
    )
    .orderBy(sql`${priceAlerts.created_at} DESC`);
}

/**
 * Update alert status (activate/deactivate)
 */
export async function updatePriceAlertStatus(
  alertId: number,
  userId: number,
  isActive: boolean
) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db
    .update(priceAlerts)
    .set({ 
      is_active: isActive ? 1 : 0,
    })
    .where(
      and(
        eq(priceAlerts.id, alertId),
        eq(priceAlerts.user_id, userId)
      )
    );
}

/**
 * Mark alert as triggered
 */
export async function triggerPriceAlert(alertId: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const now = new Date();
  
  await db
    .update(priceAlerts)
    .set({ 
      is_active: 0,
      triggered_at: now,
      last_triggered_at: now,
    })
    .where(eq(priceAlerts.id, alertId));
}

/**
 * Delete a price alert
 */
export async function deletePriceAlert(alertId: number, userId: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db
    .delete(priceAlerts)
    .where(
      and(
        eq(priceAlerts.id, alertId),
        eq(priceAlerts.user_id, userId)
      )
    );
}

/**
 * Get alert by ID (with user verification)
 */
export async function getPriceAlertById(alertId: number, userId: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db
    .select()
    .from(priceAlerts)
    .where(
      and(
        eq(priceAlerts.id, alertId),
        eq(priceAlerts.user_id, userId)
      )
    )
    .limit(1);

  return result[0] || null;
}

/**
 * Count active alerts for a user
 */
export async function countUserActivePriceAlerts(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(priceAlerts)
    .where(
      and(
        eq(priceAlerts.user_id, userId),
        eq(priceAlerts.is_active, 1)
      )
    );

  return result[0]?.count || 0;
}
