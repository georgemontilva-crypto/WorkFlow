/**
 * Payment Proof Notification Email Template
 */

export function getPaymentProofNotificationTemplate(
  userName: string,
  invoiceNumber: string,
  clientName: string,
  amount: string,
  currency: string,
  dashboardLink: string
): string {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Comprobante de Pago Recibido - Finwrk</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #000000;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; background-color: #0b0b0b; border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.08);">
          
          <!-- Header with Logo -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center;">
              <h1 style="font-size: 32px; font-weight: 700; color: #ffffff; margin: 0;">Finwrk</h1>
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="padding: 0 40px 40px;">
              <h2 style="margin: 0 0 20px; font-size: 24px; font-weight: 600; color: #ffffff; text-align: center;">Comprobante de Pago Recibido</h2>
              
              <p style="margin: 0 0 30px; font-size: 16px; line-height: 1.6; color: #a0a0a0; text-align: center;">Hola ${userName},</p>
              
              <p style="margin: 0 0 30px; font-size: 16px; line-height: 1.6; color: #a0a0a0; text-align: center;">Un cliente ha enviado un comprobante de pago para una de tus facturas.</p>
              
              <!-- Invoice Details Box -->
              <table role="presentation" style="width: 100%; background-color: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 8px; margin: 0 0 30px;">
                <tr>
                  <td style="padding: 24px;">
                    <table role="presentation" style="width: 100%;">
                      <tr>
                        <td style="padding: 8px 0; font-size: 14px; color: #666666;">Factura:</td>
                        <td style="padding: 8px 0; font-size: 14px; color: #ffffff; text-align: right; font-weight: 600;">${invoiceNumber}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; font-size: 14px; color: #666666;">Cliente:</td>
                        <td style="padding: 8px 0; font-size: 14px; color: #ffffff; text-align: right;">${clientName}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; font-size: 14px; color: #666666;">Monto:</td>
                        <td style="padding: 8px 0; font-size: 16px; color: #ffffff; text-align: right; font-weight: 700;">$${amount} ${currency}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; font-size: 14px; color: #666666;">Estado:</td>
                        <td style="padding: 8px 0; text-align: right;">
                          <span style="display: inline-block; padding: 4px 12px; background-color: rgba(168, 85, 247, 0.1); color: #a855f7; border-radius: 999px; font-size: 12px; font-weight: 600;">Pago Enviado</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- Payment Proof Image -->
              <div style="margin: 0 0 30px; text-align: center;">
                <p style="margin: 0 0 16px; font-size: 14px; color: #a0a0a0; font-weight: 600;">📎 Comprobante de Pago:</p>
                <img src="cid:payment-proof" alt="Comprobante de Pago" style="max-width: 100%; height: auto; border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.08);" />
              </div>
              
              <!-- Dashboard Link -->
              <table role="presentation" style="margin: 0 0 30px; width: 100%;">
                <tr>
                  <td align="center">
                    <a href="${dashboardLink}" style="display: inline-block; padding: 16px 32px; background-color: #ffffff; color: #000000; text-decoration: none; border-radius: 999px; font-size: 16px; font-weight: 600;">Ir al Dashboard</a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 0 0 20px; font-size: 14px; line-height: 1.6; color: #666666; text-align: center;">Revisa el comprobante y marca la factura como pagada desde tu dashboard cuando confirmes el pago.</p>
              
              <hr style="margin: 30px 0; border: none; border-top: 1px solid rgba(255, 255, 255, 0.08);">
              
              <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #666666; text-align: center;">Esta es una notificación automática. Por favor verifica el comprobante antes de marcar la factura como pagada.</p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; border-top: 1px solid rgba(255, 255, 255, 0.08); text-align: center;">
              <p style="margin: 0 0 8px; font-size: 14px; color: #666666;">© ${new Date().getFullYear()} Finwrk. Todos los derechos reservados.</p>
              <p style="margin: 0; font-size: 12px; color: #4a4a4a;">Gestor Financiero para Freelancers</p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}
