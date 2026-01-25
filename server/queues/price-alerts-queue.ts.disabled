/**
 * Price Alerts Queue - Bull Queue for price monitoring
 * Handles checking prices and triggering alerts
 */

import Bull from 'bull';
import { getRedisConfig } from '../config/redis';

// Create price alerts queue
export const priceAlertsQueue = new Bull('price-alerts', {
  redis: getRedisConfig(),
  defaultJobOptions: {
    attempts: 2,
    backoff: {
      type: 'fixed',
      delay: 30000, // 30 seconds
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
});

// Job data interface
export interface PriceAlertCheckJobData {
  timestamp: number;
}

/**
 * Initialize repeatable job to check prices every minute
 */
export async function initializePriceAlertsScheduler() {
  // Remove any existing repeatable jobs first
  const repeatableJobs = await priceAlertsQueue.getRepeatableJobs();
  for (const job of repeatableJobs) {
    await priceAlertsQueue.removeRepeatableByKey(job.key);
  }

  // Add repeatable job - runs every minute
  await priceAlertsQueue.add(
    'check-prices',
    { timestamp: Date.now() },
    {
      repeat: {
        cron: '* * * * *', // Every minute
      },
      jobId: 'price-alerts-checker',
    }
  );

  console.log('[Price Alerts Queue] Repeatable job scheduled to run every minute');
}

/**
 * Get queue statistics
 */
export async function getPriceAlertsQueueStats() {
  const [waiting, active, completed, failed, delayed] = await Promise.all([
    priceAlertsQueue.getWaitingCount(),
    priceAlertsQueue.getActiveCount(),
    priceAlertsQueue.getCompletedCount(),
    priceAlertsQueue.getFailedCount(),
    priceAlertsQueue.getDelayedCount(),
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
priceAlertsQueue.on('completed', (job) => {
  console.log(`[Price Alerts Queue] Job ${job.id} completed`);
});

priceAlertsQueue.on('failed', (job, err) => {
  console.error(`[Price Alerts Queue] Job ${job?.id} failed:`, err.message);
});

priceAlertsQueue.on('error', (error) => {
  console.error('[Price Alerts Queue] Queue error:', error);
});

console.log('[Price Alerts Queue] Queue initialized');
