/**
 * Cron Jobs Manager
 * Manages all scheduled tasks for the application
 */

import { processReminders } from './reminder-processor';

// Interval in milliseconds (5 minutes = 300000 ms)
const REMINDER_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes

let reminderInterval: NodeJS.Timeout | null = null;

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
}

/**
 * Manually trigger reminder processing (for testing)
 */
export async function triggerReminderProcessing() {
  console.log('[Cron] Manually triggering reminder processing...');
  await processReminders();
}
