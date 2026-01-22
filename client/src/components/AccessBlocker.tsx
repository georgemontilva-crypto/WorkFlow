/**
 * AccessBlocker Component
 * Blocks access to features when trial expires
 * Multilingual: English/Spanish
 */

import { Button } from '@/components/ui/button';
import { Lock, Sparkles } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface AccessBlockerProps {
  trialDaysRemaining: number;
  onUpgrade: () => void;
}

export function AccessBlocker({ trialDaysRemaining, onUpgrade }: AccessBlockerProps) {
  const { t } = useLanguage();
  const isTrialActive = trialDaysRemaining > 0;

  if (isTrialActive) {
    // Show trial warning when less than 3 days remaining
    if (trialDaysRemaining <= 3) {
      return (
        <div className="fixed bottom-4 right-4 z-50 max-w-md">
          <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-2xl p-6 backdrop-blur-md">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 text-yellow-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-foreground mb-1">
                  {trialDaysRemaining === 1 ? t.accessBlocker.lastDay : t.accessBlocker.daysRemaining.replace('{days}', trialDaysRemaining.toString())}
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  {t.accessBlocker.trialEnding}
                </p>
                <Button 
                  onClick={onUpgrade}
                  className="bg-yellow-500 text-black hover:bg-yellow-400 w-full"
                >
                  {t.accessBlocker.getLifetime}
                </Button>
              </div>
            </div>
          </div>
        </div>
      );
    }
    return null;
  }

  // Trial expired - show full-screen blocker
  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-md flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <Lock className="w-10 h-10 text-primary" />
        </div>
        
        <h2 className="text-3xl font-bold text-foreground mb-3">
          {t.accessBlocker.expired}
        </h2>
        
        <p className="text-lg text-muted-foreground mb-8">
          {t.accessBlocker.expiredMessage}
        </p>

        <div className="bg-card border border-border rounded-2xl p-6 mb-8">
          <h3 className="font-bold text-foreground mb-4">{t.accessBlocker.includes}</h3>
          <ul className="space-y-3 text-left">
            <li className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-primary text-xs">✓</span>
              </div>
              <span className="text-sm text-muted-foreground">{t.accessBlocker.benefit1}</span>
            </li>
            <li className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-primary text-xs">✓</span>
              </div>
              <span className="text-sm text-muted-foreground">{t.accessBlocker.benefit2}</span>
            </li>
            <li className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-primary text-xs">✓</span>
              </div>
              <span className="text-sm text-muted-foreground">{t.accessBlocker.benefit3}</span>
            </li>
            <li className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-primary text-xs">✓</span>
              </div>
              <span className="text-sm text-muted-foreground">{t.accessBlocker.benefit4}</span>
            </li>
          </ul>
        </div>

        <Button 
          size="lg"
          onClick={onUpgrade}
          className="w-full bg-primary text-primary-foreground hover:opacity-90 text-lg py-6"
        >
          {t.accessBlocker.ctaButton}
        </Button>
        
        <p className="text-xs text-muted-foreground mt-4">
          {t.accessBlocker.securePayment}
        </p>
      </div>
    </div>
  );
}
