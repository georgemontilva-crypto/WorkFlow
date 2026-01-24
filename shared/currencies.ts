/**
 * Currency Catalog
 * 
 * Comprehensive list of supported currencies for Finwrk platform.
 * Used for primary currency selection and savings goals.
 */

export interface Currency {
  code: string;
  name: string;
  symbol: string;
  locale: string; // For number formatting
}

export const CURRENCIES: Currency[] = [
  // Americas
  { code: 'USD', name: 'Dólar estadounidense', symbol: '$', locale: 'en-US' },
  { code: 'CAD', name: 'Dólar canadiense', symbol: 'C$', locale: 'en-CA' },
  { code: 'MXN', name: 'Peso mexicano', symbol: '$', locale: 'es-MX' },
  { code: 'COP', name: 'Peso colombiano', symbol: '$', locale: 'es-CO' },
  { code: 'ARS', name: 'Peso argentino', symbol: '$', locale: 'es-AR' },
  { code: 'CLP', name: 'Peso chileno', symbol: '$', locale: 'es-CL' },
  { code: 'BRL', name: 'Real brasileño', symbol: 'R$', locale: 'pt-BR' },
  { code: 'PEN', name: 'Sol peruano', symbol: 'S/', locale: 'es-PE' },
  { code: 'UYU', name: 'Peso uruguayo', symbol: '$U', locale: 'es-UY' },
  { code: 'BOB', name: 'Boliviano', symbol: 'Bs.', locale: 'es-BO' },
  { code: 'PYG', name: 'Guaraní paraguayo', symbol: '₲', locale: 'es-PY' },
  { code: 'VES', name: 'Bolívar venezolano', symbol: 'Bs.', locale: 'es-VE' },
  
  // Europe
  { code: 'EUR', name: 'Euro', symbol: '€', locale: 'de-DE' },
  { code: 'GBP', name: 'Libra esterlina', symbol: '£', locale: 'en-GB' },
  { code: 'CHF', name: 'Franco suizo', symbol: 'CHF', locale: 'de-CH' },
  { code: 'SEK', name: 'Corona sueca', symbol: 'kr', locale: 'sv-SE' },
  { code: 'NOK', name: 'Corona noruega', symbol: 'kr', locale: 'nb-NO' },
  { code: 'DKK', name: 'Corona danesa', symbol: 'kr', locale: 'da-DK' },
  { code: 'PLN', name: 'Zloty polaco', symbol: 'zł', locale: 'pl-PL' },
  { code: 'CZK', name: 'Corona checa', symbol: 'Kč', locale: 'cs-CZ' },
  { code: 'HUF', name: 'Florín húngaro', symbol: 'Ft', locale: 'hu-HU' },
  { code: 'RON', name: 'Leu rumano', symbol: 'lei', locale: 'ro-RO' },
  { code: 'BGN', name: 'Lev búlgaro', symbol: 'лв', locale: 'bg-BG' },
  { code: 'HRK', name: 'Kuna croata', symbol: 'kn', locale: 'hr-HR' },
  { code: 'RUB', name: 'Rublo ruso', symbol: '₽', locale: 'ru-RU' },
  { code: 'UAH', name: 'Grivna ucraniana', symbol: '₴', locale: 'uk-UA' },
  { code: 'TRY', name: 'Lira turca', symbol: '₺', locale: 'tr-TR' },
  
  // Asia-Pacific
  { code: 'JPY', name: 'Yen japonés', symbol: '¥', locale: 'ja-JP' },
  { code: 'CNY', name: 'Yuan chino', symbol: '¥', locale: 'zh-CN' },
  { code: 'KRW', name: 'Won surcoreano', symbol: '₩', locale: 'ko-KR' },
  { code: 'INR', name: 'Rupia india', symbol: '₹', locale: 'en-IN' },
  { code: 'AUD', name: 'Dólar australiano', symbol: 'A$', locale: 'en-AU' },
  { code: 'NZD', name: 'Dólar neozelandés', symbol: 'NZ$', locale: 'en-NZ' },
  { code: 'SGD', name: 'Dólar singapurense', symbol: 'S$', locale: 'en-SG' },
  { code: 'HKD', name: 'Dólar hongkonés', symbol: 'HK$', locale: 'zh-HK' },
  { code: 'TWD', name: 'Dólar taiwanés', symbol: 'NT$', locale: 'zh-TW' },
  { code: 'THB', name: 'Baht tailandés', symbol: '฿', locale: 'th-TH' },
  { code: 'MYR', name: 'Ringgit malayo', symbol: 'RM', locale: 'ms-MY' },
  { code: 'IDR', name: 'Rupia indonesia', symbol: 'Rp', locale: 'id-ID' },
  { code: 'PHP', name: 'Peso filipino', symbol: '₱', locale: 'fil-PH' },
  { code: 'VND', name: 'Dong vietnamita', symbol: '₫', locale: 'vi-VN' },
  { code: 'PKR', name: 'Rupia pakistaní', symbol: '₨', locale: 'ur-PK' },
  { code: 'BDT', name: 'Taka bangladesí', symbol: '৳', locale: 'bn-BD' },
  { code: 'LKR', name: 'Rupia de Sri Lanka', symbol: 'Rs', locale: 'si-LK' },
  
  // Middle East & Africa
  { code: 'AED', name: 'Dirham de EAU', symbol: 'د.إ', locale: 'ar-AE' },
  { code: 'SAR', name: 'Riyal saudí', symbol: '﷼', locale: 'ar-SA' },
  { code: 'QAR', name: 'Riyal qatarí', symbol: 'ر.ق', locale: 'ar-QA' },
  { code: 'KWD', name: 'Dinar kuwaití', symbol: 'د.ك', locale: 'ar-KW' },
  { code: 'BHD', name: 'Dinar bahreiní', symbol: 'د.ب', locale: 'ar-BH' },
  { code: 'OMR', name: 'Rial omaní', symbol: 'ر.ع.', locale: 'ar-OM' },
  { code: 'ILS', name: 'Nuevo séquel israelí', symbol: '₪', locale: 'he-IL' },
  { code: 'EGP', name: 'Libra egipcia', symbol: 'E£', locale: 'ar-EG' },
  { code: 'ZAR', name: 'Rand sudafricano', symbol: 'R', locale: 'en-ZA' },
  { code: 'NGN', name: 'Naira nigeriana', symbol: '₦', locale: 'en-NG' },
  { code: 'KES', name: 'Chelín keniano', symbol: 'KSh', locale: 'sw-KE' },
  { code: 'GHS', name: 'Cedi ghanés', symbol: 'GH₵', locale: 'en-GH' },
  { code: 'MAD', name: 'Dirham marroquí', symbol: 'د.م.', locale: 'ar-MA' },
  { code: 'TND', name: 'Dinar tunecino', symbol: 'د.ت', locale: 'ar-TN' },
];

/**
 * Get currency by code
 */
export function getCurrency(code: string): Currency | undefined {
  return CURRENCIES.find(c => c.code === code);
}

/**
 * Get currency symbol
 */
export function getCurrencySymbol(code: string): string {
  const currency = getCurrency(code);
  return currency?.symbol || code;
}

/**
 * Format amount with currency
 */
export function formatCurrency(amount: number, currencyCode: string): string {
  const currency = getCurrency(currencyCode);
  
  if (!currency) {
    return `${currencyCode} ${amount.toFixed(2)}`;
  }
  
  try {
    return new Intl.NumberFormat(currency.locale, {
      style: 'currency',
      currency: currency.code,
    }).format(amount);
  } catch (error) {
    // Fallback if Intl fails
    return `${currency.symbol}${amount.toFixed(2)}`;
  }
}

/**
 * Get currency codes for select options
 */
export function getCurrencyOptions(): Array<{ value: string; label: string }> {
  return CURRENCIES.map(c => ({
    value: c.code,
    label: `${c.code} – ${c.name}`,
  }));
}

/**
 * Default currency
 */
export const DEFAULT_CURRENCY = 'USD';
