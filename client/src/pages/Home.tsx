/**
 * Home Page - Dashboard Principal
 * Sistema por zonas flexibles y adaptativas
 */

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { trpc } from '@/lib/trpc';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Wallet, 
  PiggyBank,
  Settings,
  Calendar,
  Bell,
  FileText,
  Target,
  Activity,
  BarChart3,
  X,
  AlertTriangle,
  AlertCircle,
  Info,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useLocation } from 'wouter';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Mapeo de eventos a títulos legibles
const EVENT_TITLES: Record<string, string> = {
  'invoice_overdue': 'Factura Vencida',
  'pending_receipt': 'Comprobante Pendiente',
  'invoice_due_soon': 'Factura Próxima a Vencer',
  'invoice_upcoming': 'Factura Próxima',
  'income_confirmed': 'Ingreso Confirmado',
  'monthly_comparison': 'Resumen Mensual',
  'no_income_month': 'Sin Ingresos',
  'plan_limit': 'Límite de Plan',
  'plan_limit_reached': 'Límite de Plan Alcanzado',
  'feature_blocked': 'Función Bloqueada',
  'multiple_pending': 'Facturas Pendientes',
  'client_late_history': 'Historial de Cliente',
};

export default function Home() {
  const [, setLocation] = useLocation();
  const [selectedChart, setSelectedChart] = useState<'weekly' | 'monthly' | 'savings'>('weekly');

  // Fetch data using tRPC
  const { data: clients } = trpc.clients.list.useQuery();
  const { data: invoices } = trpc.invoices.list.useQuery();
  const { data: transactions } = trpc.transactions.list.useQuery();
  const { data: savingsGoals } = trpc.savingsGoals.list.useQuery();
  const { data: reminders } = trpc.reminders.list.useQuery();
  
  // Fetch urgent alerts (critical and warning only)
  const { data: urgentAlerts, refetch: refetchAlerts } = trpc.alerts.list.useQuery({
    unreadOnly: true,
  }, {
    refetchInterval: 30000, // Refetch every 30 seconds
  });
  
  // Filter only critical and warning alerts
  const filteredUrgentAlerts = urgentAlerts?.filter(a => a.type === 'critical' || a.type === 'warning') || [];
  
  // Delete alert mutation
  const deleteAlertMutation = trpc.alerts.delete.useMutation({
    onSuccess: () => refetchAlerts(),
  });

  // Calculate stats
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const monthlyIncome = transactions
    ?.filter(t => {
      const date = new Date(t.date);
      return t.type === 'income' && t.status !== 'voided' && 
             date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    })
    .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0) || 0;
  
  const monthlyExpenses = transactions
    ?.filter(t => {
      const date = new Date(t.date);
      return t.type === 'expense' && t.status !== 'voided' && 
             date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    })
    .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0) || 0;

  const totalBalance = monthlyIncome - monthlyExpenses;

  const totalSavings = savingsGoals
    ?.filter(g => g.status === 'active')
    .reduce((sum, g) => sum + parseFloat(g.current_amount.toString()), 0) || 0;

  const pendingInvoices = invoices?.filter(i => i.status === 'pending').length || 0;
  const activeClients = clients?.filter(c => c.status === 'active').length || 0;

  // Calculate weekly income data
  const weeklyData = (() => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + 1);
    startOfWeek.setHours(0, 0, 0, 0);
    
    return ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day, index) => {
      const dayDate = new Date(startOfWeek);
      dayDate.setDate(startOfWeek.getDate() + index);
      
      const dayIncome = transactions
        ?.filter(t => {
          const tDate = new Date(t.date);
          return t.type === 'income' && 
                 t.status !== 'voided' &&
                 tDate.toDateString() === dayDate.toDateString();
        })
        .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0) || 0;
      
      return { day, income: dayIncome / 1000 };
    });
  })();

  // Calculate monthly trend data (last 6 months)
  const monthlyData = (() => {
    const data = [];
    for (let i = 5; i >= 0; i--) {
      const targetDate = new Date();
      targetDate.setMonth(targetDate.getMonth() - i);
      const month = targetDate.getMonth();
      const year = targetDate.getFullYear();
      
      const monthIncome = transactions
        ?.filter(t => {
          const date = new Date(t.date);
          return t.type === 'income' && t.status !== 'voided' && 
                 date.getMonth() === month && date.getFullYear() === year;
        })
        .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0) || 0;
      
      const monthExpenses = transactions
        ?.filter(t => {
          const date = new Date(t.date);
          return t.type === 'expense' && t.status !== 'voided' && 
                 date.getMonth() === month && date.getFullYear() === year;
        })
        .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0) || 0;
      
      data.push({
        month: format(targetDate, 'MMM', { locale: es }),
        income: monthIncome / 1000,
        expenses: monthExpenses / 1000,
      });
    }
    return data;
  })();

  // Calculate savings progress data
  const savingsData = savingsGoals
    ?.filter(g => g.status === 'active')
    .slice(0, 5)
    .map(goal => ({
      name: goal.name,
      progress: (parseFloat(goal.current_amount.toString()) / parseFloat(goal.target_amount.toString())) * 100,
      current: parseFloat(goal.current_amount.toString()) / 1000,
      target: parseFloat(goal.target_amount.toString()) / 1000,
    })) || [];

  // Get recent activity
  const recentActivity = transactions
    ?.slice()
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10) || [];

  // Get today's alerts
  const todayAlerts = reminders
    ?.filter(r => {
      const reminderDate = new Date(r.reminder_date);
      const today = new Date();
      return reminderDate.toDateString() === today.toDateString();
    }) || [];

  // Get upcoming events (next 7 days)
  const upcomingEvents = reminders
    ?.filter(r => {
      const reminderDate = new Date(r.reminder_date);
      const today = new Date();
      const nextWeek = new Date(today);
      nextWeek.setDate(today.getDate() + 7);
      return reminderDate >= today && reminderDate <= nextWeek;
    })
    .sort((a, b) => new Date(a.reminder_date).getTime() - new Date(b.reminder_date).getTime())
    .slice(0, 5) || [];

  return (
    <DashboardLayout>
      <div className="min-h-screen p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">Gestión financiera integral</p>
          </div>
          <Button
            variant="outline"
            onClick={() => setLocation('/settings')}
            className="group relative h-10 w-10 rounded-full p-0 overflow-hidden transition-all duration-300 hover:w-auto hover:px-4 hover:gap-2"
          >
            <Settings className="w-4 h-4 flex-shrink-0" />
            <span className="absolute opacity-0 whitespace-nowrap group-hover:opacity-100 group-hover:relative transition-opacity duration-300 text-sm">
              Configurar
            </span>
          </Button>
        </div>

        {/* ZONA 1: Header - Cards de Resumen */}
        <div className="lg:grid lg:grid-cols-4 lg:gap-4 flex lg:flex-none overflow-x-auto gap-4 snap-x snap-mandatory scrollbar-hide pb-2 -mx-4 px-4 lg:mx-0 lg:px-0">
          {/* Balance Total */}
          <Card className="bg-card border-border min-w-[280px] lg:min-w-0 snap-center shrink-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Balance Total</p>
                  <p className={`text-2xl font-bold mt-2 ${
                    totalBalance >= 0 ? 'text-green-500' : 'text-red-500'
                  }`}>
                    ${totalBalance.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className={`p-3 rounded-full ${
                  totalBalance >= 0 ? 'bg-green-500/10' : 'bg-red-500/10'
                }`}>
                  <Wallet className={`w-6 h-6 ${
                    totalBalance >= 0 ? 'text-green-500' : 'text-red-500'
                  }`} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ingresos del Mes */}
          <Card className="bg-card border-border min-w-[280px] lg:min-w-0 snap-center shrink-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Ingresos del Mes</p>
                  <p className="text-2xl font-bold text-green-500 mt-2">
                    ${monthlyIncome.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-green-500/10">
                  <TrendingUp className="w-6 h-6 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Gastos del Mes */}
          <Card className="bg-card border-border min-w-[280px] lg:min-w-0 snap-center shrink-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Gastos del Mes</p>
                  <p className="text-2xl font-bold text-red-500 mt-2">
                    ${monthlyExpenses.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-red-500/10">
                  <TrendingDown className="w-6 h-6 text-red-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ahorros Totales */}
          <Card className="bg-card border-border min-w-[280px] lg:min-w-0 snap-center shrink-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Ahorros Totales</p>
                  <p className="text-2xl font-bold text-primary mt-2">
                    ${totalSavings.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-primary/10">
                  <PiggyBank className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ZONA 2: Visual Principal - Gráfica Seleccionable */}
        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-foreground">Análisis Visual</CardTitle>
              <Select value={selectedChart} onValueChange={(value: any) => setSelectedChart(value)}>
                <SelectTrigger className="w-[200px] bg-background border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="weekly">Ingresos Semanales</SelectItem>
                  <SelectItem value="monthly">Tendencia Mensual</SelectItem>
                  <SelectItem value="savings">Progreso de Ahorros</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                {selectedChart === 'weekly' && (
                  <BarChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" opacity={0.3} />
                    <XAxis dataKey="day" stroke="#888" />
                    <YAxis stroke="#888" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                      labelStyle={{ color: '#fff' }}
                    />
                    <Bar dataKey="income" fill="#D4AF37" radius={[8, 8, 0, 0]} />
                  </BarChart>
                )}
                {selectedChart === 'monthly' && (
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" opacity={0.3} />
                    <XAxis dataKey="month" stroke="#888" />
                    <YAxis stroke="#888" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                      labelStyle={{ color: '#fff' }}
                    />
                    <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} />
                    <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} />
                  </LineChart>
                )}
                {selectedChart === 'savings' && (
                  <BarChart data={savingsData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" opacity={0.3} />
                    <XAxis type="number" stroke="#888" />
                    <YAxis dataKey="name" type="category" stroke="#888" width={100} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                      labelStyle={{ color: '#fff' }}
                    />
                    <Bar dataKey="progress" fill="#D4AF37" radius={[0, 8, 8, 0]} />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* ZONA 3: Información Secundaria - Dos Columnas Flexibles */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Columna Izquierda */}
          <div className="space-y-6">
            {/* Alertas de Hoy */}
            {todayAlerts.length > 0 && (
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center gap-2">
                    <Bell className="w-5 h-5" />
                    Alertas de Hoy
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {todayAlerts.map((alert) => (
                      <div key={alert.id} className="flex items-start gap-3 p-3 bg-background rounded-lg border border-border">
                        <div className="p-2 rounded-full bg-yellow-500/10 flex-shrink-0">
                          <Bell className="w-4 h-4 text-yellow-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground text-sm">{alert.title}</p>
                          {alert.description && (
                            <p className="text-xs text-muted-foreground mt-1">{alert.description}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Eventos Próximos */}
            {upcomingEvents.length > 0 && (
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Eventos Próximos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {upcomingEvents.map((event) => (
                      <div key={event.id} className="flex items-start gap-3 p-3 bg-background rounded-lg border border-border">
                        <div className="p-2 rounded-full bg-primary/10 flex-shrink-0">
                          <Calendar className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground text-sm">{event.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(event.reminder_date), "dd 'de' MMMM, yyyy", { locale: es })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recordatorios y Notificaciones - Módulo Combinado */}
            <Card className="bg-card border-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-foreground flex items-center gap-2">
                    <Bell className="w-5 h-5" />
                    Recordatorios y Notificaciones
                  </CardTitle>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setLocation('/reminders')}
                    className="text-xs"
                  >
                    Ver todos
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[327px] overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
                  {/* Recordatorios */}
                  {reminders && reminders.length > 0 && reminders
                    .sort((a, b) => new Date(a.reminder_date).getTime() - new Date(b.reminder_date).getTime())
                    .map((reminder) => {
                      const reminderDate = new Date(reminder.reminder_date);
                      const today = new Date();
                      const isToday = reminderDate.toDateString() === today.toDateString();
                      const isPast = reminderDate < today && !isToday;
                      
                      return (
                        <div 
                          key={`reminder-${reminder.id}`} 
                          className="flex items-start gap-3 p-3 bg-background rounded-lg border border-border cursor-pointer hover:border-primary/50 transition-colors"
                          onClick={() => setLocation('/reminders')}
                        >
                          <div className={`p-2 rounded-full flex-shrink-0 ${
                            isPast ? 'bg-red-500/10' : isToday ? 'bg-yellow-500/10' : 'bg-blue-500/10'
                          }`}>
                            <Bell className={`w-4 h-4 ${
                              isPast ? 'text-red-500' : isToday ? 'text-yellow-500' : 'text-blue-500'
                            }`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground text-sm">{reminder.title}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {format(reminderDate, "dd 'de' MMMM, yyyy", { locale: es })}
                              {isToday && ' • Hoy'}
                              {isPast && ' • Vencido'}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  

                  {/* Alertas Urgentes (Critical y Warning) */}
                  {filteredUrgentAlerts.map((alert) => {
                    const isCritical = alert.type === 'critical';
                    const iconBg = isCritical ? 'bg-red-500/10' : 'bg-yellow-500/10';
                    const iconColor = isCritical ? 'text-red-500' : 'text-yellow-500';
                    const Icon = isCritical ? AlertCircle : AlertTriangle;
                    
                    return (
                      <div 
                        key={alert.id}
                        className="flex items-start justify-between p-3 bg-background rounded-lg border border-border group hover:border-primary/30 transition-colors"
                      >
                        <div 
                          className="flex items-start gap-3 flex-1 cursor-pointer"
                          onClick={() => alert.action_url && setLocation(alert.action_url)}
                        >
                          <div className={`p-2 rounded-full ${iconBg} flex-shrink-0`}>
                            <Icon className={`w-4 h-4 ${iconColor}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground text-sm">{EVENT_TITLES[alert.event] || alert.event}</p>
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{alert.message}</p>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteAlertMutation.mutate({ id: alert.id });
                          }}
                          className="text-muted-foreground hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0 ml-2"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                  
                  {/* Facturas Pendientes */}
                  {pendingInvoices > 0 && (
                    <div 
                      className="flex items-center justify-between p-3 bg-background rounded-lg border border-border cursor-pointer hover:border-primary/50 transition-colors"
                      onClick={() => setLocation('/invoices')}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-orange-500/10">
                          <FileText className="w-4 h-4 text-orange-500" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground text-sm">Facturas Pendientes</p>
                          <p className="text-xs text-muted-foreground">{pendingInvoices} facturas por cobrar</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="bg-orange-500/10 text-orange-500 border-orange-500/20">
                        {pendingInvoices}
                      </Badge>
                    </div>
                  )}
                  
                  {/* Clientes Activos */}
                  <div 
                    className="flex items-center justify-between p-3 bg-background rounded-lg border border-border cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => setLocation('/clients')}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-blue-500/10">
                        <Wallet className="w-4 h-4 text-blue-500" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground text-sm">Clientes Activos</p>
                        <p className="text-xs text-muted-foreground">{activeClients} clientes</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                      {activeClients}
                    </Badge>
                  </div>
                  
                  {/* Mensaje si no hay nada */}
                  {(!reminders || reminders.length === 0) && filteredUrgentAlerts.length === 0 && pendingInvoices === 0 && (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      <Info className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No hay recordatorios ni notificaciones</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Columna Derecha */}
          <div className="space-y-6">
            {/* Resumen Rápido */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Resumen del Mes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Ingresos</span>
                    <span className="text-sm font-semibold text-green-500">
                      ${(monthlyIncome / 1000).toFixed(1)}k
                    </span>
                  </div>
                  <div className="w-full bg-background rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min((monthlyIncome / (monthlyIncome + monthlyExpenses)) * 100, 100)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Gastos</span>
                    <span className="text-sm font-semibold text-red-500">
                      ${(monthlyExpenses / 1000).toFixed(1)}k
                    </span>
                  </div>
                  <div className="w-full bg-background rounded-full h-2">
                    <div 
                      className="bg-red-500 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min((monthlyExpenses / (monthlyIncome + monthlyExpenses)) * 100, 100)}%` }}
                    />
                  </div>
                  <div className="pt-4 border-t border-border">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">Balance Neto</span>
                      <span className={`text-lg font-bold ${
                        totalBalance >= 0 ? 'text-green-500' : 'text-red-500'
                      }`}>
                        ${(totalBalance / 1000).toFixed(1)}k
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Metas de Ahorro */}
            {savingsGoals && savingsGoals.length > 0 && (
              <Card className="bg-card border-border">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-foreground flex items-center gap-2">
                      <Target className="w-5 h-5" />
                      Metas de Ahorro
                    </CardTitle>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setLocation('/savings')}
                      className="text-xs"
                    >
                      Ver todas
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {savingsGoals.filter(g => g.status === 'active').slice(0, 3).map((goal) => {
                      const progress = (parseFloat(goal.current_amount.toString()) / parseFloat(goal.target_amount.toString())) * 100;
                      return (
                        <div key={goal.id} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-foreground">{goal.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {progress.toFixed(0)}%
                            </span>
                          </div>
                          <div className="w-full bg-background rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full transition-all"
                              style={{ width: `${Math.min(progress, 100)}%` }}
                            />
                          </div>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>${parseFloat(goal.current_amount.toString()).toLocaleString('es-ES')}</span>
                            <span>${parseFloat(goal.target_amount.toString()).toLocaleString('es-ES')}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* ZONA 4: Actividad Reciente */}
        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-foreground flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Actividad Reciente
              </CardTitle>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setLocation('/finances')}
                className="text-xs"
              >
                Ver todas
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
              {recentActivity.map((transaction) => (
                <div 
                  key={transaction.id} 
                  className="flex items-start gap-3 p-3 bg-background rounded-lg border border-border"
                >
                  <div className={`p-2 rounded-full flex-shrink-0 ${
                    transaction.type === 'income' 
                      ? 'bg-green-500/10' 
                      : 'bg-red-500/10'
                  }`}>
                    {transaction.type === 'income' ? (
                      <TrendingUp className="w-4 h-4 text-green-500" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm break-words">
                      {transaction.description}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {transaction.category} • {format(new Date(transaction.date), 'dd MMM yyyy', { locale: es })}
                    </p>
                  </div>
                  <div className={`text-base font-bold font-mono flex-shrink-0 ${
                    transaction.type === 'income' 
                      ? 'text-green-500' 
                      : 'text-red-500'
                  }`}>
                    {transaction.type === 'income' ? '+' : '-'}${parseFloat(transaction.amount.toString()).toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              ))}
              {recentActivity.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  No hay actividad reciente
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
