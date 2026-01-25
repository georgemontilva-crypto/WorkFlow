/**
 * Notification Helpers - Generate notifications for specific events
 * 
 * IMPORTANT: All notifications are created via tRPC to ensure validation
 */

import { getDb } from '../db';
import { notifications } from '../../drizzle/schema';

type NotificationType = "info" | "success" | "warning" | "error";
type NotificationSource = "invoice" | "savings" | "system";

interface CreateNotificationParams {
  user_id: number;
  type: NotificationType;
  title: string;
  message: string;
  source: NotificationSource;
  source_id?: number;
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

    // Check for duplicates (same source + source_id + type)
    if (params.source_id) {
      const [existing] = await db
        .select()
        .from(notifications)
        .where(
          (notifications) => 
            notifications.user_id.eq(params.user_id)
            .and(notifications.source.eq(params.source))
            .and(notifications.source_id.eq(params.source_id))
            .and(notifications.type.eq(params.type))
        )
        .limit(1);

      if (existing) {
        console.log(`[NotificationHelper] DISCARDED: Duplicate notification for source ${params.source} id ${params.source_id}`);
        return false;
      }
    }

    // Create notification
    await db.insert(notifications).values({
      user_id: params.user_id,
      type: params.type,
      title: params.title.trim(),
      message: params.message.trim(),
      source: params.source,
      source_id: params.source_id || null,
      is_read: 0,
    });

    console.log(`[NotificationHelper] Created successfully: ${params.title}`);
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
