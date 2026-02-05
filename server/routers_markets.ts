import { router, publicProcedure } from "./_core/trpc";
import { z } from "zod";

/**
 * Markets Router - Proxy for cryptocurrency market data
 * Avoids CORS issues by fetching data server-side
 */
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
        
        console.log('[Markets] Fetching crypto data from CoinGecko...');
        
        const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=${params.vs_currency}&order=market_cap_desc&per_page=${params.per_page}&page=${params.page}&sparkline=false`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`CoinGecko API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        console.log(`[Markets] Successfully fetched ${data.length} cryptocurrencies`);
        
        return data;
      } catch (error: any) {
        console.error('[Markets] Error fetching crypto data:', error);
        throw new Error(error.message || 'Failed to fetch cryptocurrency data');
      }
    }),

  /**
   * Get exchange rates from USD to other currencies
   */
  getExchangeRates: publicProcedure.query(async () => {
    try {
      console.log('[Markets] Fetching exchange rates...');
      
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
      
      if (!response.ok) {
        throw new Error(`Exchange Rate API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      console.log('[Markets] Successfully fetched exchange rates');
      
      return data.rates;
    } catch (error: any) {
      console.error('[Markets] Error fetching exchange rates:', error);
      throw new Error(error.message || 'Failed to fetch exchange rates');
    }
  }),
});
