/**
 * Markets Page - Financial markets with crypto, stocks, forex
 * Design Philosophy: Apple Minimalism - Real-time data, clean UI
 */

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Star, Search, BarChart3, Eye } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

interface MarketAsset {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  marketCap?: number;
  volume24h?: number;
  type: 'crypto' | 'stock' | 'forex' | 'commodity';
}

export default function Markets() {
  const [searchQuery, setSearchQuery] = useState('');
  const [cryptoData, setCryptoData] = useState<MarketAsset[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch favorites
  const { data: favorites, refetch: refetchFavorites } = trpc.markets.getFavorites.useQuery();
  const { data: dashboardWidget } = trpc.markets.getDashboardWidget.useQuery();

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

  const setWidgetMutation = trpc.markets.setDashboardWidget.useMutation({
    onSuccess: () => {
      refetchFavorites();
      toast.success('Widget configurado en Dashboard');
    },
  });

  // Fetch crypto data from CoinGecko API
  useEffect(() => {
    const fetchCryptoData = async () => {
      try {
        const response = await fetch(
          'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=false'
        );
        const data = await response.json();
        
        const formatted: MarketAsset[] = data.map((coin: any) => ({
          symbol: coin.symbol.toUpperCase(),
          name: coin.name,
          price: coin.current_price,
          change24h: coin.price_change_percentage_24h,
          marketCap: coin.market_cap,
          volume24h: coin.total_volume,
          type: 'crypto' as const,
        }));
        
        setCryptoData(formatted);
      } catch (error) {
        console.error('Error fetching crypto data:', error);
        toast.error('Error al cargar datos de criptomonedas');
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
    return dashboardWidget?.symbol === symbol;
  };

  const handleToggleFavorite = (asset: MarketAsset) => {
    if (isFavorite(asset.symbol)) {
      removeFavoriteMutation.mutate({ symbol: asset.symbol });
    } else {
      addFavoriteMutation.mutate({ symbol: asset.symbol, type: asset.type });
    }
  };

  const handleSetWidget = (symbol: string) => {
    setWidgetMutation.mutate({ symbol });
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

  const filteredCrypto = cryptoData.filter(asset =>
    asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    asset.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sort: favorites first, then by market cap
  const sortedCrypto = [...filteredCrypto].sort((a, b) => {
    const aIsFav = isFavorite(a.symbol);
    const bIsFav = isFavorite(b.symbol);
    if (aIsFav && !bIsFav) return -1;
    if (!aIsFav && bIsFav) return 1;
    return (b.marketCap || 0) - (a.marketCap || 0);
  });

  const AssetCard = ({ asset }: { asset: MarketAsset }) => {
    const isPositive = asset.change24h >= 0;
    const favorite = isFavorite(asset.symbol);
    const widget = isWidget(asset.symbol);

    return (
      <Card className={`border-2 hover:border-primary/50 transition-all ${favorite ? 'bg-primary/5' : ''}`}>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-lg truncate">{asset.name}</h3>
                  {widget && (
                    <Badge variant="default" className="text-xs">
                      <Eye className="w-3 h-3 mr-1" />
                      Dashboard
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{asset.symbol}</p>
              </div>
              <Button
                variant={favorite ? 'default' : 'outline'}
                size="icon"
                onClick={() => handleToggleFavorite(asset)}
              >
                <Star className={`w-4 h-4 ${favorite ? 'fill-current' : ''}`} />
              </Button>
            </div>

            {/* Price */}
            <div>
              <div className="text-3xl font-bold mb-1">{formatPrice(asset.price)}</div>
              <div className={`flex items-center gap-1 text-sm font-medium ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                {isPositive ? '+' : ''}{asset.change24h.toFixed(2)}%
              </div>
            </div>

            {/* Stats */}
            {asset.marketCap && (
              <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                <div>
                  <p className="text-xs text-muted-foreground">Cap. Mercado</p>
                  <p className="text-sm font-semibold">{formatMarketCap(asset.marketCap)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Volumen 24h</p>
                  <p className="text-sm font-semibold">{formatMarketCap(asset.volume24h || 0)}</p>
                </div>
              </div>
            )}

            {/* Actions */}
            {favorite && !widget && (
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => handleSetWidget(asset.symbol)}
              >
                <Eye className="w-4 h-4 mr-2" />
                Mostrar en Dashboard
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground text-lg">Cargando mercados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-primary/10 rounded-xl">
              <BarChart3 className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold">Mercados Financieros</h1>
              <p className="text-muted-foreground mt-1">
                Criptomonedas, acciones y más en tiempo real
              </p>
            </div>
          </div>
        </div>

        {/* Search */}
        <Card className="mb-6 border-2">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o símbolo..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11"
              />
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="crypto" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="crypto">Cripto</TabsTrigger>
            <TabsTrigger value="stocks" disabled>Acciones</TabsTrigger>
            <TabsTrigger value="forex" disabled>Forex</TabsTrigger>
            <TabsTrigger value="commodities" disabled>Commodities</TabsTrigger>
          </TabsList>

          <TabsContent value="crypto">
            {sortedCrypto.length === 0 ? (
              <Card>
                <CardContent className="py-16 text-center">
                  <Search className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium text-muted-foreground mb-2">
                    No se encontraron resultados
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Intenta con otro término de búsqueda
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sortedCrypto.map((asset) => (
                  <AssetCard key={asset.symbol} asset={asset} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="stocks">
            <Card>
              <CardContent className="py-16 text-center">
                <BarChart3 className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium text-muted-foreground">
                  Próximamente: Acciones
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
