/**
 * Email Service Module
 * Handles email sending via Resend API
 */

import { getBaseEmailTemplate } from './email-template';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    content: string; // base64 encoded
    encoding?: string; // 'base64'
    contentType?: string;
    contentId?: string; // For inline images (cid:xxx)
  }>;
}

/**
 * Send email using Resend API
 * Note: Requires RESEND_API_KEY environment variable
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    // Check if Resend API key is configured
    const apiKey = process.env.RESEND_API_KEY;
    
    if (!apiKey) {
      console.warn("[Email] RESEND_API_KEY not configured. Email not sent.");
      console.log("[Email] Would send to:", options.to);
      console.log("[Email] Subject:", options.subject);
      return false;
    }

    // Send email via Resend API
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || "Finwrk <support@finwrk.app>",
        to: options.to,
        subject: options.subject,
        html: options.html,
        ...(options.attachments && { 
          attachments: options.attachments.map(att => ({
            filename: att.filename,
            content: att.content,
            ...(att.contentType && { type: att.contentType }),
          }))
        }),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Email] Failed to send email. Status:", response.status);
      console.error("[Email] Error response:", errorText);
      console.error("[Email] Attempted to send to:", options.to);
      console.error("[Email] From address:", process.env.EMAIL_FROM || "Finwrk <support@finwrk.app>");
      return false;
    }

    console.log("[Email] Email sent successfully to:", options.to);
    return true;
  } catch (error) {
    console.error("[Email] Error sending email:", error);
    return false;
  }
}

/**
 * Email Templates - All using unified design
 */

export function getWelcomeEmailTemplate(userName: string): string {
  return getBaseEmailTemplate({
    title: '¡Bienvenido a Finwrk!',
    greeting: `Hola ${userName},`,
    body: `
      <p style="margin:0 0 16px;">Gracias por registrarte en Finwrk. Tu cuenta ha sido creada exitosamente.</p>
      <p style="margin:0 0 16px;">Estás usando el <strong>Plan Free</strong> y tienes acceso a las funcionalidades básicas:</p>
      <ul style="margin:0 0 16px; padding-left:20px;">
        <li style="margin-bottom:8px;">Dashboard financiero básico</li>
        <li style="margin-bottom:8px;">Hasta 3 clientes</li>
        <li style="margin-bottom:8px;">Máximo 5 facturas</li>
        <li style="margin-bottom:8px;">Visualización de cripto</li>
        <li style="margin-bottom:8px;">Seguridad bancaria</li>
      </ul>
      <p style="margin:0;">Puedes actualizar a <strong>Pro</strong> en cualquier momento para desbloquear funciones ilimitadas.</p>
    `,
    ctaText: 'Comenzar Ahora',
    ctaUrl: `${process.env.APP_URL || 'https://www.finwrk.app'}`
  });
}

export function getPasswordResetEmailTemplate(userName: string, resetLink: string): string {
  return getBaseEmailTemplate({
    title: 'Restablecer Contraseña',
    greeting: `Hola ${userName},`,
    body: `
      <p style="margin:0 0 16px;">Hemos recibido una solicitud para restablecer la contraseña de tu cuenta de Finwrk.</p>
      <p style="margin:0;">Haz clic en el botón de abajo para crear una nueva contraseña:</p>
    `,
    ctaText: 'Restablecer Contraseña',
    ctaUrl: resetLink,
    expirationTime: '1 hora',
    footerNote: 'Si no solicitaste restablecer tu contraseña, puedes ignorar este correo de forma segura.',
    showAlternativeLink: true,
  });
}

export function getPaymentReminderEmailTemplate(
  userName: string,
  clientName: string,
  amount: string,
  dueDate: Date,
  daysUntilDue: number
): string {
  return getBaseEmailTemplate({
    title: 'Recordatorio de Pago',
    greeting: `Hola ${userName},`,
    body: `
      <p style="margin:0 0 24px;">Te recordamos que tienes un pago próximo de tu cliente <strong>${clientName}</strong>.</p>
      
      <div style="background-color:rgba(255,255,255,0.03); border:2px solid #C4FF3D; border-radius:12px; padding:24px; text-align:center; margin:0 0 24px;">
        <p style="margin:0 0 8px; font-size:13px; color:#888888; text-transform:uppercase; letter-spacing:0.5px;">Monto a cobrar</p>
        <p style="margin:0 0 16px; font-size:36px; font-weight:700; color:#C4FF3D;">$${amount}</p>
        <p style="margin:0 0 4px; font-size:15px; color:#ffffff;">Vence en ${daysUntilDue} día${daysUntilDue !== 1 ? 's' : ''}</p>
        <p style="margin:0; font-size:14px; color:#888888;">${dueDate.toLocaleDateString('es-ES')}</p>
      </div>
      
      <p style="margin:0;">No olvides contactar a tu cliente para confirmar el pago.</p>
    `,
    ctaText: 'Ver Detalles',
    ctaUrl: `${process.env.APP_URL || 'https://www.finwrk.app'}/clients`
  });
}

