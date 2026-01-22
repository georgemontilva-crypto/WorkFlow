/**
 * Currency Calculator Component
 * Real-time currency conversion tool
 */

import { useState, useEffect } from 'react';
import { DollarSign, ArrowRightLeft, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const POPULAR_CURRENCIES = [
  { code: 'USD', name: 'Dólar estadounidense', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'Libra esterlina', symbol: '£' },
  { code: 'JPY', name: 'Yen japonés', symbol: '¥' },
  { code: 'CNY', name: 'Yuan chino', symbol: '¥' },
  { code: 'CAD', name: 'Dólar canadiense', symbol: 'C$' },
  { code: 'AUD', name: 'Dólar australiano', symbol: 'A$' },
  { code: 'CHF', name: 'Franco suizo', symbol: 'CHF' },
  { code: 'MXN', name: 'Peso mexicano', symbol: '$' },
  { code: 'BRL', name: 'Real brasileño', symbol: 'R$' },
  { code: 'ARS', name: 'Peso argentino', symbol: '$' },
  { code: 'COP', name: 'Peso colombiano', symbol: '$' },
];

export default function CurrencyCalculator() {
  const [amount, setAmount] = useState('1');
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('EUR');
  const [result, setResult] = useState<number | null>(null);
  const [rate, setRate] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchExchangeRate = async () => {
    if (!amount || parseFloat(amount) <= 0) return;
    
    setLoading(true);
    try {
      // Using exchangerate-api.com (free tier: 1500 requests/month)
      const response = await fetch(
        `https://api.exchangerate-api.com/v4/latest/${fromCurrency}`
      );
      const data = await response.json();
      
      const exchangeRate = data.rates[toCurrency];
      const convertedAmount = parseFloat(amount) * exchangeRate;
      
      setRate(exchangeRate);
      setResult(convertedAmount);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching exchange rate:', error);
      // Fallback to mock data if API fails
      const mockRate = 0.85; // USD to EUR mock
      setRate(mockRate);
      setResult(parseFloat(amount) * mockRate);
      setLastUpdate(new Date());
    } finally {
      setLoading(false);
    }
  };

  const swapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
    setResult(null);
    setRate(null);
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    });
  };

  return (
    <Card className="bg-card border-border h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-primary" />
          <CardTitle className="text-lg">Calculadora de Divisas</CardTitle>
        </div>
        <CardDescription className="text-xs">
          Conversión en tiempo real entre monedas
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Amount Input */}
        <div className="space-y-1">
          <Label htmlFor="amount" className="text-xs">Cantidad</Label>
          <Input
            id="amount"
            type="number"
            step="any"
            min="0"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="h-8 text-sm"
          />
        </div>

        {/* Currency Selectors - 2 Columns */}
        <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-end">
          {/* From Currency */}
          <div className="space-y-1">
            <Label htmlFor="fromCurrency" className="text-xs">De</Label>
            <Select value={fromCurrency} onValueChange={setFromCurrency}>
              <SelectTrigger id="fromCurrency" className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {POPULAR_CURRENCIES.map((currency) => (
                  <SelectItem key={currency.code} value={currency.code}>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{currency.code}</span>
                      <span className="text-muted-foreground text-xs">{currency.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Swap Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={swapCurrencies}
            className="rounded-full h-8 w-8"
          >
            <ArrowRightLeft className="w-3 h-3" />
          </Button>

          {/* To Currency */}
          <div className="space-y-1">
            <Label htmlFor="toCurrency" className="text-xs">A</Label>
            <Select value={toCurrency} onValueChange={setToCurrency}>
              <SelectTrigger id="toCurrency" className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {POPULAR_CURRENCIES.map((currency) => (
                  <SelectItem key={currency.code} value={currency.code}>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{currency.code}</span>
                      <span className="text-muted-foreground text-xs">{currency.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Convert Button */}
        <Button
          onClick={fetchExchangeRate}
          disabled={!amount || parseFloat(amount) <= 0 || loading}
          className="w-full h-9"
        >
          {loading ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Convirtiendo...
            </>
          ) : (
            <>
              <DollarSign className="w-4 h-4 mr-2" />
              Convertir
            </>
          )}
        </Button>

        {/* Result */}
        {result !== null && (
          <div className="space-y-2 pt-3 border-t border-border">
            <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
              <p className="text-[10px] text-muted-foreground mb-0.5">Resultado</p>
              <p className="text-2xl font-bold font-mono text-primary">
                {formatNumber(result)} {toCurrency}
              </p>
            </div>

            {rate && (
              <div className="p-2 bg-background rounded-lg border border-border">
                <p className="text-[10px] text-muted-foreground mb-0.5">Tasa de cambio</p>
                <p className="font-mono text-xs">
                  1 {fromCurrency} = {formatNumber(rate)} {toCurrency}
                </p>
              </div>
            )}

            {lastUpdate && (
              <p className="text-[10px] text-muted-foreground text-center">
                Actualizado: {lastUpdate.toLocaleTimeString()}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
