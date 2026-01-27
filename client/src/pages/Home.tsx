/**
 * Home Page - Dashboard Principal
 * Sistema por zonas flexibles usando SOLO datos de facturas
 */

import { useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
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
  DollarSign, 
  Clock, 
  AlertTriangle,
  FileText,
  TrendingUp,
  Users,
  Plus,
  Eye,
  Calendar,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { format, isAfter, isBefore, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import { useLocation } from 'wouter';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Home() {
  const [, setLocation] = useLocation();
  const [selectedChart, setSelectedChart] = useState<'weekly' | 'monthly'>('monthly');

  // Fetch data using tRPC
  const { data: invoices } = trpc.invoices.list.useQuery();
  const { data: clients } = trpc.clients.list.useQuery();
  const { data: notifications } = trpc.notifications.list.useQuery({
    unreadOnly: false,
  });

  // Calculate stats from invoices
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const today = new Date();
  
  // Ingresos cobrados este mes (facturas pagadas)
  const monthlyPaid = invoices
    ?.filter(inv => {
      const date = new Date(inv.issue_date);
      return inv.status === 'paid' && 
             date.getMonth() === currentMonth && 
             date.getFullYear() === currentYear;
    })
    .reduce((sum, inv) => sum + Number(inv.total || 0), 0) || 0;
  
  // Total pendiente por cobrar (facturas enviadas)
  const totalPending = invoices
    ?.filter(inv => inv.status === 'sent' || inv.status === 'payment_submitted')
    .reduce((sum, inv) => sum + Number(inv.total || 0), 0) || 0;
  
  // Facturas vencidas
  const overdueInvoices = invoices
    ?.filter(inv => {
      if (inv.status !== 'sent' && inv.status !== 'payment_submitted') return false;
      const dueDate = new Date(inv.due_date);
      return isBefore(dueDate, today);
    }) || [];
  
  const totalOverdue = overdueInvoices.reduce((sum, inv) => sum + Number(inv.total || 0), 0);
  
  // Total facturado este mes (todas las facturas excepto borradores y canceladas)
  const monthlyInvoiced = invoices
    ?.filter(inv => {
      const date = new Date(inv.issue_date);
      return (inv.status === 'sent' || inv.status === 'paid' || inv.status === 'payment_submitted') && 
             date.getMonth() === currentMonth && 
             date.getFullYear() === currentYear;
    })
    .reduce((sum, inv) => sum + Number(inv.total || 0), 0) || 0;

  // Calculate weekly data (last 7 days)
  const weeklyData = (() => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const targetDate = new Date();
      targetDate.setDate(today.getDate() - i);
      targetDate.setHours(0, 0, 0, 0);
      
      const dayInvoiced = invoices
        ?.filter(inv => {
          const invDate = new Date(inv.issue_date);
          invDate.setHours(0, 0, 0, 0);
          return (inv.status === 'sent' || inv.status === 'paid' || inv.status === 'payment_submitted') && 
                 invDate.getTime() === targetDate.getTime();
        })
        .reduce((sum, inv) => sum + Number(inv.total || 0), 0) || 0;
      
      data.push({
        day: format(targetDate, 'EEE', { locale: es }),
        amount: dayInvoiced / 1000,
      });
    }
    return data;
  })();

  // Calculate monthly data (last 6 months)
  const monthlyData = (() => {
    const data = [];
    for (let i = 5; i >= 0; i--) {
      const targetDate = new Date();
      targetDate.setMonth(targetDate.getMonth() - i);
      const month = targetDate.getMonth();
      const year = targetDate.getFullYear();
      
      const monthInvoiced = invoices
        ?.filter(inv => {
          const date = new Date(inv.issue_date);
          return (inv.status === 'sent' || inv.status === 'paid' || inv.status === 'payment_submitted') && 
                 date.getMonth() === month && 
                 date.getFullYear() === year;
        })
        .reduce((sum, inv) => sum + Number(inv.total || 0), 0) || 0;
      
      const monthPaid = invoices
        ?.filter(inv => {
          const date = new Date(inv.issue_date);
          return inv.status === 'paid' && 
                 date.getMonth() === month && 
                 date.getFullYear() === year;
        })
        .reduce((sum, inv) => sum + Number(inv.total || 0), 0) || 0;
      
      data.push({
        month: format(targetDate, 'MMM', { locale: es }),
        facturado: monthInvoiced / 1000,
        cobrado: monthPaid / 1000,
      });
    }
    return data;
  })();

  // Get recent activity (last 10 invoices)
  const recentActivity = invoices
    ?.slice()
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 10) || [];

  // Get urgent notifications (last 5)
  const urgentNotifications = notifications
    ?.filter(n => !n.is_read && n.is_urgent)
    .slice(0, 5) || [];

  // Status badge helper
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { label: 'Borrador', variant: 'secondary' as const },
      sent: { label: 'Enviada', variant: 'default' as const },
      paid: { label: 'Pagada', variant: 'default' as const },
      payment_submitted: { label: 'En Revisión', variant: 'default' as const },
      cancelled: { label: 'Cancelada', variant: 'destructive' as const },
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <DashboardLayout>
      <div className="max-w-[1440px] mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">Resumen de tu actividad financiera</p>
          </div>
        </div>

        {/* ZONA 1: KPIs - Tarjetas de Resumen */}
        <div className="lg:grid lg:grid-cols-4 lg:gap-4 flex lg:flex-none overflow-x-auto gap-4 snap-x snap-mandatory scrollbar-hide pb-2 -mx-4 px-4 lg:mx-0 lg:px-0">
          {/* Ingresos Cobrados */}
          <Card className="bg-card border-border min-w-[280px] lg:min-w-0 snap-center shrink-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Cobrado este mes</p>
                  <p className="text-2xl font-bold text-green-500 mt-2">
                    ${monthlyPaid.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-green-500/10">
                  <CheckCircle2 className="w-6 h-6 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Pendiente */}
          <Card className="bg-card border-border min-w-[280px] lg:min-w-0 snap-center shrink-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pendiente por cobrar</p>
                  <p className="text-2xl font-bold text-yellow-500 mt-2">
                    ${totalPending.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-yellow-500/10">
                  <Clock className="w-6 h-6 text-yellow-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Facturas Vencidas */}
          <Card className="bg-card border-border min-w-[280px] lg:min-w-0 snap-center shrink-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Facturas vencidas</p>
                  <p className="text-2xl font-bold text-red-500 mt-2">
                    ${totalOverdue.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {overdueInvoices.length} factura{overdueInvoices.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-red-500/10">
                  <AlertTriangle className="w-6 h-6 text-red-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Facturado */}
          <Card className="bg-card border-border min-w-[280px] lg:min-w-0 snap-center shrink-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Facturado este mes</p>
                  <p className="text-2xl font-bold text-primary mt-2">
                    ${monthlyInvoiced.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-primary/10">
                  <DollarSign className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ZONA 2: Gráfico Principal */}
        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-foreground">Análisis de Facturas</CardTitle>
              <Select value={selectedChart} onValueChange={(value: any) => setSelectedChart(value)}>
                <SelectTrigger className="w-[200px] bg-background border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="weekly">Últimos 7 días</SelectItem>
                  <SelectItem value="monthly">Últimos 6 meses</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {invoices && invoices.length > 0 ? (
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
                      <Bar dataKey="amount" fill="#C4FF3D" radius={[8, 8, 0, 0]} />
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
                      <Line type="monotone" dataKey="facturado" stroke="#C4FF3D" strokeWidth={2} />
                      <Line type="monotone" dataKey="cobrado" stroke="#10b981" strokeWidth={2} />
                    </LineChart>
                  )}
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-80 flex items-center justify-center">
                <div className="text-center">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Aún no hay facturas</p>
                  <p className="text-sm text-muted-foreground mt-1">Crea tu primera factura para ver el análisis</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ZONA 3: Información Secundaria - Dos Columnas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Columna Izquierda: Alertas */}
          <div className="flex flex-col gap-6">
            {/* Facturas Vencidas */}
            {overdueInvoices.length > 0 && (
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    Facturas Vencidas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {overdueInvoices.slice(0, 5).map((invoice) => (
                      <div 
                        key={invoice.id} 
                        className="flex items-start gap-3 p-3 bg-background rounded-lg border border-border hover:border-primary/50 transition-colors cursor-pointer"
                        onClick={() => setLocation('/invoices')}
                      >
                        <div className="p-2 rounded-full bg-red-500/10 flex-shrink-0">
                          <XCircle className="w-4 h-4 text-red-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground text-sm">{invoice.invoice_number}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Vencida el {format(new Date(invoice.due_date), 'dd MMM yyyy', { locale: es })}
                          </p>
                          <p className="text-sm font-semibold text-red-500 mt-1">
                            ${Number(invoice.total || 0).toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Notificaciones Urgentes */}
            {urgentNotifications.length > 0 && (
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-500" />
                    Requieren Atención
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {urgentNotifications.map((notification) => (
                      <div 
                        key={notification.id} 
                        className="flex items-start gap-3 p-3 bg-background rounded-lg border border-border"
                      >
                        <div className="p-2 rounded-full bg-yellow-500/10 flex-shrink-0">
                          <AlertTriangle className="w-4 h-4 text-yellow-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground text-sm">{notification.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">{notification.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Acciones Rápidas */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Acciones Rápidas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => setLocation('/invoices')}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Crear Factura
                  </Button>
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => setLocation('/invoices')}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Ver Facturas
                  </Button>
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => setLocation('/clients')}
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Ver Clientes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Columna Derecha: Resumen */}
          <div className="flex flex-col gap-6">
            {/* Resumen de Clientes */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Clientes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total de clientes</span>
                    <span className="text-2xl font-bold">{clients?.length || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Clientes activos</span>
                    <span className="text-lg font-semibold text-green-500">
                      {clients?.filter(c => c.status === 'active').length || 0}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Resumen de Facturas */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Estado de Facturas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Enviadas</span>
                    <span className="text-lg font-semibold">
                      {invoices?.filter(i => i.status === 'sent').length || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Pagadas</span>
                    <span className="text-lg font-semibold text-green-500">
                      {invoices?.filter(i => i.status === 'paid').length || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">En revisión</span>
                    <span className="text-lg font-semibold text-yellow-500">
                      {invoices?.filter(i => i.status === 'payment_submitted').length || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Borradores</span>
                    <span className="text-lg font-semibold text-muted-foreground">
                      {invoices?.filter(i => i.status === 'draft').length || 0}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Historial de Notificaciones */}
            <Card className="bg-card border-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-foreground flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    Notificaciones
                  </CardTitle>
                  {notifications && notifications.length > 5 && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setLocation('/settings')}
                      className="text-xs"
                    >
                      Ver todas
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {notifications && notifications.length > 0 ? (
                  <div className="space-y-3 max-h-[300px] overflow-y-auto">
                    {notifications.slice(0, 5).map((notification) => (
                      <div 
                        key={notification.id} 
                        className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                          notification.is_read 
                            ? 'bg-background border-border' 
                            : 'bg-primary/5 border-primary/20'
                        }`}
                      >
                        <div className={`p-2 rounded-full flex-shrink-0 ${
                          notification.is_urgent 
                            ? 'bg-red-500/10' 
                            : 'bg-blue-500/10'
                        }`}>
                          <AlertTriangle className={`w-4 h-4 ${
                            notification.is_urgent 
                              ? 'text-red-500' 
                              : 'text-blue-500'
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground text-sm">{notification.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">{notification.message}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(notification.created_at), 'dd MMM yyyy HH:mm', { locale: es })}
                          </p>
                        </div>
                        {!notification.is_read && (
                          <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <AlertTriangle className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">No hay notificaciones</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* ZONA 4: Actividad Reciente */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Actividad Reciente
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivity.length > 0 ? (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {recentActivity.map((invoice) => (
                  <div 
                    key={invoice.id} 
                    className="flex items-center justify-between p-3 bg-background rounded-lg border border-border hover:border-primary/50 transition-colors cursor-pointer"
                    onClick={() => setLocation('/invoices')}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-primary/10">
                        <FileText className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{invoice.invoice_number}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(invoice.created_at), 'dd MMM yyyy HH:mm', { locale: es })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="font-semibold text-sm">
                        ${Number(invoice.total || 0).toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                      </p>
                      {getStatusBadge(invoice.status)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Aún no hay actividad</p>
                <p className="text-sm text-muted-foreground mt-1">Las facturas que crees aparecerán aquí</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
