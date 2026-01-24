import { trpc } from '@/lib/trpc';
import { formatCurrency, getCurrencySymbol, DEFAULT_CURRENCY } from '@shared/currencies';

/**
 * Hook to access user's primary currency and formatting utilities
 */
export function useCurrency() {
  const { data: user } = trpc.auth.me.useQuery();
  
  const primaryCurrency = user?.primary_currency || DEFAULT_CURRENCY;
  const currencySymbol = getCurrencySymbol(primaryCurrency);

  /**
   * Format amount with user's primary currency
   */
  const format = (amount: number): string => {
    return formatCurrency(amount, primaryCurrency);
  };

  /**
   * Format amount with specific currency
   */
  const formatWith = (amount: number, currencyCode: string): string => {
    return formatCurrency(amount, currencyCode);
  };

  return {
    primaryCurrency,
    currencySymbol,
    format,
    formatWith,
  };
}
