/**
 * Pricing Page - Página de planes dentro de la app
 * Muestra los 3 planes con opciones de upgrade
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Sparkles, Zap, Crown, Loader2 } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useState } from 'react';
import { toast } from 'sonner';

export default function PricingPage() {
  const { data: subscription } = trpc.subscription.current.useQuery();
  const createCheckout = trpc.subscription.createCheckout.useMutation();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const plans = [
    {
      id: 'free',
      name: 'Finwrk Free',
      price: '$0',
      period: '/forever',
      description: 'Perfect for getting started',
      icon: Sparkles,
      iconColor: 'text-muted-foreground',
      features: [
        { text: 'Dashboard financiero básico', included: true },
        { text: 'Hasta 3 clientes', included: true },
        { text: 'Máximo 5 invoices', included: true },
        { text: 'Visualización de cripto (solo tracking)', included: true },
        { text: 'Sin automatizaciones', included: false },
        { text: 'Pagos con Stripe', included: false },
        { text: 'Multi-moneda', included: false },
      ],
      cta: 'Plan Actual',
      current: subscription?.plan === 'free',
    },
    {
      id: 'pro',
      name: 'Finwrk Pro',
      price: '$15',
      period: '/mes',
      description: 'For growing businesses',
      icon: Zap,
      iconColor: 'text-primary',
      highlighted: true,
      features: [
        { text: 'Clientes ilimitados', included: true },
        { text: 'Invoices ilimitados', included: true },
        { text: 'Multi-moneda (USD, COP, EUR, USDT)', included: true },
        { text: 'Links de pago por invoice', included: true },
        { text: 'Pagos con Stripe', included: true },
        { text: 'Pagos cripto mediante custodia externa', included: true },
        { text: 'Estados de invoice (pagado/vencido/parcial)', included: true },
        { text: 'Reportes financieros básicos', included: true },
        { text: 'Recordatorios automáticos de pago', included: true },
        { text: 'Conversión cripto → moneda local', included: true },
        { text: 'Exportación CSV / PDF', included: true },
      ],
      cta: 'Upgrade a Pro',
      current: subscription?.plan === 'pro',
    },
    {
      id: 'business',
      name: 'Finwrk Business',
      price: '$29',
      period: '/mes',
      description: 'For established companies',
      icon: Crown,
      iconColor: 'text-yellow-500',
      features: [
        { text: 'Todo lo incluido en Pro', included: true },
        { text: 'API pública para integraciones', included: true },
        { text: 'Marca blanca (logo, colores, dominio)', included: true },
        { text: 'Logs de actividad del usuario', included: true },
        { text: 'Soporte prioritario', included: true },
      ],
      cta: 'Upgrade a Business',
      current: subscription?.plan === 'business',
    },
  ];

  const handleUpgrade = async (planId: string) => {
    if (planId === 'free') return;
    
    setLoadingPlan(planId);
    try {
      const result = await createCheckout.mutateAsync({ plan: planId as 'pro' | 'business' });
      
      if (result.url) {
        window.location.href = result.url;
      }
    } catch (error: any) {
      toast.error(error.message || 'No se pudo iniciar el proceso de pago');
      setLoadingPlan(null);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
          Elige tu plan
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Empieza gratis y actualiza cuando necesites más funcionalidades
        </p>
      </div>

      {/* Current Plan Badge */}
      {subscription && (
        <div className="text-center mb-8">
          <Badge variant="outline" className="text-sm px-4 py-2">
            Plan actual: <span className="font-bold ml-1 capitalize">{subscription.plan}</span>
          </Badge>
        </div>
      )}

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((plan) => {
          const Icon = plan.icon;
          const isCurrentPlan = plan.current;
          const canUpgrade = !isCurrentPlan && subscription?.plan !== 'business';
          
          return (
            <Card 
              key={plan.id}
              className={`relative ${plan.highlighted ? 'border-primary border-2 shadow-xl' : 'border-2'} ${isCurrentPlan ? 'ring-2 ring-primary' : ''}`}
            >
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground px-4 py-1">
                    Más Popular
                  </Badge>
                </div>
              )}
              
              {isCurrentPlan && (
                <div className="absolute -top-4 right-4">
                  <Badge className="bg-green-600 text-white px-3 py-1">
                    Plan Actual
                  </Badge>
                </div>
              )}

              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={`w-6 h-6 ${plan.iconColor}`} />
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                </div>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
              </CardHeader>

              <CardContent>
                <Button 
                  className={`w-full mb-6 ${plan.highlighted ? 'bg-primary text-primary-foreground' : ''}`}
                  variant={isCurrentPlan ? 'outline' : plan.highlighted ? 'default' : 'outline'}
                  disabled={isCurrentPlan || loadingPlan !== null}
                  onClick={() => handleUpgrade(plan.id)}
                >
                  {loadingPlan === plan.id ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Procesando...
                    </>
                  ) : isCurrentPlan ? (
                    'Plan Actual'
                  ) : (
                    plan.cta
                  )}
                </Button>

                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <Check 
                        className={`w-5 h-5 shrink-0 mt-0.5 ${
                          feature.included ? 'text-green-600' : 'text-muted-foreground opacity-30'
                        }`}
                      />
                      <span className={feature.included ? 'text-foreground' : 'text-muted-foreground line-through'}>
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* FAQ or Additional Info */}
      <div className="mt-16 text-center">
        <p className="text-muted-foreground">
          ¿Tienes preguntas? <a href="mailto:support@finwrk.app" className="text-primary hover:underline">Contáctanos</a>
        </p>
      </div>
    </div>
  );
}
