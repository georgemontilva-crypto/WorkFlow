/**
 * Reminder Queue - Bull Queue for scheduled reminders
 * Handles scheduling and processing of reminder notifications
 */

import Bull from 'bull';
import { getRedisConfig } from '../config/redis';

// Create reminder queue
export const reminderQueue = new Bull('reminders', {
  redis: getRedisConfig(),
  defaultJobOptions: {
    attempts: 3, // Retry up to 3 times if failed
    backoff: {
      type: 'exponential',
      delay: 2000, // Start with 2 seconds, then exponential backoff
    },
    removeOnComplete: true, // Clean up completed jobs
    removeOnFail: false, // Keep failed jobs for debugging
  },
});

// Job data interface
export interface ReminderJobData {
  reminderId: number;
  userId: number;
  title: string;
  description: string | null;
  reminderDate: string;
  reminderTime: string | null;
  priority: string;
  category: string;
}

/**
 * Schedule a reminder notification
 * @param data Reminder data
 * @param sendAt Date/time when to send the notification
 */
export async function scheduleReminder(data: ReminderJobData, sendAt: Date) {
  const delay = sendAt.getTime() - Date.now();
  
  // Don't schedule if already past
  if (delay < 0) {
    console.log(`[Queue] Reminder ${data.reminderId} is in the past, sending immediately`);
    return await reminderQueue.add(data, { delay: 0 });
  }
  
  console.log(`[Queue] Scheduling reminder ${data.reminderId} for ${sendAt.toISOString()} (in ${Math.round(delay / 1000 / 60)} minutes)`);
  
  return await reminderQueue.add(data, {
    delay,
    jobId: `reminder-${data.reminderId}`, // Unique ID to prevent duplicates
  });
}

/**
 * Cancel a scheduled reminder
 * @param reminderId Reminder ID
 */
export async function cancelReminder(reminderId: number) {
  const jobId = `reminder-${reminderId}`;
  const job = await reminderQueue.getJob(jobId);
  
  if (job) {
    await job.remove();
    console.log(`[Queue] Cancelled reminder ${reminderId}`);
    return true;
  }
  
  return false;
}

/**
 * Reschedule a reminder (cancel old and schedule new)
 * @param data Updated reminder data
 * @param sendAt New send date/time
 */
export async function rescheduleReminder(data: ReminderJobData, sendAt: Date) {
  await cancelReminder(data.reminderId);
  return await scheduleReminder(data, sendAt);
}

/**
 * Get queue statistics
 */
export async function getQueueStats() {
  const [waiting, active, completed, failed, delayed] = await Promise.all([
    reminderQueue.getWaitingCount(),
    reminderQueue.getActiveCount(),
    reminderQueue.getCompletedCount(),
    reminderQueue.getFailedCount(),
    reminderQueue.getDelayedCount(),
  ]);
  
  return {
    waiting,
    active,
    completed,
    failed,
    delayed,
    total: waiting + active + delayed,
  };
}

// Log queue events
reminderQueue.on('completed', (job) => {
  console.log(`[Queue] Job ${job.id} completed successfully`);
});

reminderQueue.on('failed', (job, err) => {
  console.error(`[Queue] Job ${job?.id} failed:`, err.message);
});

reminderQueue.on('error', (error) => {
  console.error('[Queue] Queue error:', error);
});

console.log('[Queue] Reminder queue initialized');
