/**
 * Recurring Invoices Generator
 * Runs daily to generate new invoices from recurring templates
 */

import { getDb } from "../db";
import { invoices, invoiceItems } from "../../drizzle/schema";
import { eq, and, lte, or, isNull } from "drizzle-orm";

/**
 * Calculate next invoice date based on frequency
 */
function getNextInvoiceDate(lastDate: Date, frequency: string): Date {
  const next = new Date(lastDate);
  
  switch (frequency) {
    case 'weekly':
      next.setDate(next.getDate() + 7);
      break;
    case 'biweekly':
      next.setDate(next.getDate() + 14);
      break;
    case 'monthly':
      next.setMonth(next.getMonth() + 1);
      break;
    case 'quarterly':
      next.setMonth(next.getMonth() + 3);
      break;
    case 'semiannually':
      next.setMonth(next.getMonth() + 6);
      break;
    case 'annually':
      next.setFullYear(next.getFullYear() + 1);
      break;
    default:
      throw new Error(`Unknown frequency: ${frequency}`);
  }
  
  return next;
}

/**
 * Generate invoice number (format: INV-YYYYMMDD-XXXX)
 */
function generateInvoiceNumber(): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");
  const random = Math.floor(1000 + Math.random() * 9000);
  return `INV-${dateStr}-${random}`;
}

/**
 * Process recurring invoices
 * Generates new invoices for recurring templates that are due
 */
export async function processRecurringInvoices() {
  console.log('[RecurringInvoices] Starting recurring invoices processor...');
  
  try {
    const db = await getDb();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Find all recurring invoices that need to generate a new invoice
    const recurringInvoices = await db
      .select()
      .from(invoices)
      .where(
        and(
          eq(invoices.is_recurring, 1),
          or(
            isNull(invoices.recurrence_end_date),
            lte(today, invoices.recurrence_end_date)
          )
        )
      );
    
    console.log(`[RecurringInvoices] Found ${recurringInvoices.length} recurring invoices`);
    
    let generated = 0;
    
    for (const recurringInvoice of recurringInvoices) {
      try {
        // Determine the date to check against
        const lastGenerated = recurringInvoice.last_generated_date || recurringInvoice.recurrence_start_date;
        
        if (!lastGenerated) {
          console.log(`[RecurringInvoices] Skipping invoice ${recurringInvoice.id}: no start date`);
          continue;
        }
        
        // Calculate next invoice date
        const nextDate = getNextInvoiceDate(new Date(lastGenerated), recurringInvoice.recurrence_frequency!);
        
        // Check if it's time to generate
        if (nextDate > today) {
          console.log(`[RecurringInvoices] Invoice ${recurringInvoice.id}: next date is ${nextDate.toISOString()}, skipping`);
          continue;
        }
        
        // Check if we've passed the end date
        if (recurringInvoice.recurrence_end_date && nextDate > new Date(recurringInvoice.recurrence_end_date)) {
          console.log(`[RecurringInvoices] Invoice ${recurringInvoice.id}: passed end date, skipping`);
          continue;
        }
        
        console.log(`[RecurringInvoices] Generating new invoice from template ${recurringInvoice.id}`);
        
        // Get items from the recurring invoice
        const items = await db
          .select()
          .from(invoiceItems)
          .where(eq(invoiceItems.invoice_id, recurringInvoice.id));
        
        // Calculate new due date (same interval as original)
        const originalIssue = new Date(recurringInvoice.issue_date);
        const originalDue = new Date(recurringInvoice.due_date);
        const daysDiff = Math.floor((originalDue.getTime() - originalIssue.getTime()) / (1000 * 60 * 60 * 24));
        
        const newIssueDate = nextDate;
        const newDueDate = new Date(nextDate);
        newDueDate.setDate(newDueDate.getDate() + daysDiff);
        
        // Generate new invoice
        const newInvoiceNumber = generateInvoiceNumber();
        
        const [newInvoice] = await db.insert(invoices).values({
          user_id: recurringInvoice.user_id,
          client_id: recurringInvoice.client_id,
          invoice_number: newInvoiceNumber,
          status: "draft",
          currency: recurringInvoice.currency,
          subtotal: recurringInvoice.subtotal,
          total: recurringInvoice.total,
          issue_date: newIssueDate,
          due_date: newDueDate,
          notes: recurringInvoice.notes,
          terms: recurringInvoice.terms,
          is_recurring: 0, // Generated invoices are not recurring themselves
          recurrence_frequency: null,
          recurrence_start_date: null,
          recurrence_end_date: null,
          last_generated_date: null,
          parent_invoice_id: recurringInvoice.id,
        });
        
        const newInvoiceId = Number(newInvoice.insertId);
        
        // Copy items
        for (const item of items) {
          await db.insert(invoiceItems).values({
            invoice_id: newInvoiceId,
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total: item.total,
          });
        }
        
        // Update last_generated_date on the recurring invoice
        await db
          .update(invoices)
          .set({ last_generated_date: nextDate })
          .where(eq(invoices.id, recurringInvoice.id));
        
        console.log(`[RecurringInvoices] Generated invoice ${newInvoiceId} from template ${recurringInvoice.id}`);
        generated++;
        
      } catch (error: any) {
        console.error(`[RecurringInvoices] Error processing invoice ${recurringInvoice.id}:`, error.message);
      }
    }
    
    console.log(`[RecurringInvoices] Completed: ${generated} invoices generated`);
    return { success: true, generated };
    
  } catch (error: any) {
    console.error('[RecurringInvoices] Fatal error:', error.message);
    return { success: false, error: error.message };
  }
}
