/**
 * Price Alerts Worker
 * Checks active price alerts and triggers notifications when conditions are met
 */

import { priceAlertsQueue } from '../queues/price-alerts-queue';
import { getDb } from "../db";
import { priceAlerts, alerts, users } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { sendEmail } from "../_core/email";

interface PriceData {
  symbol: string;
  price: number;
  change24h?: number;
}

/**
 * Fetch current prices from CoinGecko for crypto
 */
async function fetchCryptoPrices(symbols: string[]): Promise<Map<string, number>> {
  const priceMap = new Map<string, number>();
  
  try {
    // Convert symbols to CoinGecko IDs (e.g., BTC -> bitcoin)
    const coinGeckoIds = symbols.map(s => {
      const mapping: Record<string, string> = {
        'BTC': 'bitcoin',
        'ETH': 'ethereum',
        'USDT': 'tether',
        'BNB': 'binancecoin',
        'SOL': 'solana',
        'XRP': 'ripple',
        'ADA': 'cardano',
        'DOGE': 'dogecoin',
        'TRX': 'tron',
        'AVAX': 'avalanche-2',
      };
      return mapping[s.toUpperCase()] || s.toLowerCase();
    });

    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coinGeckoIds.join(',')}&vs_currencies=usd`
    );

    if (!response.ok) {
      console.error('[Price Alerts] Failed to fetch crypto prices:', response.statusText);
      return priceMap;
    }

    const data = await response.json();
    
    // Map back to original symbols
    symbols.forEach((symbol, index) => {
      const coinId = coinGeckoIds[index];
      if (data[coinId]?.usd) {
        priceMap.set(symbol, data[coinId].usd);
      }
    });

  } catch (error) {
    console.error('[Price Alerts] Error fetching crypto prices:', error);
  }

  return priceMap;
}

/**
 * Fetch current prices from Alpha Vantage for stocks
 */
async function fetchStockPrices(symbols: string[]): Promise<Map<string, number>> {
  const priceMap = new Map<string, number>();
  
  // Alpha Vantage API key from environment
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
  if (!apiKey) {
    console.error('[Price Alerts] ALPHA_VANTAGE_API_KEY not configured');
    return priceMap;
  }

  try {
    // Fetch prices for each symbol (Alpha Vantage limits to 5 calls per minute on free tier)
    for (const symbol of symbols.slice(0, 5)) {
      const response = await fetch(
        `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`
      );

      if (!response.ok) continue;

      const data = await response.json();
      const price = parseFloat(data['Global Quote']?.['05. price']);
      
      if (!isNaN(price)) {
        priceMap.set(symbol, price);
      }

      // Rate limiting: wait 250ms between requests
      await new Promise(resolve => setTimeout(resolve, 250));
    }
  } catch (error) {
    console.error('[Price Alerts] Error fetching stock prices:', error);
  }

  return priceMap;
}

/**
 * Check if alert condition is met
 */
function isAlertTriggered(
  currentPrice: number,
  targetPrice: number,
  condition: 'above' | 'below'
): boolean {
  if (condition === 'above') {
    return currentPrice >= targetPrice;
  } else {
    return currentPrice <= targetPrice;
  }
}

/**
 * Create system alert
 */
async function createSystemAlert(
  userId: number,
  symbol: string,
  type: string,
  currentPrice: number,
  targetPrice: number,
  condition: string
) {
  const db = await getDb();
  
  const message = `${symbol} ha alcanzado ${condition === 'above' ? 'o superado' : 'o bajado de'} tu precio objetivo de $${targetPrice}. Precio actual: $${currentPrice.toFixed(2)}`;
  
  await db.insert(alerts).values({
    user_id: userId,
    type: 'warning',
    title: `Alerta de Precio: ${symbol}`,
    message,
    action_url: `/markets?symbol=${symbol}`,
    is_read: 0,
  });
}

/**
 * Send email notification
 */
async function sendPriceAlertEmail(
  userEmail: string,
  userName: string,
  symbol: string,
  type: string,
  currentPrice: number,
  targetPrice: number,
  condition: string
) {
  const conditionText = condition === 'above' ? 'alcanzado o superado' : 'bajado de';
  const assetType = type === 'crypto' ? 'Criptomoneda' : 'Acción';
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
        .alert-box { background: white; border-left: 4px solid #f59e0b; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .price-info { display: flex; justify-content: space-between; margin: 15px 0; }
        .price-label { color: #6b7280; font-size: 14px; }
        .price-value { font-size: 24px; font-weight: bold; color: #111827; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; margin-top: 20px; }
        .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">🔔 Alerta de Precio</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Tu alerta ha sido activada</p>
        </div>
        <div class="content">
          <p>Hola ${userName},</p>
          <p>Tu alerta de precio para <strong>${symbol}</strong> ha sido activada.</p>
          
          <div class="alert-box">
            <h3 style="margin-top: 0; color: #f59e0b;">Detalles de la Alerta</h3>
            <p><strong>${assetType}:</strong> ${symbol}</p>
            <p><strong>Condición:</strong> Precio ${conditionText} $${targetPrice}</p>
            
            <div class="price-info">
              <div>
                <div class="price-label">Precio Objetivo</div>
                <div class="price-value">$${targetPrice}</div>
              </div>
              <div style="text-align: right;">
                <div class="price-label">Precio Actual</div>
                <div class="price-value" style="color: ${condition === 'above' ? '#10b981' : '#ef4444'};">$${currentPrice.toFixed(2)}</div>
              </div>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; margin-bottom: 0;">
              Fecha y hora: ${new Date().toLocaleString('es-ES', { timeZone: 'America/Caracas' })}
            </p>
          </div>
          
          <p>Puedes ver más detalles y gestionar tus alertas en la plataforma.</p>
          
          <a href="${process.env.APP_URL || 'https://finwrk.app'}/markets?symbol=${symbol}" class="button">
            Ver ${symbol} en Finwrk
          </a>
          
          <div class="footer">
            <p>Este es un correo automático de Finwrk. No respondas a este mensaje.</p>
            <p>Si no creaste esta alerta, puedes ignorar este correo.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    to: userEmail,
    subject: `🔔 Alerta de Precio: ${symbol} ${conditionText} $${targetPrice}`,
    html,
  });
}

/**
 * Main worker function
 */
async function checkPriceAlerts() {
  console.log('[Price Alerts Worker] Starting price alerts check...');
  
  try {
    const db = await getDb();
    
    // Get all active price alerts
    const activeAlerts = await db
      .select()
      .from(priceAlerts)
      .where(eq(priceAlerts.is_active, 1));

    if (activeAlerts.length === 0) {
      console.log('[Price Alerts Worker] No active alerts found');
      return;
    }

    console.log(`[Price Alerts Worker] Found ${activeAlerts.length} active alerts`);

    // Group alerts by type
    const cryptoAlerts = activeAlerts.filter(a => a.type === 'crypto');
    const stockAlerts = activeAlerts.filter(a => a.type === 'stock');

    // Fetch current prices
    const cryptoSymbols = [...new Set(cryptoAlerts.map(a => a.symbol))];
    const stockSymbols = [...new Set(stockAlerts.map(a => a.symbol))];

    const cryptoPrices = cryptoSymbols.length > 0 ? await fetchCryptoPrices(cryptoSymbols) : new Map();
    const stockPrices = stockSymbols.length > 0 ? await fetchStockPrices(stockSymbols) : new Map();

    // Check each alert
    for (const alert of activeAlerts) {
      const currentPrice = alert.type === 'crypto' 
        ? cryptoPrices.get(alert.symbol)
        : stockPrices.get(alert.symbol);

      if (!currentPrice) {
        console.log(`[Price Alerts Worker] No price data for ${alert.symbol}`);
        continue;
      }

      const targetPrice = parseFloat(alert.target_price);
      
      if (isAlertTriggered(currentPrice, targetPrice, alert.condition)) {
        console.log(`[Price Alerts Worker] Alert triggered for ${alert.symbol}: ${currentPrice} ${alert.condition} ${targetPrice}`);

        // Get user info
        const user = await db
          .select()
          .from(users)
          .where(eq(users.id, alert.user_id))
          .limit(1);

        if (user.length === 0) continue;

        // Create system alert
        await createSystemAlert(
          alert.user_id,
          alert.symbol,
          alert.type,
          currentPrice,
          targetPrice,
          alert.condition
        );

        // Send email if enabled
        if (alert.notify_email === 1) {
          await sendPriceAlertEmail(
            user[0].email,
            user[0].name,
            alert.symbol,
            alert.type,
            currentPrice,
            targetPrice,
            alert.condition
          );
        }

        // Deactivate alert and update last_triggered_at
        await db
          .update(priceAlerts)
          .set({
            is_active: 0,
            last_triggered_at: new Date(),
          })
          .where(eq(priceAlerts.id, alert.id));

        console.log(`[Price Alerts Worker] Alert ${alert.id} processed and deactivated`);
      }
    }

    console.log('[Price Alerts Worker] Price alerts check completed');
  } catch (error) {
    console.error('[Price Alerts Worker] Error checking price alerts:', error);
    throw error; // Bull will retry based on job options
  }
}

/**
 * Process price alerts check job
 */
priceAlertsQueue.process('check-prices', async (job) => {
  console.log(`[Price Alerts Worker] Processing job ${job.id}`);
  await checkPriceAlerts();
  return { success: true, timestamp: Date.now() };
});

/**
 * Initialize the price alerts worker
 */
export function initializePriceAlertsWorker() {
  console.log('[Price Alerts Worker] Worker initialized and ready to process jobs');
  return true;
}
