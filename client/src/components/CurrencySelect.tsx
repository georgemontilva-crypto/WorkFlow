/**
 * CurrencySelect Component
 * Reusable currency selector for forms - uses comprehensive currency catalog
 */

import CurrencySelector from './CurrencySelector';

interface CurrencySelectProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  error?: string;
}

export function CurrencySelect({ 
  value, 
  onChange, 
  label = 'Moneda',
  required = false,
  disabled = false,
  placeholder,
  error
}: CurrencySelectProps) {
  return (
    <CurrencySelector
      selectedCurrency={value}
      onSelect={onChange}
      label={label}
      required={required}
      placeholder={placeholder}
      error={error}
    />
  );
}
