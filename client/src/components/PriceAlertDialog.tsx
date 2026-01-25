/**
 * Price Alert Dialog Component
 * Allows users to create price alerts for crypto and stocks
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Bell, TrendingUp, TrendingDown } from 'lucide-react';
import { trpc } from '@/lib/trpc';
// import { toast } from 'sonner';

interface PriceAlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  symbol: string;
  type: 'crypto' | 'stock';
  currentPrice?: number;
}

export function PriceAlertDialog({
  open,
  onOpenChange,
  symbol,
  type,
  currentPrice,
}: PriceAlertDialogProps) {
  const [condition, setCondition] = useState<'above' | 'below'>('above');
  const [targetPrice, setTargetPrice] = useState<string>('');
  const [notifyEmail, setNotifyEmail] = useState<boolean>(true);

  const createAlert = trpc.priceAlerts.create.useMutation({
    onSuccess: () => {
      // toast.success('Alerta de precio creada', {
      //   description: `Recibirás una notificación cuando ${symbol} ${condition === 'above' ? 'supere' : 'baje de'} $${targetPrice}`,
      // });
      onOpenChange(false);
      // Reset form
      setTargetPrice('');
      setCondition('above');
      setNotifyEmail(true);
    },
    onError: (error) => {
      // toast.error('Error al crear alerta', {
      //   description: error.message,
      // });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const price = parseFloat(targetPrice);
    if (isNaN(price) || price <= 0) {
      // toast.error('Precio inválido', {
      //   description: 'Por favor ingresa un precio válido mayor a 0',
      // });
      return;
    }

    createAlert.mutate({
      symbol,
      type,
      target_price: price,
      condition,
      notify_email: notifyEmail,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-popover border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            Crear Alerta de Precio
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Recibe una notificación cuando {symbol} alcance tu precio objetivo
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Current Price Info */}
          {currentPrice && (
            <div className="bg-accent/20 border border-border rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-1">Precio actual</p>
              <p className="text-2xl font-bold text-foreground">
                ${currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 8 })}
              </p>
            </div>
          )}

          {/* Asset */}
          <div className="space-y-2">
            <Label className="text-foreground">Activo</Label>
            <Input
              value={symbol}
              disabled
              className="bg-background border-border text-foreground"
            />
          </div>

          {/* Condition */}
          <div className="space-y-2">
            <Label className="text-foreground">Condición</Label>
            <Select value={condition} onValueChange={(value: 'above' | 'below') => setCondition(value)}>
              <SelectTrigger className="bg-background border-border text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="above">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-green-500" />
                    <span>Precio mayor que</span>
                  </div>
                </SelectItem>
                <SelectItem value="below">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="w-4 h-4 text-red-500" />
                    <span>Precio menor que</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Target Price */}
          <div className="space-y-2">
            <Label htmlFor="targetPrice" className="text-foreground">
              Precio Objetivo
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                $
              </span>
              <Input
                id="targetPrice"
                type="number"
                step="any"
                placeholder="0.00"
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
                className="bg-background border-border text-foreground pl-7"
                required
              />
            </div>
          </div>

          {/* Email Notification Toggle */}
          <div className="flex items-center justify-between p-4 bg-accent/10 border border-border rounded-lg">
            <div className="space-y-0.5">
              <Label htmlFor="notifyEmail" className="text-foreground cursor-pointer">
                Notificación por email
              </Label>
              <p className="text-sm text-muted-foreground">
                Recibe un correo cuando se active la alerta
              </p>
            </div>
            <Switch
              id="notifyEmail"
              checked={notifyEmail}
              onCheckedChange={setNotifyEmail}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-border text-foreground"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={createAlert.isLoading}
              className="bg-primary text-primary-foreground"
            >
              {createAlert.isLoading ? 'Creando...' : 'Crear Alerta'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
