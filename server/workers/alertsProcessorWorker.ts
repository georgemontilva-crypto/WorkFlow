/**
 * Alerts Processor Worker
 * Processes alert events from Redis queue and persists to database
 * Handles toast notifications and email sending
 */

import { alertsRedisService, type AlertEvent } from '../services/alertsRedisService';
import { getDb } from '../db';
import { alerts, users } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';
import { sendEmail } from '../_core/email';

/**
 * Process a single alert event
 */
async function processAlertEvent(event: AlertEvent): Promise<boolean> {
  console.log(`[Alerts Processor] Processing event: ${event.type} for user ${event.userId}`);

  try {
    // Check if already triggered
    if (await alertsRedisService.isAlertTriggered(event.alertId)) {
      console.log(`[Alerts Processor] Alert ${event.alertId} already triggered, skipping`);
      return false;
    }

    // Try to lock for processing
    const locked = await alertsRedisService.lockAlertForProcessing(event.alertId);
    if (!locked) {
      console.log(`[Alerts Processor] Alert ${event.alertId} is being processed by another worker, skipping`);
      return false;
    }

    try {
      const db = await getDb();

      // 1. Persist alert to database (source of truth)
      await db.insert(alerts).values({
        user_id: event.userId,
        type: event.priority,
        title: event.title,
        message: event.message,
        action_url: event.actionUrl || null,
        is_read: 0,
      });

      console.log(`[Alerts Processor] Alert persisted to database for user ${event.userId}`);

      // 2. Handle email notification if enabled
      if (event.sendEmail) {
        // Check email rate limit
        const canSendEmail = await alertsRedisService.checkEmailRateLimit(event.userId, event.type);
        
        if (canSendEmail) {
          // Get user email
          const userResult = await db
            .select()
            .from(users)
            .where(eq(users.id, event.userId))
            .limit(1);

          if (userResult.length > 0) {
            const user = userResult[0];
            await sendAlertEmail(user.email, user.name, event);
            await alertsRedisService.incrementEmailRateLimit(event.userId, event.type);
            console.log(`[Alerts Processor] Email sent to ${user.email}`);
          }
        } else {
          console.log(`[Alerts Processor] Email rate limit reached for user ${event.userId}, skipping email`);
        }
      }

      // 3. Mark as triggered in Redis
      await alertsRedisService.markAlertTriggered(event.alertId);

      console.log(`[Alerts Processor] Event ${event.alertId} processed successfully`);
      return true;

    } finally {
      // Always unlock
      await alertsRedisService.unlockAlert(event.alertId);
    }

  } catch (error) {
    console.error(`[Alerts Processor] Error processing event ${event.alertId}:`, error);
    // Unlock on error
    await alertsRedisService.unlockAlert(event.alertId);
    throw error;
  }
}

/**
 * Send alert email
 */
async function sendAlertEmail(
  userEmail: string,
  userName: string,
  event: AlertEvent
): Promise<void> {
  const priorityColors: Record<string, string> = {
    critical: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6',
  };

  const priorityLabels: Record<string, string> = {
    critical: 'Crítica',
    warning: 'Advertencia',
    info: 'Información',
  };

  const color = priorityColors[event.priority] || '#3b82f6';
  const label = priorityLabels[event.priority] || 'Notificación';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, ${color} 0%, ${color}dd 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
        .alert-box { background: white; border-left: 4px solid ${color}; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .button { display: inline-block; background: ${color}; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; margin-top: 20px; }
        .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">Alerta de Finwrk</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">${label}</p>
        </div>
        <div class="content">
          <p>Hola ${userName},</p>
          
          <div class="alert-box">
            <h3 style="margin-top: 0; color: ${color};">${event.title}</h3>
            <p style="color: #374151;">${event.message}</p>
            
            ${event.metadata ? `
              <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e5e7eb;">
                <p style="color: #6b7280; font-size: 14px; margin: 5px 0;">
                  <strong>Detalles:</strong>
                </p>
                ${Object.entries(event.metadata).map(([key, value]) => `
                  <p style="color: #6b7280; font-size: 14px; margin: 5px 0;">
                    ${key}: ${value}
                  </p>
                `).join('')}
              </div>
            ` : ''}
          </div>
          
          ${event.actionUrl ? `
            <a href="${process.env.APP_URL || 'https://finwrk.app'}${event.actionUrl}" class="button">
              Ver en Finwrk
            </a>
          ` : ''}
          
          <div class="footer">
            <p>Este es un correo automático de Finwrk. No respondas a este mensaje.</p>
            <p>Puedes gestionar tus notificaciones desde la configuración de tu cuenta.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    to: userEmail,
    subject: `[Finwrk] ${event.title}`,
    html,
  });
}

/**
 * Main worker loop
 */
async function startWorker() {
  console.log('[Alerts Processor] Worker started');

  while (true) {
    try {
      // Check Redis health
      const healthy = await alertsRedisService.healthCheck();
      if (!healthy) {
        console.error('[Alerts Processor] Redis unhealthy, waiting 10s...');
        await new Promise(resolve => setTimeout(resolve, 10000));
        continue;
      }

      // Dequeue event (blocking with 5s timeout)
      const event = await alertsRedisService.dequeueAlertEvent(5);

      if (event) {
        await processAlertEvent(event);
      }

    } catch (error) {
      console.error('[Alerts Processor] Worker error:', error);
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
}

/**
 * Initialize worker
 */
export function initializeAlertsProcessorWorker() {
  console.log('[Alerts Processor] Initializing worker...');
  
  // Start worker in background
  startWorker().catch(error => {
    console.error('[Alerts Processor] Fatal error:', error);
    process.exit(1);
  });

  return true;
}
