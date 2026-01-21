/**
 * Recurring Invoices Job
 * Runs daily to generate invoices from recurring templates
 */

import { 
  getRecurringInvoicesDueForGeneration,
  createInvoice,
  updateRecurringInvoiceNextDate
} from '../db';
import { 
  calculateNextGenerationDate,
  generateRecurringInvoiceNumber,
  shouldGenerateInvoice,
  type RecurrenceFrequency
} from './recurring-invoices';
import { addDays } from 'date-fns';

/**
 * Process all recurring invoices and generate new ones if needed
 */
export async function processRecurringInvoices() {
  console.log('[Recurring Invoices Job] Starting...');
  
  try {
    // Get all recurring invoices that are due for generation
    const dueInvoices = await getRecurringInvoicesDueForGeneration();
    
    console.log(`[Recurring Invoices Job] Found ${dueInvoices.length} invoices to process`);
    
    for (const template of dueInvoices) {
      try {
        // Check if should generate (date check)
        if (!template.next_generation_date || !shouldGenerateInvoice(template.next_generation_date)) {
          continue;
        }
        
        // Generate new invoice from template
        const newInvoiceData = {
          user_id: template.user_id,
          client_id: template.client_id,
          invoice_number: generateRecurringInvoiceNumber(template.invoice_number),
          issue_date: new Date(),
          due_date: addDays(new Date(), 30), // 30 days from now
          items: template.items,
          subtotal: template.subtotal,
          tax: template.tax,
          total: template.total,
          currency: template.currency,
          paid_amount: '0',
          balance: template.total,
          status: 'sent' as const,
          payment_link: template.payment_link,
          notes: template.notes,
          is_recurring: false, // Generated invoices are not recurring themselves
          parent_invoice_id: template.id, // Link to parent template
        };
        
        // Create the new invoice
        const result = await createInvoice(newInvoiceData);
        
        console.log(`[Recurring Invoices Job] Generated invoice ${newInvoiceData.invoice_number} from template ${template.invoice_number}`);
        
        // Calculate next generation date
        const nextDate = calculateNextGenerationDate(
          new Date(),
          template.recurrence_frequency as RecurrenceFrequency,
          template.recurrence_interval || undefined
        );
        
        // Update template's next generation date
        await updateRecurringInvoiceNextDate(template.id, nextDate);
        
        console.log(`[Recurring Invoices Job] Next generation scheduled for ${nextDate.toISOString()}`);
        
      } catch (error) {
        console.error(`[Recurring Invoices Job] Error processing invoice ${template.id}:`, error);
        // Continue with next invoice even if one fails
      }
    }
    
    console.log('[Recurring Invoices Job] Completed successfully');
    
  } catch (error) {
    console.error('[Recurring Invoices Job] Fatal error:', error);
    throw error;
  }
}

/**
 * Start the recurring invoices job scheduler
 * Runs every day at 00:00 UTC
 */
export function startRecurringInvoicesScheduler() {
  // Run immediately on startup (for testing)
  processRecurringInvoices().catch(console.error);
  
  // Schedule to run daily at midnight
  const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
  
  setInterval(() => {
    processRecurringInvoices().catch(console.error);
  }, TWENTY_FOUR_HOURS);
  
  console.log('[Recurring Invoices Scheduler] Started - will run every 24 hours');
}
