/**
 * Reminder Worker - Processes reminder jobs from Bull Queue
 * Sends email notifications and updates reminder status
 */

import { reminderQueue, ReminderJobData } from '../queues/reminder-queue';
import { getDb } from '../db';
import { reminders, users } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';
import { sendEmail } from '../_core/email';

/**
 * Process reminder job - send email notification
 */
reminderQueue.process(async (job) => {
  const data: ReminderJobData = job.data;
  
  console.log(`[Worker] Processing reminder ${data.reminderId}: ${data.title}`);
  
  try {
    const db = await getDb();
    if (!db) {
      throw new Error('Database not available');
    }
    
    // Get reminder from database to check current status
    const reminderResult = await db
      .select()
      .from(reminders)
      .where(eq(reminders.id, data.reminderId))
      .limit(1);
    
    if (!reminderResult || reminderResult.length === 0) {
      console.log(`[Worker] Reminder ${data.reminderId} not found, skipping`);
      return { success: false, reason: 'not_found' };
    }
    
    const reminder = reminderResult[0];
    
    // Check if already sent or cancelled
    if (reminder.email_sent === 1) {
      console.log(`[Worker] Reminder ${data.reminderId} already sent, skipping`);
      return { success: false, reason: 'already_sent' };
    }
    
    if (reminder.status !== 'pending') {
      console.log(`[Worker] Reminder ${data.reminderId} status is ${reminder.status}, skipping`);
      return { success: false, reason: 'not_pending' };
    }
    
    // Get user email
    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.id, data.userId))
      .limit(1);
    
    if (!userResult || userResult.length === 0) {
      throw new Error(`User ${data.userId} not found`);
    }
    
    const user = userResult[0];
    
    // Format date
    const reminderDate = new Date(data.reminderDate);
    const formattedDate = reminderDate.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    
    // Build email HTML
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #FF9500 0%, #FF6B00 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">🔔 Recordatorio</h1>
        </div>
        <div style="padding: 30px; background: #1A1A1A; color: #F5F5F5;">
          <h2 style="color: #FF9500; margin-top: 0;">${data.title}</h2>
          ${data.description ? `<p style="color: #A0A0A0;">${data.description}</p>` : ''}
          <div style="background: #2A2A2A; padding: 20px; border-radius: 10px; margin: 20px 0;">
            <p style="margin: 0;"><strong>📅 Fecha:</strong> ${formattedDate}</p>
            ${data.reminderTime ? `<p style="margin: 10px 0 0;"><strong>⏰ Hora:</strong> ${data.reminderTime}</p>` : ''}
            <p style="margin: 10px 0 0;"><strong>📁 Categoría:</strong> ${getCategoryLabel(data.category)}</p>
            <p style="margin: 10px 0 0;"><strong>⚡ Prioridad:</strong> ${getPriorityLabel(data.priority)}</p>
          </div>
          <p style="color: #A0A0A0; font-size: 12px; margin-top: 30px;">
            Este es un recordatorio automático de Finwrk. No es necesario responder este correo.
          </p>
        </div>
      </div>
    `;
    
    // Send email
    const success = await sendEmail({
      to: user.email,
      subject: `🔔 Recordatorio: ${data.title}`,
      html: emailHtml,
    });
    
    if (!success) {
      throw new Error('Failed to send email');
    }
    
    // Mark email as sent
    await db
      .update(reminders)
      .set({ 
        email_sent: 1,
        updated_at: new Date() 
      })
      .where(eq(reminders.id, data.reminderId));
    
    console.log(`[Worker] Email sent successfully for reminder ${data.reminderId}`);
    
    return { 
      success: true, 
      reminderId: data.reminderId,
      sentTo: user.email 
    };
    
  } catch (error) {
    console.error(`[Worker] Error processing reminder ${data.reminderId}:`, error);
    throw error; // Bull will retry based on job options
  }
});

/**
 * Get category label in Spanish
 */
function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    'meeting': 'Reunión',
    'payment': 'Pago',
    'deadline': 'Fecha límite',
    'follow_up': 'Seguimiento',
    'personal': 'Personal',
    'other': 'Otro',
  };
  return labels[category] || category;
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

console.log('[Worker] Reminder worker initialized and ready to process jobs');
