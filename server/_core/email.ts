
/**
 * Email Service Module
 * Handles email sending via Resend API
 */

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
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
        from: process.env.EMAIL_FROM || "WorkFlow <noreply@workflow.com>",
        to: options.to,
        subject: options.subject,
        html: options.html,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("[Email] Failed to send email:", error);
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

export function getWelcomeEmailTemplate(userName: string, trialEndDate: Date): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #000; color: #fff; padding: 30px; text-align: center; }
    .content { background: #f9f9f9; padding: 30px; }
    .button { display: inline-block; padding: 12px 24px; background: #000; color: #fff; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>¡Bienvenido a WorkFlow!</h1>
    </div>
    <div class="content">
      <h2>Hola ${userName},</h2>
      <p>Gracias por registrarte en WorkFlow. Tu cuenta ha sido creada exitosamente.</p>
      <p>Tu período de prueba gratuito termina el <strong>${trialEndDate.toLocaleDateString('es-ES')}</strong>.</p>
      <p>Durante este tiempo, tendrás acceso completo a todas las funcionalidades:</p>
      <ul>
        <li>Gestión de clientes</li>
        <li>Creación de facturas profesionales</li>
        <li>Control de ingresos y gastos</li>
        <li>Metas de ahorro</li>
        <li>Soporte técnico</li>
      </ul>
      <a href="${process.env.APP_URL || 'http://localhost:3000'}" class="button">Comenzar Ahora</a>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} WorkFlow. Todos los derechos reservados.</p>
    </div>
  </div>
</body>
</html>
  `;
}

export function getPasswordResetEmailTemplate(userName: string, resetLink: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #000; color: #fff; padding: 30px; text-align: center; }
    .content { background: #f9f9f9; padding: 30px; }
    .button { display: inline-block; padding: 12px 24px; background: #000; color: #fff; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Recuperación de Contraseña</h1>
    </div>
    <div class="content">
      <h2>Hola ${userName},</h2>
      <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en WorkFlow.</p>
      <p>Haz clic en el siguiente botón para crear una nueva contraseña:</p>
      <a href="${resetLink}" class="button">Restablecer Contraseña</a>
      <div class="warning">
        <strong>⚠️ Importante:</strong> Este enlace es válido por 1 hora y solo puede usarse una vez.
      </div>
      <p>Si no solicitaste este cambio, puedes ignorar este correo de forma segura.</p>
      <p style="color: #666; font-size: 12px; margin-top: 30px;">
        Si el botón no funciona, copia y pega este enlace en tu navegador:<br>
        ${resetLink}
      </p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} WorkFlow. Todos los derechos reservados.</p>
    </div>
  </div>
</body>
</html>
  `;
}

