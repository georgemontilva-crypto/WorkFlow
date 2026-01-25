/**
 * Markets Page - Financial markets with crypto, stocks, forex
 * Design Philosophy: Apple Minimalism - Real-time data, clean UI
 */

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Star, Search, BarChart3, Eye, Sparkles, ArrowLeft, ChevronDown, Bell, BellPlus, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { useLocation } from 'wouter';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';
import { DashboardLayout } from '@/components/DashboardLayout';
import ScenarioSimulator from '@/components/ScenarioSimulator';
import CurrencyCalculator from '@/components/CurrencyCalculator';
import { PriceAlertDialog } from '@/components/PriceAlertDialog';

interface MarketAsset {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  marketCap?: number;
  volume24h?: number;
  type: 'crypto' | 'stock' | 'forex' | 'commodity';
  sparkline?: number[];
}

// Fallback data for crypto when API fails
const MOCK_CRYPTO_FALLBACK: MarketAsset[] = [
  { symbol: 'BTC', name: 'Bitcoin', price: 64230.50, change24h: 2.5, marketCap: 1200000000000, volume24h: 35000000000, type: 'crypto', sparkline: [62000, 63000, 62500, 64000, 63500, 64230, 64500] },
  { symbol: 'ETH', name: 'Ethereum', price: 3450.20, change24h: 1.8, marketCap: 400000000000, volume24h: 15000000000, type: 'crypto', sparkline: [3300, 3350, 3400, 3380, 3420, 3450, 3460] },
  { symbol: 'SOL', name: 'Solana', price: 145.80, change24h: 5.2, marketCap: 65000000000, volume24h: 4000000000, type: 'crypto', sparkline: [130, 135, 140, 138, 142, 145, 148] },
  { symbol: 'BNB', name: 'Binance Coin', price: 590.10, change24h: 0.5, marketCap: 87000000000, volume24h: 1200000000, type: 'crypto', sparkline: [580, 585, 588, 590, 589, 590, 592] },
  { symbol: 'XRP', name: 'Ripple', price: 0.62, change24h: -1.2, marketCap: 34000000000, volume24h: 1500000000, type: 'crypto', sparkline: [0.60, 0.61, 0.63, 0.62, 0.61, 0.62, 0.61] },
  { symbol: 'ADA', name: 'Cardano', price: 0.45, change24h: -0.8, marketCap: 16000000000, volume24h: 400000000, type: 'crypto', sparkline: [0.44, 0.45, 0.46, 0.45, 0.45, 0.45, 0.44] },
  { symbol: 'DOGE', name: 'Dogecoin', price: 0.16, change24h: 8.5, marketCap: 23000000000, volume24h: 2000000000, type: 'crypto', sparkline: [0.14, 0.15, 0.15, 0.16, 0.17, 0.16, 0.16] },
  { symbol: 'AVAX', name: 'Avalanche', price: 35.40, change24h: 3.1, marketCap: 13000000000, volume24h: 500000000, type: 'crypto', sparkline: [32, 33, 34, 35, 34, 35, 36] },
  { symbol: 'DOT', name: 'Polkadot', price: 7.20, change24h: -2.1, marketCap: 10000000000, volume24h: 200000000, type: 'crypto', sparkline: [7.5, 7.4, 7.3, 7.2, 7.3, 7.2, 7.1] },
  { symbol: 'LINK', name: 'Chainlink', price: 14.50, change24h: 1.5, marketCap: 8500000000, volume24h: 300000000, type: 'crypto', sparkline: [13.5, 14.0, 14.2, 14.5, 14.4, 14.5, 14.6] },
];

