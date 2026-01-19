/**
 * TrialBanner - Muestra los días restantes del período de prueba
 * Se muestra en el dashboard para usuarios en período de prueba
 */

import { useAuth } from '@/_core/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { differenceInDays } from 'date-fns';
import { Clock, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/card';

export function TrialBanner() {
  const { user } = useAuth();
  const { t } = useLanguage();

  if (!user || !user.trial_ends_at || user.has_lifetime_access) {
    return null;
  }

  const trialEndsAt = new Date(user.trial_ends_at);
  const now = new Date();
  const daysRemaining = differenceInDays(trialEndsAt, now);

  // Don't show if trial has ended
  if (daysRemaining < 0) {
    return null;
  }

  // Determine color based on days remaining
  const getColorClasses = () => {
    if (daysRemaining <= 1) {
      return {
        bg: 'bg-red-500/10 border-red-500/30',
        text: 'text-red-600 dark:text-red-400',
        icon: 'text-red-500',
      };
    } else if (daysRemaining <= 3) {
      return {
        bg: 'bg-yellow-500/10 border-yellow-500/30',
        text: 'text-yellow-600 dark:text-yellow-400',
        icon: 'text-yellow-500',
      };
    } else {
      return {
        bg: 'bg-primary/10 border-primary/30',
        text: 'text-primary',
        icon: 'text-primary',
      };
    }
  };

  const colors = getColorClasses();
  const Icon = daysRemaining <= 3 ? Clock : Sparkles;

  const getMessage = () => {
    if (daysRemaining === 0) {
      return t.trial?.lastDay || 'Último día de prueba';
    } else if (daysRemaining === 1) {
      return t.trial?.oneDayLeft || 'Queda 1 día de prueba';
    } else {
      return (t.trial?.daysLeft || 'Quedan {days} días de prueba').replace('{days}', daysRemaining.toString());
    }
  };

  return (
    <Card className={`${colors.bg} border-2 p-4 mb-6`}>
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-full ${colors.bg}`}>
          <Icon className={`w-6 h-6 ${colors.icon}`} />
        </div>
        <div className="flex-1">
          <h3 className={`font-bold text-lg ${colors.text}`}>
            {getMessage()}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {t.trial?.description || 'Disfruta de todas las funcionalidades durante tu período de prueba'}
          </p>
        </div>
        {daysRemaining <= 3 && (
          <div className="text-right">
            <p className={`text-3xl font-bold ${colors.text}`}>
              {daysRemaining}
            </p>
            <p className="text-xs text-muted-foreground uppercase">
              {daysRemaining === 1 ? (t.trial?.day || 'día') : (t.trial?.days || 'días')}
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
