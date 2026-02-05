import * as priceAlertsDb from "../db-price-alerts";
import { getUserById } from "../db";
import { sendEmail } from "../_core/email";
import { createNotification } from "../helpers/notificationHelpers";

/**
 * Price Alerts Monitor Service
 * Checks active alerts and triggers notifications when conditions are met
 */

interface CryptoPrice {
  symbol: string;
  price: number;
}

/**
 * Check all active alerts against current prices
 */
export async function checkPriceAlerts(currentPrices: CryptoPrice[]) {
  try {
    console.log('[PriceAlertsMonitor] Starting price alerts check...');
    
    // Get all active alerts
    const activeAlerts = await priceAlertsDb.getAllActivePriceAlerts();
    
    if (activeAlerts.length === 0) {
      console.log('[PriceAlertsMonitor] No active alerts to check');
      return;
    }

    console.log(`[PriceAlertsMonitor] Checking ${activeAlerts.length} active alerts against ${currentPrices.length} prices`);

    // Create a map of current prices for quick lookup
    const priceMap = new Map<string, number>();
    currentPrices.forEach(cp => {
      priceMap.set(cp.symbol.toUpperCase(), cp.price);
    });

    // Check each alert
    for (const alert of activeAlerts) {
      const currentPrice = priceMap.get(alert.symbol);
      
      if (currentPrice === undefined) {
        // Price not available for this symbol
        continue;
      }

      const targetPrice = parseFloat(alert.target_price);
      let shouldTrigger = false;

      // Check condition
      if (alert.condition === 'above' && currentPrice >= targetPrice) {
        shouldTrigger = true;
      } else if (alert.condition === 'below' && currentPrice <= targetPrice) {
        shouldTrigger = true;
      }

      if (shouldTrigger) {
        console.log(`[PriceAlertsMonitor] Alert triggered! Alert ID: ${alert.id}, ${alert.symbol}: $${currentPrice} ${alert.condition} $${targetPrice}`);
        
        try {
          // Trigger the alert
          await triggerAlert(alert, currentPrice);
        } catch (error) {
          console.error(`[PriceAlertsMonitor] Error triggering alert ${alert.id}:`, error);
        }
      }
    }

    console.log('[PriceAlertsMonitor] Price alerts check completed');
  } catch (error) {
    console.error('[PriceAlertsMonitor] Error in checkPriceAlerts:', error);
  }
}

/**
 * Trigger an alert: mark as triggered and send notifications
 */
async function triggerAlert(alert: any, currentPrice: number) {
  try {
    // Mark alert as triggered
    await priceAlertsDb.triggerPriceAlert(alert.id);
    
    // Get user info
    const user = await getUserById(alert.user_id);
    if (!user) {
      console.error(`[PriceAlertsMonitor] User not found for alert ${alert.id}`);
      return;
    }

    const targetPrice = parseFloat(alert.target_price);
    const conditionText = alert.condition === 'above' ? 'alcanzó o superó' : 'cayó a o por debajo de';
    
    // Send app notification
    if (alert.notify_app === 1) {
      try {
        await createNotification({
          user_id: alert.user_id,
          type: 'success',
          title: `🚀 Alerta de precio: ${alert.symbol}`,
          message: `${alert.symbol} ${conditionText} tu precio objetivo de $${targetPrice.toLocaleString()}. Precio actual: $${currentPrice.toLocaleString()}`,
          source: 'system',
          source_id: alert.id,
          is_urgent: true,
        });
        console.log(`[PriceAlertsMonitor] App notification sent for alert ${alert.id}`);
      } catch (error) {
        console.error(`[PriceAlertsMonitor] Error sending app notification:`, error);
      }
    }

    // Send email notification
    if (alert.notify_email === 1) {
      try {
        const emailHtml = getPriceAlertEmailTemplate(
          user.name,
          alert.symbol,
          currentPrice,
          targetPrice,
          alert.condition,
          new Date()
        );

        await sendEmail({
          to: user.email,
          subject: `🚀 Alerta de precio activada – ${alert.symbol}`,
          html: emailHtml,
        });
        
        console.log(`[PriceAlertsMonitor] Email sent for alert ${alert.id} to ${user.email}`);
      } catch (error) {
        console.error(`[PriceAlertsMonitor] Error sending email:`, error);
      }
    }

    console.log(`[PriceAlertsMonitor] Alert ${alert.id} fully triggered and notifications sent`);
  } catch (error) {
    console.error(`[PriceAlertsMonitor] Error in triggerAlert:`, error);
    throw error;
  }
}

