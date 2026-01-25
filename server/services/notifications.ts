import { createHash } from 'crypto';
import { db } from '../db';
import { notifications } from '../../drizzle/schema';
import type { Notification, InsertNotification } from '../../drizzle/schema';

/**
 * Sistema de Notificaciones V2
 * Limpio, predecible y escalable con Redis
 */

// ================================================
// TIPOS
// ================================================

export interface CreateNotificationInput {
  user_id: number;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  priority?: 'low' | 'normal' | 'high';
  event_type?: string; // Para cooldowns (ej: 'invoice_created', 'payment_received')
}

interface NotificationQueueItem {
  id: number;
  type: string;
  title: string;
  message: string;
  priority: string;
  created_at: Date;
}

// ================================================
// REDIS CLIENT (LAZY INITIALIZATION)
// ================================================

let redisClient: any = null;

async function getRedis() {
  if (redisClient) return redisClient;
  
  try {
    const Redis = (await import('ioredis')).default;
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times: number) => {
        if (times > 3) {
          console.error('[Notifications] Redis connection failed after 3 retries');
          return null;
        }
        return Math.min(times * 100, 3000);
      },
    });
    
    redisClient.on('error', (err: Error) => {
      console.error('[Notifications] Redis error:', err);
    });
    
    console.log('[Notifications] Redis connected');
    return redisClient;
  } catch (error) {
    console.error('[Notifications] Failed to initialize Redis:', error);
    return null;
  }
}

// ================================================
// UTILIDADES
// ================================================

/**
 * Crear hash único para detectar duplicados
 */
function createNotificationHash(input: CreateNotificationInput): string {
  const data = `${input.user_id}:${input.type}:${input.title}:${input.message}`;
  return createHash('md5').update(data).digest('hex');
}

/**
 * Obtener TTL de cooldown según tipo de evento
 */
function getCooldownTTL(event_type: string): number {
  const cooldowns: Record<string, number> = {
    'invoice_created': 60,           // 1 minuto
    'invoice_sent': 60,               // 1 minuto
    'payment_received': 300,          // 5 minutos
    'invoice_overdue': 86400,         // 1 día
    'client_created': 60,             // 1 minuto
    'email_error': 300,               // 5 minutos
    'default': 60,                    // 1 minuto por defecto
  };
  
  return cooldowns[event_type] || cooldowns['default'];
}

// ================================================
// FUNCIÓN PRINCIPAL: CREAR NOTIFICACIÓN
// ================================================

export async function createNotification(
  input: CreateNotificationInput
): Promise<Notification | null> {
  const startTime = Date.now();
  
  try {
    // 1. VALIDAR DATOS OBLIGATORIOS
    if (!input.title || input.title.trim().length === 0) {
      console.error('[Notifications] Missing title', { user_id: input.user_id });
      return null;
    }
    
    if (!input.message || input.message.trim().length === 0) {
      console.error('[Notifications] Missing message', { user_id: input.user_id });
      return null;
    }
    
    // Trim y validar longitud
    const title = input.title.trim();
    const message = input.message.trim();
    
    if (title.length > 255) {
      console.error('[Notifications] Title too long', { length: title.length });
      return null;
    }
    
    // 2. OBTENER REDIS (SI ESTÁ DISPONIBLE)
    const redis = await getRedis();
    
    if (redis) {
      // 3. VERIFICAR DUPLICADOS
      const hash = createNotificationHash(input);
      const dedupKey = `notifications:dedup:${input.user_id}:${hash}`;
      const isDuplicate = await redis.exists(dedupKey);
      
      if (isDuplicate) {
        console.log('[Notifications] Duplicate notification discarded', {
          user_id: input.user_id,
          type: input.type,
          title: title.substring(0, 50),
        });
        return null;
      }
      
      // 4. VERIFICAR COOLDOWN
      if (input.event_type) {
        const cooldownKey = `notifications:cooldown:${input.user_id}:${input.event_type}`;
        const cooldownActive = await redis.exists(cooldownKey);
        
        if (cooldownActive) {
          console.log('[Notifications] Cooldown active, notification discarded', {
            user_id: input.user_id,
            event_type: input.event_type,
          });
          return null;
        }
      }
      
      // 5. VERIFICAR RATE LIMIT (máx 10 notificaciones por minuto)
      const rateLimitKey = `notifications:ratelimit:${input.user_id}`;
      const count = await redis.incr(rateLimitKey);
      
      if (count === 1) {
        await redis.expire(rateLimitKey, 60);
      }
      
      if (count > 10) {
        console.warn('[Notifications] Rate limit exceeded', {
          user_id: input.user_id,
          count,
        });
        return null;
      }
    }
    
    // 6. GUARDAR EN BASE DE DATOS (PERSISTENTE)
    const [notification] = await db.insert(notifications).values({
      user_id: input.user_id,
      type: input.type,
      title,
      message,
      priority: input.priority || 'normal',
      is_read: 0,
    }).returning();
    
    if (!notification) {
      console.error('[Notifications] Failed to insert into database');
      return null;
    }
    
    // 7. ENCOLAR EN REDIS (TEMPORAL - PARA TOASTS)
    if (redis) {
      const queueKey = `notifications:queue:${input.user_id}`;
      const queueItem: NotificationQueueItem = {
        id: notification.id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        priority: notification.priority,
        created_at: notification.created_at,
      };
      
      await redis.rpush(queueKey, JSON.stringify(queueItem));
      
      // 8. ESTABLECER CONTROLES
      const hash = createNotificationHash(input);
      const dedupKey = `notifications:dedup:${input.user_id}:${hash}`;
      await redis.setex(dedupKey, 300, '1'); // 5 minutos
      
      if (input.event_type) {
        const cooldownKey = `notifications:cooldown:${input.user_id}:${input.event_type}`;
        const ttl = getCooldownTTL(input.event_type);
        await redis.setex(cooldownKey, ttl, '1');
      }
    }
    
    // 9. LOG DE ÉXITO
    const duration = Date.now() - startTime;
    console.log('[Notifications] Created successfully', {
      id: notification.id,
      user_id: input.user_id,
      type: input.type,
      priority: input.priority || 'normal',
      event_type: input.event_type,
      duration_ms: duration,
    });
    
    return notification;
    
  } catch (error: any) {
    console.error('[Notifications] Error creating notification:', {
      error: error.message,
      user_id: input.user_id,
      type: input.type,
    });
    return null;
  }
}

