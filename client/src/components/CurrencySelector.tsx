import { useState } from 'react';
import { Search, ChevronDown, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CURRENCIES, getCurrency } from '@shared/currencies';

interface CurrencySelectorProps {
  selectedCurrency: string;
  onSelect: (code: string) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  error?: string;
}

export default function CurrencySelector({ 
  selectedCurrency, 
  onSelect, 
  placeholder = "Seleccionar moneda",
  label,
  required = false,
  error
}: CurrencySelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCurrencies = CURRENCIES.filter(currency =>
    currency.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    currency.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (code: string) => {
    onSelect(code);
    setOpen(false);
    setSearchQuery('');
  };

  const selected = getCurrency(selectedCurrency);

  return (
    <div className="space-y-2">
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-[#EBFF57]">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Input Field */}
      <div className="relative">
        <Input
          readOnly
          value={selected ? `${selected.code} - ${selected.name}` : ''}
          placeholder={placeholder}
          onClick={() => setOpen(true)}
          className={`cursor-pointer pr-10 h-10 bg-[#0a0a0a] border ${
            error ? 'border-red-500' : 'border-white/10'
          } text-white hover:border-[#EBFF57]/50 transition-colors`}
        />
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
      </div>

      {/* Error Message */}
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}

      {/* Popup Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md max-h-[600px] flex flex-col p-0 bg-[#0a0a0a] border-white/10">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-white/10">
            <DialogTitle className="text-[#EBFF57]">Seleccionar Moneda</DialogTitle>
          </DialogHeader>

          {/* Search Field */}
          <div className="px-6 py-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <Input
                placeholder="Buscar por código o nombre..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10 bg-black/50 border-white/10 text-white placeholder-white/40"
                autoFocus
              />
            </div>
          </div>

          {/* Currency List - Scrollable */}
          <div className="flex-1 overflow-y-auto px-6 pb-6">
            {filteredCurrencies.length === 0 ? (
              <p className="text-sm text-white/40 text-center py-8">
                No se encontraron monedas
              </p>
            ) : (
              <div className="space-y-1">
                {filteredCurrencies.map((currency) => (
                  <Button
                    key={currency.code}
                    variant="ghost"
                    className={`w-full justify-between h-auto py-3 px-4 hover:bg-white/5 ${
                      selectedCurrency === currency.code ? 'bg-[#EBFF57]/10' : ''
                    }`}
                    onClick={() => handleSelect(currency.code)}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`font-mono font-semibold ${
                        selectedCurrency === currency.code ? 'text-[#EBFF57]' : 'text-white'
                      }`}>
                        {currency.code}
                      </span>
                      <span className="text-white/60">–</span>
                      <span className="text-white">{currency.name}</span>
                    </div>
                    {selectedCurrency === currency.code && (
                      <Check className="w-5 h-5 text-[#EBFF57]" />
                    )}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