// Mock data for other markets
const MOCK_STOCKS: MarketAsset[] = [
  { symbol: 'AAPL', name: 'Apple Inc.', price: 185.92, change24h: 1.25, marketCap: 2890000000000, volume24h: 55000000, type: 'stock', sparkline: [180, 182, 181, 183, 184, 185, 186] },
  { symbol: 'MSFT', name: 'Microsoft Corp.', price: 420.55, change24h: 0.85, marketCap: 3120000000000, volume24h: 22000000, type: 'stock', sparkline: [410, 412, 415, 414, 418, 419, 420] },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 175.30, change24h: -0.45, marketCap: 2150000000000, volume24h: 30000000, type: 'stock', sparkline: [178, 177, 176, 175, 176, 175, 175] },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', price: 180.15, change24h: 2.10, marketCap: 1850000000000, volume24h: 40000000, type: 'stock', sparkline: [175, 176, 178, 179, 180, 181, 180] },
  { symbol: 'TSLA', name: 'Tesla Inc.', price: 178.20, change24h: -1.50, marketCap: 560000000000, volume24h: 95000000, type: 'stock', sparkline: [185, 182, 180, 178, 179, 177, 178] },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', price: 880.45, change24h: 3.20, marketCap: 2200000000000, volume24h: 45000000, type: 'stock', sparkline: [850, 860, 870, 865, 875, 880, 885] },
  { symbol: 'META', name: 'Meta Platforms', price: 495.60, change24h: 1.10, marketCap: 1250000000000, volume24h: 18000000, type: 'stock', sparkline: [480, 485, 490, 492, 495, 494, 496] },
  { symbol: 'BRK.B', name: 'Berkshire Hathaway', price: 405.30, change24h: 0.20, marketCap: 880000000000, volume24h: 3000000, type: 'stock', sparkline: [400, 402, 403, 404, 405, 405, 406] },
  { symbol: 'LLY', name: 'Eli Lilly', price: 760.10, change24h: 2.50, marketCap: 720000000000, volume24h: 2500000, type: 'stock', sparkline: [740, 745, 750, 755, 758, 760, 765] },
  { symbol: 'V', name: 'Visa Inc.', price: 275.40, change24h: -0.10, marketCap: 560000000000, volume24h: 6000000, type: 'stock', sparkline: [278, 277, 276, 275, 275, 274, 275] },
  { symbol: 'JPM', name: 'JPMorgan Chase', price: 195.20, change24h: 0.80, marketCap: 560000000000, volume24h: 9000000, type: 'stock', sparkline: [190, 192, 193, 194, 195, 195, 196] },
  { symbol: 'WMT', name: 'Walmart Inc.', price: 60.50, change24h: 0.30, marketCap: 480000000000, volume24h: 15000000, type: 'stock', sparkline: [59, 60, 60, 60.2, 60.5, 60.4, 60.6] },
];

const MOCK_FOREX: MarketAsset[] = [
  { symbol: 'EUR/USD', name: 'Euro / US Dollar', price: 1.0850, change24h: 0.15, type: 'forex', sparkline: [1.082, 1.083, 1.084, 1.083, 1.084, 1.085, 1.085] },
  { symbol: 'GBP/USD', name: 'British Pound / US Dollar', price: 1.2640, change24h: -0.20, type: 'forex', sparkline: [1.268, 1.267, 1.266, 1.265, 1.264, 1.263, 1.264] },
  { symbol: 'USD/JPY', name: 'US Dollar / Japanese Yen', price: 151.20, change24h: 0.50, type: 'forex', sparkline: [150.5, 150.8, 151.0, 151.1, 151.2, 151.3, 151.2] },
  { symbol: 'USD/CHF', name: 'US Dollar / Swiss Franc', price: 0.9050, change24h: 0.10, type: 'forex', sparkline: [0.902, 0.903, 0.904, 0.904, 0.905, 0.905, 0.905] },
  { symbol: 'AUD/USD', name: 'Australian Dollar / USD', price: 0.6580, change24h: 0.30, type: 'forex', sparkline: [0.655, 0.656, 0.657, 0.658, 0.658, 0.659, 0.658] },
  { symbol: 'USD/CAD', name: 'US Dollar / Canadian Dollar', price: 1.3560, change24h: -0.10, type: 'forex', sparkline: [1.360, 1.358, 1.357, 1.356, 1.355, 1.356, 1.356] },
  { symbol: 'NZD/USD', name: 'New Zealand Dollar / USD', price: 0.6020, change24h: 0.25, type: 'forex', sparkline: [0.598, 0.600, 0.601, 0.602, 0.603, 0.602, 0.602] },
  { symbol: 'EUR/GBP', name: 'Euro / British Pound', price: 0.8580, change24h: 0.05, type: 'forex', sparkline: [0.855, 0.856, 0.857, 0.858, 0.858, 0.859, 0.858] },
];

