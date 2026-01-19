/**
 * WelcomeDialog - Popup de bienvenida para usuarios nuevos
 * Se muestra solo la primera vez que el usuario inicia sesión
 */

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Sparkles, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/_core/hooks/useAuth';

export function WelcomeDialog() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

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

  const handleClose = () => {
    if (user) {
      localStorage.setItem(`welcome-seen-${user.id}`, 'true');
    }
    setIsOpen(false);
  };

  const features = [
    t.welcome?.feature1 || 'Gestiona tus clientes y pagos',
    t.welcome?.feature2 || 'Crea facturas profesionales',
    t.welcome?.feature3 || 'Controla tus finanzas',
    t.welcome?.feature4 || 'Establece metas de ahorro',
    t.welcome?.feature5 || 'Recibe recordatorios automáticos',
  ];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[500px] bg-gradient-to-br from-primary/5 via-background to-background border-primary/20">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
          </div>
          <DialogTitle className="text-2xl text-center">
            {t.welcome?.title || '¡Bienvenido a HiWork!'}
          </DialogTitle>
          <DialogDescription className="text-center text-base pt-2">
            {t.welcome?.subtitle || 'Estamos emocionados de tenerte aquí. Tu período de prueba de 7 días ha comenzado.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Trial Info */}
          <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
            <p className="text-sm font-medium text-center text-foreground">
              {t.welcome?.trialInfo || '🎉 Tienes 7 días de acceso completo gratis'}
            </p>
          </div>

          {/* Features List */}
          <div className="space-y-3">
            <p className="text-sm font-semibold text-foreground">
              {t.welcome?.featuresTitle || 'Lo que puedes hacer:'}
            </p>
            <div className="space-y-2">
              {features.map((feature, index) => (
                <div key={index} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-muted-foreground">{feature}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="pt-4">
            <Button 
              onClick={handleClose}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              size="lg"
            >
              {t.welcome?.startButton || '¡Comenzar Ahora!'}
            </Button>
          </div>

          {/* Footer Note */}
          <p className="text-xs text-center text-muted-foreground pt-2">
            {t.welcome?.footerNote || 'Puedes acceder a todas las funcionalidades durante tu período de prueba'}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