export function getInvoiceCreatedEmailTemplate(
  clientName: string,
  invoiceNumber: string,
  total: string,
  dueDate: Date
): string {
  return getBaseEmailTemplate({
    title: 'Nueva Factura Creada',
    body: `
      <p style="margin:0 0 16px;">Se ha creado una nueva factura exitosamente para <strong>${clientName}</strong>.</p>
      
      <div style="background-color:rgba(255,255,255,0.03); border-left:3px solid #C4FF3D; border-radius:8px; padding:20px; margin:0 0 24px;">
        <p style="margin:0 0 12px;"><span style="color:#888888;">Número de Factura:</span> <strong style="color:#ffffff;">${invoiceNumber}</strong></p>
        <p style="margin:0 0 12px;"><span style="color:#888888;">Total:</span> <strong style="color:#ffffff; font-size:18px;">$${total}</strong></p>
        <p style="margin:0;"><span style="color:#888888;">Fecha de Vencimiento:</span> <strong style="color:#ffffff;">${dueDate.toLocaleDateString('es-ES')}</strong></p>
      </div>
    `,
    ctaText: 'Ver Factura',
    ctaUrl: `${process.env.APP_URL || 'https://www.finwrk.app'}/invoices`
  });
}

export function getLoginAlertEmailTemplate(
  userName: string,
  ipAddress: string,
  userAgent: string,
  time: Date
): string {
  return getBaseEmailTemplate({
    title: 'Nuevo Inicio de Sesión Detectado',
    greeting: `Hola ${userName},`,
    body: `
      <p style="margin:0 0 24px;">Hemos detectado un nuevo inicio de sesión en tu cuenta de Finwrk.</p>
      
      <div style="background-color:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.1); border-radius:8px; padding:20px; margin:0 0 24px;">
        <p style="margin:0 0 12px;"><span style="color:#888888;">Fecha y Hora:</span> <strong style="color:#ffffff;">${time.toLocaleString('es-ES')}</strong></p>
        <p style="margin:0 0 12px;"><span style="color:#888888;">Dirección IP:</span> <strong style="color:#ffffff;">${ipAddress}</strong></p>
        <p style="margin:0;"><span style="color:#888888;">Dispositivo:</span> <strong style="color:#ffffff;">${userAgent}</strong></p>
      </div>
      
      <p style="margin:0 0 16px;">Si fuiste tú, puedes ignorar este mensaje.</p>
      <p style="margin:0; color:#ff4444;"><strong>¿No fuiste tú?</strong> Te recomendamos cambiar tu contraseña inmediatamente para proteger tu cuenta.</p>
    `,
    ctaText: 'Revisar Seguridad',
    ctaUrl: `${process.env.APP_URL || 'https://www.finwrk.app'}/settings`
  });
}

export function getPaymentProofReceivedEmailTemplate(
  userName: string,
  invoiceNumber: string,
  clientName: string,
  amount: string,
  currency: string
): string {
  return getBaseEmailTemplate({
    title: 'Comprobante de Pago Recibido',
    greeting: `Hola ${userName},`,
    body: `
      <p style="margin:0 0 24px;">Tu cliente <strong>${clientName}</strong> ha subido un comprobante de pago para la factura <strong>${invoiceNumber}</strong>.</p>
      
      <div style="background-color:rgba(255,255,255,0.03); border:2px solid #C4FF3D; border-radius:12px; padding:24px; text-align:center; margin:0 0 24px;">
        <p style="margin:0 0 8px; font-size:13px; color:#888888; text-transform:uppercase; letter-spacing:0.5px;">Factura</p>
        <p style="margin:0 0 16px; font-size:36px; font-weight:700; color:#C4FF3D;">${invoiceNumber}</p>
        <p style="margin:0 0 4px; font-size:15px; color:#ffffff;">Monto: <strong>${amount} ${currency}</strong></p>
        <p style="margin:0; font-size:14px; color:#888888;">Cliente: ${clientName}</p>
      </div>
      
      <p style="margin:0 0 16px;">Por favor revisa el comprobante y confirma el pago en tu dashboard.</p>
      <p style="margin:0; font-size:14px; color:#888888;">Una vez confirmado, la factura se marcará como pagada automáticamente.</p>
    `,
    ctaText: 'Revisar Comprobante',
    ctaUrl: `${process.env.APP_URL || 'https://www.finwrk.app'}/invoices`
  });
}

export function getPriceAlertEmailTemplate(
  userName: string,
  symbol: string,
  price: number,
  targetPrice: number,
  condition: 'above' | 'below'
): string {
  const conditionText = condition === 'above' ? 'superado' : 'caído por debajo de';
  const arrow = condition === 'above' ? '↑' : '↓';
  const color = condition === 'above' ? '#16a34a' : '#dc2626';
  
  return getBaseEmailTemplate({
    title: 'Alerta de Precio',
    greeting: `Hola ${userName},`,
    body: `
      <p style="margin:0 0 24px;">El precio de <strong>${symbol}</strong> ha ${conditionText} tu precio objetivo.</p>
      
      <div style="background-color:rgba(255,255,255,0.03); border:2px solid ${color}; border-radius:12px; padding:24px; text-align:center; margin:0 0 24px;">
        <p style="margin:0 0 8px; font-size:13px; color:#888888; text-transform:uppercase; letter-spacing:0.5px;">${symbol}</p>
        <p style="margin:0 0 16px; font-size:36px; font-weight:700; color:${color};">${arrow} $${price.toFixed(2)}</p>
        <p style="margin:0; font-size:14px; color:#888888;">Precio objetivo: $${targetPrice.toFixed(2)}</p>
      </div>
      
      <p style="margin:0;">Revisa tu portafolio para tomar decisiones informadas.</p>
    `,
    ctaText: 'Ver Portafolio',
    ctaUrl: `${process.env.APP_URL || 'https://www.finwrk.app'}/crypto`
  });
}
