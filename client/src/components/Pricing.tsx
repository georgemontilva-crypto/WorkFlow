/**
 * Pricing Section Component - Finwrk
 * Displays subscription plans with features
 */

import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';

const plans = [
  {
    id: 'free',
    name: 'Finwrk Free',
    price: 0,
    period: '',
    description: 'Perfect for getting started',
    features: [
      'Basic financial dashboard',
      'Up to 3 clients',
      'Maximum 5 invoices',
      'Crypto tracking (no payments)',
      'No automations',
    ],
    cta: 'Start Free',
    highlighted: false,
  },
  {
    id: 'pro',
    name: 'Finwrk Pro',
    price: 15,
    period: '/month',
    description: 'For growing freelancers and businesses',
    features: [
      'Unlimited clients',
      'Unlimited invoices',
      'Multi-currency (USD, COP, EUR, USDT)',
      'Payment links per invoice',
      'Stripe payments',
      'Crypto payments via external custody',
      'Invoice states (paid/overdue/partial)',
      'Basic financial reports',
      'Automatic payment reminders',
      'Crypto to local currency conversion',
      'CSV / PDF export',
    ],
    cta: 'Upgrade to Pro',
    highlighted: true,
  },
  {
    id: 'business',
    name: 'Finwrk Business',
    price: 29,
    period: '/month',
    description: 'For teams and enterprises',
    features: [
      'Everything in Pro',
      'Public API for integrations',
      'White label (logo, colors, domain)',
      'User activity logs',
      'Priority support',
    ],
    cta: 'Upgrade to Business',
    highlighted: false,
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Choose the plan that fits your needs. Start free, upgrade anytime.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-2xl border ${
                plan.highlighted
                  ? 'border-primary shadow-lg scale-105'
                  : 'border-border'
              } bg-card p-8 flex flex-col`}
            >
              {/* Badge for highlighted plan */}
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground text-sm font-medium px-4 py-1 rounded-full">
                    Most Popular
                  </span>
                </div>
              )}

              {/* Plan name */}
              <h3 className="text-2xl font-bold text-foreground mb-2">
                {plan.name}
              </h3>

              {/* Description */}
              <p className="text-sm text-muted-foreground mb-6">
                {plan.description}
              </p>

              {/* Price */}
              <div className="mb-8">
                <div className="flex items-baseline">
                  <span className="text-5xl font-bold text-foreground">
                    ${plan.price}
                  </span>
                  {plan.period && (
                    <span className="text-muted-foreground ml-2">
                      {plan.period}
                    </span>
                  )}
                </div>
              </div>

              {/* CTA Button */}
              <Button
                className={`w-full mb-8 ${
                  plan.highlighted
                    ? 'bg-primary text-primary-foreground hover:opacity-90'
                    : 'bg-background text-foreground border border-border hover:bg-muted'
                }`}
                onClick={() => {
                  if (plan.id === 'free') {
                    window.location.href = '/signup';
                  } else {
                    window.location.href = '/signup';
                  }
                }}
              >
                {plan.cta}
              </Button>

              {/* Features */}
              <ul className="space-y-4 flex-1">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-muted-foreground">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Footer note */}
        <div className="text-center mt-12">
          <p className="text-sm text-muted-foreground">
            All plans include bank-level security and data encryption.{' '}
            <a href="/faq" className="text-primary hover:underline">
              View FAQ
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
