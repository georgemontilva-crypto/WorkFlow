/**
 * MarketWidget - Real-time market data widget for Dashboard
 * Design Philosophy: Apple Minimalism - Clean, informative
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';
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

export function MarketWidget({ symbol, type }: MarketWidgetProps) {
  const [, setLocation] = useLocation();
  const [data, setData] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (type === 'crypto') {
        try {
          const response = await fetch(
            `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&symbols=${symbol.toLowerCase()}&order=market_cap_desc&per_page=1&page=1&sparkline=false`
          );
          const result = await response.json();
          
          if (result && result.length > 0) {
            const coin = result[0];
            setData({
              name: coin.name,
              price: coin.current_price,
              change24h: coin.price_change_percentage_24h,
              high24h: coin.high_24h,
              low24h: coin.low_24h,
            });
          }
        } catch (error) {
          console.error('Error fetching market data:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [symbol, type]);

  if (loading) {
    return (
      <Card className="border-2 hover:border-primary/50 transition-colors cursor-pointer" onClick={() => setLocation('/markets')}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Mercado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            <div className="h-8 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className="border-2 hover:border-primary/50 transition-colors cursor-pointer" onClick={() => setLocation('/markets')}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Mercado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No hay datos disponibles</p>
        </CardContent>
      </Card>
    );
  }

  const isPositive = data.change24h >= 0;
  const formatPrice = (price: number) => {
    if (price < 1) return `$${price.toFixed(6)}`;
    if (price < 100) return `$${price.toFixed(2)}`;
    return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <Card className="border-2 hover:border-primary/50 transition-colors cursor-pointer" onClick={() => setLocation('/markets')}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
          <span className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            {data.name}
          </span>
          <span className="text-xs">{symbol}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="text-3xl font-bold text-foreground font-mono">
            {formatPrice(data.price)}
          </div>
          <div className={`flex items-center gap-1 text-sm font-medium ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
            {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            {isPositive ? '+' : ''}{data.change24h.toFixed(2)}% (24h)
          </div>
          <div className="grid grid-cols-2 gap-2 pt-2 border-t text-xs">
            <div>
              <p className="text-muted-foreground">Máx 24h</p>
              <p className="font-semibold">{formatPrice(data.high24h)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Mín 24h</p>
              <p className="font-semibold">{formatPrice(data.low24h)}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
