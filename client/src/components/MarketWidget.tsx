/**
 * MarketWidget - Real-time market data widget for Dashboard
 * Design Philosophy: Apple Minimalism - Clean, informative
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
      <Card className="bg-card border-2 border-border hover:border-primary/50 hover:shadow-lg transition-all cursor-pointer" onClick={() => setLocation('/markets')}>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <BarChart3 className="w-4 h-4" strokeWidth={1.5} />
            Mercado
          </CardTitle>
          <Activity className="w-4 h-4 text-muted-foreground animate-pulse" />
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
      <Card className="bg-card border-2 border-border hover:border-primary/50 hover:shadow-lg transition-all cursor-pointer" onClick={() => setLocation('/markets')}>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <BarChart3 className="w-4 h-4" strokeWidth={1.5} />
            Mercado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Sin datos</p>
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
    <Card 
      className={`bg-card border-2 transition-all cursor-pointer hover:shadow-lg ${
        isPositive 
          ? 'border-green-500/30 hover:border-green-500/50 bg-gradient-to-br from-green-500/5 to-green-500/10' 
          : 'border-red-500/30 hover:border-red-500/50 bg-gradient-to-br from-red-500/5 to-red-500/10'
      }`}
      onClick={() => setLocation('/markets')}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <BarChart3 className="w-4 h-4" strokeWidth={1.5} />
          <span className="hidden sm:inline">{data.name}</span>
          <span className="sm:hidden">{symbol}</span>
        </CardTitle>
        <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
          isPositive ? 'bg-green-500/20 text-green-600' : 'bg-red-500/20 text-red-600'
        }`}>
          {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {isPositive ? '+' : ''}{(data.change24h || 0).toFixed(1)}%
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="text-2xl sm:text-3xl font-bold text-foreground font-mono">
            {formatPrice(data.price)}
          </div>
          <div className="text-xs text-muted-foreground">
            <span className="hidden sm:inline">{symbol} • </span>Actualización en tiempo real
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
