/**
 * Notification Listeners - Escuchan eventos y crean notificaciones
 * 
 * PRINCIPIO FUNDAMENTAL:
 * - El sistema de notificaciones NO es llamado directamente
 * - El sistema de notificaciones ESCUCHA eventos
 * - Las notificaciones son un EFECTO SECUNDARIO de eventos de dominio
 * 
 * ARQUITECTURA:
 * - Desacoplamiento total de módulos de negocio
 * - Las notificaciones no afectan el flujo principal
 * - Si una notificación falla, el evento ya ocurrió exitosamente
 */

import { eventBus, PaymentRegisteredEvent, InvoicePaidEvent, InvoiceOverdueEvent, SavingsGoalCompletedEvent } from './EventBus';
import { createNotification } from '../helpers/notificationHelpers';

/**
 * Initialize all notification listeners
 */
export function initializeNotificationListeners(): void {
  console.log('[NotificationListeners] Initializing...');

  // Listen to payment.registered
  eventBus.on<PaymentRegisteredEvent>('payment.registered', async (event) => {
    console.log('[NotificationListeners] Handling payment.registered');
    
    const { userId, invoiceNumber, amount, currency, newStatus } = event.payload;
    const statusText = newStatus === 'paid' ? 'completamente pagada' : 'parcialmente pagada';
    
    await createNotification({
      user_id: userId,
      type: 'success',
      title: `Pago registrado para ${invoiceNumber}`,
      message: `Se registró un pago de ${amount} ${currency}. La factura ${invoiceNumber} está ahora ${statusText}.`,
      source: 'invoice',
      source_id: event.payload.invoiceId,
    });
  });

  // Listen to invoice.paid
  eventBus.on<InvoicePaidEvent>('invoice.paid', async (event) => {
    console.log('[NotificationListeners] Handling invoice.paid');
    
    const { userId, invoiceId, invoiceNumber, amount, currency } = event.payload;
    
    await createNotification({
      user_id: userId,
      type: 'success',
      title: `Factura ${invoiceNumber} pagada`,
      message: `La factura ${invoiceNumber} ha sido marcada como pagada. Monto: ${amount} ${currency}.`,
      source: 'invoice',
      source_id: invoiceId,
    });
  });

  // Listen to invoice.overdue
  eventBus.on<InvoiceOverdueEvent>('invoice.overdue', async (event) => {
    console.log('[NotificationListeners] Handling invoice.overdue');
    
    const { userId, invoiceId, invoiceNumber, dueDate } = event.payload;
    
    await createNotification({
      user_id: userId,
      type: 'warning',
      title: `Factura ${invoiceNumber} vencida`,
      message: `La factura ${invoiceNumber} venció el ${dueDate.toLocaleDateString('es-ES')}. Considera enviar un recordatorio al cliente.`,
      source: 'invoice',
      source_id: invoiceId,
    });
  });

  // Listen to savings.goal_completed
  eventBus.on<SavingsGoalCompletedEvent>('savings.goal_completed', async (event) => {
    console.log('[NotificationListeners] Handling savings.goal_completed');
    
    const { userId, goalId, goalName, targetAmount, currency } = event.payload;
    
    await createNotification({
      user_id: userId,
      type: 'success',
      title: `¡Meta de ahorro completada!`,
      message: `Felicidades, has completado tu meta "${goalName}" de ${targetAmount} ${currency}.`,
      source: 'savings',
      source_id: goalId,
    });
  });

  console.log('[NotificationListeners] All listeners registered successfully');
}
