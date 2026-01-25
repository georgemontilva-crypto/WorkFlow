/**
 * Cron Jobs Manager
 * Manages all scheduled tasks for the application
 */

import { processReminders } from './reminder-processor';
import { processRecurringInvoices } from './recurring-invoices';

// Interval in milliseconds
const REMINDER_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes
const RECURRING_INVOICE_CHECK_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours (daily)

let reminderInterval: NodeJS.Timeout | null = null;
let recurringInvoiceInterval: NodeJS.Timeout | null = null;

/**
 * Start all cron jobs
 */
export function startCronJobs() {
  console.log('[Cron] Starting cron jobs...');
  
  // Start reminder processor
  if (!reminderInterval) {
    // Run immediately on start
    processReminders();
    
    // Then run every 5 minutes
    reminderInterval = setInterval(() => {
      processReminders();
    }, REMINDER_CHECK_INTERVAL);
    
    console.log('[Cron] Reminder processor started (runs every 5 minutes)');
  }
  
  // Start recurring invoices processor
  if (!recurringInvoiceInterval) {
    // Run immediately on start
    processRecurringInvoices();
    
    // Then run every 24 hours
    recurringInvoiceInterval = setInterval(() => {
      processRecurringInvoices();
    }, RECURRING_INVOICE_CHECK_INTERVAL);
    
    console.log('[Cron] Recurring invoices processor started (runs daily)');
  }
}

/**
 * Stop all cron jobs
 */
export function stopCronJobs() {
  console.log('[Cron] Stopping cron jobs...');
  
  if (reminderInterval) {
    clearInterval(reminderInterval);
    reminderInterval = null;
    console.log('[Cron] Reminder processor stopped');
  }
  
  if (recurringInvoiceInterval) {
    clearInterval(recurringInvoiceInterval);
    recurringInvoiceInterval = null;
    console.log('[Cron] Recurring invoices processor stopped');
  }
}

/**
 * Manually trigger reminder processing (for testing)
 */
export async function triggerReminderProcessing() {
  console.log('[Cron] Manually triggering reminder processing...');
  await processReminders();
}

/**
 * Manually trigger recurring invoices processing (for testing)
 */
export async function triggerRecurringInvoicesProcessing() {
  console.log('[Cron] Manually triggering recurring invoices processing...');
  await processRecurringInvoices();
}
