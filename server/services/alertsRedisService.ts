/**
 * Alerts Redis Service
 * Redis as performance layer for alerts evaluation and deduplication
 * Database remains the single source of truth
 */

import { getRedisClient } from '../config/redis';
import type { Redis } from 'ioredis';

export interface AlertCondition {
  id: string;
  userId: number;
  type: 'price_alert' | 'overdue_invoice' | 'pending_payment' | 'month_end_event';
  condition: any; // Specific to alert type
  priority: 'critical' | 'warning' | 'info';
}

export interface AlertEvent {
  alertId: string;
  userId: number;
  type: string;
  priority: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  actionUrl?: string;
  sendEmail: boolean;
  metadata?: Record<string, any>;
  timestamp: number;
}

export class AlertsRedisService {
  private redis: Redis;
  
  // Key prefixes
  private readonly PREFIX_ACTIVE = 'alerts:active:';
  private readonly PREFIX_TRIGGERED = 'alerts:triggered:';
  private readonly PREFIX_PROCESSING = 'alerts:processing:';
  private readonly PREFIX_RATE_LIMIT_TOAST = 'alerts:ratelimit:toast:';
  private readonly PREFIX_RATE_LIMIT_EMAIL = 'alerts:ratelimit:email:';
  private readonly QUEUE_EVENTS = 'alerts:events:queue';
  
  // TTL values (in seconds)
  private readonly TTL_TRIGGERED = 86400; // 24 hours
  private readonly TTL_PROCESSING = 300; // 5 minutes
  private readonly TTL_RATE_LIMIT = 60; // 1 minute
  
  constructor() {
    this.redis = getRedisClient();
  }

  /**
   * Load active alerts from DB to Redis for evaluation
   * Called periodically by workers
   */
  async loadActiveAlerts(alerts: AlertCondition[]): Promise<void> {
    const pipeline = this.redis.pipeline();
    
    for (const alert of alerts) {
      const key = `${this.PREFIX_ACTIVE}${alert.type}:${alert.id}`;
      pipeline.set(key, JSON.stringify(alert), 'EX', 3600); // 1 hour TTL
    }
    
    await pipeline.exec();
    console.log(`[Alerts Redis] Loaded ${alerts.length} active alerts`);
  }

  /**
   * Get all active alerts of a specific type
   */
  async getActiveAlertsByType(type: string): Promise<AlertCondition[]> {
    const pattern = `${this.PREFIX_ACTIVE}${type}:*`;
    const keys = await this.redis.keys(pattern);
    
    if (keys.length === 0) return [];
    
    const values = await this.redis.mget(...keys);
    return values
      .filter((v): v is string => v !== null)
      .map(v => JSON.parse(v));
  }

  /**
   * Check if alert was already triggered
   */
  async isAlertTriggered(alertId: string): Promise<boolean> {
    const key = `${this.PREFIX_TRIGGERED}${alertId}`;
    const exists = await this.redis.exists(key);
    return exists === 1;
  }

  /**
   * Mark alert as triggered (prevents duplicates)
   */
  async markAlertTriggered(alertId: string): Promise<void> {
    const key = `${this.PREFIX_TRIGGERED}${alertId}`;
    await this.redis.set(key, Date.now(), 'EX', this.TTL_TRIGGERED);
  }

  /**
   * Check if alert is being processed (prevents race conditions)
   */
  async isAlertProcessing(alertId: string): Promise<boolean> {
    const key = `${this.PREFIX_PROCESSING}${alertId}`;
    const exists = await this.redis.exists(key);
    return exists === 1;
  }

  /**
   * Lock alert for processing
   */
  async lockAlertForProcessing(alertId: string): Promise<boolean> {
    const key = `${this.PREFIX_PROCESSING}${alertId}`;
    // Use SET NX (set if not exists) for atomic lock
    const result = await this.redis.set(key, Date.now(), 'EX', this.TTL_PROCESSING, 'NX');
    return result === 'OK';
  }

  /**
   * Unlock alert after processing
   */
  async unlockAlert(alertId: string): Promise<void> {
    const key = `${this.PREFIX_PROCESSING}${alertId}`;
    await this.redis.del(key);
  }

