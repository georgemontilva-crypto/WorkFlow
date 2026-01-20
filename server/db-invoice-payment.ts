/**
 * Invoice Payment Functions
 * Additional database functions for payment processing
 */

import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { ENV } from "./_core/env";
import { invoices } from "../drizzle/schema";
import { eq } from "drizzle-orm";

const pool = mysql.createPool({
  uri: ENV.databaseUrl,
});

const db = drizzle(pool);

export async function getInvoiceByPaymentToken(token: string) {
  const result = await db
    .select()
    .from(invoices)
    .where(eq(invoices.payment_token, token))
    .limit(1);
  
  return result[0] || null;
}
