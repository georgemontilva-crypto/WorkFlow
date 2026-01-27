/**
 * Notification Helpers - Generate notifications for specific events
 * 
 * IMPORTANT: All notifications are created via tRPC to ensure validation
 */

import { getDb } from '../db';
import { notifications } from '../../drizzle/schema';
import { eq, and } from 'drizzle-orm';

type NotificationType = "info" | "success" | "warning" | "error";
type NotificationSource = "invoice" | "savings" | "system";

interface CreateNotificationParams {
  user_id: number;
  type: NotificationType;
  title: string;
  message: string;
  source: NotificationSource;
  source_id?: number;
  is_urgent?: boolean;
}

/**
 * Create a notification directly in the database
 * IMPORTANT: Validates title and message are not empty
 * Prevents duplicates based on source + source_id + type
 */
export async function createNotification(params: CreateNotificationParams): Promise<boolean> {
  const db = await getDb();

  console.log(`[NotificationHelper] Create attempt:`, {
    user_id: params.user_id,
    type: params.type,
    title: params.title,
    source: params.source,
    source_id: params.source_id,
  });

  try {
    // Validate title and message
    if (!params.title || params.title.trim().length === 0) {
      console.error(`[NotificationHelper] DISCARDED: Empty title`);
      return false;
    }

    if (!params.message || params.message.trim().length === 0) {
      console.error(`[NotificationHelper] DISCARDED: Empty message`);
      return false;
    }

    // Check for duplicates (same source + source_id + title)
    // This allows multiple notification types for the same source, but prevents exact duplicate messages
    if (params.source_id) {
      const [existing] = await db
        .select()
        .from(notifications)
        .where(
          and(
            eq(notifications.user_id, params.user_id),
            eq(notifications.source, params.source),
            eq(notifications.source_id, params.source_id),
            eq(notifications.title, params.title.trim())
          )
        )
        .limit(1);

      if (existing) {
        console.log(`[NotificationHelper] DISCARDED: Duplicate notification "${params.title}" for source ${params.source} id ${params.source_id}`);
        return false;
      }
    }

    // Create notification
    const result = await db.insert(notifications).values({
      user_id: params.user_id,
      type: params.type,
      title: params.title.trim(),
      message: params.message.trim(),
      source: params.source,
      source_id: params.source_id || null,
      is_read: 0,
      is_urgent: params.is_urgent ? 1 : 0,
    });

    console.log(`[NotificationHelper] Created successfully: ${params.title}`);
    
    // Get the created notification ID (SQLite lastInsertRowid)
    const notificationId = result.lastInsertRowid ? Number(result.lastInsertRowid) : 0;
    
    // Publish real-time event via Redis (non-blocking)
    try {
      const { notificationsRealtimeService } = await import('../services/notificationsRealtimeService');
      await notificationsRealtimeService.publishNotification({
        userId: params.user_id,
        notificationId: notificationId,
        type: 'new',
        source: params.source,
        timestamp: Date.now(),
      });
      console.log(`[NotificationHelper] Real-time event published for notification ID: ${notificationId}`);
    } catch (realtimeError: any) {
      console.error(`[NotificationHelper] Real-time publish error (non-blocking):`, realtimeError.message);
    }
    
    return true;
  } catch (error: any) {
    console.error(`[NotificationHelper] Create error:`, error.message);
    return false;
  }
}

/**
 * INVOICE NOTIFICATIONS
 */

export async function notifyInvoiceOverdue(userId: number, invoiceId: number, invoiceNumber: string, dueDate: Date) {
  return createNotification({
    user_id: userId,
    type: "warning",
    title: `Factura ${invoiceNumber} vencida`,
    message: `La factura ${invoiceNumber} venció el ${dueDate.toLocaleDateString('es-ES')}. Considera enviar un recordatorio al cliente.`,
    source: "invoice",
    source_id: invoiceId,
    is_urgent: true,  // ← URGENTE: factura vencida
  });
}

export async function notifyInvoicePaid(userId: number, invoiceId: number, invoiceNumber: string, amount: number, currency: string) {
  return createNotification({
    user_id: userId,
    type: "success",
    title: `Factura ${invoiceNumber} pagada`,
    message: `La factura ${invoiceNumber} ha sido marcada como pagada. Monto: ${amount} ${currency}.`,
    source: "invoice",
    source_id: invoiceId,
  });
}

/**
 * SAVINGS NOTIFICATIONS
 */

export async function notifySavingsGoalCompleted(userId: number, goalId: number, goalName: string, targetAmount: number, currency: string) {
  return createNotification({
    user_id: userId,
    type: "success",
    title: `¡Meta de ahorro completada!`,
    message: `Felicidades, has completado tu meta "${goalName}" de ${targetAmount} ${currency}.`,
    source: "savings",
    source_id: goalId,
  });
}

/**
 * SYSTEM NOTIFICATIONS
 */

export async function notifyPrimaryCurrencyNotSet(userId: number) {
  return createNotification({
    user_id: userId,
    type: "info",
    title: "Configura tu moneda principal",
    message: "No has configurado tu moneda principal. Ve a Configuración para seleccionar tu moneda preferida.",
    source: "system",
  });
}

/**
 * PAYMENT NOTIFICATIONS
 */

