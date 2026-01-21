/**
 * Reminder Processor - Cron Job
 * Processes reminders automatically:
 * 1. Sends email notifications based on notify_days_before
 * 2. Updates status to 'completed' or 'cancelled' when past due
 */

import { getDb } from '../db';
import { reminders } from '../../drizzle/schema';
import { eq, and, lte, gte } from 'drizzle-orm';

interface Reminder {
  id: number;
  user_id: number;
  title: string;
  description: string | null;
  reminder_date: Date;
  reminder_time: string | null;
  category: string;
  priority: string;
  status: string;
  notify_email: number;
  notify_days_before: number;
  email_sent: number;
  created_at: Date;
  updated_at: Date;
}

/**
 * Process all pending reminders
 * - Send email notifications
 * - Update status for past reminders
 */
export async function processReminders() {
  console.log('[Cron] Processing reminders...');
  
  try {
    const db = await getDb();
    if (!db) {
      console.error('[Cron] Database not available');
      return;
    }

    const now = new Date();

    // Get all pending reminders
    const pendingReminders = await db
      .select()
      .from(reminders)
      .where(eq(reminders.status, 'pending'));

    console.log(`[Cron] Found ${pendingReminders.length} pending reminders`);

    for (const reminder of pendingReminders) {
      const reminderDate = new Date(reminder.reminder_date);
      
      // Add time if specified
      if (reminder.reminder_time) {
        const [hours, minutes] = reminder.reminder_time.split(':');
        reminderDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      }

      // Check if reminder is past due
      if (reminderDate < now) {
        console.log(`[Cron] Reminder ${reminder.id} is past due, updating status to completed`);
        await db
          .update(reminders)
          .set({ 
            status: 'completed',
            updated_at: new Date() 
          })
          .where(eq(reminders.id, reminder.id));
        continue;
      }

      // Check if we should send email notification
      if (reminder.notify_email === 1 && reminder.email_sent === 0) {
        const daysUntilReminder = Math.ceil((reminderDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        // Send email if we're within the notification window
        if (daysUntilReminder <= reminder.notify_days_before) {
          console.log(`[Cron] Sending email for reminder ${reminder.id} (${daysUntilReminder} days until due)`);
          await sendReminderEmail(reminder);
        }
      }
    }

    console.log('[Cron] Reminder processing completed');
  } catch (error) {
    console.error('[Cron] Error processing reminders:', error);
  }
}

/**
 * Send email notification for a reminder
 */
async function sendReminderEmail(reminder: any) {
  try {
    const db = await getDb();
    if (!db) {
      console.error('[Cron] Database not available');
      return;
    }

    // Import email service
    const { sendEmail } = await import('../_core/email');
    
    // Get user email
    const { users } = await import('../../drizzle/schema');
    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.id, reminder.user_id))
      .limit(1);

    if (!userResult || userResult.length === 0) {
      console.error(`[Cron] User ${reminder.user_id} not found`);
      return;
    }

    const user = userResult[0];
    const reminderDate = new Date(reminder.reminder_date);
    const formattedDate = reminderDate.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #FF9500 0%, #FF6B00 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">🔔 Recordatorio</h1>
        </div>
        <div style="padding: 30px; background: #1A1A1A; color: #F5F5F5;">
          <h2 style="color: #FF9500; margin-top: 0;">${reminder.title}</h2>
          ${reminder.description ? `<p style="color: #A0A0A0;">${reminder.description}</p>` : ''}
          <div style="background: #2A2A2A; padding: 20px; border-radius: 10px; margin: 20px 0;">
            <p style="margin: 0;"><strong>📅 Fecha:</strong> ${formattedDate}</p>
            ${reminder.reminder_time ? `<p style="margin: 10px 0 0;"><strong>⏰ Hora:</strong> ${reminder.reminder_time}</p>` : ''}
            <p style="margin: 10px 0 0;"><strong>⚡ Prioridad:</strong> ${getPriorityLabel(reminder.priority)}</p>
          </div>
          <p style="color: #A0A0A0; font-size: 12px; margin-top: 30px;">
            Este es un recordatorio automático de Finwrk. No es necesario responder este correo.
          </p>
        </div>
      </div>
    `;

    const success = await sendEmail({
      to: user.email,
      subject: `🔔 Recordatorio: ${reminder.title}`,
      html: emailHtml,
    });

    if (success) {
      // Mark email as sent
      await db
        .update(reminders)
        .set({ 
          email_sent: 1,
          updated_at: new Date() 
        })
        .where(eq(reminders.id, reminder.id));
      
      console.log(`[Cron] Email sent successfully for reminder ${reminder.id}`);
    } else {
      console.error(`[Cron] Failed to send email for reminder ${reminder.id}`);
    }
  } catch (error) {
    console.error(`[Cron] Error sending email for reminder ${reminder.id}:`, error);
  }
}

/**
 * Get priority label in Spanish
 */
function getPriorityLabel(priority: string): string {
  switch (priority) {
    case 'high':
      return '🔴 Alta';
    case 'medium':
      return '🟡 Media';
    case 'low':
      return '🟢 Baja';
    default:
      return 'Media';
  }
}
