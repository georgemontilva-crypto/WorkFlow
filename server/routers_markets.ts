import { router, publicProcedure } from "./_core/trpc";
import { z } from "zod";

/**
 * Markets Router - Proxy for cryptocurrency market data
 * Avoids CORS issues by fetching data server-side
 * Implements caching to avoid rate limiting
 */

// Cache for crypto data (60 seconds)
let cryptoCache: { data: any; timestamp: number } | null = null;
const CRYPTO_CACHE_TTL = 60000; // 60 seconds

// Cache for exchange rates (5 minutes)
let ratesCache: { data: any; timestamp: number } | null = null;
const RATES_CACHE_TTL = 300000; // 5 minutes

export const marketsRouter = router({
  /**
   * Get cryptocurrency market data from CoinGecko
   */
  getCryptos: publicProcedure
    .input(z.object({
      vs_currency: z.string().default('usd'),
      per_page: z.number().default(50),
      page: z.number().default(1),
    }).optional())
    .query(async ({ input }) => {
      try {
        const params = input || { vs_currency: 'usd', per_page: 50, page: 1 };
        
        // Check cache first
        const now = Date.now();
        if (cryptoCache && (now - cryptoCache.timestamp) < CRYPTO_CACHE_TTL) {
          console.log('[Markets] Returning cached crypto data');
          return cryptoCache.data;
        }
        
        console.log('[Markets] Fetching fresh crypto data from CoinGecko...');
        
        const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=${params.vs_currency}&order=market_cap_desc&per_page=${params.per_page}&page=${params.page}&sparkline=false`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
          // If rate limited and we have old cache, return it
          if (response.status === 429 && cryptoCache) {
            console.log('[Markets] Rate limited, returning stale cache');
            return cryptoCache.data;
          }
          throw new Error(`CoinGecko API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Update cache
        cryptoCache = { data, timestamp: now };
        
        console.log(`[Markets] Successfully fetched and cached ${data.length} cryptocurrencies`);
        
        return data;
      } catch (error: any) {
        console.error('[Markets] Error fetching crypto data:', error);
        // If we have any cache, return it on error
        if (cryptoCache) {
          console.log('[Markets] Returning stale cache due to error');
          return cryptoCache.data;
        }
        throw new Error(error.message || 'Failed to fetch cryptocurrency data');
      }
    }),

  /**
   * Get exchange rates from USD to other currencies
   */
  getExchangeRates: publicProcedure.query(async () => {
    try {
      // Check cache first
      const now = Date.now();
      if (ratesCache && (now - ratesCache.timestamp) < RATES_CACHE_TTL) {
        console.log('[Markets] Returning cached exchange rates');
        return ratesCache.data;
      }
      
      console.log('[Markets] Fetching fresh exchange rates...');
      
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
      
      if (!response.ok) {
        // If error and we have old cache, return it
        if (ratesCache) {
          console.log('[Markets] Error fetching rates, returning stale cache');
          return ratesCache.data;
        }
        throw new Error(`Exchange Rate API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Update cache
      ratesCache = { data: data.rates, timestamp: now };
      
      console.log('[Markets] Successfully fetched and cached exchange rates');
      
      return data.rates;
    } catch (error: any) {
      console.error('[Markets] Error fetching exchange rates:', error);
      // If we have any cache, return it on error
      if (ratesCache) {
        console.log('[Markets] Returning stale cache due to error');
        return ratesCache.data;
      }
      throw new Error(error.message || 'Failed to fetch exchange rates');
    }
  }),
});
