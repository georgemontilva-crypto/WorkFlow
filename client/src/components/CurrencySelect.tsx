/**
 * CurrencySelect Component
 * Reusable currency selector for forms
 */

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Currency, CURRENCY_NAMES, getAvailableCurrencies } from '@/lib/currency';

interface CurrencySelectProps {
  value: Currency;
  onChange: (value: Currency) => void;
  label?: string;
  required?: boolean;
  disabled?: boolean;
}

export function CurrencySelect({ 
  value, 
  onChange, 
  label = 'Moneda',
  required = false,
  disabled = false 
}: CurrencySelectProps) {
  const currencies = getAvailableCurrencies();

  return (
    <div className="space-y-2">
      {label && (
        <Label>
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}
      <Select 
        value={value} 
        onValueChange={(val) => onChange(val as Currency)}
        disabled={disabled}
      >
        <SelectTrigger>
          <SelectValue placeholder="Selecciona moneda" />
        </SelectTrigger>
        <SelectContent>
          {currencies.map((currency) => (
            <SelectItem key={currency} value={currency}>
              {CURRENCY_NAMES[currency]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