/**
 * Email template for price alerts
 */
function getPriceAlertEmailTemplate(
  userName: string,
  symbol: string,
  currentPrice: number,
  targetPrice: number,
  condition: 'above' | 'below',
  timestamp: Date
): string {
  const conditionText = condition === 'above' 
    ? 'alcanzó o superó' 
    : 'cayó a o por debajo de';
  
  const emoji = condition === 'above' ? '🚀' : '📉';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Alerta de Precio</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0A0A0A; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #121212; border: 1px solid #C4FF3D; border-radius: 12px; overflow: hidden;">
          
          <!-- Header -->
          <tr>
            <td style="padding: 32px 32px 24px 32px; text-align: center; background-color: #0A0A0A;">
              <h1 style="margin: 0; color: #C4FF3D; font-size: 24px; font-weight: 600;">
                ${emoji} Alerta de Precio Activada
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 32px;">
              <p style="margin: 0 0 24px 0; color: #FFFFFF; font-size: 16px; line-height: 1.5;">
                Hola <strong>${userName}</strong>,
              </p>
              
              <p style="margin: 0 0 24px 0; color: #FFFFFF; font-size: 16px; line-height: 1.5;">
                Tu alerta de precio para <strong style="color: #C4FF3D;">${symbol}</strong> ha sido activada.
              </p>

              <!-- Alert Details Box -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #0A0A0A; border: 1px solid #333333; border-radius: 8px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 20px;">
                    <table role="presentation" style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td style="padding: 8px 0; color: #999999; font-size: 14px;">Criptomoneda:</td>
                        <td style="padding: 8px 0; color: #FFFFFF; font-size: 14px; text-align: right; font-weight: 600;">${symbol}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #999999; font-size: 14px;">Precio objetivo:</td>
                        <td style="padding: 8px 0; color: #FFFFFF; font-size: 14px; text-align: right; font-weight: 600;">$${targetPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 8 })}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #999999; font-size: 14px;">Precio actual:</td>
                        <td style="padding: 8px 0; color: #C4FF3D; font-size: 16px; text-align: right; font-weight: 700;">$${currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 8 })}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #999999; font-size: 14px;">Condición:</td>
                        <td style="padding: 8px 0; color: #FFFFFF; font-size: 14px; text-align: right;">${conditionText}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #999999; font-size: 14px;">Fecha y hora:</td>
                        <td style="padding: 8px 0; color: #FFFFFF; font-size: 14px; text-align: right;">${timestamp.toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' })}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 24px 0; color: #FFFFFF; font-size: 16px; line-height: 1.5;">
                Esta alerta ha sido desactivada automáticamente. Puedes crear una nueva alerta desde el módulo de Mercados en FinWrk.
              </p>

              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 32px 0;">
                <tr>
                  <td align="center">
                    <a href="https://www.finwrk.app/markets" style="display: inline-block; padding: 14px 32px; background-color: transparent; color: #C4FF3D; text-decoration: none; border: 2px solid #C4FF3D; border-radius: 8px; font-size: 16px; font-weight: 600; transition: all 0.2s;">
                      Ver Mercados
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background-color: #0A0A0A; border-top: 1px solid #333333;">
              <p style="margin: 0; color: #666666; font-size: 12px; text-align: center; line-height: 1.5;">
                Este es un correo automático de FinWrk. Por favor no respondas a este mensaje.
              </p>
              <p style="margin: 8px 0 0 0; color: #666666; font-size: 12px; text-align: center;">
                © ${new Date().getFullYear()} FinWrk. Todos los derechos reservados.
              </p>
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
