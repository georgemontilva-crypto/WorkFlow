/**
 * EventBus - Sistema de eventos centralizado
 * 
 * PRINCIPIO FUNDAMENTAL:
 * - Los módulos NO se llaman directamente entre sí
 * - Los módulos EMITEN eventos cuando algo importante sucede
 * - Los módulos ESCUCHAN eventos que les interesan
 * - El EventBus es el único punto de comunicación entre módulos
 * 
 * ARQUITECTURA:
 * - Patrón Observer/PubSub
 * - Desacoplamiento total entre emisores y receptores
 * - Eventos tipados para seguridad en tiempo de compilación
 */

import { EventEmitter } from 'events';

/**
 * Domain Events - Eventos de dominio del sistema
 */
export type DomainEvent = 
  | PaymentRegisteredEvent
  | InvoicePaidEvent
  | InvoiceOverdueEvent
  | SavingsGoalCompletedEvent;

/**
 * Payment Events
 */
export interface PaymentRegisteredEvent {
  type: 'payment.registered';
  payload: {
    userId: number;
    invoiceId: number;
    invoiceNumber: string;
    amount: number;
    currency: string;
    newStatus: 'partial' | 'paid';
    paymentId: number;
    timestamp: Date;
  };
}

/**
 * Invoice Events
 */
export interface InvoicePaidEvent {
  type: 'invoice.paid';
  payload: {
    userId: number;
    invoiceId: number;
    invoiceNumber: string;
    amount: number;
    currency: string;
    timestamp: Date;
  };
}

export interface InvoiceOverdueEvent {
  type: 'invoice.overdue';
  payload: {
    userId: number;
    invoiceId: number;
    invoiceNumber: string;
    dueDate: Date;
    timestamp: Date;
  };
}

/**
 * Savings Events
 */
export interface SavingsGoalCompletedEvent {
  type: 'savings.goal_completed';
  payload: {
    userId: number;
    goalId: number;
    goalName: string;
    targetAmount: number;
    currency: string;
    timestamp: Date;
  };
}

/**
 * Event Listener Type
 */
type EventListener<T extends DomainEvent> = (event: T) => void | Promise<void>;

/**
 * EventBus Class - Singleton
 */
class EventBus {
  private emitter: EventEmitter;
  private static instance: EventBus;

  private constructor() {
    this.emitter = new EventEmitter();
    // Increase max listeners to avoid warnings
    this.emitter.setMaxListeners(50);
    
    console.log('[EventBus] Initialized');
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  /**
   * Emit an event
   */
  public emit<T extends DomainEvent>(event: T): void {
    console.log(`[EventBus] Emitting event: ${event.type}`, {
      userId: event.payload.userId,
      timestamp: event.payload.timestamp,
    });

    this.emitter.emit(event.type, event);
  }

  /**
   * Listen to an event
   */
  public on<T extends DomainEvent>(
    eventType: T['type'],
    listener: EventListener<T>
  ): void {
    console.log(`[EventBus] Registering listener for: ${eventType}`);
    
    this.emitter.on(eventType, async (event: T) => {
      try {
        await listener(event);
      } catch (error: any) {
        console.error(`[EventBus] Error in listener for ${eventType}:`, error.message);
      }
    });
  }

  /**
   * Remove a listener
   */
  public off<T extends DomainEvent>(
    eventType: T['type'],
    listener: EventListener<T>
  ): void {
    this.emitter.off(eventType, listener as any);
  }

  /**
   * Remove all listeners for an event type
   */
  public removeAllListeners(eventType?: string): void {
    this.emitter.removeAllListeners(eventType);
  }
}

/**
 * Export singleton instance
 */
export const eventBus = EventBus.getInstance();
