
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
        from: process.env.EMAIL_FROM || "Finwrk <noreply@finwrk.app>",
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
      console.error("[Email] From address:", process.env.EMAIL_FROM || "Finwrk <noreply@finwrk.app>");
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
 * Email Templates
 */

export function getWelcomeEmailTemplate(userName: string): string {
  const body = `
    <p style="margin:0 0 16px;">Hola <strong>${userName}</strong>,</p>
    <p style="margin:0 0 16px;">Gracias por registrarte en Finwrk. Tu cuenta ha sido creada exitosamente.</p>
    <p style="margin:0 0 16px;">Estás usando el <strong>Plan Free</strong> y tienes acceso a las funcionalidades básicas:</p>
    <ul style="margin:0 0 16px; padding-left:20px; color:#d1d1d6;">
      <li style="margin-bottom:8px;">Dashboard financiero básico</li>
      <li style="margin-bottom:8px;">Hasta 3 clientes</li>
      <li style="margin-bottom:8px;">Máximo 5 facturas</li>
      <li style="margin-bottom:8px;">Visualización de cripto</li>
      <li style="margin-bottom:8px;">Seguridad bancaria</li>
    </ul>
    <p style="margin:0 0 16px;">Puedes actualizar a <strong>Pro</strong> en cualquier momento para desbloquear funciones ilimitadas.</p>
  `;

  return getBaseEmailTemplate({
    title: '¡Bienvenido a Finwrk!',
    body,
    ctaText: 'Comenzar Ahora',
    ctaUrl: `${process.env.APP_URL || 'http://localhost:3000'}`
  });
}

export function getPasswordResetEmailTemplate(userName: string, resetLink: string): string {
  const body = `
    <p style="margin:0 0 16px;">Hola <strong>${userName}</strong>,</p>
    <p style="margin:0 0 16px;">Hemos recibido una solicitud para restablecer la contraseña de tu cuenta de Finwrk.</p>
    <p style="margin:0 0 16px;">Haz clic en el botón de abajo para crear una nueva contraseña:</p>
    <div style="margin:24px 0; padding:16px; background-color:#1a1a1f; border-radius:8px; border:1px solid #26262c;">
      <p style="margin:0; font-size:13px; color:#8e8e93;">O copia y pega este enlace en tu navegador:</p>
      <p style="margin:8px 0 0; font-size:13px; color:#ff8c2b; word-break:break-all;">${resetLink}</p>
    </div>
    <p style="margin:0 0 16px; font-size:14px; color:#8e8e93;">Este enlace expirará en 1 hora por razones de seguridad.</p>
    <p style="margin:0; font-size:14px; color:#8e8e93;">Si no solicitaste restablecer tu contraseña, puedes ignorar este correo de forma segura.</p>
  `;

  return getBaseEmailTemplate({
    title: 'Restablecer Contraseña',
    body,
    ctaText: 'Restablecer Contraseña',
    ctaUrl: resetLink
  });
}

export function getPaymentReminderEmailTemplate(
  userName: string,
  clientName: string,
  amount: string,
  dueDate: Date,
  daysUntilDue: number
): string {
  const body = `
    <p style="margin:0 0 16px;">Hola <strong>${userName}</strong>,</p>
    <p style="margin:0 0 24px;">Te recordamos que tienes un pago próximo de tu cliente <strong>${clientName}</strong>.</p>
    
    <div style="background-color:#1a1a1f; border:1px solid #ff8c2b; border-radius:12px; padding:24px; text-align:center; margin:0 0 24px;">
      <p style="margin:0 0 8px; font-size:13px; color:#8e8e93; text-transform:uppercase; letter-spacing:0.5px;">Monto a cobrar</p>
      <p style="margin:0 0 16px; font-size:36px; font-weight:700; color:#ff8c2b;">$${amount}</p>
      <p style="margin:0 0 4px; font-size:15px; color:#ffffff;">Vence en ${daysUntilDue} día${daysUntilDue !== 1 ? 's' : ''}</p>
      <p style="margin:0; font-size:14px; color:#8e8e93;">${dueDate.toLocaleDateString('es-ES')}</p>
    </div>
    
    <p style="margin:0;">No olvides contactar a tu cliente para confirmar el pago.</p>
  `;

  return getBaseEmailTemplate({
    title: 'Recordatorio de Pago',
    body,
    ctaText: 'Ver Detalles',
    ctaUrl: `${process.env.APP_URL || 'http://localhost:3000'}/clients`
  });
}

