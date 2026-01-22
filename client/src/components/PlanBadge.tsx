/**
 * Plan Badge Component
 * Shows current subscription plan with upgrade option
 */

import { Button } from '@/components/ui/button';
import { trpc } from '@/lib/trpc';
import { Crown, Zap } from 'lucide-react';
import { useLocation } from 'wouter';

export function PlanBadge() {
  const [, setLocation] = useLocation();
  const { data: subscription, isLoading } = trpc.subscription.current.useQuery();

  if (isLoading || !subscription) {
    return null;
  }

  const planConfig = {
    free: {
      label: 'Free',
      icon: null,
      color: 'text-muted-foreground',
      bg: 'bg-muted',
    },
    pro: {
      label: 'Pro',
      icon: Zap,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    business: {
      label: 'Business',
      icon: Crown,
      color: 'text-yellow-500',
      bg: 'bg-yellow-500/10',
    },
  };

  const config = planConfig[subscription.plan as keyof typeof planConfig];
  const Icon = config.icon;

  // Don't show plan badge for Pro/Business users
  if (subscription.plan === 'pro' || subscription.plan === 'business') {
    return null;
  }

  return (
    <div className="space-y-2">
      {/* Current Plan Display */}
      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${config.bg}`}>
        {Icon && <Icon className={`w-4 h-4 ${config.color}`} />}
        <div className="flex-1">
          <p className="text-xs text-muted-foreground">Plan Actual</p>
          <p className={`text-sm font-semibold ${config.color}`}>{config.label}</p>
        </div>
      </div>
      
      {/* Upgrade Button for Free users */}
      {subscription.plan === 'free' && (
        <Button
          size="sm"
          variant="outline"
          className="w-full border border-white text-white hover:bg-white hover:text-black transition-colors font-semibold"
          onClick={() => {
            // Navigate to pricing page within the app
            window.location.href = '/pricing';
          }}
        >
          Upgrade a Pro
        </Button>
      )}
    </div>
  );
}
