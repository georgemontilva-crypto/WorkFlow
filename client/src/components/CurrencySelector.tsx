import { useState } from 'react';
import { Search, ChevronDown } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface Currency {
  code: string;
  name: string;
  symbol: string;
}

interface CurrencySelectorProps {
  currencies: Currency[];
  selectedCurrency: string;
  onSelect: (code: string) => void;
  placeholder?: string;
}

export default function CurrencySelector({ currencies, selectedCurrency, onSelect, placeholder = "Seleccionar moneda" }: CurrencySelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCurrencies = currencies.filter(currency =>
    currency.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    currency.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (code: string) => {
    onSelect(code);
    setOpen(false);
    setSearchQuery('');
  };

  const selected = currencies.find(c => c.code === selectedCurrency);

  return (
    <>
      {/* Input Field */}
      <div className="relative">
        <Input
          readOnly
          value={selected ? `${selected.code} - ${selected.name}` : ''}
          placeholder={placeholder}
          onClick={() => setOpen(true)}
          className="cursor-pointer pr-10 h-8 text-sm"
        />
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
      </div>

      {/* Popup Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md max-h-[500px] flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-4">
            <DialogTitle>Seleccionar Moneda</DialogTitle>
          </DialogHeader>

          {/* Search Field */}
          <div className="px-6 pb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por código o nombre..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-9"
                autoFocus
              />
            </div>
          </div>

          {/* Currency List - Scrollable */}
          <div className="flex-1 overflow-y-auto px-6 pb-6">
            {filteredCurrencies.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No se encontraron monedas
              </p>
            ) : (
              <div className="space-y-1">
                {filteredCurrencies.map((currency) => (
                  <Button
                    key={currency.code}
                    variant="ghost"
                    className="w-full justify-start h-auto py-2 px-3"
                    onClick={() => handleSelect(currency.code)}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex flex-col items-start">
                        <span className="font-semibold text-sm">{currency.code}</span>
                        <span className="text-xs text-muted-foreground">{currency.name}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">{currency.symbol}</span>
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
