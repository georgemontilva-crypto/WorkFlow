
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
        from: process.env.EMAIL_FROM || "Finwrk <noreply@finwrk.app>",
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
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password - Finwrk</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; border-bottom: 1px solid #e5e5e5;">
              <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #000000;">Finwrk</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; font-size: 24px; font-weight: 600; color: #000000;">Reset Your Password</h2>
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #333333;">Hi ${userName},</p>
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #333333;">We received a request to reset your password for your Finwrk account. Click the button below to create a new password:</p>
              <table role="presentation" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="${resetLink}" style="display: inline-block; padding: 16px 32px; background-color: #000000; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600;">Reset Password</a>
                  </td>
                </tr>
              </table>
              <p style="margin: 20px 0; font-size: 14px; line-height: 1.6; color: #666666;">Or copy and paste this link into your browser:</p>
              <p style="margin: 0 0 20px; font-size: 14px; line-height: 1.6; color: #0066cc; word-break: break-all;">${resetLink}</p>
              <p style="margin: 20px 0 0; font-size: 14px; line-height: 1.6; color: #666666;">This link will expire in 1 hour for security reasons.</p>
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e5e5;">
              <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #999999;">If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px 40px; background-color: #f9f9f9; border-top: 1px solid #e5e5e5; text-align: center; border-bottom-left-radius: 8px; border-bottom-right-radius: 8px;">
              <p style="margin: 0 0 10px; font-size: 14px; color: #666666;">© ${new Date().getFullYear()} Finwrk. All rights reserved.</p>
              <p style="margin: 0; font-size: 12px; color: #999999;">Financial Manager for Freelancers</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
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
