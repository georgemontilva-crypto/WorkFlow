/**
 * Recurring Invoices Utility
 * Handles calculation and generation of recurring invoices
 */

import { addDays, addMonths, addYears } from 'date-fns';

export type RecurrenceFrequency = 'every_minute' | 'monthly' | 'biweekly' | 'annual' | 'custom';

/**
 * Calculate next generation date based on frequency
 */
export function calculateNextGenerationDate(
  currentDate: Date,
  frequency: RecurrenceFrequency,
  customInterval?: number
): Date {
  switch (frequency) {
    case 'every_minute':
      // For testing: add 1 minute
      const nextMinute = new Date(currentDate);
      nextMinute.setMinutes(nextMinute.getMinutes() + 1);
      return nextMinute;
    case 'monthly':
      return addMonths(currentDate, 1);
    case 'biweekly':
      return addDays(currentDate, 14);
    case 'annual':
      return addYears(currentDate, 1);
    case 'custom':
      if (!customInterval || customInterval <= 0) {
        throw new Error('Custom interval must be a positive number');
      }
      return addDays(currentDate, customInterval);
    default:
      throw new Error(`Invalid frequency: ${frequency}`);
  }
}

/**
 * Check if an invoice should be generated today
 */
export function shouldGenerateInvoice(nextGenerationDate: Date): boolean {
  const now = new Date();
  const targetDate = new Date(nextGenerationDate);
  
  // Compare with full timestamp (includes minutes for testing)
  return targetDate <= now;
}

/**
 * Generate invoice number for recurring invoice
 */
export function generateRecurringInvoiceNumber(originalNumber: string): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `INV-${timestamp}${random}`;
}
