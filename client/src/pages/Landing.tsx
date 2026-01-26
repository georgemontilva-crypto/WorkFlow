/**
 * Finwrk Landing Page
 * Enfoque: Claridad, problemas reales y valor emocional
 */

import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { 
  FileText, Users, TrendingUp, Menu, X,
  AlertCircle, CheckCircle, ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/_core/hooks/useAuth';

export default function Landing() {
  const [, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      setLocation('/dashboard');
    }
  }, [isAuthenticated, loading, setLocation]);

  const problems = [
    {
      icon: FileText,
      text: "Facturas en un lado, pagos en otro, y un Excel para intentar entender todo."
    },
    {
      icon: AlertCircle,
      text: "No saber con certeza cuándo te pagarán o cuánto dinero tienes realmente disponible."
    },
    {
      icon: TrendingUp,
      text: "La sensación de no tener el control de tus finanzas y tomar decisiones a ciegas."
    }
  ];

  const steps = [
    {
      number: "1",
      title: "Registra tus clientes y facturas",
      description: "Centraliza toda la información de tus proyectos y lo que tienes que cobrar."
    },
    {
      number: "2",
      title: "Registra pagos y seguimientos",
      description: "Marca las facturas como pagadas y lleva un control de lo que está pendiente."
    },
    {
      number: "3",
      title: "Visualiza tus ingresos reales",
      description: "Ten una vista clara y en tiempo real de cómo va tu negocio cada mes."
    }
  ];

  const benefits = [
    {
      icon: CheckCircle,
      title: "Menos caos",
      description: "Olvídate de los Excels y las carpetas desordenadas."
    },
    {
      icon: CheckCircle,
      title: "Más claridad",
      description: "Entiende tus números de un vistazo."
    },
    {
      icon: CheckCircle,
      title: "Decisiones más tranquilas",
      description: "Toma decisiones informadas sobre tu negocio y tu dinero."
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <img src="/finwrk-logo.png" alt="Finwrk" className="h-8" />
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-6">
              <Button 
                variant="ghost" 
                onClick={() => setLocation('/login')}
                className="text-foreground hover:text-primary"
              >
                Iniciar Sesión
              </Button>
              <Button 
                onClick={() => setLocation('/signup')}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Empezar ahora
              </Button>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 space-y-2 border-t border-border">
              <Button 
                variant="ghost" 
                onClick={() => setLocation('/login')}
                className="w-full justify-start"
              >
                Iniciar Sesión
              </Button>
              <Button 
                onClick={() => setLocation('/signup')}
                className="w-full bg-primary text-primary-foreground"
              >
                Empezar ahora
              </Button>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 sm:pt-32 pb-16 sm:pb-20 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                Ten claridad real sobre tu dinero,{' '}
                <span className="text-primary">sin complicarte.</span>
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Finwrk organiza tus clientes, facturas y pagos para que sepas qué cobraste, 
                qué falta por cobrar y cómo va tu mes.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg"
                  onClick={() => setLocation('/signup')}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 text-lg px-8 py-6"
                >
                  Empezar ahora
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button 
                  size="lg"
                  variant="outline"
                  onClick={() => document.getElementById('como-funciona')?.scrollIntoView({ behavior: 'smooth' })}
                  className="text-lg px-8 py-6"
                >
                  Ver cómo funciona
                </Button>
              </div>
            </div>
            <div className="relative">
              <div className="relative rounded-3xl overflow-hidden border border-border shadow-2xl">
                <img 
                  src="/landing-images/hero-freelancer.jpg" 
                  alt="Freelancer trabajando tranquilo" 
                  className="w-full h-auto"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">¿Te suena familiar?</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {problems.map((problem, index) => (
              <Card key={index} className="bg-card border-border hover:border-primary/50 transition-colors">
                <CardContent className="p-8 space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-destructive/10 flex items-center justify-center">
                    <problem.icon className="w-7 h-7 text-destructive" strokeWidth={1.5} />
                  </div>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    {problem.text}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <div className="relative rounded-3xl overflow-hidden border border-border shadow-2xl">
                <img 
                  src="/landing-images/dashboard-mockup.png" 
                  alt="Dashboard de Finwrk" 
                  className="w-full h-auto"
                />
              </div>
            </div>
            <div className="order-1 lg:order-2 space-y-6">
              <h2 className="text-3xl sm:text-4xl font-bold leading-tight">
                Todo tu flujo financiero, en un solo lugar y con claridad.
              </h2>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Finwrk no es un ERP complicado ni un banco. Es tu workspace financiero, 
                diseñado para personas que trabajan.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="como-funciona" className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Menos caos, más claridad en 3 simples pasos.
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <Card key={index} className="bg-card border-border relative overflow-hidden">
                <CardContent className="p-8 space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                    <span className="text-3xl font-bold text-primary">{step.number}</span>
                  </div>
                  <h3 className="text-xl font-semibold">{step.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Diseñado para la tranquilidad, no para la contabilidad.
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <Card key={index} className="bg-card border-border hover:border-primary/50 transition-colors">
                <CardContent className="p-8 space-y-4 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                    <benefit.icon className="w-7 h-7 text-primary" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-xl font-semibold">{benefit.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {benefit.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            Recupera el control de tus finanzas hoy.
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Únete a cientos de freelancers y agencias que ya tienen claridad sobre su dinero.
          </p>
          <Button 
            size="lg"
            onClick={() => setLocation('/signup')}
            className="bg-primary text-primary-foreground hover:bg-primary/90 text-lg px-12 py-6"
          >
            Empezar ahora
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-border">
        <div className="container mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <img src="/finwrk-logo.png" alt="Finwrk" className="h-6" />
              <span className="text-sm text-muted-foreground">© 2025 Finwrk. Todos los derechos reservados.</span>
            </div>
            <div className="flex gap-6">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                Privacidad
              </Button>
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                Términos
              </Button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
