import { useState } from 'react';
import { Search, ChevronDown } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface Asset {
  symbol: string;
  name: string;
  price: number;
  type: string;
}

interface AssetSelectorProps {
  assets: Asset[];
  selectedAsset: Asset | null;
  onSelect: (asset: Asset) => void;
  placeholder?: string;
}

export default function AssetSelector({ assets, selectedAsset, onSelect, placeholder = "Seleccionar activo" }: AssetSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredAssets = assets.filter(asset =>
    asset.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    asset.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (asset: Asset) => {
    onSelect(asset);
    setOpen(false);
    setSearchQuery('');
  };

  return (
    <>
      {/* Input Field */}
      <div className="relative">
        <Input
          readOnly
          value={selectedAsset ? `${selectedAsset.symbol} - ${selectedAsset.name}` : ''}
          placeholder={placeholder}
          onClick={() => setOpen(true)}
          className="cursor-pointer pr-10 h-9"
        />
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
      </div>

      {/* Popup Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md max-h-[500px] flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-4">
            <DialogTitle>Seleccionar Activo</DialogTitle>
          </DialogHeader>

          {/* Search Field */}
          <div className="px-6 pb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por símbolo o nombre..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-9"
                autoFocus
              />
            </div>
          </div>

          {/* Asset List - Scrollable */}
          <div className="flex-1 overflow-y-auto px-6 pb-6">
            {filteredAssets.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No se encontraron activos
              </p>
            ) : (
              <div className="space-y-1">
                {filteredAssets.map((asset) => (
                  <Button
                    key={asset.symbol}
                    variant="ghost"
                    className="w-full justify-start h-auto py-2 px-3"
                    onClick={() => handleSelect(asset)}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex flex-col items-start">
                        <span className="font-semibold text-sm">{asset.symbol}</span>
                        <span className="text-xs text-muted-foreground">{asset.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-mono text-sm">${asset.price.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 6 })}</span>
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
