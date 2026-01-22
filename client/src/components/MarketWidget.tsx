/**
 * MarketWidget - Real-time market data widget for Dashboard
 * Design Philosophy: Apple Minimalism - Clean, informative
 * Data Source: Binance API (faster and more accurate than CoinGecko)
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, BarChart3, Activity } from 'lucide-react';
import { useLocation } from 'wouter';
import { Sparkline } from './Sparkline';

interface MarketWidgetProps {
  symbol: string;
  type: 'crypto' | 'stock' | 'forex' | 'commodity';
}

interface MarketData {
  name: string;
  price: number;
  change24h: number;
  high24h: number;
  low24h: number;
  sparklineData: number[];
}

// Map crypto symbols to display names
const CRYPTO_NAMES: Record<string, string> = {
  'BTC': 'Bitcoin',
  'ETH': 'Ethereum',
  'SOL': 'Solana',
  'BNB': 'BNB',
  'XRP': 'Ripple',
  'ADA': 'Cardano',
  'DOGE': 'Dogecoin',
  'AVAX': 'Avalanche',
  'DOT': 'Polkadot',
  'LINK': 'Chainlink',
  'MATIC': 'Polygon',
  'UNI': 'Uniswap',
  'LTC': 'Litecoin',
  'ATOM': 'Cosmos',
  'XLM': 'Stellar',
  'ALGO': 'Algorand',
  'VET': 'VeChain',
  'ICP': 'Internet Computer',
  'FIL': 'Filecoin',
  'HBAR': 'Hedera',
  'APT': 'Aptos',
  'ARB': 'Arbitrum',
  'OP': 'Optimism',
  'NEAR': 'NEAR Protocol',
  'STX': 'Stacks',
  'IMX': 'Immutable X',
  'INJ': 'Injective',
  'TIA': 'Celestia',
  'SEI': 'Sei',
  'SUI': 'Sui',
};

export function MarketWidget({ symbol, type }: MarketWidgetProps) {
  const [, setLocation] = useLocation();
  const [data, setData] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (type === 'crypto') {
        try {
          // Binance uses USDT pairs for most cryptos
          const pair = `${symbol.toUpperCase()}USDT`;
          
          // Fetch 24hr ticker data from Binance
          const response = await fetch(
            `https://api.binance.com/api/v3/ticker/24hr?symbol=${pair}`
          );
          
          // Fetch kline/candlestick data for sparkline (last 24 hours, 1-hour intervals)
          const klineResponse = await fetch(
            `https://api.binance.com/api/v3/klines?symbol=${pair}&interval=1h&limit=24`
          );
          
          if (!response.ok || !klineResponse.ok) {
            // If USDT pair doesn't exist, try BUSD
            const busdResponse = await fetch(
              `https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol.toUpperCase()}BUSD`
            );
            
            const busdKlineResponse = await fetch(
              `https://api.binance.com/api/v3/klines?symbol=${symbol.toUpperCase()}BUSD&interval=1h&limit=24`
            );
            
            if (!busdResponse.ok || !busdKlineResponse.ok) {
              throw new Error(`API error: ${response.status}`);
            }
            
            const result = await busdResponse.json();
            const klineResult = await busdKlineResponse.json();
            
            // Extract closing prices for sparkline
            const sparklineData = klineResult.map((candle: any) => parseFloat(candle[4]));
            
            setData({
              name: CRYPTO_NAMES[symbol.toUpperCase()] || symbol.toUpperCase(),
              price: parseFloat(result.lastPrice),
              change24h: parseFloat(result.priceChangePercent),
              high24h: parseFloat(result.highPrice),
              low24h: parseFloat(result.lowPrice),
              sparklineData,
            });
          } else {
            const result = await response.json();
            const klineResult = await klineResponse.json();
            
            // Extract closing prices for sparkline
            const sparklineData = klineResult.map((candle: any) => parseFloat(candle[4]));
            
            setData({
              name: CRYPTO_NAMES[symbol.toUpperCase()] || symbol.toUpperCase(),
              price: parseFloat(result.lastPrice),
              change24h: parseFloat(result.priceChangePercent),
              high24h: parseFloat(result.highPrice),
              low24h: parseFloat(result.lowPrice),
              sparklineData,
            });
          }
        } catch (error) {
          console.error('Error fetching market data from Binance:', error);
          setData(null);
        } finally {
          setLoading(false);
        }
      } else {
        // For non-crypto assets, set loading to false
        setLoading(false);
      }
    };

    fetchData();
    // Update every 30 seconds (Binance is faster, so we can update more frequently)
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [symbol, type]);

  if (loading) {
    return (
      <Card className="bg-card border border-border hover:border-primary/50 hover:shadow-lg transition-all cursor-pointer" onClick={() => setLocation('/markets')}>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <BarChart3 className="w-4 h-4" strokeWidth={1.5} />
            Mercado
          </CardTitle>
          <Activity className="w-4 h-4 text-muted-foreground animate-pulse" />
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">Cargando...</p>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className="bg-card border border-border hover:border-primary/50 hover:shadow-lg transition-all cursor-pointer" onClick={() => setLocation('/markets')}>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <BarChart3 className="w-4 h-4" strokeWidth={1.5} />
            Mercado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">Sin datos</p>
        </CardContent>
      </Card>
    );
  }

  const isPositive = data.change24h >= 0;
  const changeColor = isPositive ? 'text-green-500' : 'text-red-500';
  const changeBgColor = isPositive ? 'bg-green-500/10' : 'bg-red-500/10';
  const borderColor = isPositive ? 'border-green-500/30' : 'border-red-500/30';
  const sparklineColor = isPositive ? '#10b981' : '#ef4444';

  return (
    <Card 
      className={`bg-card border ${borderColor} hover:border-primary/50 hover:shadow-lg transition-all cursor-pointer`}
      onClick={() => setLocation('/markets')}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-3">
          {/* Crypto Logo */}
          <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center bg-muted/20 flex-shrink-0">
            <img 
              src={`/crypto-logos/${symbol.toLowerCase()}.png`}
              alt={symbol.toUpperCase()}
              className="w-full h-full object-contain p-1"
              onError={(e) => {
                // Fallback to initials if logo fails to load
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                target.parentElement!.innerHTML = `<span class="text-sm font-bold text-muted-foreground">${symbol.toUpperCase().slice(0, 2)}</span>`;
              }}
            />
          </div>
          
          {/* Symbol and Name */}
          <div>
            <CardTitle className="text-sm font-semibold text-foreground">
              {symbol.toUpperCase()}
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              {data.name}
            </p>
          </div>
        </div>
        
        {/* Change Badge */}
        <div className={`flex items-center gap-1 px-2 py-1 rounded-md ${changeBgColor}`}>
          {isPositive ? (
            <TrendingUp className={`w-3 h-3 ${changeColor}`} />
          ) : (
            <TrendingDown className={`w-3 h-3 ${changeColor}`} />
          )}
          <span className={`text-xs font-semibold ${changeColor}`}>
            {isPositive ? '+' : ''}{data.change24h.toFixed(2)}%
          </span>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Price */}
        <div className="text-2xl sm:text-3xl font-bold text-foreground font-mono">
          ${data.price.toLocaleString('en-US', { 
            minimumFractionDigits: data.price < 1 ? 4 : 2,
            maximumFractionDigits: data.price < 1 ? 6 : 2
          })}
        </div>
        
        {/* Sparkline Chart */}
        <div className="w-full flex items-center justify-center">
          <Sparkline 
            data={data.sparklineData}
            width={200}
            height={60}
            color={sparklineColor}
            strokeWidth={1.5}
            className="w-full"
          />
        </div>
      </CardContent>
    </Card>
  );
}