export function getPaymentReminderEmailTemplate(
  userName: string,
  clientName: string,
  amount: string,
  dueDate: Date,
  daysUntilDue: number
): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #000; color: #fff; padding: 30px; text-align: center; }
    .content { background: #f9f9f9; padding: 30px; }
    .highlight { background: #fff; border: 2px solid #000; padding: 20px; margin: 20px 0; text-align: center; }
    .amount { font-size: 32px; font-weight: bold; color: #000; }
    .button { display: inline-block; padding: 12px 24px; background: #000; color: #fff; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Recordatorio de Pago</h1>
    </div>
    <div class="content">
      <h2>Hola ${userName},</h2>
      <p>Te recordamos que tienes un pago próximo de tu cliente <strong>${clientName}</strong>.</p>
      <div class="highlight">
        <p style="margin: 0; color: #666;">Monto a cobrar:</p>
        <div class="amount">$${amount}</div>
        <p style="margin: 10px 0 0 0; color: #666;">Vence en ${daysUntilDue} día${daysUntilDue !== 1 ? 's' : ''}</p>
        <p style="margin: 0; color: #666; font-size: 14px;">${dueDate.toLocaleDateString('es-ES')}</p>
      </div>
      <p>No olvides contactar a tu cliente para confirmar el pago.</p>
      <a href="${process.env.APP_URL || 'http://localhost:3000'}/clients" class="button">Ver Detalles</a>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} WorkFlow. Todos los derechos reservados.</p>
    </div>
  </div>
</body>
</html>
  `;
}

export function getInvoiceCreatedEmailTemplate(
  clientName: string,
  invoiceNumber: string,
  total: string,
  dueDate: Date
): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #000; color: #fff; padding: 30px; text-align: center; }
    .content { background: #f9f9f9; padding: 30px; }
    .invoice-details { background: #fff; padding: 20px; margin: 20px 0; border-left: 4px solid #000; }
    .button { display: inline-block; padding: 12px 24px; background: #000; color: #fff; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Nueva Factura Creada</h1>
    </div>
    <div class="content">
      <h2>Factura para ${clientName}</h2>
      <p>Se ha creado una nueva factura exitosamente.</p>
      <div class="invoice-details">
        <p><strong>Número de Factura:</strong> ${invoiceNumber}</p>
        <p><strong>Total:</strong> $${total}</p>
        <p><strong>Fecha de Vencimiento:</strong> ${dueDate.toLocaleDateString('es-ES')}</p>
      </div>
      <a href="${process.env.APP_URL || 'http://localhost:3000'}/invoices" class="button">Ver Factura</a>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} WorkFlow. Todos los derechos reservados.</p>
    </div>
  </div>
</body>
</html>
  `;
}

export function getLoginAlertEmailTemplate(
  userName: string,
  ipAddress: string,
  userAgent: string,
  time: Date
): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #000; color: #fff; padding: 30px; text-align: center; }
    .content { background: #f9f9f9; padding: 30px; }
    .alert-box { background: #fff; border-left: 4px solid #000; padding: 20px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Nuevo Inicio de Sesión Detectado</h1>
    </div>
    <div class="content">
      <h2>Hola ${userName},</h2>
      <p>Hemos detectado un nuevo inicio de sesión en tu cuenta de WorkFlow.</p>
      
      <div class="alert-box">
        <p><strong>Fecha y Hora:</strong> ${time.toLocaleString('es-ES')}</p>
        <p><strong>Dirección IP:</strong> ${ipAddress}</p>
        <p><strong>Dispositivo:</strong> ${userAgent}</p>
      </div>

      <p>Si fuiste tú, puedes ignorar este mensaje.</p>
      <p><strong>¿No fuiste tú?</strong> Te recomendamos cambiar tu contraseña inmediatamente para proteger tu cuenta.</p>
      
      <a href="${process.env.APP_URL || 'http://localhost:3000'}/settings" style="display: inline-block; padding: 12px 24px; background: #000; color: #fff; text-decoration: none; border-radius: 6px; margin: 20px 0;">Revisar Seguridad</a>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} WorkFlow. Todos los derechos reservados.</p>
    </div>
  </div>
</body>
</html>
  `;
}

export function getPriceAlertEmailTemplate(
  userName: string,
  symbol: string,
  price: number,
  targetPrice: number,
  condition: 'above' | 'below'
): string {
  const conditionText = condition === 'above' ? 'superado' : 'caído por debajo de';
  const arrow = condition === 'above' ? '📈' : '📉';
  const color = condition === 'above' ? '#16a34a' : '#dc2626';
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #000; color: #fff; padding: 30px; text-align: center; }
    .content { background: #f9f9f9; padding: 30px; }
    .price-box { background: #fff; border: 2px solid #000; padding: 20px; margin: 20px 0; text-align: center; }
    .price { font-size: 36px; font-weight: bold; color: ${color}; }
    .target { color: #666; font-size: 14px; margin-top: 5px; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${arrow} Alerta de Precio: ${symbol}</h1>
    </div>
    <div class="content">
      <h2>Hola ${userName},</h2>
      <p>Tu alerta de precio para <strong>${symbol}</strong> se ha activado.</p>
      
      <div class="price-box">
        <p style="margin: 0; color: #666;">El precio ha ${conditionText}:</p>
        <div class="price">$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })}</div>
        <div class="target">Objetivo: $${targetPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })}</div>
      </div>

      <a href="${process.env.APP_URL || 'http://localhost:3000'}/markets" style="display: inline-block; padding: 12px 24px; background: #000; color: #fff; text-decoration: none; border-radius: 6px; margin: 20px 0;">Ver Mercado</a>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} WorkFlow. Todos los derechos reservados.</p>
    </div>
  </div>
</body>
</html>
  `;
}
