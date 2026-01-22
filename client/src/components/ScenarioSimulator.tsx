/**
 * Scenario Simulator Component
 * Allows users to simulate hypothetical profit/loss scenarios for financial assets
 */

import { useState, useEffect } from 'react';
import { Calculator, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Asset {
  symbol: string;
  name: string;
  price: number;
  type: string;
}

interface ScenarioSimulatorProps {
  availableAssets: Asset[];
  selectedAsset?: Asset | null;
}

interface SimulationResult {
  initialInvestment: number;
  finalValue: number;
  profitLoss: number;
  roi: number;
}

export default function ScenarioSimulator({ availableAssets, selectedAsset }: ScenarioSimulatorProps) {
  // Form state
  const [asset, setAsset] = useState<Asset | null>(selectedAsset || null);
  const [quantity, setQuantity] = useState('');
  const [buyPrice, setBuyPrice] = useState('');
  const [targetPrice, setTargetPrice] = useState('');
  const [commissionPercent, setCommissionPercent] = useState('');
  const [commissionFixed, setCommissionFixed] = useState('');

  // Result state
  const [result, setResult] = useState<SimulationResult | null>(null);

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Update asset when selectedAsset prop changes
  useEffect(() => {
    if (selectedAsset) {
      setAsset(selectedAsset);
      setBuyPrice(selectedAsset.price.toString());
    }
  }, [selectedAsset]);

  // Update buy price when asset changes
  useEffect(() => {
    if (asset && !buyPrice) {
      setBuyPrice(asset.price.toString());
    }
  }, [asset]);

  const validateFields = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!asset) {
      newErrors.asset = 'Debes seleccionar un activo';
    }

    if (!quantity || parseFloat(quantity) <= 0) {
      newErrors.quantity = 'La cantidad debe ser mayor a 0';
    }

    if (!buyPrice || parseFloat(buyPrice) <= 0) {
      newErrors.buyPrice = 'El precio de compra debe ser mayor a 0';
    }

    if (!targetPrice || parseFloat(targetPrice) <= 0) {
      newErrors.targetPrice = 'El precio objetivo debe ser mayor a 0';
    }

    if (commissionPercent && (parseFloat(commissionPercent) < 0 || parseFloat(commissionPercent) > 100)) {
      newErrors.commissionPercent = 'La comisión debe estar entre 0 y 100%';
    }

    if (commissionFixed && parseFloat(commissionFixed) < 0) {
      newErrors.commissionFixed = 'La comisión fija no puede ser negativa';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateScenario = () => {
    if (!validateFields()) return;

    const qty = parseFloat(quantity);
    const buy = parseFloat(buyPrice);
    const target = parseFloat(targetPrice);
    const commPct = commissionPercent ? parseFloat(commissionPercent) / 100 : 0;
    const commFix = commissionFixed ? parseFloat(commissionFixed) : 0;

    // Calculate initial investment
    const initialInvestment = qty * buy;

    // Calculate final value
    const finalValue = qty * target;

    // Calculate commissions
    const totalCommission = (initialInvestment * commPct) + (finalValue * commPct) + commFix;

    // Calculate profit/loss
    const profitLoss = finalValue - initialInvestment - totalCommission;

    // Calculate ROI
    const roi = (profitLoss / initialInvestment) * 100;

    setResult({
      initialInvestment,
      finalValue,
      profitLoss,
      roi
    });
  };

  const resetForm = () => {
    setQuantity('');
    setBuyPrice(asset?.price.toString() || '');
    setTargetPrice('');
    setCommissionPercent('');
    setCommissionFixed('');
    setResult(null);
    setErrors({});
  };

  const isFormValid = asset && quantity && buyPrice && targetPrice;

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Calculator className="w-5 h-5 text-primary" />
          </div>
          <div>
            <CardTitle>Simulador de Escenario</CardTitle>
            <CardDescription>
              Calcula posibles ganancias o pérdidas en un escenario hipotético.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Asset Selection */}
        <div className="space-y-2">
          <Label htmlFor="asset">Activo *</Label>
          <Select
            value={asset?.symbol || ''}
            onValueChange={(symbol) => {
              const selected = availableAssets.find(a => a.symbol === symbol);
              if (selected) {
                setAsset(selected);
                setBuyPrice(selected.price.toString());
              }
            }}
          >
            <SelectTrigger id="asset" className={errors.asset ? 'border-red-500' : ''}>
              <SelectValue placeholder="Selecciona un activo" />
            </SelectTrigger>
            <SelectContent>
              {availableAssets.map((a) => (
                <SelectItem key={a.symbol} value={a.symbol}>
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{a.symbol}</span>
                    <span className="text-muted-foreground text-sm">{a.name}</span>
                    <span className="ml-auto font-mono text-xs">${a.price.toLocaleString()}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.asset && <p className="text-xs text-red-500">{errors.asset}</p>}
          
          {asset && (
            <div className="flex items-center gap-2 p-3 bg-background rounded-lg border border-border">
              <div className="flex-1">
                <p className="font-semibold">{asset.name}</p>
                <p className="text-xs text-muted-foreground">{asset.symbol}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Precio actual</p>
                <p className="font-mono font-semibold">${asset.price.toLocaleString()}</p>
              </div>
            </div>
          )}
        </div>

        {/* Input Fields Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Quantity */}
          <div className="space-y-2">
            <Label htmlFor="quantity">Cantidad *</Label>
            <Input
              id="quantity"
              type="number"
              step="any"
              min="0"
              placeholder="0.00"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className={errors.quantity ? 'border-red-500' : ''}
            />
            {errors.quantity && <p className="text-xs text-red-500">{errors.quantity}</p>}
          </div>

          {/* Buy Price */}
          <div className="space-y-2">
            <Label htmlFor="buyPrice">Precio de Compra *</Label>
            <Input
              id="buyPrice"
              type="number"
              step="any"
              min="0"
              placeholder="0.00"
              value={buyPrice}
              onChange={(e) => setBuyPrice(e.target.value)}
              className={errors.buyPrice ? 'border-red-500' : ''}
            />
            {errors.buyPrice && <p className="text-xs text-red-500">{errors.buyPrice}</p>}
          </div>

          {/* Target Price */}
          <div className="space-y-2">
            <Label htmlFor="targetPrice">Precio Objetivo *</Label>
            <Input
              id="targetPrice"
              type="number"
              step="any"
              min="0"
              placeholder="0.00"
              value={targetPrice}
              onChange={(e) => setTargetPrice(e.target.value)}
              className={errors.targetPrice ? 'border-red-500' : ''}
            />
            {errors.targetPrice && <p className="text-xs text-red-500">{errors.targetPrice}</p>}
          </div>

          {/* Commission Percent */}
          <div className="space-y-2">
            <Label htmlFor="commissionPercent">Comisión (%)</Label>
            <Input
              id="commissionPercent"
              type="number"
              step="0.01"
              min="0"
              max="100"
              placeholder="0.00"
              value={commissionPercent}
              onChange={(e) => setCommissionPercent(e.target.value)}
              className={errors.commissionPercent ? 'border-red-500' : ''}
            />
            {errors.commissionPercent && <p className="text-xs text-red-500">{errors.commissionPercent}</p>}
          </div>

          {/* Commission Fixed */}
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="commissionFixed">Comisión Fija</Label>
            <Input
              id="commissionFixed"
              type="number"
              step="any"
              min="0"
              placeholder="0.00"
              value={commissionFixed}
              onChange={(e) => setCommissionFixed(e.target.value)}
              className={errors.commissionFixed ? 'border-red-500' : ''}
            />
            {errors.commissionFixed && <p className="text-xs text-red-500">{errors.commissionFixed}</p>}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={calculateScenario}
            disabled={!isFormValid}
            className="flex-1"
          >
            <Calculator className="w-4 h-4 mr-2" />
            Calcular
          </Button>
          <Button
            variant="outline"
            onClick={resetForm}
          >
            Limpiar
          </Button>
        </div>

        {/* Results */}
        {result && (
          <div className="space-y-4 pt-4 border-t border-border">
            <h3 className="font-semibold text-lg">Resultados</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Initial Investment */}
              <div className="p-4 bg-background rounded-lg border border-border">
                <p className="text-sm text-muted-foreground mb-1">Inversión Inicial</p>
                <p className="text-2xl font-bold font-mono">
                  ${result.initialInvestment.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>

              {/* Final Value */}
              <div className="p-4 bg-background rounded-lg border border-border">
                <p className="text-sm text-muted-foreground mb-1">Valor Final</p>
                <p className="text-2xl font-bold font-mono">
                  ${result.finalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>

              {/* Profit/Loss */}
              <div className={`p-4 rounded-lg border ${result.profitLoss >= 0 ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                <div className="flex items-center gap-2 mb-1">
                  {result.profitLoss >= 0 ? (
                    <TrendingUp className="w-4 h-4 text-green-500" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-500" />
                  )}
                  <p className="text-sm text-muted-foreground">
                    {result.profitLoss >= 0 ? 'Ganancia' : 'Pérdida'}
                  </p>
                </div>
                <p className={`text-2xl font-bold font-mono ${result.profitLoss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {result.profitLoss >= 0 ? '+' : ''}${result.profitLoss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>

              {/* ROI */}
              <div className={`p-4 rounded-lg border ${result.roi >= 0 ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                <div className="flex items-center gap-2 mb-1">
                  {result.roi >= 0 ? (
                    <TrendingUp className="w-4 h-4 text-green-500" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-500" />
                  )}
                  <p className="text-sm text-muted-foreground">ROI</p>
                </div>
                <p className={`text-2xl font-bold font-mono ${result.roi >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {result.roi >= 0 ? '+' : ''}{result.roi.toFixed(2)}%
                </p>
              </div>
            </div>

            {/* Disclaimer */}
            <Alert className="bg-yellow-500/10 border-yellow-500/20">
              <AlertCircle className="w-4 h-4 text-yellow-500" />
              <AlertDescription className="text-sm text-muted-foreground">
                Este cálculo es una simulación hipotética y no constituye asesoría financiera.
              </AlertDescription>
            </Alert>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
