/**
 * Recurring Invoices Job
 * Runs daily to generate invoices from recurring templates
 */

import { 
  getRecurringInvoicesDueForGeneration,
  createInvoice,
  updateRecurringInvoiceNextDate
} from '../db';
import { 
  calculateNextGenerationDate,
  generateRecurringInvoiceNumber,
  shouldGenerateInvoice,
  type RecurrenceFrequency
} from './recurring-invoices';
import { addDays } from 'date-fns';

/**
 * Process all recurring invoices and generate new ones if needed
 */
export async function processRecurringInvoices() {
  console.log('[Recurring Invoices Job] Starting...');
  
  try {
    // Get all recurring invoices that are due for generation
    const dueInvoices = await getRecurringInvoicesDueForGeneration();
    
    console.log(`[Recurring Invoices Job] Found ${dueInvoices.length} invoices to process`);
    
    for (const template of dueInvoices) {
      try {
        // Check if should generate (date check)
        if (!template.next_generation_date || !shouldGenerateInvoice(template.next_generation_date)) {
          continue;
        }
        
        // Generate new invoice from template
        // Generate unique payment token
        const crypto = await import('crypto');
        const paymentToken = crypto.randomBytes(32).toString('hex');
        
        const newInvoiceData = {
          user_id: template.user_id,
          client_id: template.client_id,
          invoice_number: generateRecurringInvoiceNumber(template.invoice_number),
          issue_date: new Date(),
          due_date: addDays(new Date(), 30), // 30 days from now
          items: template.items,
          subtotal: template.subtotal,
          tax: template.tax,
          total: template.total,
          currency: template.currency,
          paid_amount: '0',
          balance: template.total,
          status: 'sent' as const,
          payment_token: paymentToken, // Unique token for public access
          payment_link: template.payment_link,
          notes: template.notes,
          is_recurring: false, // Generated invoices are not recurring themselves
          parent_invoice_id: template.id, // Link to parent template
        };
        
        // Create the new invoice
        const result = await createInvoice(newInvoiceData);
        const newInvoiceId = result.id;
        
        console.log(`[Recurring Invoices Job] Generated invoice ${newInvoiceData.invoice_number} from template ${template.invoice_number}`);
        
        // Send invoice PDF to client automatically
        try {
          const { getInvoiceById, getClientById } = await import('../db');
          const { generateInvoicePDF } = await import('./pdf');
          const { sendEmail } = await import('./email');
          
          // Get full invoice and client data
          const invoice = await getInvoiceById(newInvoiceId, template.user_id);
          const client = await getClientById(template.client_id, template.user_id);
          
          if (invoice && client) {
            // Prepare invoice data for PDF
            const invoiceData = {
              ...invoice,
              clientName: client.name,
              clientEmail: client.email,
              clientPhone: client.phone,
              companyName: client.company || undefined,
              items: typeof invoice.items === 'string' ? JSON.parse(invoice.items) : invoice.items,
            };
            
            // Generate PDF
            const pdfBase64 = await generateInvoicePDF(invoiceData);
            
            // Send email with PDF attachment
            const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #000; color: #fff; padding: 30px; text-align: center; }
    .content { background: #f9f9f9; padding: 30px; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Nueva Factura - Finwrk</h1>
    </div>
    <div class="content">
      <h2>Hola ${client.name},</h2>
      <p>Se ha generado automáticamente tu factura recurrente.</p>
      <p><strong>Número de factura:</strong> ${invoice.invoice_number}</p>
      <p><strong>Total:</strong> ${invoice.currency} ${parseFloat(invoice.total as any).toFixed(2)}</p>
      <p><strong>Fecha de emisión:</strong> ${new Date(invoice.issue_date).toLocaleDateString('es-ES')}</p>
      <p><strong>Fecha de vencimiento:</strong> ${new Date(invoice.due_date).toLocaleDateString('es-ES')}</p>
      <p>Adjunto encontrarás el PDF de tu factura.</p>
      ${invoice.payment_token ? `
      <div style="margin: 30px 0; padding: 20px; background: #fff; border-radius: 8px; text-align: center;">
        <h3 style="margin: 0 0 15px 0; color: #000;">Ver Factura y Subir Comprobante</h3>
        <p style="margin: 0 0 20px 0; color: #666;">Haz clic en el botón para ver los detalles de tu factura y subir tu comprobante de pago.</p>
        <a href="${process.env.APP_URL || 'https://finwrk.app'}/invoice/${invoice.payment_token}" 
           style="display: inline-block; padding: 12px 30px; background: #000; color: #fff; text-decoration: none; border-radius: 6px; font-weight: 600;">
          Ver Factura
        </a>
      </div>
      ` : ''}
      <p>Gracias por tu preferencia.</p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Finwrk. Todos los derechos reservados.</p>
    </div>
  </div>
</body>
</html>
            `;
            
            await sendEmail({
              to: client.email,
              subject: `Nueva Factura ${invoice.invoice_number} - Finwrk`,
              html: emailHtml,
              attachments: [{
                filename: `factura-${invoice.invoice_number}.pdf`,
                content: pdfBase64,
                contentType: 'application/pdf',
              }],
            });
            
            console.log(`[Recurring Invoices Job] Invoice PDF sent to client: ${client.email}`);
          }
        } catch (emailError) {
          console.error(`[Recurring Invoices Job] Failed to send invoice email:`, emailError);
          // Don't throw - invoice was created successfully, just email failed
        }
        
        // Calculate next generation date
        const nextDate = calculateNextGenerationDate(
          new Date(),
          template.recurrence_frequency as RecurrenceFrequency,
          template.recurrence_interval || undefined
        );
        
        // Update template's next generation date
        await updateRecurringInvoiceNextDate(template.id, nextDate);
        
        console.log(`[Recurring Invoices Job] Next generation scheduled for ${nextDate.toISOString()}`);
        
      } catch (error) {
        console.error(`[Recurring Invoices Job] Error processing invoice ${template.id}:`, error);
        // Continue with next invoice even if one fails
      }
    }
    
    console.log('[Recurring Invoices Job] Completed successfully');
    
  } catch (error) {
    console.error('[Recurring Invoices Job] Fatal error:', error);
    throw error;
  }
}

/**
 * Start the recurring invoices job scheduler
 * Runs every day at 00:00 UTC
 */
export function startRecurringInvoicesScheduler() {
  // Run immediately on startup (for testing)
  processRecurringInvoices().catch(console.error);
  
  // Schedule to run every minute (for testing)
  // TODO: Change back to 24 hours in production
  const ONE_MINUTE = 60 * 1000;
  // const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
  
  setInterval(() => {
    processRecurringInvoices().catch(console.error);
  }, ONE_MINUTE);
  
  console.log('[Recurring Invoices Scheduler] Started - will run every 1 minute (TESTING MODE)');
}