const MOCK_COMMODITIES: MarketAsset[] = [
  { symbol: 'XAU/USD', name: 'Gold', price: 2350.50, change24h: 1.10, type: 'commodity', sparkline: [2320, 2330, 2325, 2340, 2345, 2350, 2350] },
  { symbol: 'XAG/USD', name: 'Silver', price: 28.40, change24h: 2.50, type: 'commodity', sparkline: [27.5, 27.8, 28.0, 28.1, 28.2, 28.3, 28.4] },
  { symbol: 'WTI', name: 'Crude Oil WTI', price: 85.60, change24h: -0.80, type: 'commodity', sparkline: [87.0, 86.5, 86.0, 85.8, 85.5, 85.6, 85.6] },
  { symbol: 'BRENT', name: 'Brent Crude Oil', price: 90.10, change24h: -0.70, type: 'commodity', sparkline: [91.5, 91.0, 90.5, 90.2, 90.0, 90.1, 90.1] },
  { symbol: 'NG', name: 'Natural Gas', price: 1.85, change24h: -1.50, type: 'commodity', sparkline: [1.90, 1.88, 1.86, 1.85, 1.84, 1.85, 1.85] },
  { symbol: 'HG', name: 'Copper', price: 4.25, change24h: 1.20, type: 'commodity', sparkline: [4.15, 4.18, 4.20, 4.22, 4.24, 4.25, 4.26] },
  { symbol: 'PT', name: 'Platinum', price: 980.00, change24h: 0.50, type: 'commodity', sparkline: [970, 975, 978, 980, 982, 980, 981] },
  { symbol: 'PD', name: 'Palladium', price: 1050.00, change24h: -0.30, type: 'commodity', sparkline: [1060, 1055, 1050, 1048, 1050, 1052, 1050] },
];

