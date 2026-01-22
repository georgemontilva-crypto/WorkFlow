/**
 * Scenario Simulator Component - Compact & Stable Version
 * Allows users to simulate hypothetical profit/loss scenarios for financial assets
 */

import { useState, useEffect } from 'react';
import { Calculator, TrendingUp, TrendingDown, AlertCircle, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import AssetSelector from './AssetSelector';

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
    if (asset) {
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

    // Calculations
    const initialInvestment = qty * buy;
    const finalValue = qty * target;
    const commissionAmount = (initialInvestment * commPct) + commFix;
    const profitLoss = finalValue - initialInvestment - commissionAmount;
    const roi = (profitLoss / initialInvestment) * 100;

    setResult({
      initialInvestment,
      finalValue,
      profitLoss,
      roi
    });
  };

  const handleClear = () => {
    setAsset(null);
    setQuantity('');
    setBuyPrice('');
    setTargetPrice('');
    setCommissionPercent('');
    setCommissionFixed('');
    setResult(null);
    setErrors({});
  };

  const isFormValid = asset && quantity && buyPrice && targetPrice;

  return (
    <Card className="flex flex-col" style={{ minHeight: '420px', maxHeight: '420px' }}>
      <CardHeader className="pb-2 px-4 pt-3 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-primary" />
            <CardTitle className="text-base">Simulador de Escenario</CardTitle>
          </div>
          {result && (
            <Button variant="ghost" size="sm" onClick={handleClear} className="h-6 px-2">
              <X className="w-3 h-3" />
            </Button>
          )}
        </div>
        <CardDescription className="text-[10px]">
          Calcula posibles ganancias o pérdidas en un escenario hipotético
        </CardDescription>
      </CardHeader>

      <CardContent className="px-4 pb-3 flex-1 overflow-y-auto">
        <div className="space-y-2">
          {/* Asset Selector */}
          <div className="space-y-1">
            <Label htmlFor="asset" className="text-xs">Activo *</Label>
            <AssetSelector
              assets={availableAssets}
              selectedAsset={asset}
              onSelect={setAsset}
              placeholder="Seleccionar activo"
            />
            {errors.asset && <p className="text-[10px] text-destructive">{errors.asset}</p>}
          </div>

          {/* Asset Info Card */}
          {asset && (
            <div className="p-1.5 bg-muted/30 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold">{asset.symbol}</p>
                  <p className="text-[9px] text-muted-foreground">{asset.name}</p>
                </div>
                <p className="text-xs font-mono">${asset.price.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 6 })}</p>
              </div>
            </div>
          )}

          {/* Form Fields - 2 Columns */}
          <div className="grid grid-cols-2 gap-2">
            {/* Quantity */}
            <div className="space-y-0.5">
              <Label htmlFor="quantity" className="text-xs">Cantidad *</Label>
              <Input
                id="quantity"
                type="number"
                placeholder="0.00"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="h-7 text-xs"
                step="any"
              />
              {errors.quantity && <p className="text-[10px] text-destructive">{errors.quantity}</p>}
            </div>

            {/* Buy Price */}
            <div className="space-y-0.5">
              <Label htmlFor="buyPrice" className="text-xs">Precio Compra *</Label>
              <Input
                id="buyPrice"
                type="number"
                placeholder="0.00"
                value={buyPrice}
                onChange={(e) => setBuyPrice(e.target.value)}
                className="h-7 text-xs"
                step="any"
              />
              {errors.buyPrice && <p className="text-[10px] text-destructive">{errors.buyPrice}</p>}
            </div>

            {/* Target Price */}
            <div className="space-y-0.5">
              <Label htmlFor="targetPrice" className="text-xs">Precio Objetivo *</Label>
              <Input
                id="targetPrice"
                type="number"
                placeholder="0.00"
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
                className="h-7 text-xs"
                step="any"
              />
              {errors.targetPrice && <p className="text-[10px] text-destructive">{errors.targetPrice}</p>}
            </div>

            {/* Commission Percent */}
            <div className="space-y-0.5">
              <Label htmlFor="commissionPercent" className="text-xs">Comisión (%)</Label>
              <Input
                id="commissionPercent"
                type="number"
                placeholder="0.00"
                value={commissionPercent}
                onChange={(e) => setCommissionPercent(e.target.value)}
                className="h-7 text-xs"
                step="any"
                min="0"
                max="100"
              />
              {errors.commissionPercent && <p className="text-[10px] text-destructive">{errors.commissionPercent}</p>}
            </div>
          </div>

          {/* Commission Fixed - Full Width */}
          <div className="space-y-0.5">
            <Label htmlFor="commissionFixed" className="text-xs">Comisión Fija</Label>
            <Input
              id="commissionFixed"
              type="number"
              placeholder="0.00"
              value={commissionFixed}
              onChange={(e) => setCommissionFixed(e.target.value)}
              className="h-7 text-xs"
              step="any"
              min="0"
            />
            {errors.commissionFixed && <p className="text-[10px] text-destructive">{errors.commissionFixed}</p>}
          </div>

          {/* Calculate Button */}
          <Button
            onClick={calculateScenario}
            disabled={!isFormValid}
            className="w-full h-8 text-xs"
          >
            <Calculator className="w-3 h-3 mr-1.5" />
            Calcular
          </Button>

          {/* Results */}
          {result && (
            <div className="space-y-2 pt-2 border-t">
              <h4 className="text-xs font-semibold">Resultados</h4>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="p-1.5 bg-muted/30 rounded-lg">
                  <p className="text-[9px] text-muted-foreground mb-0.5">Inversión Inicial</p>
                  <p className="text-xs font-mono">${result.initialInvestment.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>

                <div className="p-1.5 bg-muted/30 rounded-lg">
                  <p className="text-[9px] text-muted-foreground mb-0.5">Valor Final</p>
                  <p className="text-xs font-mono">${result.finalValue.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>

                <div className={`p-1.5 rounded-lg ${result.profitLoss >= 0 ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                  <p className="text-[9px] text-muted-foreground mb-0.5">Ganancia / Pérdida</p>
                  <p className={`text-xs font-mono font-semibold flex items-center gap-1 ${result.profitLoss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {result.profitLoss >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {result.profitLoss >= 0 ? '+' : ''} ${result.profitLoss.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>

                <div className={`p-1.5 rounded-lg ${result.roi >= 0 ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                  <p className="text-[9px] text-muted-foreground mb-0.5">ROI</p>
                  <p className={`text-xs font-mono font-semibold ${result.roi >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {result.roi >= 0 ? '+' : ''}{result.roi.toFixed(2)}%
                  </p>
                </div>
              </div>

              {/* Disclaimer */}
              <Alert className="py-1.5">
                <AlertCircle className="w-3 h-3" />
                <AlertDescription className="text-[9px]">
                  Este cálculo es una simulación hipotética y no constituye asesoría financiera.
                </AlertDescription>
              </Alert>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