export async function notifyPaymentRegistered(
  userId: number, 
  invoiceId: number, 
  invoiceNumber: string, 
  amount: number, 
  currency: string,
  newStatus: "partial" | "paid"
) {
  const statusText = newStatus === "paid" ? "completamente pagada" : "parcialmente pagada";
  
  return createNotification({
    user_id: userId,
    type: "success",
    title: `Pago registrado para ${invoiceNumber}`,
    message: `Se registró un pago de ${amount} ${currency}. La factura ${invoiceNumber} está ahora ${statusText}.`,
    source: "invoice",
    source_id: invoiceId,
  });
}

export async function notifyPaymentProofUploaded(
  userId: number,
  invoiceId: number,
  invoiceNumber: string
) {
  return createNotification({
    user_id: userId,
    type: "info",
    title: `Comprobante recibido para ${invoiceNumber}`,
    message: `El cliente ha subido un comprobante de pago para la factura ${invoiceNumber}. Revisa y confirma el pago.`,
    source: "invoice",
    source_id: invoiceId,
    is_urgent: true,  // ← URGENTE: requiere revisión del admin
  });
}



/**
 * INVOICE NOTIFICATIONS (Extended)
 */

export async function notifyInvoiceCreated(
  userId: number,
  invoiceId: number,
  invoiceNumber: string,
  clientName: string,
  amount: number,
  currency: string
) {
  return createNotification({
    user_id: userId,
    type: "success",
    title: `Factura ${invoiceNumber} creada`,
    message: `Factura para ${clientName} por ${amount} ${currency} creada exitosamente.`,
    source: "invoice",
    source_id: invoiceId,
  });
}

export async function notifyInvoiceSent(
  userId: number,
  invoiceId: number,
  invoiceNumber: string,
  clientName: string,
  clientEmail: string
) {
  return createNotification({
    user_id: userId,
    type: "info",
    title: `Factura ${invoiceNumber} enviada`,
    message: `La factura para ${clientName} ha sido enviada a ${clientEmail}.`,
    source: "invoice",
    source_id: invoiceId,
  });
}

export async function notifyInvoiceCancelled(
  userId: number,
  invoiceId: number,
  invoiceNumber: string
) {
  return createNotification({
    user_id: userId,
    type: "warning",
    title: `Factura ${invoiceNumber} cancelada`,
    message: `La factura ${invoiceNumber} ha sido marcada como cancelada.`,
    source: "invoice",
    source_id: invoiceId,
  });
}

export async function notifyInvoiceDueSoon(
  userId: number,
  invoiceId: number,
  invoiceNumber: string,
  daysUntilDue: number
) {
  return createNotification({
    user_id: userId,
    type: "warning",
    title: `Factura ${invoiceNumber} por vencer`,
    message: `La factura ${invoiceNumber} vence en ${daysUntilDue} ${daysUntilDue === 1 ? 'día' : 'días'}. Considera enviar un recordatorio al cliente.`,
    source: "invoice",
    source_id: invoiceId,
    is_urgent: true,
  });
}

/**
 * CLIENT NOTIFICATIONS
 */

export async function notifyClientCreated(
  userId: number,
  clientId: number,
  clientName: string
) {
  return createNotification({
    user_id: userId,
    type: "success",
    title: `Cliente creado: ${clientName}`,
    message: `El cliente "${clientName}" ha sido agregado exitosamente a tu cartera.`,
    source: "system",
    source_id: clientId,
  });
}

/**
 * SAVINGS NOTIFICATIONS (Extended)
 */

export async function notifySavingsGoalCreated(
  userId: number,
  goalId: number,
  goalName: string,
  targetAmount: number,
  currency: string
) {
  return createNotification({
    user_id: userId,
    type: "success",
    title: `Meta de ahorro creada: ${goalName}`,
    message: `Tu nueva meta de ahorro "${goalName}" por ${targetAmount} ${currency} ha sido creada.`,
    source: "savings",
    source_id: goalId,
  });
}

export async function notifySavingsProgressUpdated(
  userId: number,
  goalId: number,
  goalName: string,
  currentAmount: number,
  targetAmount: number,
  currency: string,
  percentageComplete: number
) {
  return createNotification({
    user_id: userId,
    type: "info",
    title: `Progreso actualizado: ${goalName}`,
    message: `Has ahorrado ${currentAmount} ${currency} de ${targetAmount} ${currency} (${percentageComplete}% completado).`,
    source: "savings",
    source_id: goalId,
  });
}

export async function notifySavingsGoalReached(
  userId: number,
  goalId: number,
  goalName: string,
  targetAmount: number,
  currency: string
) {
  return createNotification({
    user_id: userId,
    type: "success",
    title: `¡Meta alcanzada! ${goalName}`,
    message: `¡Felicitaciones! Has alcanzado tu meta de ahorro "${goalName}" de ${targetAmount} ${currency}.`,
    source: "savings",
    source_id: goalId,
  });
}

export async function notifySavingsTransferredToBalance(
  userId: number,
  goalId: number,
  goalName: string,
  amount: number,
  currency: string
) {
  return createNotification({
    user_id: userId,
    type: "success",
    title: `Fondos transferidos al balance`,
    message: `${amount} ${currency} de tu meta "${goalName}" han sido transferidos a tu balance disponible.`,
    source: "savings",
    source_id: goalId,
  });
}