export default function Markets() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [cryptoData, setCryptoData] = useState<MarketAsset[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch favorites
  const { data: favorites, refetch: refetchFavorites } = trpc.markets.getFavorites.useQuery();
  const { data: dashboardWidgets } = trpc.markets.getDashboardWidgets.useQuery();
  const { data: priceAlerts, refetch: refetchAlerts } = trpc.priceAlerts.list.useQuery();

  const createAlertMutation = trpc.priceAlerts.create.useMutation({
    onSuccess: () => {
      refetchAlerts();
      toast.success('Alerta creada exitosamente');
      setAlertDialogOpen(false);
    },
    onError: (error) => toast.error(error.message),
  });

  const deleteAlertMutation = trpc.priceAlerts.delete.useMutation({
    onSuccess: () => {
      refetchAlerts();
      toast.success('Alerta eliminada');
    },
  });

  const [alertDialogOpen, setAlertDialogOpen] = useState(false);
  const [selectedAssetForAlert, setSelectedAssetForAlert] = useState<MarketAsset | null>(null);
  const [alertTargetPrice, setAlertTargetPrice] = useState('');
  const [alertCondition, setAlertCondition] = useState<'above' | 'below'>('above');

  const handleCreateAlert = () => {
    if (!selectedAssetForAlert || !alertTargetPrice) return;
    
    createAlertMutation.mutate({
      symbol: selectedAssetForAlert.symbol,
      type: selectedAssetForAlert.type,
      target_price: parseFloat(alertTargetPrice),
      condition: alertCondition,
    });
  };

  const openAlertDialog = (e: React.MouseEvent, asset: MarketAsset) => {
    e.stopPropagation();
    setSelectedAssetForAlert(asset);
    setAlertTargetPrice(asset.price.toString());
    setAlertDialogOpen(true);
  };

  // Mutations
  const addFavoriteMutation = trpc.markets.addFavorite.useMutation({
    onSuccess: () => {
      refetchFavorites();
      toast.success('Agregado a favoritos');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const removeFavoriteMutation = trpc.markets.removeFavorite.useMutation({
    onSuccess: () => {
      refetchFavorites();
      toast.success('Eliminado de favoritos');
    },
  });

  const toggleWidgetMutation = trpc.markets.toggleDashboardWidget.useMutation({
    onSuccess: (data) => {
      refetchFavorites();
      toast.success(data.is_dashboard_widget ? 'Añadido al Dashboard' : 'Quitado del Dashboard');
    },
  });

  // Fetch crypto data from CoinGecko API
  useEffect(() => {
    const fetchCryptoData = async () => {
      try {
        // Added sparkline=true to get historical data
        const response = await fetch(
          'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=true'
        );
        
        if (!response.ok) throw new Error('API Limit reached');
        
        const data = await response.json();
        
        const formatted: MarketAsset[] = data.map((coin: any) => ({
          symbol: coin.symbol.toUpperCase(),
          name: coin.name,
          price: coin.current_price,
          change24h: coin.price_change_percentage_24h,
          marketCap: coin.market_cap,
          volume24h: coin.total_volume,
          type: 'crypto' as const,
          sparkline: coin.sparkline_in_7d?.price || [],
        }));
        
        setCryptoData(formatted);
      } catch (error) {
        console.error('Error fetching crypto data:', error);
        // Fallback data if API fails
        setCryptoData(MOCK_CRYPTO_FALLBACK);
        toast.error('Usando datos de respaldo (API limitada)');
      } finally {
        setLoading(false);
      }
    };

    fetchCryptoData();
    const interval = setInterval(fetchCryptoData, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  const isFavorite = (symbol: string) => {
    return favorites?.some(f => f.symbol === symbol);
  };

  const isWidget = (symbol: string) => {
    return dashboardWidgets?.some(w => w.symbol === symbol);
  };

  const handleToggleFavorite = (e: React.MouseEvent, asset: MarketAsset) => {
    e.stopPropagation();
    if (isFavorite(asset.symbol)) {
      removeFavoriteMutation.mutate({ symbol: asset.symbol });
    } else {
      addFavoriteMutation.mutate({ symbol: asset.symbol, type: asset.type });
      // Persist custom asset
      if (![...cryptoData, ...MOCK_STOCKS, ...MOCK_FOREX, ...MOCK_COMMODITIES, ...customAssets].some(a => a.symbol === asset.symbol)) {
        setCustomAssets(prev => [...prev, asset]);
      }
    }
  };

  const handleSetWidget = (e: React.MouseEvent, asset: MarketAsset) => {
    e.stopPropagation();
    
    // Si no está en favoritos, añadirlo primero
    if (!isFavorite(asset.symbol)) {
      addFavoriteMutation.mutate(
        { symbol: asset.symbol, type: asset.type },
        {
          onSuccess: () => {
            // Después de añadir a favoritos, añadir al dashboard
            toggleWidgetMutation.mutate({ symbol: asset.symbol });
          }
        }
      );
    } else {
      // Si ya está en favoritos, solo toggle dashboard
      toggleWidgetMutation.mutate({ symbol: asset.symbol });
    }
    
    // Persist custom asset
    if (![...cryptoData, ...MOCK_STOCKS, ...MOCK_FOREX, ...MOCK_COMMODITIES, ...customAssets].some(a => a.symbol === asset.symbol)) {
      setCustomAssets(prev => [...prev, asset]);
    }
  };

  const formatPrice = (price: number) => {
    if (price < 1) return `$${price.toFixed(6)}`;
    if (price < 100) return `$${price.toFixed(2)}`;
    return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatMarketCap = (value: number) => {
    if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    return `$${value.toLocaleString()}`;
  };

  const filterAssets = (assets: MarketAsset[]) => {
    return assets.filter(asset =>
      asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.symbol.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const sortAssets = (assets: MarketAsset[]) => {
    return [...assets].sort((a, b) => {
      const aIsFav = isFavorite(a.symbol);
      const bIsFav = isFavorite(b.symbol);
      if (aIsFav && !bIsFav) return -1;
      if (!aIsFav && bIsFav) return 1;
      return (b.marketCap || 0) - (a.marketCap || 0);
    });
  };

  const favoriteCount = favorites?.length || 0;

  const MiniChart = ({ data, isPositive }: { data: number[], isPositive: boolean }) => {
    if (!data || data.length === 0) return null;
    
    const chartData = data.map((val, i) => ({ i, val }));
    const color = isPositive ? '#22c55e' : '#ef4444'; // green-500 : red-500

    return (
      <div className="h-8 w-16 sm:w-24">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <Line 
              type="monotone" 
              dataKey="val" 
              stroke={color} 
              strokeWidth={2} 
              dot={false} 
              isAnimationActive={false}
            />
            <YAxis domain={['dataMin', 'dataMax']} hide />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const AssetItem = ({ asset }: { asset: MarketAsset }) => {
    const isPositive = asset.change24h >= 0;
    const favorite = isFavorite(asset.symbol);

    return (
      <div className="flex items-center justify-between p-2 border rounded-lg bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-all duration-200 shadow-sm gap-2">
        {/* Left: Symbol & Name */}
        <div className="flex items-center gap-3 text-left min-w-0 flex-1">
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-sm sm:text-base truncate">{asset.symbol}</span>
            <span className="text-xs text-muted-foreground truncate">{asset.name}</span>
          </div>
        </div>

        {/* Center: Mini Chart */}
        {asset.sparkline && (
          <div className="opacity-80 hover:opacity-100 transition-opacity hidden sm:block">
            <MiniChart data={asset.sparkline} isPositive={isPositive} />
          </div>
        )}

        {/* Right: Price, Change, Actions */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="text-right min-w-[70px]">
            <div className="font-mono font-medium text-sm">{formatPrice(asset.price)}</div>
            <div className={`text-[10px] flex items-center justify-end gap-1 font-medium ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
              {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {Math.abs(asset.change24h).toFixed(2)}%
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => {
                e.stopPropagation();
                handleToggleFavorite(e, asset);
              }}
            >
              <Star className={`w-4 h-4 ${favorite ? 'fill-primary text-primary' : ''}`} />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => {
                e.stopPropagation();
                openAlertDialog(e, asset);
              }}
            >
              <Bell className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground text-lg">Cargando mercados financieros...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-full">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <BarChart3 className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">Mercados</h1>
            
            {/* Badges al lado del título */}
            <div className="flex items-center gap-2">
              {favoriteCount > 0 && (
                <Badge variant="outline">
                  <Star className="w-3 h-3 mr-1 fill-current" />
                  {favoriteCount} favoritos
                </Badge>
              )}
              {priceAlerts && priceAlerts.length > 0 && (
                <Badge variant="outline" className="cursor-pointer hover:bg-white/5" onClick={() => document.getElementById('alerts-section')?.scrollIntoView({ behavior: 'smooth' })}>
                  <Bell className="w-3 h-3 mr-1 text-blue-500" />
                  {priceAlerts.length} alertas
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Active Alerts Section */}
        {priceAlerts && priceAlerts.length > 0 && (
          <div id="alerts-section" className="mb-8">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Bell className="w-5 h-5 text-blue-500" />
              Alertas Activas
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {priceAlerts.map((alert) => (
                <Card key={alert.id} className="bg-card/50 backdrop-blur-sm border-white/5">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-lg">{alert.symbol}</div>
                      <div className="text-sm text-muted-foreground">
                        Avisar si {alert.condition === 'above' ? 'sube de' : 'baja de'} ${Number(alert.target_price).toLocaleString()}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-500 hover:text-red-400 hover:bg-red-500/10"
                      onClick={() => deleteAlertMutation.mutate({ id: alert.id })}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        <PriceAlertDialog
          open={alertDialogOpen}
          onOpenChange={(open) => {
            setAlertDialogOpen(open);
            if (!open) {
              refetchAlerts();
            }
          }}
          symbol={selectedAssetForAlert?.symbol || ''}
          type={selectedAssetForAlert?.type || 'crypto'}
          currentPrice={selectedAssetForAlert?.price}
        />

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar activo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Group Buttons */}
        <Tabs defaultValue="crypto-stocks" className="w-full">
          <div className="flex gap-3 mb-6">
            <TabsList className="inline-flex flex-1">
              <TabsTrigger value="crypto-stocks" className="flex-1">Cripto + Acciones</TabsTrigger>
            </TabsList>
            <TabsList className="inline-flex flex-1">
              <TabsTrigger value="forex-commodities" className="flex-1">Forex + Commodities</TabsTrigger>
            </TabsList>
          </div>

          {/* Crypto + Stocks */}
          <TabsContent value="crypto-stocks">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Crypto Column */}
              <div className="flex flex-col">
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  Criptomonedas
                </h3>
                <div className="overflow-y-auto pr-2 space-y-2" style={{ maxHeight: 'calc(5 * 68px + 4 * 0.5rem)' }}>
                  {sortAssets(filterAssets(cryptoData)).map((asset) => (
                    <AssetItem key={asset.symbol} asset={asset} />
                  ))}
                </div>
              </div>

              {/* Stocks Column */}
              <div className="flex flex-col">
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Acciones
                </h3>
                <div className="overflow-y-auto pr-2 space-y-2" style={{ maxHeight: 'calc(5 * 68px + 4 * 0.5rem)' }}>
                  {sortAssets(filterAssets(MOCK_STOCKS)).map((asset) => (
                    <AssetItem key={asset.symbol} asset={asset} />
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Forex + Commodities */}
          <TabsContent value="forex-commodities">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Forex Column */}
              <div className="flex flex-col">
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  Forex
                </h3>
                <div className="overflow-y-auto pr-2 space-y-2" style={{ maxHeight: 'calc(5 * 68px + 4 * 0.5rem)' }}>
                  {sortAssets(filterAssets(MOCK_FOREX)).map((asset) => (
                    <AssetItem key={asset.symbol} asset={asset} />
                  ))}
                </div>
              </div>

              {/* Commodities Column */}
              <div className="flex flex-col">
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Commodities
                </h3>
                <div className="overflow-y-auto pr-2 space-y-2" style={{ maxHeight: 'calc(5 * 68px + 4 * 0.5rem)' }}>
                  {sortAssets(filterAssets(MOCK_COMMODITIES)).map((asset) => (
                    <AssetItem key={asset.symbol} asset={asset} />
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Tools Section - 50/50 Layout */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
          {/* Scenario Simulator - Left 50% */}
          <ScenarioSimulator
            availableAssets={[
              ...cryptoData,
              ...MOCK_STOCKS,
              ...MOCK_FOREX,
              ...MOCK_COMMODITIES
            ]}
            selectedAsset={null}
          />
          
          {/* Currency Calculator - Right 50% */}
          <CurrencyCalculator />
        </div>
      </div>
    </DashboardLayout>
  );
}