  /**
   * Enqueue alert event for processing by worker
   */
  async enqueueAlertEvent(event: AlertEvent): Promise<void> {
    await this.redis.rpush(this.QUEUE_EVENTS, JSON.stringify(event));
    console.log(`[Alerts Redis] Enqueued event: ${event.type} for user ${event.userId}`);
  }

  /**
   * Dequeue alert event (blocking pop with timeout)
   */
  async dequeueAlertEvent(timeoutSeconds: number = 5): Promise<AlertEvent | null> {
    const result = await this.redis.blpop(this.QUEUE_EVENTS, timeoutSeconds);
    
    if (!result) return null;
    
    const [, value] = result;
    return JSON.parse(value);
  }

  /**
   * Get queue length
   */
  async getQueueLength(): Promise<number> {
    return await this.redis.llen(this.QUEUE_EVENTS);
  }

  /**
   * Check toast rate limit for user
   */
  async checkToastRateLimit(userId: number): Promise<boolean> {
    const key = `${this.PREFIX_RATE_LIMIT_TOAST}${userId}`;
    const count = await this.redis.get(key);
    
    // Allow max 5 toasts per minute per user
    if (count && parseInt(count) >= 5) {
      return false; // Rate limited
    }
    
    return true;
  }

  /**
   * Increment toast rate limit counter
   */
  async incrementToastRateLimit(userId: number): Promise<void> {
    const key = `${this.PREFIX_RATE_LIMIT_TOAST}${userId}`;
    const current = await this.redis.incr(key);
    
    // Set TTL only on first increment
    if (current === 1) {
      await this.redis.expire(key, this.TTL_RATE_LIMIT);
    }
  }

  /**
   * Check email rate limit for user
   */
  async checkEmailRateLimit(userId: number, alertType: string): Promise<boolean> {
    const key = `${this.PREFIX_RATE_LIMIT_EMAIL}${userId}:${alertType}`;
    const count = await this.redis.get(key);
    
    // Allow max 3 emails per hour per alert type per user
    if (count && parseInt(count) >= 3) {
      return false; // Rate limited
    }
    
    return true;
  }

  /**
   * Increment email rate limit counter
   */
  async incrementEmailRateLimit(userId: number, alertType: string): Promise<void> {
    const key = `${this.PREFIX_RATE_LIMIT_EMAIL}${userId}:${alertType}`;
    const current = await this.redis.incr(key);
    
    // Set TTL only on first increment (1 hour)
    if (current === 1) {
      await this.redis.expire(key, 3600);
    }
  }

  /**
   * Remove active alert from Redis (when deactivated in DB)
   */
  async removeActiveAlert(type: string, alertId: string): Promise<void> {
    const key = `${this.PREFIX_ACTIVE}${type}:${alertId}`;
    await this.redis.del(key);
  }

  /**
   * Clear all triggered alerts (cleanup)
   */
  async clearTriggeredAlerts(): Promise<void> {
    const pattern = `${this.PREFIX_TRIGGERED}*`;
    const keys = await this.redis.keys(pattern);
    
    if (keys.length > 0) {
      await this.redis.del(...keys);
      console.log(`[Alerts Redis] Cleared ${keys.length} triggered alerts`);
    }
  }

  /**
   * Get statistics
   */
  async getStats(): Promise<{
    activeAlerts: number;
    triggeredAlerts: number;
    processingAlerts: number;
    queueLength: number;
  }> {
    const [activeKeys, triggeredKeys, processingKeys, queueLen] = await Promise.all([
      this.redis.keys(`${this.PREFIX_ACTIVE}*`),
      this.redis.keys(`${this.PREFIX_TRIGGERED}*`),
      this.redis.keys(`${this.PREFIX_PROCESSING}*`),
      this.redis.llen(this.QUEUE_EVENTS),
    ]);

    return {
      activeAlerts: activeKeys.length,
      triggeredAlerts: triggeredKeys.length,
      processingAlerts: processingKeys.length,
      queueLength: queueLen,
    };
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.redis.ping();
      return true;
    } catch (error) {
      console.error('[Alerts Redis] Health check failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const alertsRedisService = new AlertsRedisService();
