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

  return (
    <div className="flex items-center gap-2">
      <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>
        {Icon && <Icon className="w-3.5 h-3.5" />}
        <span>{config.label}</span>
      </div>
      
      {subscription.plan === 'free' && (
        <Button
          size="sm"
          variant="outline"
          className="text-xs h-7"
          onClick={() => setLocation('/#pricing')}
        >
          Upgrade
        </Button>
      )}
    </div>
  );
}
