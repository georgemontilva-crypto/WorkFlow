/**
 * Invoice Email Template - Finwrk
 * Email template for sending invoices to clients
 */

import { getBaseEmailTemplate } from './email-template';

interface InvoiceEmailOptions {
  clientName: string;
  userName: string;
  invoiceNumber: string;
  total: string;
  currency: string;
  dueDate: Date;
  publicLink: string;
}

export function getInvoiceEmailTemplate(options: InvoiceEmailOptions): string {
  const {
    clientName,
    userName,
    invoiceNumber,
    total,
    currency,
    dueDate,
    publicLink,
  } = options;

  return getBaseEmailTemplate({
    title: `Nueva Factura ${invoiceNumber}`,
    greeting: `Hola ${clientName},`,
    body: `
      <p style="margin:0 0 24px;">Te enviamos la factura <strong>${invoiceNumber}</strong> de <strong>${userName}</strong>.</p>
      
      <div style="background:rgba(255,255,255,0.03); border:2px solid #C4FF3D; border-radius:16px; padding:28px; text-align:center; margin:0 0 24px;">
        <p style="margin:0 0 8px; font-size:13px; color:#888888; text-transform:uppercase; letter-spacing:0.5px;">Monto Total</p>
        <p style="margin:0 0 16px; font-size:38px; font-weight:700; color:#C4FF3D; letter-spacing:-1px;">${new Intl.NumberFormat('es-ES', { style: 'currency', currency }).format(parseFloat(total))}</p>
        <div style="height:1px; background:rgba(255,255,255,0.1); margin:16px 0;"></div>
        <p style="margin:0 0 4px; font-size:13px; color:#888888; text-transform:uppercase; letter-spacing:0.5px;">Fecha de Vencimiento</p>
        <p style="margin:0; font-size:17px; font-weight:600; color:#ffffff;">${dueDate.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>
      
      <div style="background:rgba(255,255,255,0.03); border-radius:12px; padding:20px; margin:0 0 24px;">
        <p style="margin:0 0 12px; font-size:14px; color:#888888; font-weight:600; text-transform:uppercase; letter-spacing:0.5px;">En el portal de pago podrás:</p>
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width:100%;">
          <tr>
            <td style="padding:6px 0;">
              <span style="color:#C4FF3D; font-size:16px; margin-right:8px;">✓</span>
              <span style="color:#cccccc; font-size:15px;">Ver los detalles completos de la factura</span>
            </td>
          </tr>
          <tr>
            <td style="padding:6px 0;">
              <span style="color:#C4FF3D; font-size:16px; margin-right:8px;">✓</span>
              <span style="color:#cccccc; font-size:15px;">Descargar el PDF adjunto</span>
            </td>
          </tr>
          <tr>
            <td style="padding:6px 0;">
              <span style="color:#C4FF3D; font-size:16px; margin-right:8px;">✓</span>
              <span style="color:#cccccc; font-size:15px;">Realizar el pago y subir tu comprobante</span>
            </td>
          </tr>
        </table>
      </div>
      
      <p style="margin:0 0 8px; color:#888888; font-size:14px;">Gracias por tu preferencia.</p>
      <p style="margin:0; color:#ffffff; font-size:15px; font-weight:600;">Saludos,<br>${userName}</p>
    `,
    ctaText: '💳 Pagar Ahora',
    ctaUrl: publicLink,
  });
}
