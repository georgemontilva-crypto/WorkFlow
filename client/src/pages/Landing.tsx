/**
 * Finwrk Landing Page
 * Landing completa con todas las funcionalidades
 */

import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { 
  FileText, TrendingUp, Users, ArrowRight, Menu, X, Check,
  Bell, Globe, Shield, Lock, Database, Zap
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

  const features = [
    {
      icon: FileText,
      title: "Facturación Profesional",
      description: "Crea y envía facturas hermosas en segundos. Tus clientes las reciben por email y pueden pagarlas desde un enlace único."
    },
    {
      icon: Users,
      title: "Gestión de Clientes",
      description: "Organiza todos tus clientes y proyectos en un solo lugar. Historial completo de cada relación comercial."
    },
    {
      icon: TrendingUp,
      title: "Dashboard Financiero",
      description: "Vista en tiempo real de ingresos, gastos y balance. Gráficos claros que te muestran cómo va tu mes."
    },
    {
      icon: Globe,
      title: "Multimoneda y Cripto",
      description: "Acepta pagos en cualquier moneda, incluyendo criptomonedas. Finwrk se adapta a como trabajas."
    },
    {
      icon: Bell,
      title: "Recordatorios Automáticos",
      description: "Nunca pierdas un pago. Finwrk envía recordatorios automáticos a tus clientes cuando una factura está por vencer."
    },
    {
      icon: Zap,
      title: "Portal de Clientes",
      description: "Tus clientes pueden ver facturas, descargar PDFs y subir comprobantes de pago sin necesidad de crear una cuenta."
    }
  ];

  const securityFeatures = [
    {
      icon: Lock,
      title: "Autenticación de Dos Factores",
      description: "Capa adicional de seguridad para tu cuenta."
    },
    {
      icon: Database,
      title: "Encriptación de Extremo a Extremo",
      description: "Tus datos están encriptados y seguros."
    },
    {
      icon: Shield,
      title: "Exportación de Datos",
      description: "Eres dueño de tu información, expórtala cuando quieras."
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
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="/landing-images/team-working.jpg" 
            alt="Equipo trabajando" 
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background"></div>
        </div>
        
        <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-8 max-w-5xl mx-auto">
            Claridad real sobre tu dinero.{' '}
            <span className="text-primary">Sin complicarte.</span>
          </h1>
          <p className="text-xl sm:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed">
            Organiza clientes, facturas y pagos en un solo lugar. Finwrk te dice qué cobraste, 
            qué falta y cómo va tu mes.
          </p>
          <Button 
            size="lg"
            onClick={() => setLocation('/signup')}
            className="bg-primary text-primary-foreground hover:bg-primary/90 text-lg px-12 py-7 rounded-full shadow-lg shadow-primary/25"
          >
            Empezar ahora
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/20">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">¿Te suena familiar?</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-card border-border hover:border-destructive/50 transition-colors">
              <CardContent className="p-8 space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-destructive/10 flex items-center justify-center">
                  <FileText className="w-7 h-7 text-destructive" strokeWidth={1.5} />
                </div>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Facturas por aquí, pagos por allá, y un Excel para intentar entender todo.
                </p>
              </CardContent>
            </Card>
            <Card className="bg-card border-border hover:border-destructive/50 transition-colors">
              <CardContent className="p-8 space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-destructive/10 flex items-center justify-center">
                  <TrendingUp className="w-7 h-7 text-destructive" strokeWidth={1.5} />
                </div>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  No saber con certeza cuándo te pagarán o cuánto dinero tienes realmente disponible.
                </p>
              </CardContent>
            </Card>
            <Card className="bg-card border-border hover:border-destructive/50 transition-colors">
              <CardContent className="p-8 space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-destructive/10 flex items-center justify-center">
                  <Users className="w-7 h-7 text-destructive" strokeWidth={1.5} />
                </div>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  La sensación de no tener el control de tus finanzas y tomar decisiones a ciegas.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1">
              <div className="relative rounded-3xl overflow-hidden border-2 border-primary/20 shadow-2xl shadow-primary/10">
                <img 
                  src="/landing-images/finanzas-dashboard.png" 
                  alt="Dashboard de Finanzas en Finwrk" 
                  className="w-full h-auto"
                />
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-8 leading-tight">
                Tu workspace financiero, diseñado para personas que trabajan.
              </h2>
              <p className="text-xl text-muted-foreground leading-relaxed mb-8">
                No es un ERP complicado ni un banco. Es tu espacio para tener control real.
              </p>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                    <Check className="w-6 h-6 text-primary" strokeWidth={3} />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Gestión de clientes y facturas</h3>
                    <p className="text-muted-foreground leading-relaxed">Todo centralizado, nada se pierde.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                    <Check className="w-6 h-6 text-primary" strokeWidth={3} />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Control de pagos en tiempo real</h3>
                    <p className="text-muted-foreground leading-relaxed">Sabe qué está pagado y qué no.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                    <Check className="w-6 h-6 text-primary" strokeWidth={3} />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Reportes financieros claros</h3>
                    <p className="text-muted-foreground leading-relaxed">Visualiza ingresos, gastos y balance al instante.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/20">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
              Todo lo que necesitas para tener el control.
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="bg-card border-border hover:border-primary/50 transition-colors">
                <CardContent className="p-8 space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <feature.icon className="w-8 h-8 text-primary" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-xl font-semibold">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
              Tres pasos. Claridad inmediata.
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <Users className="w-10 h-10 text-primary" strokeWidth={1.5} />
              </div>
              <h3 className="text-2xl font-bold">Registra</h3>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Clientes y facturas en un solo lugar.
              </p>
            </div>
            <div className="text-center space-y-4">
              <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <FileText className="w-10 h-10 text-primary" strokeWidth={1.5} />
              </div>
              <h3 className="text-2xl font-bold">Controla</h3>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Marca pagos y haz seguimiento.
              </p>
            </div>
            <div className="text-center space-y-4">
              <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <TrendingUp className="w-10 h-10 text-primary" strokeWidth={1.5} />
              </div>
              <h3 className="text-2xl font-bold">Visualiza</h3>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Ingresos reales, en tiempo real.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/20">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
              Tu tranquilidad es nuestra prioridad.
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {securityFeatures.map((feature, index) => (
              <Card key={index} className="bg-card border-border">
                <CardContent className="p-8 space-y-4 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                    <feature.icon className="w-8 h-8 text-primary" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-xl font-semibold">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-8">
            Recupera el control de tus finanzas hoy.
          </h2>
          <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed">
            Únete a freelancers y agencias que ya tienen claridad sobre su dinero.
          </p>
          <Button 
            size="lg"
            onClick={() => setLocation('/signup')}
            className="bg-primary text-primary-foreground hover:bg-primary/90 text-lg px-12 py-7 rounded-full shadow-lg shadow-primary/25"
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
