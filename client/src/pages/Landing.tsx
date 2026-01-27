import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { 
  FileText, TrendingUp, Users, ArrowRight, Menu, X,
  Bell, Shield, Lock, Download, Eye, Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/finwrk-logo.png" alt="Finwrk" className="h-8" />
          </div>
          <div className="hidden md:flex items-center gap-4">
            <Button 
              variant="ghost" 
              onClick={() => setLocation('/login')}
              className="text-white hover:text-[#C4FF3D]"
            >
              Iniciar Sesión
            </Button>
            <Button 
              onClick={() => setLocation('/signup')}
              className="bg-[#C4FF3D] text-black hover:bg-[#b3e835] font-semibold"
            >
              Empezar ahora
            </Button>
          </div>
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
        {mobileMenuOpen && (
          <div className="md:hidden px-6 py-4 border-t border-white/10">
            <div className="flex flex-col gap-3">
              <Button 
                variant="ghost" 
                onClick={() => setLocation('/login')}
                className="w-full justify-start text-white"
              >
                Iniciar Sesión
              </Button>
              <Button 
                onClick={() => setLocation('/signup')}
                className="w-full bg-[#C4FF3D] text-black"
              >
                Empezar ahora
              </Button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#C4FF3D]/5 to-transparent"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center max-w-4xl mx-auto mb-16">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              Claridad real sobre
              <br />
              <span className="text-[#C4FF3D]">tu dinero</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-400 mb-8 leading-relaxed">
              Organiza clientes, facturas y pagos en un solo lugar.
              <br />
              Finwrk te dice qué cobraste, qué falta y cómo va tu mes.
            </p>
            <div className="flex gap-4 justify-center">
              <Button 
                size="lg" 
                onClick={() => setLocation('/signup')}
                className="bg-[#C4FF3D] text-black hover:bg-[#b3e835] font-semibold text-lg px-8 py-6 rounded-full"
              >
                Empezar ahora
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Hero Screenshot */}
          <div className="relative max-w-6xl mx-auto">
            <div className="absolute inset-0 bg-[#C4FF3D]/20 blur-[120px] rounded-full"></div>
            <div className="relative rounded-3xl overflow-hidden border-2 border-[#C4FF3D]/30 shadow-2xl shadow-[#C4FF3D]/10">
              <img 
                src="/landing-images/screenshot-finanzas.png" 
                alt="Dashboard de Finanzas de Finwrk"
                className="w-full h-auto"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-20 px-6 bg-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">¿Te suena familiar?</h2>
            <p className="text-xl text-gray-400">Estos son los problemas que resolvemos</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-black border border-white/10 rounded-3xl p-8 hover:border-[#C4FF3D]/50 transition-all">
              <div className="w-12 h-12 rounded-full bg-[#C4FF3D]/10 flex items-center justify-center mb-6">
                <FileText className="w-6 h-6 text-[#C4FF3D]" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Facturas por aquí, pagos por allá</h3>
              <p className="text-gray-400">
                Un Excel para intentar entender todo. Pierdes tiempo buscando información dispersa.
              </p>
            </div>

            <div className="bg-black border border-white/10 rounded-3xl p-8 hover:border-[#C4FF3D]/50 transition-all">
              <div className="w-12 h-12 rounded-full bg-[#C4FF3D]/10 flex items-center justify-center mb-6">
                <TrendingUp className="w-6 h-6 text-[#C4FF3D]" />
              </div>
              <h3 className="text-xl font-semibold mb-4">No saber cuánto dinero tienes</h3>
              <p className="text-gray-400">
                No tienes certeza de cuándo te pagarán o cuánto dinero tienes realmente disponible.
              </p>
            </div>

            <div className="bg-black border border-white/10 rounded-3xl p-8 hover:border-[#C4FF3D]/50 transition-all">
              <div className="w-12 h-12 rounded-full bg-[#C4FF3D]/10 flex items-center justify-center mb-6">
                <Eye className="w-6 h-6 text-[#C4FF3D]" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Decisiones a ciegas</h3>
              <p className="text-gray-400">
                La sensación de no tener el control de tus finanzas y tomar decisiones sin datos claros.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section with Screenshots */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Feature 1: Gestión de Clientes */}
          <div className="grid md:grid-cols-2 gap-12 items-center mb-32">
            <div>
              <div className="inline-block px-4 py-2 bg-[#C4FF3D]/10 rounded-full mb-6">
                <span className="text-[#C4FF3D] font-semibold">Gestión de Clientes</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Todos tus clientes en un solo lugar
              </h2>
              <p className="text-xl text-gray-400 mb-8 leading-relaxed">
                Organiza tu cartera de clientes con toda la información que necesitas: contacto, proyectos, historial de facturas y pagos.
              </p>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#C4FF3D]/20 flex items-center justify-center flex-shrink-0 mt-1">
                    <div className="w-2 h-2 rounded-full bg-[#C4FF3D]"></div>
                  </div>
                  <span className="text-gray-300">Historial completo de cada cliente</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#C4FF3D]/20 flex items-center justify-center flex-shrink-0 mt-1">
                    <div className="w-2 h-2 rounded-full bg-[#C4FF3D]"></div>
                  </div>
                  <span className="text-gray-300">Filtros por estado (Activo/Inactivo)</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#C4FF3D]/20 flex items-center justify-center flex-shrink-0 mt-1">
                    <div className="w-2 h-2 rounded-full bg-[#C4FF3D]"></div>
                  </div>
                  <span className="text-gray-300">Búsqueda rápida y organización simple</span>
                </li>
              </ul>
            </div>
            <div className="relative">
              <div className="absolute -inset-4 bg-[#C4FF3D]/10 blur-3xl rounded-full"></div>
              <div className="relative rounded-3xl overflow-hidden border border-[#C4FF3D]/30">
                <img 
                  src="/landing-images/screenshot-clientes.png" 
                  alt="Gestión de Clientes en Finwrk"
                  className="w-full h-auto"
                />
              </div>
            </div>
          </div>

          {/* Feature 2: Facturación */}
          <div className="grid md:grid-cols-2 gap-12 items-center mb-32">
            <div className="order-2 md:order-1 relative">
              <div className="absolute -inset-4 bg-[#C4FF3D]/10 blur-3xl rounded-full"></div>
              <div className="relative rounded-3xl overflow-hidden border border-[#C4FF3D]/30">
                <img 
                  src="/landing-images/screenshot-facturas.png" 
                  alt="Facturación en Finwrk"
                  className="w-full h-auto"
                />
              </div>
            </div>
            <div className="order-1 md:order-2">
              <div className="inline-block px-4 py-2 bg-[#C4FF3D]/10 rounded-full mb-6">
                <span className="text-[#C4FF3D] font-semibold">Facturación Profesional</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Crea y envía facturas en segundos
              </h2>
              <p className="text-xl text-gray-400 mb-8 leading-relaxed">
                Facturas hermosas y profesionales que tus clientes reciben por email. Pueden pagarlas desde un enlace único.
              </p>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#C4FF3D]/20 flex items-center justify-center flex-shrink-0 mt-1">
                    <div className="w-2 h-2 rounded-full bg-[#C4FF3D]"></div>
                  </div>
                  <span className="text-gray-300">Envío automático por email</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#C4FF3D]/20 flex items-center justify-center flex-shrink-0 mt-1">
                    <div className="w-2 h-2 rounded-full bg-[#C4FF3D]"></div>
                  </div>
                  <span className="text-gray-300">Estados claros (Pagada, Pendiente, En Revisión)</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#C4FF3D]/20 flex items-center justify-center flex-shrink-0 mt-1">
                    <div className="w-2 h-2 rounded-full bg-[#C4FF3D]"></div>
                  </div>
                  <span className="text-gray-300">Recordatorios automáticos de vencimiento</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Feature 3: Dashboard Financiero */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-block px-4 py-2 bg-[#C4FF3D]/10 rounded-full mb-6">
                <span className="text-[#C4FF3D] font-semibold">Dashboard Financiero</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Visualiza tus números en tiempo real
              </h2>
              <p className="text-xl text-gray-400 mb-8 leading-relaxed">
                Gráficos claros que te muestran cómo va tu mes. Ingresos, gastos y balance al instante.
              </p>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#C4FF3D]/20 flex items-center justify-center flex-shrink-0 mt-1">
                    <div className="w-2 h-2 rounded-full bg-[#C4FF3D]"></div>
                  </div>
                  <span className="text-gray-300">Tendencia mensual de ingresos</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#C4FF3D]/20 flex items-center justify-center flex-shrink-0 mt-1">
                    <div className="w-2 h-2 rounded-full bg-[#C4FF3D]"></div>
                  </div>
                  <span className="text-gray-300">Comparativa mensual automática</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#C4FF3D]/20 flex items-center justify-center flex-shrink-0 mt-1">
                    <div className="w-2 h-2 rounded-full bg-[#C4FF3D]"></div>
                  </div>
                  <span className="text-gray-300">Transacciones recientes con detalle</span>
                </li>
              </ul>
            </div>
            <div className="relative">
              <div className="absolute -inset-4 bg-[#C4FF3D]/10 blur-3xl rounded-full"></div>
              <div className="relative rounded-3xl overflow-hidden border border-[#C4FF3D]/30">
                <img 
                  src="/landing-images/screenshot-finanzas.png" 
                  alt="Dashboard Financiero de Finwrk"
                  className="w-full h-auto"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Additional Features Grid */}
      <section className="py-20 px-6 bg-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Todo lo que necesitas</h2>
            <p className="text-xl text-gray-400">Funcionalidades diseñadas para tu tranquilidad</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-black border border-white/10 rounded-3xl p-8 hover:border-[#C4FF3D]/50 transition-all">
              <div className="w-12 h-12 rounded-full bg-[#C4FF3D]/10 flex items-center justify-center mb-6">
                <Bell className="w-6 h-6 text-[#C4FF3D]" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Recordatorios Automáticos</h3>
              <p className="text-gray-400">
                Nunca pierdas un pago. Finwrk envía recordatorios automáticos a tus clientes cuando una factura está por vencer.
              </p>
            </div>

            <div className="bg-black border border-white/10 rounded-3xl p-8 hover:border-[#C4FF3D]/50 transition-all">
              <div className="w-12 h-12 rounded-full bg-[#C4FF3D]/10 flex items-center justify-center mb-6">
                <Zap className="w-6 h-6 text-[#C4FF3D]" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Portal de Clientes</h3>
              <p className="text-gray-400">
                Tus clientes pueden ver facturas, descargar PDFs y subir comprobantes de pago sin necesidad de crear una cuenta.
              </p>
            </div>

            <div className="bg-black border border-white/10 rounded-3xl p-8 hover:border-[#C4FF3D]/50 transition-all">
              <div className="w-12 h-12 rounded-full bg-[#C4FF3D]/10 flex items-center justify-center mb-6">
                <Shield className="w-6 h-6 text-[#C4FF3D]" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Autenticación 2FA</h3>
              <p className="text-gray-400">
                Capa adicional de seguridad para tu cuenta. Tus datos financieros siempre protegidos.
              </p>
            </div>

            <div className="bg-black border border-white/10 rounded-3xl p-8 hover:border-[#C4FF3D]/50 transition-all">
              <div className="w-12 h-12 rounded-full bg-[#C4FF3D]/10 flex items-center justify-center mb-6">
                <Lock className="w-6 h-6 text-[#C4FF3D]" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Encriptación Total</h3>
              <p className="text-gray-400">
                Tus datos están encriptados de extremo a extremo. Privacidad y seguridad garantizadas.
              </p>
            </div>

            <div className="bg-black border border-white/10 rounded-3xl p-8 hover:border-[#C4FF3D]/50 transition-all">
              <div className="w-12 h-12 rounded-full bg-[#C4FF3D]/10 flex items-center justify-center mb-6">
                <Download className="w-6 h-6 text-[#C4FF3D]" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Exportación de Datos</h3>
              <p className="text-gray-400">
                Eres dueño de tu información. Expórtala cuando quieras en formatos estándar.
              </p>
            </div>

            <div className="bg-black border border-white/10 rounded-3xl p-8 hover:border-[#C4FF3D]/50 transition-all">
              <div className="w-12 h-12 rounded-full bg-[#C4FF3D]/10 flex items-center justify-center mb-6">
                <Users className="w-6 h-6 text-[#C4FF3D]" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Para Freelancers y Agencias</h3>
              <p className="text-gray-400">
                Diseñado específicamente para personas que trabajan de forma independiente o en equipos pequeños.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#C4FF3D]/5 to-transparent"></div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-5xl md:text-6xl font-bold mb-6">
            Recupera el control de tus finanzas hoy
          </h2>
          <p className="text-xl text-gray-400 mb-12">
            Únete a freelancers y agencias que ya tienen claridad sobre su dinero.
          </p>
          <Button 
            size="lg" 
            onClick={() => setLocation('/signup')}
            className="bg-[#C4FF3D] text-black hover:bg-[#b3e835] font-semibold text-lg px-12 py-8 rounded-full shadow-lg shadow-[#C4FF3D]/20"
          >
            Empezar ahora
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <img src="/finwrk-logo.png" alt="Finwrk" className="h-8" />
            </div>
            <div className="flex gap-8 text-sm text-gray-400">
              <button className="hover:text-[#C4FF3D] transition-colors">Privacidad</button>
              <button className="hover:text-[#C4FF3D] transition-colors">Términos</button>
            </div>
            <p className="text-sm text-gray-500">
              © 2026 Finwrk. Gestión Financiera para Freelancers.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
