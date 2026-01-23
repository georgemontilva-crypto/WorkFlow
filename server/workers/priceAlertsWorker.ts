/**
 * Price Alerts Worker (Refactored with Redis)
 * Uses Redis as performance layer for evaluation
 * Database remains the single source of truth
 */

import { priceAlertsQueue } from '../queues/price-alerts-queue';
import { alertsRedisService, type AlertCondition, type AlertEvent } from '../services/alertsRedisService';
import { getDb } from "../db";
import { priceAlerts } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

interface PriceData {
  symbol: string;
  price: number;
}

/**
 * Fetch current prices from CoinGecko for crypto
 */
async function fetchCryptoPrices(symbols: string[]): Promise<Map<string, number>> {
  const priceMap = new Map<string, number>();
  
  try {
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
  
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
  if (!apiKey) {
    console.error('[Price Alerts] ALPHA_VANTAGE_API_KEY not configured');
    return priceMap;
  }

  try {
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
 * Main worker function - Load alerts from DB to Redis and evaluate
 */
async function checkPriceAlerts() {
  console.log('[Price Alerts] Starting price alerts check...');
  
  try {
    const db = await getDb();
    
    // 1. Load active price alerts from DB (source of truth)
    const activeAlerts = await db
      .select()
      .from(priceAlerts)
      .where(eq(priceAlerts.is_active, 1));

    if (activeAlerts.length === 0) {
      console.log('[Price Alerts] No active alerts found');
      return;
    }

    console.log(`[Price Alerts] Found ${activeAlerts.length} active alerts in DB`);

    // 2. Transform to AlertCondition format and load to Redis
    const alertConditions: AlertCondition[] = activeAlerts.map(alert => ({
      id: `price_alert_${alert.id}`,
      userId: alert.user_id,
      type: 'price_alert',
      condition: {
        alertId: alert.id,
        symbol: alert.symbol,
        assetType: alert.type,
        targetPrice: parseFloat(alert.target_price),
        condition: alert.condition,
        notifyEmail: alert.notify_email === 1,
      },
      priority: 'warning',
    }));

    await alertsRedisService.loadActiveAlerts(alertConditions);

    // 3. Group alerts by asset type
    const cryptoAlerts = activeAlerts.filter(a => a.type === 'crypto');
    const stockAlerts = activeAlerts.filter(a => a.type === 'stock');

    // 4. Fetch current prices
    const cryptoSymbols = [...new Set(cryptoAlerts.map(a => a.symbol))];
    const stockSymbols = [...new Set(stockAlerts.map(a => a.symbol))];

    const cryptoPrices = cryptoSymbols.length > 0 ? await fetchCryptoPrices(cryptoSymbols) : new Map();
    const stockPrices = stockSymbols.length > 0 ? await fetchStockPrices(stockSymbols) : new Map();

    // 5. Evaluate each alert using Redis
    for (const alert of activeAlerts) {
      const alertId = `price_alert_${alert.id}`;
      
      // Check if already triggered in Redis
      if (await alertsRedisService.isAlertTriggered(alertId)) {
        console.log(`[Price Alerts] Alert ${alertId} already triggered, skipping`);
        continue;
      }

      const currentPrice = alert.type === 'crypto' 
        ? cryptoPrices.get(alert.symbol)
        : stockPrices.get(alert.symbol);

      if (!currentPrice) {
        console.log(`[Price Alerts] No price data for ${alert.symbol}`);
        continue;
      }

      const targetPrice = parseFloat(alert.target_price);
      
      if (isAlertTriggered(currentPrice, targetPrice, alert.condition)) {
        console.log(`[Price Alerts] Alert triggered for ${alert.symbol}: ${currentPrice} ${alert.condition} ${targetPrice}`);

        // 6. Create alert event and enqueue to Redis
        const event: AlertEvent = {
          alertId,
          userId: alert.user_id,
          type: 'price_alert',
          priority: 'warning',
          title: `Alerta de Precio: ${alert.symbol}`,
          message: `${alert.symbol} ha alcanzado ${alert.condition === 'above' ? 'o superado' : 'o bajado de'} tu precio objetivo de $${targetPrice}. Precio actual: $${currentPrice.toFixed(2)}`,
          actionUrl: `/markets?symbol=${alert.symbol}`,
          sendEmail: alert.notify_email === 1,
          metadata: {
            symbol: alert.symbol,
            assetType: alert.type,
            currentPrice: currentPrice.toFixed(2),
            targetPrice: targetPrice.toFixed(2),
            condition: alert.condition,
          },
          timestamp: Date.now(),
        };

        await alertsRedisService.enqueueAlertEvent(event);

        // 7. Deactivate alert in DB and update last_triggered_at
        await db
          .update(priceAlerts)
          .set({
            is_active: 0,
            last_triggered_at: new Date(),
          })
          .where(eq(priceAlerts.id, alert.id));

        // 8. Remove from Redis active alerts
        await alertsRedisService.removeActiveAlert('price_alert', alertId);

        console.log(`[Price Alerts] Alert ${alertId} enqueued for processing`);
      }
    }

    console.log('[Price Alerts] Price alerts check completed');
  } catch (error) {
    console.error('[Price Alerts] Error checking price alerts:', error);
    throw error;
  }
}

/**
 * Process price alerts check job
 */
priceAlertsQueue.process('check-prices', async (job) => {
  console.log(`[Price Alerts] Processing job ${job.id}`);
  await checkPriceAlerts();
  return { success: true, timestamp: Date.now() };
});

/**
 * Initialize the price alerts worker
 */
export function initializePriceAlertsWorker() {
  console.log('[Price Alerts] Worker initialized and ready to process jobs');
  return true;
}
