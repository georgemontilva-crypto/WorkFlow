/**
 * Notifications Realtime Service
 * Uses Redis Pub/Sub for instant notification delivery
 */

import { getRedisClient } from '../config/redis';
import type { Redis } from 'ioredis';

export interface NotificationEvent {
  userId: number;
  notificationId: number;
  type: 'new' | 'read' | 'delete';
  source?: 'invoice' | 'savings' | 'system';
  timestamp: number;
}

export class NotificationsRealtimeService {
  private publisher: Redis;
  private subscriber: Redis;
  private readonly CHANNEL_PREFIX = 'notifications:user:';

  constructor() {
    // Create separate Redis clients for pub and sub
    // (Redis requires separate connections for pub/sub)
    this.publisher = getRedisClient();
    this.subscriber = this.publisher.duplicate();
    
    console.log('[Notifications Realtime] Service initialized');
  }

  /**
   * Get channel name for a user
   */
  private getUserChannel(userId: number): string {
    return `${this.CHANNEL_PREFIX}${userId}`;
  }

  /**
   * Publish notification event to user's channel
   */
  async publishNotification(event: NotificationEvent): Promise<void> {
    try {
      const channel = this.getUserChannel(event.userId);
      const payload = JSON.stringify(event);
      
      await this.publisher.publish(channel, payload);
      
      console.log(`[Notifications Realtime] Published to ${channel}:`, event.type);
    } catch (error: any) {
      console.error('[Notifications Realtime] Publish error:', error.message);
    }
  }

  /**
   * Subscribe to user's notification channel
   * Returns unsubscribe function
   */
  async subscribeToUser(
    userId: number,
    callback: (event: NotificationEvent) => void
  ): Promise<() => void> {
    const channel = this.getUserChannel(userId);
    
    const messageHandler = (ch: string, message: string) => {
      if (ch === channel) {
        try {
          const event: NotificationEvent = JSON.parse(message);
          callback(event);
        } catch (error: any) {
          console.error('[Notifications Realtime] Parse error:', error.message);
        }
      }
    };

    await this.subscriber.subscribe(channel);
    this.subscriber.on('message', messageHandler);
    
    console.log(`[Notifications Realtime] Subscribed to ${channel}`);

    // Return unsubscribe function
    return async () => {
      await this.subscriber.unsubscribe(channel);
      this.subscriber.off('message', messageHandler);
      console.log(`[Notifications Realtime] Unsubscribed from ${channel}`);
    };
  }

  /**
   * Close connections
   */
  async close(): Promise<void> {
    await this.subscriber.quit();
    console.log('[Notifications Realtime] Connections closed');
  }
}

// Singleton instance
export const notificationsRealtimeService = new NotificationsRealtimeService();
