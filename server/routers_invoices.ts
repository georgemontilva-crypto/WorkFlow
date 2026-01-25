/**
 * Invoices Router - REBUILT FROM SCRATCH
 * Clean, stable, predictable invoice system
 * 
 * Dependencies:
 * - Clients (must exist and belong to user)
 * 
 * States: draft → sent → paid
 *         draft → cancelled
 *         sent → cancelled
 */

import { router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { getDb } from "./db";
import * as dbHelpers from "./db";
import { invoices, invoiceItems } from "../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import { generateInvoicePDF } from "./services/invoicePDF";
import { sendEmail } from "./_core/email";

/**
 * Validation schemas
 */
const invoiceItemSchema = z.object({
  description: z.string().min(1, "La descripción es obligatoria"),
  quantity: z.number().positive("La cantidad debe ser mayor a 0"),
  unit_price: z.number().min(0, "El precio unitario no puede ser negativo"),
  total: z.number().min(0, "El total no puede ser negativo"),
});

const createInvoiceSchema = z.object({
  client_id: z.number().positive("Debe seleccionar un cliente"),
  issue_date: z.string().min(1, "La fecha de emisión es obligatoria"),
  due_date: z.string().min(1, "La fecha de vencimiento es obligatoria"),
  items: z.array(invoiceItemSchema).min(1, "Debe agregar al menos un ítem"),
  notes: z.string().optional(),
  terms: z.string().optional(),
  is_recurring: z.boolean().optional(),
  recurrence_frequency: z.enum(["weekly", "biweekly", "monthly", "quarterly", "semiannually", "annually"]).optional(),
  recurrence_end_date: z.string().optional(),
});

export const invoicesRouter = router({
  // List all invoices for the authenticated user
  list: protectedProcedure
    .input(z.object({
      status: z.enum(["all", "draft", "sent", "paid", "cancelled"]).optional().default("all"),
    }).optional())
    .query(async ({ ctx, input }) => {
      console.log(`[Invoices] List request from user: ${ctx.user.id}`, input);
      
      try {
        const db = await getDb();
        const filters: any[] = [eq(invoices.user_id, ctx.user.id)];
        
        if (input?.status && input.status !== "all") {
          filters.push(eq(invoices.status, input.status));
        }
        
        const result = await db
          .select()
          .from(invoices)
          .where(and(...filters))
          .orderBy(desc(invoices.created_at));
        
        console.log(`[Invoices] Found ${result.length} invoices for user: ${ctx.user.id}`);
        
        return result;
      } catch (error: any) {
        console.error(`[Invoices] List error:`, error.message);
        throw new Error("Error al listar facturas");
      }
    }),

  // Get invoice by ID with items
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      console.log(`[Invoices] Get invoice ${input.id} for user: ${ctx.user.id}`);
      
      try {
        const db = await getDb();
        // Get invoice
        const invoice = await db
          .select()
          .from(invoices)
          .where(and(
            eq(invoices.id, input.id),
            eq(invoices.user_id, ctx.user.id)
          ))
          .limit(1);
        
        if (!invoice || invoice.length === 0) {
          console.log(`[Invoices] Invoice ${input.id} not found for user: ${ctx.user.id}`);
          throw new Error("Factura no encontrada");
        }
        
        // Get items
        const items = await db
          .select()
          .from(invoiceItems)
          .where(eq(invoiceItems.invoice_id, input.id));
        
        console.log(`[Invoices] Found invoice ${input.id} with ${items.length} items`);
        
        return {
          ...invoice[0],
          items,
        };
      } catch (error: any) {
        console.error(`[Invoices] GetById error:`, error.message);
        throw new Error(error.message || "Error al obtener factura");
      }
    }),

  // Create invoice with validations
  create: protectedProcedure
    .input(createInvoiceSchema)
    .mutation(async ({ ctx, input }) => {
      console.log(`[Invoices] Create attempt by user ${ctx.user.id}:`, {
        client_id: input.client_id,
        items_count: input.items.length,
      });
      
      try {
        const db = await getDb();
        // 1. Validate client exists and belongs to user
        const client = await dbHelpers.getClientById(input.client_id, ctx.user.id);
        
        if (!client) {
          console.log(`[Invoices] Client ${input.client_id} not found for user ${ctx.user.id}`);
          throw new Error("Cliente no encontrado");
        }
        
        console.log(`[Invoices] Client validated: ${client.name}`);
        
        // 2. Validate items
        if (input.items.length === 0) {
          throw new Error("Debe agregar al menos un ítem");
        }
        
        for (const item of input.items) {
          if (item.quantity <= 0) {
            throw new Error("La cantidad debe ser mayor a 0");
          }
          if (item.unit_price < 0) {
            throw new Error("El precio unitario no puede ser negativo");
          }
        }
        
        // 3. Validate dates
        const issueDate = new Date(input.issue_date);
        const dueDate = new Date(input.due_date);
        
        if (dueDate < issueDate) {
          throw new Error("La fecha de vencimiento debe ser posterior a la fecha de emisión");
        }
        
        // 4. Calculate totals
        const subtotal = input.items.reduce((sum, item) => sum + item.total, 0);
        const total = subtotal; // No tax for now
        
        console.log(`[Invoices] Calculated totals: subtotal=${subtotal}, total=${total}`);
        
        // 5. Generate invoice number (format: INV-YYYYMMDD-XXXX)
        const date = new Date();
        const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");
        const random = Math.floor(1000 + Math.random() * 9000);
        const invoice_number = `INV-${dateStr}-${random}`;
        
        // 6. Get user's primary currency
        const user = await dbHelpers.getUserById(ctx.user.id);
        const currency = user?.primary_currency || "USD";
        
        console.log(`[Invoices] Invoice number: ${invoice_number}, currency: ${currency}`);
        
        // 7. Create invoice
        const [newInvoice] = await db.insert(invoices).values({
          user_id: ctx.user.id,
          client_id: input.client_id,
          invoice_number,
          status: "draft",
          currency,
          subtotal: subtotal.toString(),
          total: total.toString(),
          issue_date: issueDate,
          due_date: dueDate,
          notes: input.notes || null,
          terms: input.terms || null,
          is_recurring: input.is_recurring ? 1 : 0,
          recurrence_frequency: input.is_recurring ? input.recurrence_frequency : null,
          recurrence_start_date: input.is_recurring ? issueDate : null,
          recurrence_end_date: input.is_recurring && input.recurrence_end_date ? new Date(input.recurrence_end_date) : null,
          last_generated_date: null,
          parent_invoice_id: null,
        });
        
        const invoiceId = Number(newInvoice.insertId);
        
        console.log(`[Invoices] Invoice created: ${invoiceId}`);
        
        // 8. Create invoice items
        for (const item of input.items) {
          await db.insert(invoiceItems).values({
            invoice_id: invoiceId,
            description: item.description,
            quantity: item.quantity.toString(),
            unit_price: item.unit_price.toString(),
            total: item.total.toString(),
          });
        }
        
        console.log(`[Invoices] ${input.items.length} items created for invoice ${invoiceId}`);
        
        // 9. Return created invoice with items
        const createdInvoice = await db
          .select()
          .from(invoices)
          .where(eq(invoices.id, invoiceId))
          .limit(1);
        
        const createdItems = await db
          .select()
          .from(invoiceItems)
          .where(eq(invoiceItems.invoice_id, invoiceId));
        
        console.log(`[Invoices] Invoice ${invoiceId} created successfully`);
        
        return {
          success: true,
          invoice: {
            ...createdInvoice[0],
            items: createdItems,
          },
        };
      } catch (error: any) {
        console.error(`[Invoices] Create error for user ${ctx.user.id}:`, error.message);
        throw new Error(error.message || "Error al crear factura");
      }
    }),

  // Update invoice status
  updateStatus: protectedProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["draft", "sent", "paid", "cancelled"]),
    }))
    .mutation(async ({ ctx, input }) => {
      console.log(`[Invoices] Update status for invoice ${input.id} to ${input.status}`);
      
      try {
        const db = await getDb();
        // Get current invoice
        const [invoice] = await db
          .select()
          .from(invoices)
          .where(and(
            eq(invoices.id, input.id),
            eq(invoices.user_id, ctx.user.id)
          ))
          .limit(1);
        
        if (!invoice) {
          throw new Error("Factura no encontrada");
        }
        
        // Validate state transition
        const currentStatus = invoice.status;
        const newStatus = input.status;
        
    const validTransitions: Record<string, string[]> = {
      draft: ["sent", "cancelled"],
      sent: ["cancelled"], // ✅ SOLO puede cancelarse, NO pagarse (payments.register es la única fuente de verdad)
      paid: [], // Cannot change from paid
      cancelled: [], // Cannot change from cancelled
    };
        
        if (!validTransitions[currentStatus]?.includes(newStatus)) {
          console.log(`[Invoices] Invalid transition: ${currentStatus} → ${newStatus}`);
          throw new Error(`No se puede cambiar el estado de ${currentStatus} a ${newStatus}`);
        }
        
        // Update status
        await db
          .update(invoices)
          .set({
            status: newStatus,
            updated_at: new Date(),
          })
          .where(eq(invoices.id, input.id));
        
        console.log(`[Invoices] Status updated: ${currentStatus} → ${newStatus}`);
        
        // ✅ NO emitimos eventos aquí porque invoices NO puede cambiar a 'paid'
        // Solo payments.register puede marcar una factura como pagada
        
        return { success: true };
      } catch (error: any) {
        console.error(`[Invoices] UpdateStatus error:`, error.message);
        throw new Error(error.message || "Error al actualizar estado");
      }
    }),

  // Delete invoice (only if draft)
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      console.log(`[Invoices] Delete attempt for invoice ${input.id}`);
      
      try {
        const db = await getDb();
        // Get invoice
        const [invoice] = await db
          .select()
          .from(invoices)
          .where(and(
            eq(invoices.id, input.id),
            eq(invoices.user_id, ctx.user.id)
          ))
          .limit(1);
        
        if (!invoice) {
          throw new Error("Factura no encontrada");
        }
        
        // Only allow deletion of draft invoices
        if (invoice.status !== "draft") {
          throw new Error("Solo se pueden eliminar facturas en borrador");
        }
        
        // Delete items first (cascade should handle this, but being explicit)
        await db
          .delete(invoiceItems)
          .where(eq(invoiceItems.invoice_id, input.id));
        
        // Delete invoice
        await db
          .delete(invoices)
          .where(eq(invoices.id, input.id));
        
        console.log(`[Invoices] Invoice ${input.id} deleted successfully`);
        
        return { success: true };
      } catch (error: any) {
        console.error(`[Invoices] Delete error:`, error.message);
        throw new Error(error.message || "Error al eliminar factura");
      }
    }),

  // Send invoice by email with PDF attachment
  sendByEmail: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      console.log(`[Invoices] Send email for invoice ${input.id}`);
      
      try {
        const db = await getDb();
        
        // Get invoice with items
        const [invoice] = await db
          .select()
          .from(invoices)
          .where(and(
            eq(invoices.id, input.id),
            eq(invoices.user_id, ctx.user.id)
          ))
          .limit(1);
        
        if (!invoice) {
          throw new Error("Factura no encontrada");
        }
        
        // Only send draft invoices
        if (invoice.status !== "draft") {
          throw new Error("Solo se pueden enviar facturas en borrador");
        }
        
        // Get items
        const items = await db
          .select()
          .from(invoiceItems)
          .where(eq(invoiceItems.invoice_id, input.id));
        
        if (items.length === 0) {
          throw new Error("La factura no tiene ítems");
        }
        
        // Get client
        const client = await dbHelpers.getClientById(invoice.client_id, ctx.user.id);
        
        if (!client) {
          throw new Error("Cliente no encontrado");
        }
        
        // Get user
        const user = await dbHelpers.getUserById(ctx.user.id);
        
        if (!user) {
          throw new Error("Usuario no encontrado");
        }
        
        console.log(`[Invoices] Generating PDF for invoice ${invoice.invoice_number}`);
        
        // Generate PDF
        const pdfBase64 = await generateInvoicePDF({
          invoice_number: invoice.invoice_number,
          issue_date: invoice.issue_date,
          due_date: invoice.due_date,
          status: invoice.status,
          currency: invoice.currency,
          subtotal: invoice.subtotal,
          total: invoice.total,
          notes: invoice.notes,
          terms: invoice.terms,
          client: {
            name: client.name,
            email: client.email,
            phone: client.phone,
            company: client.company,
          },
          items: items.map(item => ({
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total: item.total,
          })),
          user: {
            name: user.name,
            email: user.email,
          },
        });
        
        console.log(`[Invoices] Sending email to ${client.email}`);
        
        // Send email with PDF attachment
        const emailSent = await sendEmail({
          to: client.email,
          subject: `Factura ${invoice.invoice_number} - ${user.name}`,
          html: `
            <h2>Nueva Factura</h2>
            <p>Hola ${client.name},</p>
            <p>Adjunto encontrarás la factura <strong>${invoice.invoice_number}</strong>.</p>
            <p><strong>Detalles:</strong></p>
            <ul>
              <li>Número: ${invoice.invoice_number}</li>
              <li>Fecha de emisión: ${new Date(invoice.issue_date).toLocaleDateString('es-ES')}</li>
              <li>Fecha de vencimiento: ${new Date(invoice.due_date).toLocaleDateString('es-ES')}</li>
              <li>Total: ${new Intl.NumberFormat('es-ES', { style: 'currency', currency: invoice.currency }).format(parseFloat(invoice.total))}</li>
            </ul>
            <p>Gracias por tu negocio.</p>
            <p>Saludos,<br>${user.name}</p>
          `,
          attachments: [{
            filename: `Factura-${invoice.invoice_number}.pdf`,
            content: pdfBase64,
            contentType: 'application/pdf',
          }],
        });
        
        if (!emailSent) {
          console.error(`[Invoices] Failed to send email for invoice ${input.id}`);
          throw new Error("Error al enviar el email. Verifica la configuración de RESEND_API_KEY.");
        }
        
        // Update status to sent
        await db
          .update(invoices)
          .set({
            status: "sent",
            updated_at: new Date(),
          })
          .where(eq(invoices.id, input.id));
        
        console.log(`[Invoices] Email sent successfully for invoice ${invoice.invoice_number}`);
        
        return { success: true };
      } catch (error: any) {
        console.error(`[Invoices] SendByEmail error:`, error.message);
        throw new Error(error.message || "Error al enviar factura por email");
      }
    }),

  // Download invoice PDF
  downloadPDF: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      console.log(`[Invoices] Download PDF for invoice ${input.id}`);
      
      try {
        const db = await getDb();
        
        // Get invoice with items
        const [invoice] = await db
          .select()
          .from(invoices)
          .where(and(
            eq(invoices.id, input.id),
            eq(invoices.user_id, ctx.user.id)
          ))
          .limit(1);
        
        if (!invoice) {
          throw new Error("Factura no encontrada");
        }
        
        // Get items
        const items = await db
          .select()
          .from(invoiceItems)
          .where(eq(invoiceItems.invoice_id, input.id));
        
        // Get client
        const client = await dbHelpers.getClientById(invoice.client_id, ctx.user.id);
        
        if (!client) {
          throw new Error("Cliente no encontrado");
        }
        
        // Get user
        const user = await dbHelpers.getUserById(ctx.user.id);
        
        if (!user) {
          throw new Error("Usuario no encontrado");
        }
        
        // Generate PDF
        const pdfBase64 = await generateInvoicePDF({
          invoice_number: invoice.invoice_number,
          issue_date: invoice.issue_date,
          due_date: invoice.due_date,
          status: invoice.status,
          currency: invoice.currency,
          subtotal: invoice.subtotal,
          total: invoice.total,
          notes: invoice.notes,
          terms: invoice.terms,
          client: {
            name: client.name,
            email: client.email,
            phone: client.phone,
            company: client.company,
          },
          items: items.map(item => ({
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total: item.total,
          })),
          user: {
            name: user.name,
            email: user.email,
          },
        });
        
        console.log(`[Invoices] PDF generated for invoice ${invoice.invoice_number}`);
        
        return {
          success: true,
          pdf: pdfBase64,
          filename: `Factura-${invoice.invoice_number}.pdf`,
        };
      } catch (error: any) {
        console.error(`[Invoices] DownloadPDF error:`, error.message);
        throw new Error(error.message || "Error al generar PDF");
      }
    }),

});
