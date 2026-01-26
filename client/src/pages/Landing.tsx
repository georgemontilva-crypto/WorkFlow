/**
 * Finwrk Landing Page
 * Slogan: "Recibe pagos. Mantén el control."
 */

import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { 
  Users, FileText, TrendingUp, Target, Bell, Shield,
  Check, X, Menu, Zap, Globe, Lock, Key, Database,
  ArrowRight, Star, ChevronDown, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/_core/hooks/useAuth';

import { Pricing } from '@/components/Pricing';

export default function Landing() {
  const [, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAuthenticated, loading } = useAuth();
    // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (!loading && isAuthenticated) {
      setLocation('/dashboard');
    }
  }, [isAuthenticated, loading, setLocation]);

  const features = [
    {
      icon: FileText,
      title: "Facturación Profesional",
      description: "Crea y envía facturas hermosas en segundos"
    },
    {
      icon: Users,
      title: "Gestión de Clientes",
      description: "Organiza todos tus clientes y proyectos en un solo lugar"
    },
    {
      icon: Globe,
      title: "Multimoneda y Cripto",
      description: "Acepta pagos en moneda fiat y criptomonedas"
    },
    {
      icon: Zap,
      title: "Enlaces de Pago",
      description: "Comparte enlaces de pago personalizados con tus clientes"
    },
    {
      icon: TrendingUp,
      title: "Reportes Financieros",
      description: "Reportes automáticos y análisis detallados"
    },
    {
      icon: Bell,
      title: "Recordatorios Inteligentes",
      description: "Nunca pierdas un pago con recordatorios automáticos"
    }
  ];

  const securityFeatures = [
    {
      icon: Lock,
      title: "Autenticación de Dos Factores",
      description: "Capa adicional de seguridad para tu cuenta"
    },
    {
      icon: Database,
      title: "Encriptación de Extremo a Extremo",
      description: "Tus datos están encriptados en reposo y en tránsito"
    },
    {
      icon: Key,
      title: "Custodia Externa de Wallets",
      description: "Activos cripto asegurados con estándares de la industria"
    },
    {
      icon: Shield,
      title: "Cumplimiento Normativo",
      description: "Construido para cumplir con regulaciones financieras"
    }
  ];

  const plans = [
    {
      name: "Gratis",
      price: "$0",
      period: "/para siempre",
      description: "Perfecto para comenzar",
      features: [
        { text: "Panel básico", included: true },
        { text: "Hasta 3 clientes", included: true },
        { text: "Máximo 5 facturas", included: true },
        { text: "Visualización de cripto", included: true },
        { text: "Enlaces de pago", included: false },
        { text: "Automatizaciones", included: false }
      ],
      cta: "Comenzar Gratis",
      highlighted: false
    },
    {
      name: "Pro",
      price: "$15",
      period: "/mes",
      description: "Para negocios en crecimiento",
      features: [
        { text: "Clientes ilimitados", included: true },
        { text: "Facturas ilimitadas", included: true },
        { text: "Multimoneda", included: true },
        { text: "Enlaces de pago", included: true },
        { text: "Pagos cripto", included: true },
        { text: "Automatizaciones", included: true },
        { text: "Reportes financieros", included: true }
      ],
      cta: "Probar Pro Gratis",
      highlighted: true
    },
    {
      name: "Empresarial",
      price: "$29",
      period: "/mes",
      description: "Para equipos y agencias",
      features: [
        { text: "Todo en Pro", included: true },
        { text: "Cuentas multiusuario", included: true },
        { text: "Roles y permisos", included: true },
        { text: "API pública", included: true },
        { text: "Marca blanca", included: true },
        { text: "Soporte prioritario", included: true }
      ],
      cta: "Contactar Ventas",
      highlighted: false
    }
  ];

  const howItWorks = [
    {
      step: "1",
      title: "Regístrate Gratis",
      description: "Crea tu cuenta en menos de 60 segundos"
    },
    {
      step: "2",
      title: "Agrega Clientes y Crea Facturas",
      description: "Configura tus clientes y comienza a facturar"
    },
    {
      step: "3",
      title: "Recibe Pagos",
      description: "Comparte enlaces de pago y recibe pagos al instante"
    }
  ];

  const faqs = [
    {
      question: "¿Finwrk es realmente gratis?",
      answer: "¡Sí! Nuestro plan Gratis es completamente gratuito para siempre sin necesidad de tarjeta de crédito."
    },
    {
      question: "¿Puedo aceptar pagos en criptomonedas?",
      answer: "Sí, los planes Pro y Empresarial soportan pagos cripto con custodia externa para máxima seguridad."
    },
    {
      question: "¿Mis datos financieros están seguros?",
      answer: "Absolutamente. Usamos encriptación de extremo a extremo, 2FA y seguimos las mejores prácticas de la industria para la seguridad de datos."
    },
    {
      question: "¿Puedo mejorar o reducir mi plan?",
      answer: "Sí, puedes mejorar o reducir tu plan en cualquier momento. Los cambios toman efecto inmediatamente."
    }
  ];

  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center">
            <img src="/finwrk-logo.png" alt="Finwrk" className="h-10 w-auto" />
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <button 
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors bg-transparent border-none cursor-pointer"
            >
              Características
            </button>
            <button 
              onClick={() => document.getElementById('security')?.scrollIntoView({ behavior: 'smooth' })}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors bg-transparent border-none cursor-pointer"
            >
              Seguridad
            </button>
            <button 
              onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors bg-transparent border-none cursor-pointer"
            >
              Precios
            </button>
            <button 
              onClick={() => document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' })}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors bg-transparent border-none cursor-pointer"
            >
              Preguntas Frecuentes
            </button>

            <Button 
              onClick={() => setLocation('/login')} 
              variant="outline"
              className="border-white text-white bg-black hover:bg-white hover:text-black transition-colors"
            >
              Iniciar Sesión
            </Button>
            <Button onClick={() => setLocation('/signup')} className="">
              Comenzar Gratis
            </Button>
          </nav>
          
          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-foreground hover:bg-accent rounded-md transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
        
        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-background border-t border-border">
            <nav className="container mx-auto px-4 py-4 flex flex-col gap-4">
              <button 
                onClick={() => {
                  setMobileMenuOpen(false);
                  setTimeout(() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' }), 100);
                }}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors py-2 text-left bg-transparent border-none cursor-pointer"
              >
                Características
              </button>
              <button 
                onClick={() => {
                  setMobileMenuOpen(false);
                  setTimeout(() => document.getElementById('security')?.scrollIntoView({ behavior: 'smooth' }), 100);
                }}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors py-2 text-left bg-transparent border-none cursor-pointer"
              >
                Seguridad
              </button>
              <button 
                onClick={() => {
                  setMobileMenuOpen(false);
                  setTimeout(() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' }), 100);
                }}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors py-2 text-left bg-transparent border-none cursor-pointer"
              >
                Precios
              </button>
              <button 
                onClick={() => {
                  setMobileMenuOpen(false);
                  setTimeout(() => document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' }), 100);
                }}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors py-2 text-left bg-transparent border-none cursor-pointer"
              >
                Preguntas Frecuentes
              </button>
              <div className="pt-2 border-t border-border space-y-3">
    
                <div className="flex items-center gap-3">
                  <Button 
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setLocation('/login');
                    }} 
                    variant="outline"
                    className="border-white text-white bg-black hover:bg-white hover:text-black transition-colors flex-1"
                  >
                    Iniciar Sesión
                  </Button>
                  <Button 
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setLocation('/signup');
                    }} 
                    className="bg-primary text-primary-foreground hover:opacity-90 flex-1"
                  >
                    Comenzar Gratis
                  </Button>
                </div>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-4" style={{ paddingTop: 'calc(8rem + env(safe-area-inset-top))' }}>
        <div className="container mx-auto max-w-5xl text-center">
          <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 bg-primary/10 text-primary rounded-md text-sm font-medium">
            <Sparkles className="w-4 h-4" />
            <span>Ahora aceptamos pagos cripto</span>
          </div>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 leading-tight">
            Recibe pagos.
            <br />
            <span className="text-primary">Mantén el control.</span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Facturación profesional y gestión financiera para freelancers y negocios. 
            Acepta pagos en fiat y cripto con seguridad de nivel bancario.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              size="lg" 
              onClick={() => setLocation('/signup')}
              className="bg-primary text-primary-foreground hover:opacity-90 text-lg px-8 py-6"
            >
              Comenzar Gratis <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              className="text-lg px-8 py-6"
            >
              Ver Cómo Funciona
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-6">
            No se requiere tarjeta de crédito • Plan gratis disponible para siempre
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-accent/5">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Todo lo que necesitas para recibir pagos
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Funcionalidades poderosas diseñadas para negocios modernos
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border hover:border-primary/50 transition-all hover:shadow-lg">
                <CardHeader>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section id="security" className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 bg-primary/10 text-primary rounded-md text-sm font-medium">
              <Shield className="w-4 h-4" />
              <span>Seguridad Primero</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Seguridad de nivel bancario para tus datos financieros
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Tu seguridad es nuestra máxima prioridad. Implementamos prácticas líderes de la industria para mantener tus datos seguros.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {securityFeatures.map((feature, index) => (
              <Card key={index} className="border">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center shrink-0">
                      <feature.icon className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <CardTitle className="text-xl mb-2">{feature.title}</CardTitle>
                      <p className="text-muted-foreground">{feature.description}</p>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>



      {/* How It Works Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Comienza en minutos
            </h2>
            <p className="text-xl text-muted-foreground">
              Tres simples pasos para comenzar a recibir pagos
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {howItWorks.map((step, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-3xl font-bold text-primary mx-auto mb-4">
                  {step.step}
                </div>
                <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 px-4 bg-accent/5">
        <div className="container mx-auto max-w-3xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Preguntas Frecuentes
            </h2>
          </div>
          
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <Card key={index} className="border">
                <CardHeader 
                  className="cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                >
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{faq.question}</CardTitle>
                    <ChevronDown 
                      className={`w-5 h-5 transition-transform ${openFaq === index ? 'rotate-180' : ''}`}
                    />
                  </div>
                </CardHeader>
                {openFaq === index && (
                  <CardContent>
                    <p className="text-muted-foreground">{faq.answer}</p>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            ¿Listo para tomar el control de tus finanzas?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Únete a miles de negocios usando Finwrk para recibir pagos más rápido
          </p>
          <Button 
            size="lg" 
            onClick={() => setLocation('/signup')}
            className="bg-primary text-primary-foreground hover:opacity-90 text-lg px-8 py-6"
          >
            Comenzar Gratis Hoy <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </section>

      {/* Pricing Section */}
      <Pricing />

      {/* Footer */}
      <footer className="border-t border-border py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center mb-4">
                <img src="/finwrk-logo.png" alt="Finwrk" className="h-8 w-auto" />
              </div>
              <p className="text-sm text-muted-foreground">
                Recibe pagos. Mantén el control.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Producto</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><button onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-foreground transition-colors bg-transparent border-none cursor-pointer p-0">Características</button></li>
                <li><button onClick={() => document.getElementById('security')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-foreground transition-colors bg-transparent border-none cursor-pointer p-0">Seguridad</button></li>
                <li><button onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-foreground transition-colors bg-transparent border-none cursor-pointer p-0">Precios</button></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Empresa</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Acerca de</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Contacto</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Privacidad</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Términos</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Seguridad</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-border pt-8 text-center text-sm text-muted-foreground">
            <p>© 2026 Finwrk. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
