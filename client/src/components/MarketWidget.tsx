/**
 * MarketWidget - Real-time market data widget for Dashboard
 * Design Philosophy: Apple Minimalism - Clean, informative
 * Data Source: Binance API (faster and more accurate than CoinGecko)
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, BarChart3, Activity } from 'lucide-react';
import { useLocation } from 'wouter';

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
          
          if (!response.ok) {
            // If USDT pair doesn't exist, try BUSD
            const busdResponse = await fetch(
              `https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol.toUpperCase()}BUSD`
            );
            
            if (!busdResponse.ok) {
              throw new Error(`API error: ${response.status}`);
            }
            
            const result = await busdResponse.json();
            setData({
              name: CRYPTO_NAMES[symbol.toUpperCase()] || symbol.toUpperCase(),
              price: parseFloat(result.lastPrice),
              change24h: parseFloat(result.priceChangePercent),
              high24h: parseFloat(result.highPrice),
              low24h: parseFloat(result.lowPrice),
            });
          } else {
            const result = await response.json();
            setData({
              name: CRYPTO_NAMES[symbol.toUpperCase()] || symbol.toUpperCase(),
              price: parseFloat(result.lastPrice),
              change24h: parseFloat(result.priceChangePercent),
              high24h: parseFloat(result.highPrice),
              low24h: parseFloat(result.lowPrice),
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
      <Card className="bg-card border-2 border-border hover:border-primary/50 hover:shadow-lg transition-all cursor-pointer" onClick={() => setLocation('/markets')}>
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
      <Card className="bg-card border-2 border-border hover:border-primary/50 hover:shadow-lg transition-all cursor-pointer" onClick={() => setLocation('/markets')}>
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

  return (
    <Card 
      className={`bg-card border-2 ${borderColor} hover:border-primary/50 hover:shadow-lg transition-all cursor-pointer`}
      onClick={() => setLocation('/markets')}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <BarChart3 className="w-4 h-4" strokeWidth={1.5} />
          {symbol.toUpperCase()}
        </CardTitle>
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
      <CardContent>
        <div className="space-y-1">
          <div className="text-2xl sm:text-3xl font-bold text-foreground font-mono">
            ${data.price.toLocaleString('en-US', { 
              minimumFractionDigits: data.price < 1 ? 4 : 2,
              maximumFractionDigits: data.price < 1 ? 6 : 2
            })}
          </div>
          <p className="text-xs text-muted-foreground">
            {data.name} • Actualización en tiempo real
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
