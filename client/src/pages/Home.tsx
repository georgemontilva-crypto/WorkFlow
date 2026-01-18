/**
 * Home Page - Dashboard Principal
 * Design Philosophy: Apple Minimalism - Negro, grises, blanco
 * 
 * Dashboard con tarjetas modulares, estadísticas y próximos pagos
 */

import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { DollarSign, Users, FileText, TrendingUp, AlertCircle } from 'lucide-react';
import { format, parseISO, isBefore, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { useLocation } from 'wouter';

export default function Home() {
  const [, setLocation] = useLocation();

  // Cargar datos desde la base de datos
  const clients = useLiveQuery(() => db.clients.toArray());
  const invoices = useLiveQuery(() => db.invoices.toArray());
  const transactions = useLiveQuery(() => db.transactions.toArray());

  // Calcular estadísticas
  const activeClients = clients?.filter(c => c.status === 'active').length || 0;
  const pendingInvoices = invoices?.filter(i => i.status === 'pending').length || 0;
  
  const monthlyIncome = transactions
    ?.filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0) || 0;
  
  const monthlyExpenses = transactions
    ?.filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0) || 0;

  // Clientes con pagos próximos (próximos 7 días)
  const upcomingPayments = clients
    ?.filter(c => {
      if (!c.nextPaymentDate) return false;
      const paymentDate = parseISO(c.nextPaymentDate);
      const today = new Date();
      const weekFromNow = addDays(today, 7);
      return isBefore(paymentDate, weekFromNow) && !isBefore(paymentDate, today);
    })
    .sort((a, b) => 
      parseISO(a.nextPaymentDate).getTime() - parseISO(b.nextPaymentDate).getTime()
    ) || [];

  // Clientes con pagos vencidos
  const overduePayments = clients
    ?.filter(c => {
      if (!c.nextPaymentDate) return false;
      const paymentDate = parseISO(c.nextPaymentDate);
      return isBefore(paymentDate, new Date());
    }) || [];

  return (
    <DashboardLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
          <p className="text-muted-foreground">
            Resumen de tu gestión financiera y clientes
          </p>
        </div>

        {/* Hero Section */}
        <div className="mb-8 rounded-xl h-48 bg-gradient-to-br from-card via-accent/20 to-card border border-border flex items-center justify-center">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-2xl bg-accent/30 flex items-center justify-center">
              <TrendingUp className="w-10 h-10 text-foreground" strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">Control Total</h2>
              <p className="text-muted-foreground">Gestiona tu negocio con precisión</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Clientes Activos
              </CardTitle>
              <Users className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{activeClients}</div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Facturas Pendientes
              </CardTitle>
              <FileText className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{pendingInvoices}</div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Ingresos del Mes
              </CardTitle>
              <TrendingUp className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground font-mono">
                ${monthlyIncome.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Gastos del Mes
              </CardTitle>
              <DollarSign className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground font-mono">
                ${monthlyExpenses.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alerts and Upcoming Payments */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pagos Vencidos */}
          {overduePayments.length > 0 && (
            <Card className="bg-card border-destructive/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <AlertCircle className="w-5 h-5" strokeWidth={1.5} />
                  Pagos Vencidos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {overduePayments.slice(0, 5).map(client => (
                    <div 
                      key={client.id} 
                      className="flex items-center justify-between p-3 rounded-lg bg-destructive/10 border border-destructive/20"
                    >
                      <div>
                        <p className="font-medium text-foreground">{client.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Vencido: {format(parseISO(client.nextPaymentDate), 'dd MMM yyyy', { locale: es })}
                        </p>
                      </div>
                      <p className="font-mono font-semibold text-destructive">
                        ${client.amount.toLocaleString('es-ES')}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Próximos Pagos */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Próximos Pagos (7 días)</CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingPayments.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  No hay pagos próximos en los próximos 7 días
                </p>
              ) : (
                <div className="space-y-3">
                  {upcomingPayments.slice(0, 5).map(client => (
                    <div 
                      key={client.id} 
                      className="flex items-center justify-between p-3 rounded-lg bg-accent/50 border border-border"
                    >
                      <div>
                        <p className="font-medium text-foreground">{client.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(parseISO(client.nextPaymentDate), 'dd MMM yyyy', { locale: es })}
                        </p>
                      </div>
                      <p className="font-mono font-semibold text-foreground">
                        ${client.amount.toLocaleString('es-ES')}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 flex gap-4">
          <Button 
            onClick={() => setLocation('/clients')}
            className="bg-primary text-primary-foreground hover:opacity-90"
          >
            Agregar Cliente
          </Button>
          <Button 
            onClick={() => setLocation('/invoices')}
            variant="outline"
            className="border-border text-foreground hover:bg-accent"
          >
            Nueva Factura
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