export function getInvoiceCreatedEmailTemplate(
  clientName: string,
  invoiceNumber: string,
  total: string,
  dueDate: Date
): string {
  const body = `
    <p style="margin:0 0 16px;">Se ha creado una nueva factura exitosamente para <strong>${clientName}</strong>.</p>
    
    <div style="background-color:#1a1a1f; border-left:3px solid #ff8c2b; border-radius:8px; padding:20px; margin:0 0 24px;">
      <p style="margin:0 0 12px;"><span style="color:#8e8e93;">Número de Factura:</span> <strong style="color:#ffffff;">${invoiceNumber}</strong></p>
      <p style="margin:0 0 12px;"><span style="color:#8e8e93;">Total:</span> <strong style="color:#ffffff; font-size:18px;">$${total}</strong></p>
      <p style="margin:0;"><span style="color:#8e8e93;">Fecha de Vencimiento:</span> <strong style="color:#ffffff;">${dueDate.toLocaleDateString('es-ES')}</strong></p>
    </div>
  `;

  return getBaseEmailTemplate({
    title: 'Nueva Factura Creada',
    body,
    ctaText: 'Ver Factura',
    ctaUrl: `${process.env.APP_URL || 'http://localhost:3000'}/invoices`
  });
}

export function getLoginAlertEmailTemplate(
  userName: string,
  ipAddress: string,
  userAgent: string,
  time: Date
): string {
  const body = `
    <p style="margin:0 0 16px;">Hola <strong>${userName}</strong>,</p>
    <p style="margin:0 0 24px;">Hemos detectado un nuevo inicio de sesión en tu cuenta de Finwrk.</p>
    
    <div style="background-color:#1a1a1f; border:1px solid #26262c; border-radius:8px; padding:20px; margin:0 0 24px;">
      <p style="margin:0 0 12px;"><span style="color:#8e8e93;">Fecha y Hora:</span> <strong style="color:#ffffff;">${time.toLocaleString('es-ES')}</strong></p>
      <p style="margin:0 0 12px;"><span style="color:#8e8e93;">Dirección IP:</span> <strong style="color:#ffffff;">${ipAddress}</strong></p>
      <p style="margin:0;"><span style="color:#8e8e93;">Dispositivo:</span> <strong style="color:#ffffff;">${userAgent}</strong></p>
    </div>
    
    <p style="margin:0 0 16px;">Si fuiste tú, puedes ignorar este mensaje.</p>
    <p style="margin:0; color:#ff8c2b;"><strong>¿No fuiste tú?</strong> Te recomendamos cambiar tu contraseña inmediatamente para proteger tu cuenta.</p>
  `;

  return getBaseEmailTemplate({
    title: 'Nuevo Inicio de Sesión Detectado',
    body,
    ctaText: 'Revisar Seguridad',
    ctaUrl: `${process.env.APP_URL || 'http://localhost:3000'}/settings`
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
  
  const body = `
    <p style="margin:0 0 16px;">Hola <strong>${userName}</strong>,</p>
    <p style="margin:0 0 24px;">El precio de <strong>${symbol}</strong> ha ${conditionText} tu precio objetivo.</p>
    
    <div style="background-color:#1a1a1f; border:2px solid ${color}; border-radius:12px; padding:24px; text-align:center; margin:0 0 24px;">
      <p style="margin:0 0 8px; font-size:13px; color:#8e8e93; text-transform:uppercase; letter-spacing:0.5px;">${symbol}</p>
      <p style="margin:0 0 16px; font-size:42px; font-weight:700; color:${color};">${arrow} $${price.toFixed(2)}</p>
      <p style="margin:0; font-size:14px; color:#8e8e93;">Precio objetivo: <strong style="color:#ffffff;">$${targetPrice.toFixed(2)}</strong></p>
    </div>
    
    <p style="margin:0;">Esta alerta se disparó automáticamente según tus configuraciones.</p>
  `;

  return getBaseEmailTemplate({
    title: `Alerta de Precio: ${symbol}`,
    body,
    ctaText: 'Ver en Mercados',
    ctaUrl: `${process.env.APP_URL || 'http://localhost:3000'}/markets`
  });
}