// ================================================
// OBTENER NOTIFICACIONES PENDIENTES (TOASTS)
// ================================================

export async function getPendingNotifications(
  user_id: number
): Promise<NotificationQueueItem[]> {
  try {
    const redis = await getRedis();
    if (!redis) return [];
    
    const queueKey = `notifications:queue:${user_id}`;
    
    // Obtener todas las notificaciones de la cola
    const items = await redis.lrange(queueKey, 0, -1);
    
    if (!items || items.length === 0) {
      return [];
    }
    
    // Parsear y retornar
    const notifications = items.map((item: string) => JSON.parse(item));
    
    console.log('[Notifications] Retrieved pending notifications', {
      user_id,
      count: notifications.length,
    });
    
    return notifications;
    
  } catch (error: any) {
    console.error('[Notifications] Error getting pending notifications:', error);
    return [];
  }
}

// ================================================
// LIMPIAR NOTIFICACIONES PENDIENTES (DESPUÉS DE MOSTRAR)
// ================================================

export async function clearPendingNotifications(user_id: number): Promise<void> {
  try {
    const redis = await getRedis();
    if (!redis) return;
    
    const queueKey = `notifications:queue:${user_id}`;
    await redis.del(queueKey);
    
    console.log('[Notifications] Cleared pending notifications', { user_id });
    
  } catch (error: any) {
    console.error('[Notifications] Error clearing pending notifications:', error);
  }
}

// ================================================
// OBTENER HISTORIAL (DESDE BASE DE DATOS)
// ================================================

export async function getNotificationHistory(
  user_id: number,
  limit: number = 50
): Promise<Notification[]> {
  try {
    const result = await db
      .select()
      .from(notifications)
      .where((t: any) => t.user_id.eq(user_id))
      .orderBy((t: any) => t.created_at.desc())
      .limit(limit);
    
    return result as Notification[];
    
  } catch (error: any) {
    console.error('[Notifications] Error getting history:', error);
    return [];
  }
}

// ================================================
// MARCAR COMO LEÍDA
// ================================================

export async function markNotificationAsRead(
  notification_id: number,
  user_id: number
): Promise<boolean> {
  try {
    await db
      .update(notifications)
      .set({ is_read: 1 })
      .where((t: any) => t.id.eq(notification_id).and(t.user_id.eq(user_id)));
    
    console.log('[Notifications] Marked as read', { notification_id, user_id });
    return true;
    
  } catch (error: any) {
    console.error('[Notifications] Error marking as read:', error);
    return false;
  }
}

// ================================================
// MARCAR TODAS COMO LEÍDAS
// ================================================

export async function markAllNotificationsAsRead(user_id: number): Promise<boolean> {
  try {
    await db
      .update(notifications)
      .set({ is_read: 1 })
      .where((t: any) => t.user_id.eq(user_id).and(t.is_read.eq(0)));
    
    console.log('[Notifications] Marked all as read', { user_id });
    return true;
    
  } catch (error: any) {
    console.error('[Notifications] Error marking all as read:', error);
    return false;
  }
}
