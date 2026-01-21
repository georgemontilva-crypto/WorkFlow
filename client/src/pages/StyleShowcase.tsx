/**
 * StyleShowcase - Demostración de los nuevos estilos Banking UI
 * Este componente muestra todos los nuevos estilos y componentes visuales
 */

import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Wallet, 
  Send, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  FileText, 
  Target,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  Plus
} from 'lucide-react';

export default function StyleShowcase() {
  return (
    <DashboardLayout>
      <div className="container mx-auto py-8 space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold gradient-green bg-clip-text text-transparent">
            Banking UI Showcase
          </h1>
          <p className="text-muted-foreground">
            Demostración de los nuevos estilos inspirados en diseño bancario moderno
          </p>
        </div>

        {/* Sección: Paleta de Colores */}
        <section className="space-y-4">
          <h2 className="section-title">Paleta de Colores</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="glass-card p-6 space-y-2">
              <div className="w-full h-20 rounded-[22px] bg-primary"></div>
              <p className="text-sm font-medium">Primary</p>
              <p className="text-xs text-muted-foreground">Verde Teal</p>
            </div>
            <div className="glass-card p-6 space-y-2">
              <div className="w-full h-20 rounded-[22px] bg-accent"></div>
              <p className="text-sm font-medium">Accent</p>
              <p className="text-xs text-muted-foreground">Amarillo Neón</p>
            </div>
            <div className="glass-card p-6 space-y-2">
              <div className="w-full h-20 rounded-[22px] gradient-green"></div>
              <p className="text-sm font-medium">Gradient</p>
              <p className="text-xs text-muted-foreground">Verde Multi-tono</p>
            </div>
            <div className="glass-card p-6 space-y-2">
              <div className="w-full h-20 rounded-[22px] bg-card"></div>
              <p className="text-sm font-medium">Card</p>
              <p className="text-xs text-muted-foreground">Fondo Tarjeta</p>
            </div>
            <div className="glass-card p-6 space-y-2">
              <div className="w-full h-20 rounded-[22px] bg-destructive"></div>
              <p className="text-sm font-medium">Destructive</p>
              <p className="text-xs text-muted-foreground">Rojo Sutil</p>
            </div>
          </div>
        </section>

        {/* Sección: Botones */}
        <section className="space-y-4">
          <h2 className="section-title">Botones</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>CTA Button</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="btn-cta w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Crear Nuevo
                </Button>
                <p className="text-xs text-muted-foreground">
                  Amarillo neón para acciones principales
                </p>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Primary Green</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="btn-primary-green w-full">
                  <Send className="w-4 h-4 mr-2" />
                  Enviar Dinero
                </Button>
                <p className="text-xs text-muted-foreground">
                  Verde para acciones secundarias
                </p>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Glass Button</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="glass-button w-full">
                  <Wallet className="w-4 h-4 mr-2" />
                  Ver Más
                </Button>
                <p className="text-xs text-muted-foreground">
                  Transparente con efecto vidrio
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Sección: Tarjeta de Balance (Estilo Banking) */}
        <section className="space-y-4">
          <h2 className="section-title">Tarjeta de Balance</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card-gradient-green p-8 glow-green">
              <div className="flex items-center justify-between mb-6">
                <div className="icon-container">
                  <CreditCard className="w-6 h-6 text-primary" />
                </div>
                <Badge className="bg-accent text-accent-foreground font-semibold">
                  VISA
                </Badge>
              </div>
              
              <p className="text-muted-foreground text-sm mb-2">
                Balance Total
              </p>
              
              <h2 className="balance-display gradient-green bg-clip-text text-transparent">
                $12,450.75
              </h2>
              
              <div className="flex items-center gap-2 mt-2 mb-6">
                <ArrowUpRight className="w-4 h-4 text-chart-3" />
                <span className="text-sm text-chart-3 font-medium">+12.5% este mes</span>
              </div>
              
              <Button className="btn-cta w-full">
                <Send className="w-4 h-4 mr-2" />
                Enviar Dinero
              </Button>
            </div>

            <div className="space-y-4">
              <div className="stat-card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm mb-1">
                      Clientes Activos
                    </p>
                    <h3 className="text-3xl font-bold text-primary">
                      248
                    </h3>
                  </div>
                  <div className="icon-container glow-green">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                </div>
                <div className="mt-4 progress-bar-green">
                  <div className="progress-bar-fill" style={{ width: '75%' }} />
                </div>
              </div>

              <div className="stat-card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm mb-1">
                      Facturas Pendientes
                    </p>
                    <h3 className="text-3xl font-bold text-accent">
                      12
                    </h3>
                  </div>
                  <div className="icon-container glow-yellow">
                    <FileText className="w-6 h-6 text-accent" />
                  </div>
                </div>
                <div className="mt-4 progress-bar-green">
                  <div className="progress-bar-fill" style={{ width: '40%' }} />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Sección: Lista de Transacciones */}
        <section className="space-y-4">
          <h2 className="section-title">Transacciones Recientes</h2>
          <Card className="glass-card">
            <CardContent className="p-6 space-y-4">
              {[
                { type: 'income', name: 'Pago Cliente ABC', date: '2024-01-20', amount: 1500 },
                { type: 'expense', name: 'Servicios Cloud', date: '2024-01-19', amount: 250 },
                { type: 'income', name: 'Factura #1234', date: '2024-01-18', amount: 3200 },
                { type: 'expense', name: 'Software License', date: '2024-01-17', amount: 99 },
              ].map((tx, idx) => (
                <div key={idx} className="glass-hover p-4 rounded-[22px] flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="icon-container">
                      {tx.type === 'income' ? (
                        <TrendingUp className="w-5 h-5 text-chart-3" />
                      ) : (
                        <TrendingDown className="w-5 h-5 text-destructive" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{tx.name}</p>
                      <p className="text-sm text-muted-foreground">{tx.date}</p>
                    </div>
                  </div>
                  <span className={tx.type === 'income' ? 'transaction-positive font-semibold text-lg' : 'transaction-negative font-semibold text-lg'}>
                    {tx.type === 'income' ? '+' : '-'}${tx.amount.toLocaleString()}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        {/* Sección: Glassmorphism */}
        <section className="space-y-4">
          <h2 className="section-title">Efectos Glassmorphism</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="glass p-6 rounded-[22px]">
              <h3 className="font-semibold mb-2">Glass Base</h3>
              <p className="text-sm text-muted-foreground">
                Efecto de vidrio básico con blur
              </p>
            </div>

            <div className="glass-card p-6">
              <h3 className="font-semibold mb-2">Glass Card</h3>
              <p className="text-sm text-muted-foreground">
                Tarjeta con sombra y bordes redondeados
              </p>
            </div>

            <div className="glass-modal p-6">
              <h3 className="font-semibold mb-2">Glass Modal</h3>
              <p className="text-sm text-muted-foreground">
                Modal con mayor opacidad y blur
              </p>
            </div>
          </div>
        </section>

        {/* Sección: Gradientes */}
        <section className="space-y-4">
          <h2 className="section-title">Gradientes Verdes</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="gradient-green p-8 rounded-[22px]">
              <h3 className="font-semibold text-white mb-2">Gradient Full</h3>
              <p className="text-sm text-white/80">
                Gradiente completo verde
              </p>
            </div>

            <div className="gradient-green-subtle p-8 rounded-[22px] border border-white/10">
              <h3 className="font-semibold mb-2">Gradient Subtle</h3>
              <p className="text-sm text-muted-foreground">
                Gradiente sutil (10% opacidad)
              </p>
            </div>

            <div className="gradient-green-card p-8 rounded-[22px] border border-white/10">
              <h3 className="font-semibold mb-2">Gradient Card</h3>
              <p className="text-sm text-muted-foreground">
                Gradiente para tarjetas
              </p>
            </div>
          </div>
        </section>

        {/* Sección: Avatares e Iconos */}
        <section className="space-y-4">
          <h2 className="section-title">Avatares e Iconos</h2>
          <div className="glass-card p-6">
            <div className="flex items-center gap-6 flex-wrap">
              <div className="avatar-circle w-16 h-16 bg-gradient-green flex items-center justify-center">
                <span className="text-white font-bold text-xl">JD</span>
              </div>

              <div className="icon-container">
                <Wallet className="w-6 h-6 text-primary" />
              </div>

              <div className="icon-container glow-green">
                <Users className="w-6 h-6 text-primary" />
              </div>

              <div className="icon-container glow-yellow">
                <Target className="w-6 h-6 text-accent" />
              </div>
            </div>
          </div>
        </section>

        {/* Sección: Border Radius */}
        <section className="space-y-4">
          <h2 className="section-title">Border Radius (22px)</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="glass-card p-6 text-center">
              <div className="w-full h-24 bg-primary/20 rounded-[22px] mb-2"></div>
              <p className="text-sm">22px radius</p>
            </div>
            <div className="glass-card p-6 text-center">
              <div className="w-full h-24 bg-accent/20 rounded-[22px] mb-2"></div>
              <p className="text-sm">Suave y moderno</p>
            </div>
            <div className="glass-card p-6 text-center">
              <div className="w-full h-24 gradient-green rounded-[22px] mb-2"></div>
              <p className="text-sm">Con gradiente</p>
            </div>
            <div className="glass-card p-6 text-center">
              <div className="w-full h-24 bg-card rounded-[22px] mb-2"></div>
              <p className="text-sm">Consistente</p>
            </div>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
