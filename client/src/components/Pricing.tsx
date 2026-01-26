/**
 * Pricing Section Component - Finwrk
 * Displays subscription plans with features
 */

import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';

const plans = [
  {
    id: 'free',
    name: 'Finwrk Gratis',
    price: 0,
    period: '',
    description: 'Perfecto para comenzar',
    features: [
      'Panel financiero básico',
      'Hasta 3 clientes',
      'Máximo 5 facturas',
      'Seguimiento cripto (sin pagos)',
      'Sin automatizaciones',
    ],
    cta: 'Comenzar Gratis',
    highlighted: false,
  },
  {
    id: 'pro',
    name: 'Finwrk Pro',
    price: 15,
    period: '/mes',
    description: 'Para freelancers y negocios en crecimiento',
    features: [
      'Clientes ilimitados',
      'Facturas ilimitadas',
      'Multimoneda (USD, COP, EUR, USDT)',
      'Enlaces de pago por factura',
      'Pagos cripto vía custodia externa',
      'Estados de factura (pagada/vencida/parcial)',
      'Reportes financieros',
      'Recordatorios automáticos de pago',
      'Conversión cripto a moneda local',
      'Exportación CSV / PDF',
    ],
    cta: 'Mejorar a Pro',
    highlighted: true,
  },
  {
    id: 'business',
    name: 'Finwrk Empresarial',
    price: 29,
    period: '/mes',
    description: 'Para equipos y empresas',
    features: [
      'Todo en Pro',
      'API pública para integraciones',
      'Marca blanca (logo, colores, dominio)',
      'Registros de actividad de usuarios',
      'Soporte prioritario',
    ],
    cta: 'Mejorar a Empresarial',
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
            Precios simples y transparentes
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Elige el plan que se ajuste a tus necesidades. Comienza gratis, mejora en cualquier momento.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-lg border ${
                plan.highlighted
                  ? 'border-primary shadow-lg scale-105'
                  : 'border-border'
              } bg-card p-8 flex flex-col`}
            >
              {/* Badge for highlighted plan */}
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground text-sm font-medium px-4 py-1 rounded-md">
                    Más Popular
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
            Todos los planes incluyen seguridad de nivel bancario y encriptación de datos.{' '}
            <a href="/faq" className="text-primary hover:underline">
              Ver Preguntas Frecuentes
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
