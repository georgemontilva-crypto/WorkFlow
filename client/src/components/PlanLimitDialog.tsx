/**
 * Plan Limit Dialog - Modal cuando se alcanza el límite del plan
 */

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Sparkles } from 'lucide-react';
import { useLocation } from 'wouter';

interface PlanLimitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  limitType: 'invoices' | 'clients';
  currentCount: number;
  limit: number;
}

export function PlanLimitDialog({
  open,
  onOpenChange,
  limitType,
  currentCount,
  limit,
}: PlanLimitDialogProps) {
  const [, setLocation] = useLocation();

  const handleUpgrade = () => {
    onOpenChange(false);
    setLocation('/settings?tab=subscription');
  };

  const limitText = limitType === 'invoices' ? 'facturas' : 'clientes';
  const limitTextSingular = limitType === 'invoices' ? 'factura' : 'cliente';

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-popover border-border max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
          </div>
          <AlertDialogTitle className="text-center text-xl">
            Límite Alcanzado
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center space-y-3">
            <p className="text-base">
              Has alcanzado el límite de <strong>{limit} {limitText}</strong> del plan Free.
            </p>
            <div className="bg-muted/50 rounded-lg p-4 border border-border">
              <p className="text-sm text-muted-foreground mb-1">
                {limitText.charAt(0).toUpperCase() + limitText.slice(1)} creadas:
              </p>
              <p className="text-2xl font-bold text-foreground">
                {currentCount} / {limit}
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              Actualiza a <strong className="text-primary">Finwrk Pro</strong> para crear {limitText} ilimitadas y desbloquear todas las funcionalidades.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel className="w-full sm:w-auto">
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleUpgrade}
            className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Upgrade a Pro
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
