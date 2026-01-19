/**
 * Markets Page - Financial markets with crypto, stocks, forex
 * Design Philosophy: Apple Minimalism - Real-time data, clean UI
 */

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Star, Search, BarChart3, Eye, Sparkles } from 'lucide-react';
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

  const favoriteCount = favorites?.length || 0;

  const AssetCard = ({ asset }: { asset: MarketAsset }) => {
    const isPositive = asset.change24h >= 0;
    const favorite = isFavorite(asset.symbol);
    const widget = isWidget(asset.symbol);

    return (
      <Card className={`border-2 transition-all hover:shadow-lg ${
        favorite 
          ? 'bg-gradient-to-br from-primary/5 to-primary/10 border-primary/30 hover:border-primary/50' 
          : 'hover:border-primary/30'
      }`}>
        <CardContent className="p-4 sm:p-6">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h3 className="font-bold text-base sm:text-lg truncate">{asset.name}</h3>
                  {widget && (
                    <Badge variant="default" className="text-xs shrink-0">
                      <Eye className="w-3 h-3 mr-1" />
                      Dashboard
                    </Badge>
                  )}
                  {favorite && (
                    <Badge variant="outline" className="text-xs shrink-0 border-primary/50">
                      <Sparkles className="w-3 h-3 mr-1" />
                      Favorito
                    </Badge>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground font-mono">{asset.symbol}</p>
              </div>
              <Button
                variant={favorite ? 'default' : 'outline'}
                size="icon"
                className="shrink-0"
                onClick={() => handleToggleFavorite(asset)}
              >
                <Star className={`w-4 h-4 ${favorite ? 'fill-current' : ''}`} />
              </Button>
            </div>

            {/* Price */}
            <div>
              <div className="text-2xl sm:text-3xl font-bold mb-1 font-mono">{formatPrice(asset.price)}</div>
              <div className={`flex items-center gap-1 text-sm font-medium ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                {isPositive ? '+' : ''}{asset.change24h.toFixed(2)}% (24h)
              </div>
            </div>

            {/* Stats */}
            {asset.marketCap && (
              <div className="grid grid-cols-2 gap-3 pt-3 border-t">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Cap. Mercado</p>
                  <p className="text-sm font-semibold font-mono">{formatMarketCap(asset.marketCap)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Volumen 24h</p>
                  <p className="text-sm font-semibold font-mono">{formatMarketCap(asset.volume24h || 0)}</p>
                </div>
              </div>
            )}

            {/* Actions */}
            {favorite && !widget && (
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-2"
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
      <div className="flex items-center justify-center h-full min-h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground text-lg">Cargando mercados financieros...</p>
          <p className="text-sm text-muted-foreground mt-2">Obteniendo datos en tiempo real</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-7xl">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-gradient-to-br from-primary/10 to-primary/20 rounded-xl">
              <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold truncate">Mercados Financieros</h1>
              <p className="text-sm sm:text-base text-muted-foreground mt-1">
                Criptomonedas en tiempo real • Actualización automática
              </p>
            </div>
          </div>
          
          {/* Stats Badge */}
          {favoriteCount > 0 && (
            <div className="flex items-center gap-2 mt-4">
              <Badge variant="outline" className="text-sm">
                <Star className="w-3 h-3 mr-1 fill-current" />
                {favoriteCount} {favoriteCount === 1 ? 'favorito' : 'favoritos'}
              </Badge>
              {dashboardWidget && (
                <Badge variant="default" className="text-sm">
                  <Eye className="w-3 h-3 mr-1" />
                  Widget activo
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Search */}
        <Card className="mb-6 border-2">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o símbolo (ej: Bitcoin, BTC)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11 text-base"
              />
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="crypto" className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 mb-6 h-auto">
            <TabsTrigger value="crypto" className="text-sm sm:text-base py-2">
              <BarChart3 className="w-4 h-4 mr-2" />
              Cripto
            </TabsTrigger>
            <TabsTrigger value="stocks" disabled className="text-sm sm:text-base py-2">
              Acciones
            </TabsTrigger>
            <TabsTrigger value="forex" disabled className="text-sm sm:text-base py-2">
              Forex
            </TabsTrigger>
            <TabsTrigger value="commodities" disabled className="text-sm sm:text-base py-2">
              Commodities
            </TabsTrigger>
          </TabsList>

          <TabsContent value="crypto">
            {sortedCrypto.length === 0 ? (
              <Card className="border-2">
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
              <>
                {/* Results count */}
                <div className="mb-4 text-sm text-muted-foreground">
                  Mostrando {sortedCrypto.length} {sortedCrypto.length === 1 ? 'criptomoneda' : 'criptomonedas'}
                  {favoriteCount > 0 && ' • Favoritos primero'}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                  {sortedCrypto.map((asset) => (
                    <AssetCard key={asset.symbol} asset={asset} />
                  ))}
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="stocks">
            <Card className="border-2">
              <CardContent className="py-16 text-center">
                <BarChart3 className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium text-muted-foreground mb-2">
                  Próximamente: Acciones
                </p>
                <p className="text-sm text-muted-foreground">
                  NYSE, NASDAQ, S&P 500 y más
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
