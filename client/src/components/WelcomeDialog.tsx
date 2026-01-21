/**
 * WelcomeDialog - Popup de bienvenida para usuarios nuevos
 * Se muestra solo la primera vez que el usuario inicia sesión
 * Personalizado según el plan del usuario
 */

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Sparkles, CheckCircle2, Crown, Zap } from 'lucide-react';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';

export function WelcomeDialog() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const { data: subscription } = trpc.subscription.current.useQuery(undefined, {
    enabled: !!user,
  });

  useEffect(() => {
    if (!user) return;

    // Check if user has seen welcome dialog
    const hasSeenWelcome = localStorage.getItem(`welcome-seen-${user.id}`);
    
    if (!hasSeenWelcome) {
      // Show welcome dialog after a short delay
      setTimeout(() => {
        setIsOpen(true);
      }, 1000);
    }
  }, [user]);

  const handleClose = (open: boolean) => {
    if (!open && user) {
      // Save to localStorage when closing (regardless of how it's closed)
      localStorage.setItem(`welcome-seen-${user.id}`, 'true');
    }
    setIsOpen(open);
  };

  // Plan-specific content
  const planContent = {
    free: {
      icon: Sparkles,
      title: '¡Bienvenido a Finwrk!',
      subtitle: 'Estamos emocionados de tenerte aquí. Comienza a gestionar tus finanzas de forma profesional.',
      badge: null,
      features: [
        'Dashboard financiero básico',
        'Hasta 3 clientes',
        'Máximo 5 facturas',
        'Visualización de cripto',
        'Seguridad bancaria',
      ],
      footerNote: 'Puedes actualizar a Pro en cualquier momento para desbloquear funciones ilimitadas',
    },
    pro: {
      icon: Zap,
      title: '¡Bienvenido a Finwrk Pro!',
      subtitle: 'Estás listo para llevar tu negocio al siguiente nivel con todas las funciones profesionales.',
      badge: 'Plan Pro Activado',
      features: [
        'Clientes y facturas ilimitados',
        'Multi-moneda (USD, COP, EUR, USDT)',
        'Links de pago por factura',
        'Pagos cripto mediante custodia externa',
        'Reportes financieros y automatizaciones',
      ],
      footerNote: 'Tienes acceso completo a todas las funciones profesionales',
    },
    business: {
      icon: Crown,
      title: '¡Bienvenido a Finwrk Business!',
      subtitle: 'Tienes acceso al máximo nivel de Finwrk con funciones empresariales avanzadas.',
      badge: 'Plan Business Activado',
      features: [
        'Todo lo incluido en Pro',
        'API pública para integraciones',
        'Marca blanca personalizable',
        'Logs de actividad detallados',
        'Soporte prioritario',
      ],
      footerNote: 'Disfruta del máximo poder de Finwrk para tu empresa',
    },
  };

  const plan = subscription?.plan || 'free';
  const content = planContent[plan as keyof typeof planContent] || planContent.free;
  const Icon = content.icon;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] bg-background border-primary/30 shadow-2xl">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center animate-pulse">
              <Icon className="w-8 h-8 text-primary" />
            </div>
          </div>
          <DialogTitle className="text-2xl sm:text-3xl text-center font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            {content.title}
          </DialogTitle>
          <DialogDescription className="text-center text-base sm:text-lg pt-3 text-foreground/80">
            {content.subtitle}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Plan Badge (only for Pro/Business) */}
          {content.badge && (
            <div className="bg-gradient-to-r from-primary/15 to-primary/5 rounded-xl p-4 border-2 border-primary/30 shadow-sm">
              <p className="text-sm sm:text-base font-semibold text-center text-foreground flex items-center justify-center gap-2">
                <span>{content.badge}</span>
              </p>
            </div>
          )}

          {/* Features List */}
          <div className="space-y-3">
            <p className="text-sm sm:text-base font-bold text-foreground">
              Lo que puedes hacer:
            </p>
            <div className="space-y-3">
              {content.features.map((feature, index) => (
                <div key={index} className="flex items-start gap-3 group">
                  <div className="flex-shrink-0 mt-0.5">
                    <CheckCircle2 className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
                  </div>
                  <p className="text-sm sm:text-base text-foreground/90 leading-relaxed">{feature}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="pt-2">
            <Button 
              onClick={() => handleClose(false)}
              className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground font-semibold shadow-lg hover:shadow-xl transition-all"
              size="lg"
            >
              ¡Comenzar Ahora!
            </Button>
          </div>

          {/* Footer Note */}
          <p className="text-xs sm:text-sm text-center text-muted-foreground pt-1">
            {content.footerNote}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
