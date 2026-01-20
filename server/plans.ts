/**
 * Subscription Plans Configuration
 */

export const PLANS = {
  FREE: {
    id: 'free',
    name: 'Finwrk Free',
    price: 0,
    currency: 'USD',
    interval: null,
    limits: {
      clients: 3,
      invoices: 5,
      cryptoPayments: false,
      automations: false,
      multiCurrency: false,
      stripePayments: false,
      reports: false,
      api: false,
      whiteLabel: false,
    },
    features: [
      'Basic financial dashboard',
      'Up to 3 clients',
      'Maximum 5 invoices',
      'Crypto tracking (no payments)',
      'No automations',
    ],
  },
  PRO: {
    id: 'pro',
    name: 'Finwrk Pro',
    price: 15,
    currency: 'USD',
    interval: 'month',
    stripePriceId: process.env.STRIPE_PRICE_PRO, // Set in Railway
    limits: {
      clients: Infinity,
      invoices: Infinity,
      cryptoPayments: true,
      automations: true,
      multiCurrency: true,
      stripePayments: true,
      reports: true,
      api: false,
      whiteLabel: false,
    },
    features: [
      'Unlimited clients',
      'Unlimited invoices',
      'Multi-currency (USD, COP, EUR, USDT)',
      'Payment links per invoice',
      'Crypto payments via external custody',
      'Invoice states (paid/overdue/partial)',
      'Financial reports',
      'Automatic payment reminders',
      'Crypto to local currency conversion',
      'CSV / PDF export',
    ],
  },
  BUSINESS: {
    id: 'business',
    name: 'Finwrk Business',
    price: 29,
    currency: 'USD',
    interval: 'month',
    stripePriceId: process.env.STRIPE_PRICE_BUSINESS, // Set in Railway
    limits: {
      clients: Infinity,
      invoices: Infinity,
      cryptoPayments: true,
      automations: true,
      multiCurrency: true,
      stripePayments: true,
      reports: true,
      api: true,
      whiteLabel: true,
    },
    features: [
      'Everything in Pro',
      'Public API for integrations',
      'White label (logo, colors, domain)',
      'User activity logs',
      'Priority support',
    ],
  },
} as const;

export type PlanId = 'free' | 'pro' | 'business';

export function getPlanById(planId: PlanId) {
  return PLANS[planId.toUpperCase() as keyof typeof PLANS];
}

export function canAccessFeature(planId: PlanId, feature: keyof typeof PLANS.FREE.limits): boolean {
  const plan = getPlanById(planId);
  return plan.limits[feature] as boolean;
}

export function getPlanLimit(planId: PlanId, limit: 'clients' | 'invoices'): number {
  const plan = getPlanById(planId);
  return plan.limits[limit] as number;
}
