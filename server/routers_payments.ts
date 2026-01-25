/**
 * Payments Router - MANUAL PAYMENT REGISTRATION SYSTEM
 * 
 * PRINCIPLES:
 * - Payments are registered, NOT processed
 * - Every payment belongs to an invoice
 * - Payments update invoice status automatically
 * - No editing or deleting payments (immutable)
 * - Transactional operations (all or nothing)
 */

import { router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { getDb } from "./db";
import { payments, invoices } from "../drizzle/schema";
import { eq, and, sum } from "drizzle-orm";
import { notifyPaymentRegistered } from "./helpers/notificationHelpers";

/**
 * Input validation schema for registering a payment
 */
const registerPaymentSchema = z.object({
  invoice_id: z.number().positive("Debe seleccionar una factura"),
  amount: z.number().positive("El monto debe ser mayor a 0"),
  payment_date: z.string().min(1, "La fecha de pago es obligatoria"),
  method: z.enum(["cash", "transfer", "card", "other"], {
    errorMap: () => ({ message: "Método de pago inválido" }),
  }),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

export const paymentsRouter = router({
  /**
   * List all payments for a specific invoice
   */
  listByInvoice: protectedProcedure
    .input(z.object({
      invoice_id: z.number().positive(),
    }))
    .query(async ({ ctx, input }) => {
      console.log(`[Payments] List payments for invoice ${input.invoice_id} by user ${ctx.user.id}`);
      
      try {
        const db = await getDb();
        
        // Verify invoice belongs to user
        const invoice = await db
          .select()
          .from(invoices)
          .where(and(
            eq(invoices.id, input.invoice_id),
            eq(invoices.user_id, ctx.user.id)
          ))
          .limit(1);
        
        if (!invoice || invoice.length === 0) {
          throw new Error("Factura no encontrada");
        }
        
        // Get all payments for this invoice
        const invoicePayments = await db
          .select()
          .from(payments)
          .where(and(
            eq(payments.invoice_id, input.invoice_id),
            eq(payments.user_id, ctx.user.id)
          ))
          .orderBy(payments.payment_date);
        
        console.log(`[Payments] Found ${invoicePayments.length} payments for invoice ${input.invoice_id}`);
        
        return invoicePayments;
      } catch (error: any) {
        console.error(`[Payments] ListByInvoice error:`, error.message);
        throw new Error(error.message || "Error al obtener pagos");
      }
    }),

  /**
   * List all payments for the authenticated user
   */
  list: protectedProcedure
    .query(async ({ ctx }) => {
      console.log(`[Payments] List all payments for user ${ctx.user.id}`);
      
      try {
        const db = await getDb();
        
        const userPayments = await db
          .select()
          .from(payments)
          .where(eq(payments.user_id, ctx.user.id))
          .orderBy(payments.payment_date);
        
        console.log(`[Payments] Found ${userPayments.length} payments`);
        
        return userPayments;
      } catch (error: any) {
        console.error(`[Payments] List error:`, error.message);
        throw new Error(error.message || "Error al obtener pagos");
      }
    }),

  /**
   * Register a new payment (CORE FUNCTIONALITY)
   * 
   * This is a TRANSACTIONAL operation:
   * 1. Validate invoice exists and belongs to user
   * 2. Validate invoice is not cancelled
   * 3. Validate payment amount doesn't exceed invoice total
   * 4. Create payment record
   * 5. Recalculate total paid for invoice
   * 6. Update invoice status (partial or paid)
   * 7. Generate notification
   */
  register: protectedProcedure
    .input(registerPaymentSchema)
    .mutation(async ({ ctx, input }) => {
      console.log(`[Payments] Register payment attempt by user ${ctx.user.id}:`, {
        invoice_id: input.invoice_id,
        amount: input.amount,
        method: input.method,
      });
      
      try {
        const db = await getDb();
        
        // 1. Get invoice and validate
        const invoice = await db
          .select()
          .from(invoices)
          .where(and(
            eq(invoices.id, input.invoice_id),
            eq(invoices.user_id, ctx.user.id)
          ))
          .limit(1);
        
        if (!invoice || invoice.length === 0) {
          console.log(`[Payments] Invoice ${input.invoice_id} not found for user ${ctx.user.id}`);
          throw new Error("Factura no encontrada");
        }
        
        const invoiceData = invoice[0];
        
        // 2. Validate invoice is not cancelled
        if (invoiceData.status === "cancelled") {
          console.log(`[Payments] Cannot register payment for cancelled invoice ${input.invoice_id}`);
          throw new Error("No se puede registrar un pago para una factura cancelada");
        }
        
        console.log(`[Payments] Invoice validated: ${invoiceData.invoice_number}, total: ${invoiceData.total}`);
        
        // 3. Get existing payments for this invoice
        const existingPayments = await db
          .select()
          .from(payments)
          .where(eq(payments.invoice_id, input.invoice_id));
        
        const totalPaid = existingPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
        const newTotalPaid = totalPaid + input.amount;
        const invoiceTotal = parseFloat(invoiceData.total);
        
        console.log(`[Payments] Current total paid: ${totalPaid}, new total: ${newTotalPaid}, invoice total: ${invoiceTotal}`);
        
        // 4. Validate payment doesn't exceed invoice total
        if (newTotalPaid > invoiceTotal) {
          const remaining = invoiceTotal - totalPaid;
          console.log(`[Payments] Payment exceeds invoice total. Remaining: ${remaining}`);
          throw new Error(`El monto excede el total de la factura. Monto restante: $${remaining.toFixed(2)}`);
        }
        
        // 5. Create payment record
        const [newPayment] = await db.insert(payments).values({
          user_id: ctx.user.id,
          invoice_id: input.invoice_id,
          amount: input.amount.toString(),
          payment_date: new Date(input.payment_date),
          method: input.method,
          reference: input.reference || null,
          notes: input.notes || null,
        });
        
        const paymentId = Number(newPayment.insertId);
        
        console.log(`[Payments] Payment created: ${paymentId}`);
        
        // 6. Determine new invoice status
        let newStatus: "partial" | "paid";
        
        if (newTotalPaid >= invoiceTotal) {
          newStatus = "paid";
        } else {
          newStatus = "partial";
        }
        
        console.log(`[Payments] Updating invoice ${input.invoice_id} status to: ${newStatus}`);
        
        // 7. Update invoice status
        await db
          .update(invoices)
          .set({ 
            status: newStatus,
            updated_at: new Date(),
          })
          .where(eq(invoices.id, input.invoice_id));
        
        console.log(`[Payments] Invoice status updated successfully`);
        
        // 8. Generate notification
        await notifyPaymentRegistered(
          ctx.user.id,
          input.invoice_id,
          invoiceData.invoice_number,
          input.amount,
          invoiceData.currency,
          newStatus
        );
        
        console.log(`[Payments] Payment registered successfully: ${paymentId}`);
        
        return {
          success: true,
          payment_id: paymentId,
          new_status: newStatus,
          total_paid: newTotalPaid,
          invoice_total: invoiceTotal,
        };
        
      } catch (error: any) {
        console.error(`[Payments] Register error:`, error.message);
        throw new Error(error.message || "Error al registrar pago");
      }
    }),

  /**
   * Get payment summary for an invoice
   * Returns total paid, remaining, and payment count
   */
  getSummary: protectedProcedure
    .input(z.object({
      invoice_id: z.number().positive(),
    }))
    .query(async ({ ctx, input }) => {
      console.log(`[Payments] Get summary for invoice ${input.invoice_id}`);
      
      try {
        const db = await getDb();
        
        // Get invoice
        const invoice = await db
          .select()
          .from(invoices)
          .where(and(
            eq(invoices.id, input.invoice_id),
            eq(invoices.user_id, ctx.user.id)
          ))
          .limit(1);
        
        if (!invoice || invoice.length === 0) {
          throw new Error("Factura no encontrada");
        }
        
        const invoiceData = invoice[0];
        
        // Get payments
        const invoicePayments = await db
          .select()
          .from(payments)
          .where(eq(payments.invoice_id, input.invoice_id));
        
        const totalPaid = invoicePayments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
        const invoiceTotal = parseFloat(invoiceData.total);
        const remaining = invoiceTotal - totalPaid;
        
        return {
          invoice_total: invoiceTotal,
          total_paid: totalPaid,
          remaining: remaining,
          payment_count: invoicePayments.length,
          status: invoiceData.status,
        };
        
      } catch (error: any) {
        console.error(`[Payments] GetSummary error:`, error.message);
        throw new Error(error.message || "Error al obtener resumen");
      }
    }),
});
