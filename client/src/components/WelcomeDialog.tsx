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

  const handleClose = (open: boolean) => {
    if (!open && user) {
      // Save to localStorage when closing (regardless of how it's closed)
      localStorage.setItem(`welcome-seen-${user.id}`, 'true');
    }
    setIsOpen(open);
  };

  const features = [
    t.welcome.feature1,
    t.welcome.feature2,
    t.welcome.feature3,
    t.welcome.feature4,
    t.welcome.feature5,
  ];

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] bg-background border-primary/30 shadow-2xl">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center animate-pulse">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
          </div>
          <DialogTitle className="text-2xl sm:text-3xl text-center font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            {t.welcome.title}
          </DialogTitle>
          <DialogDescription className="text-center text-base sm:text-lg pt-3 text-foreground/80">
            {t.welcome.subtitle}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Trial Info */}
          <div className="bg-gradient-to-r from-primary/15 to-primary/5 rounded-xl p-4 border-2 border-primary/30 shadow-sm">
            <p className="text-sm sm:text-base font-semibold text-center text-foreground flex items-center justify-center gap-2">
              <span className="text-2xl">🎉</span>
              <span>{t.welcome.trialInfo}</span>
            </p>
          </div>

          {/* Features List */}
          <div className="space-y-3">
            <p className="text-sm sm:text-base font-bold text-foreground">
              {t.welcome.featuresTitle}
            </p>
            <div className="space-y-3">
              {features.map((feature, index) => (
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
              {t.welcome.startButton}
            </Button>
          </div>

          {/* Footer Note */}
          <p className="text-xs sm:text-sm text-center text-muted-foreground pt-1">
            {t.welcome.footerNote}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
