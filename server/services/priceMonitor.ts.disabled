
import { getAllActivePriceAlerts, updatePriceAlertLastTriggered, getUserById } from "../db";
import { sendEmail, getPriceAlertEmailTemplate } from "../_core/email";

// Mock price service (replace with real API in production)
async function getCurrentPrice(symbol: string): Promise<number> {
  // Simulate price variations for demo purposes
  const basePrices: Record<string, number> = {
    'BTC': 93173.00,
    'ETH': 3217.27,
    'XRP': 2.00,
    'SOL': 133.91,
    'DOGE': 0.128421,
    'USDT': 0.999498,
    'BNB': 925.65,
    'ADA': 0.368197,
  };

  const basePrice = basePrices[symbol] || 100;
  // Add random variation between -1% and +1%
  const variation = 1 + (Math.random() * 0.02 - 0.01);
  return basePrice * variation;
}

export function startPriceMonitor() {
  console.log("[PriceMonitor] Starting price monitoring service...");
  
  // Check prices every 1 minute
  setInterval(async () => {
    try {
      const alerts = await getAllActivePriceAlerts();
      
      if (alerts.length === 0) return;

      console.log(`[PriceMonitor] Checking ${alerts.length} active alerts...`);

      for (const alert of alerts) {
        // Skip if triggered recently (e.g., in the last hour)
        if (alert.last_triggered_at) {
          const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
          if (alert.last_triggered_at > oneHourAgo) continue;
        }

        const currentPrice = await getCurrentPrice(alert.symbol);
        const targetPrice = Number(alert.target_price);
        let shouldTrigger = false;

        if (alert.condition === 'above' && currentPrice >= targetPrice) {
          shouldTrigger = true;
        } else if (alert.condition === 'below' && currentPrice <= targetPrice) {
          shouldTrigger = true;
        }

        if (shouldTrigger) {
          console.log(`[PriceMonitor] Alert triggered for ${alert.symbol} (${currentPrice} ${alert.condition} ${targetPrice})`);
          
          const user = await getUserById(alert.user_id);
          if (user) {
            const emailHtml = getPriceAlertEmailTemplate(
              user.name,
              alert.symbol,
              currentPrice,
              targetPrice,
              alert.condition
            );

            await sendEmail({
              to: user.email,
              subject: `🔔 Alerta de Precio: ${alert.symbol}`,
              html: emailHtml,
            });

            await updatePriceAlertLastTriggered(alert.id);
          }
        }
      }
    } catch (error) {
      console.error("[PriceMonitor] Error checking prices:", error);
    }
  }, 60 * 1000); // Run every minute
}
