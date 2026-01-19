/**
 * Currency utilities for formatting and displaying monetary values
 */

export type Currency = 'USD' | 'COP' | 'EUR';

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  USD: '$',
  COP: '$',
  EUR: '€',
};

export const CURRENCY_NAMES: Record<Currency, string> = {
  USD: 'Dólar (USD)',
  COP: 'Peso Colombiano (COP)',
  EUR: 'Euro (EUR)',
};

export const CURRENCY_DECIMALS: Record<Currency, number> = {
  USD: 2,
  COP: 0, // Colombian peso doesn't use decimals
  EUR: 2,
};

/**
 * Format amount with currency symbol and proper decimals
 */
export function formatCurrency(amount: number | string, currency: Currency = 'USD'): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  const decimals = CURRENCY_DECIMALS[currency];
  const symbol = CURRENCY_SYMBOLS[currency];
  
  const formatted = numAmount.toLocaleString('es-ES', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  
  // For EUR, symbol goes after the amount
  if (currency === 'EUR') {
    return `${formatted}${symbol}`;
  }
  
  // For USD and COP, symbol goes before
  return `${symbol}${formatted}`;
}

/**
 * Get currency symbol
 */
export function getCurrencySymbol(currency: Currency = 'USD'): string {
  return CURRENCY_SYMBOLS[currency];
}

/**
 * Get currency name
 */
export function getCurrencyName(currency: Currency = 'USD'): string {
  return CURRENCY_NAMES[currency];
}

/**
 * Get all available currencies
 */
export function getAvailableCurrencies(): Currency[] {
  return ['USD', 'COP', 'EUR'];
}
