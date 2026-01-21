/**
 * Home Page - Dashboard Principal Simplificado
 * Layout: 4 tarjetas superiores + grid 2 columnas + eventos próximos
 */

import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/lib/trpc';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Wallet, 
  PiggyBank,
  Settings,
  Plus,
  Calendar,
  Users,
  FileText
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { useLocation } from 'wouter';
import { formatCurrency } from '@/lib/currency';

export default function Home() {
  const [, setLocation] = useLocation();
  
  // Fetch data using tRPC
  const { data: clients } = trpc.clients.list.useQuery();
  const { data: invoices } = trpc.invoices.list.useQuery();
  const { data: transactions } = trpc.transactions.list.useQuery();
  const { data: savingsGoals } = trpc.savingsGoals.list.useQuery();

  // Calculate stats
  const activeClients = clients?.filter(c => c.status === 'active').length || 0;
  const pendingInvoices = invoices?.filter(i => i.status === 'pending').length || 0;
  
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const monthlyIncome = transactions
    ?.filter(t => {
      const date = new Date(t.date);
      return t.type === 'income' && date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    })
    .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0) || 0;
  
  const monthlyExpenses = transactions
    ?.filter(t => {
      const date = new Date(t.date);
      return t.type === 'expense' && date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    })
    .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0) || 0;

  const totalBalance = monthlyIncome - monthlyExpenses;

  const totalSavings = savingsGoals
    ?.filter(g => g.status === 'active')
    .reduce((sum, g) => sum + parseFloat(g.current_amount.toString()), 0) || 0;

  // Get reminders (eventos próximos)
  const today = new Date();
  const upcomingPayments = clients?.filter(c => {
    if (!c.next_payment_date || c.status !== 'active') return false;
    const daysUntil = differenceInDays(new Date(c.next_payment_date), today);
    return daysUntil >= 0 && daysUntil <= 7; // Próximos 7 días
  }).slice(0, 3) || [];

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Gestión financiera integral y eventos</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              Configurar
            </Button>
            <Button size="sm" className="bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Nuevo
            </Button>
          </div>
        </div>

        {/* 4 Tarjetas Superiores */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Balance */}
          <div className="dashboard-stat-card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Total Balance</span>
              <Wallet className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="dashboard-stat-number">{formatCurrency(totalBalance, 'USD')}</div>
            <div className="dashboard-stat-change positive">
              <TrendingUp className="w-4 h-4" />
              <span>+12.5%</span>
            </div>
          </div>

          {/* Ingresos */}
          <div className="dashboard-stat-card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Ingresos</span>
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="dashboard-stat-number">{formatCurrency(monthlyIncome, 'USD')}</div>
            <div className="dashboard-stat-change positive">
              <TrendingUp className="w-4 h-4" />
              <span>+8.2%</span>
            </div>
          </div>

          {/* Gastos */}
          <div className="dashboard-stat-card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Gastos</span>
              <TrendingDown className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="dashboard-stat-number">{formatCurrency(monthlyExpenses, 'USD')}</div>
            <div className="dashboard-stat-change negative">
              <TrendingDown className="w-4 h-4" />
              <span>-3.1%</span>
            </div>
          </div>

          {/* Ahorros */}
          <div className="dashboard-stat-card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Ahorros</span>
              <PiggyBank className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="dashboard-stat-number">{formatCurrency(totalSavings, 'USD')}</div>
            <div className="dashboard-stat-change positive">
              <TrendingUp className="w-4 h-4" />
              <span>+15.3%</span>
            </div>
          </div>
        </div>

        {/* Grid de 2 Columnas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna Izquierda - Gráficos (2/3) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Ingresos Semanales */}
            <div className="dashboard-chart-card">
              <h3 className="dashboard-chart-title">Ingresos Semanales</h3>
              <p className="dashboard-chart-subtitle">Actividad de esta semana</p>
              <div className="h-64 flex items-end justify-between gap-2">
                {/* Placeholder para gráfico de barras */}
                {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day, i) => {
                  const heights = [40, 25, 80, 60, 70, 65, 75];
                  return (
                    <div key={day} className="flex-1 flex flex-col items-center gap-2">
                      <div 
                        className="w-full bg-primary rounded-t-lg transition-all hover:bg-primary/80"
                        style={{ height: `${heights[i]}%` }}
                      />
                      <span className="text-xs text-muted-foreground">{day}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Progreso de Ahorros */}
            <div className="dashboard-chart-card">
              <h3 className="dashboard-chart-title">Progreso de Ahorros</h3>
              <p className="dashboard-chart-subtitle">Últimos 5 meses</p>
              <div className="h-64 flex items-center justify-center">
                <p className="text-muted-foreground">Gráfico de línea aquí</p>
              </div>
            </div>
          </div>

          {/* Columna Derecha - Meta y Resumen (1/3) */}
          <div className="space-y-6">
            {/* Meta de Ahorros */}
            <div className="dashboard-chart-card">
              <h3 className="dashboard-chart-title">Meta de Ahorros</h3>
              <div className="flex items-center justify-center h-48">
                {/* Gráfico circular placeholder */}
                <div className="relative w-32 h-32">
                  <svg className="w-full h-full -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="oklch(0.22 0 0)"
                      strokeWidth="12"
                      fill="none"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="oklch(0.68 0.20 35)"
                      strokeWidth="12"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 56}`}
                      strokeDashoffset={`${2 * Math.PI * 56 * 0.55}`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold">45%</span>
                  </div>
                </div>
              </div>
              <p className="text-center text-sm text-muted-foreground mt-4">
                {formatCurrency(4500, 'USD')} de {formatCurrency(10000, 'USD')} ahorrados
              </p>
            </div>

            {/* Resumen */}
            <div className="resume-card">
              <h3 className="text-lg font-semibold mb-4">Resumen</h3>
              <div className="space-y-1">
                <div className="resume-item">
                  <span className="resume-label">Transacciones</span>
                  <span className="resume-value primary">{transactions?.length || 0}</span>
                </div>
                <div className="resume-item">
                  <span className="resume-label">Clientes Activos</span>
                  <span className="resume-value primary">{activeClients}</span>
                </div>
                <div className="resume-item">
                  <span className="resume-label">Facturas Pendientes</span>
                  <span className="resume-value danger">{pendingInvoices}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Eventos Próximos / Recordatorios */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Eventos Próximos</h2>
            <span className="text-sm text-muted-foreground">Gestión de eventos y reuniones</span>
          </div>
          
          {upcomingPayments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcomingPayments.map((client, index) => {
                const daysUntil = differenceInDays(new Date(client.next_payment_date!), today);
                const statusClass = daysUntil === 0 ? 'confirmed' : daysUntil <= 3 ? 'in-progress' : 'pending';
                const statusText = daysUntil === 0 ? 'Confirmado' : daysUntil <= 3 ? 'En Progreso' : 'Pendiente';
                const statusColor = daysUntil === 0 ? 'bg-success' : daysUntil <= 3 ? 'bg-blue-500' : 'bg-purple-500';
                
                return (
                  <div key={client.id} className={`reminder-card ${statusClass}`}>
                    <h3 className="reminder-title">{client.name}</h3>
                    <p className="reminder-subtitle">
                      Pago de facturación mensual
                    </p>
                    <div className="reminder-meta">
                      <div className="flex items-center gap-4 text-xs">
                        <span>{format(new Date(client.next_payment_date!), 'd MMM yyyy', { locale: es })}</span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {index + 1} asistente{index !== 0 ? 's' : ''}
                        </span>
                      </div>
                      <Badge className={`${statusColor} text-white text-xs px-2 py-0.5`}>
                        {statusText}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="dashboard-chart-card text-center py-12">
              <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No hay eventos próximos</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
