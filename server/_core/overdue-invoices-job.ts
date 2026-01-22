/**
 * Overdue Invoices Job
 * Runs periodically to mark invoices as overdue when they pass their due date
 */

import { getDb } from '../db';
import { invoices } from '../../drizzle/schema';
import { and, eq, lt, sql } from 'drizzle-orm';

/**
 * Process all sent invoices and mark as overdue if past due date
 */
export async function processOverdueInvoices() {
  console.log('[Overdue Invoices Job] Starting...');
  
  try {
    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today
    
    // Find all invoices that are sent or payment_sent and past their due date
    const overdueInvoices = await db
      .select()
      .from(invoices)
      .where(
        and(
          sql`${invoices.status} IN ('sent', 'payment_sent')`,
          lt(invoices.due_date, today)
        )
      );
    
    console.log(`[Overdue Invoices Job] Found ${overdueInvoices.length} overdue invoices`);
    
    // Update each invoice to overdue status
    for (const invoice of overdueInvoices) {
      try {
        await db
          .update(invoices)
          .set({ 
            status: 'overdue',
            updated_at: new Date()
          })
          .where(eq(invoices.id, invoice.id));
        
        console.log(`[Overdue Invoices Job] Marked invoice ${invoice.invoice_number} as overdue`);
      } catch (error) {
        console.error(`[Overdue Invoices Job] Error updating invoice ${invoice.id}:`, error);
        // Continue with next invoice
      }
    }
    
    console.log('[Overdue Invoices Job] Completed successfully');
    
  } catch (error) {
    console.error('[Overdue Invoices Job] Fatal error:', error);
    throw error;
  }
}

/**
 * Start the overdue invoices job scheduler
 * Runs every hour to check for overdue invoices
 */
export function startOverdueInvoicesScheduler() {
  // Run immediately on startup
  processOverdueInvoices().catch(console.error);
  
  // Schedule to run every hour
  const ONE_HOUR = 60 * 60 * 1000;
  
  setInterval(() => {
    processOverdueInvoices().catch(console.error);
  }, ONE_HOUR);
  
  console.log('[Overdue Invoices Scheduler] Started - will run every 1 hour');
}
