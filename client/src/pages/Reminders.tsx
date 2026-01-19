/**
 * Reminders Page - Sistema de Alertas y Recordatorios
 * Design Philosophy: Apple Minimalism - Clean timeline with visual priority
 */

import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { trpc } from '@/lib/trpc';
import { AlertCircle, Clock, CheckCircle2, Eye, Building2, Calendar, DollarSign } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLocation } from 'wouter';

type ReminderItem = {
  id: number;
  type: 'client' | 'invoice';
  clientName: string;
  company?: string;
  amount: string;
  due_date: string;
  daysUntil: number;
  status: 'overdue' | 'urgent' | 'upcoming';
  invoice_number?: string;
};

export default function Reminders() {
  const { t } = useLanguage();
  const [, setLocation] = useLocation();
  
  // Fetch data using tRPC
  const { data: clients } = trpc.clients.list.useQuery();
  const { data: invoices } = trpc.invoices.list.useQuery();

  // Filter active clients and pending invoices
  const activeClients = clients?.filter(c => c.status === 'active') || [];
  const pendingInvoices = invoices?.filter(i => i.status === 'draft' || i.status === 'sent') || [];

  // Procesar recordatorios de clientes
  const clientReminders: ReminderItem[] = activeClients.map(client => {
    const daysUntil = differenceInDays(new Date(client.next_payment_date), new Date());
    let status: 'overdue' | 'urgent' | 'upcoming' = 'upcoming';
    
    if (daysUntil < 0) status = 'overdue';
    else if (daysUntil <= 5) status = 'urgent';
    
    return {
      id: client.id,
      type: 'client' as const,
      clientName: client.name,
      company: client.company || undefined,
      amount: client.amount,
      due_date: new Date(client.next_payment_date).toISOString(),
      daysUntil,
      status
    };
  });

  // Procesar recordatorios de facturas
  const invoiceReminders: ReminderItem[] = pendingInvoices.map(invoice => {
    const daysUntil = differenceInDays(new Date(invoice.due_date), new Date());
    let status: 'overdue' | 'urgent' | 'upcoming' = 'upcoming';
    
    if (daysUntil < 0) status = 'overdue';
    else if (daysUntil <= 5) status = 'urgent';
    
    const client = clients?.find(c => c.id === invoice.client_id);
    
    return {
      id: invoice.id,
      type: 'invoice' as const,
      clientName: client?.name || 'Cliente Desconocido',
      company: client?.company || undefined,
      amount: invoice.total,
      due_date: new Date(invoice.due_date).toISOString(),
      daysUntil,
      status,
      invoice_number: invoice.invoice_number
    };
  });

  // Combinar y ordenar todos los recordatorios
  const allReminders = [...clientReminders, ...invoiceReminders]
    .sort((a, b) => {
      // Primero por status (overdue > urgent > upcoming)
      const statusOrder = { overdue: 0, urgent: 1, upcoming: 2 };
      if (statusOrder[a.status] !== statusOrder[b.status]) {
        return statusOrder[a.status] - statusOrder[b.status];
      }
      // Luego por días hasta vencimiento (más cercano primero)
      return a.daysUntil - b.daysUntil;
    });

  const overdueReminders = allReminders.filter(r => r.status === 'overdue');
  const urgentReminders = allReminders.filter(r => r.status === 'urgent');
  const upcomingReminders = allReminders.filter(r => r.status === 'upcoming');

  const getStatusConfig = (status: 'overdue' | 'urgent' | 'upcoming') => {
    switch (status) {
      case 'overdue':
        return {
          icon: AlertCircle,
          color: 'text-red-500',
          bgColor: 'bg-red-500/10',
          borderColor: 'border-red-500/20',
          label: 'Vencido'
        };
      case 'urgent':
        return {
          icon: Clock,
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-500/10',
          borderColor: 'border-yellow-500/20',
          label: 'Urgente'
        };
      case 'upcoming':
        return {
          icon: CheckCircle2,
          color: 'text-blue-500',
          bgColor: 'bg-blue-500/10',
          borderColor: 'border-blue-500/20',
          label: 'Próximo'
        };
    }
  };

  const ReminderCard = ({ reminder }: { reminder: ReminderItem }) => {
    const config = getStatusConfig(reminder.status);
    const Icon = config.icon;

    return (
      <Card className={`${config.bgColor} ${config.borderColor} border-2 hover:scale-[1.02] transition-transform`}>
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            {/* Left Section */}
            <div className="flex items-start gap-3 sm:gap-4 flex-1">
              <div className={`${config.bgColor} p-2 sm:p-3 rounded-full`}>
                <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${config.color}`} />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className={`${config.color} border-current text-xs`}>
                    {config.label}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {reminder.type === 'client' ? 'Cliente' : 'Factura'}
                  </Badge>
                </div>
                
                <h3 className="text-base sm:text-lg font-bold text-foreground mb-1 truncate">
                  {reminder.clientName}
                </h3>
                
                {reminder.company && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <Building2 className="w-4 h-4" />
                    <span className="truncate">{reminder.company}</span>
                  </div>
                )}
                
                {reminder.invoice_number && (
                  <p className="text-sm text-muted-foreground mb-2">
                    Factura: {reminder.invoice_number}
                  </p>
                )}
                
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>{format(new Date(reminder.due_date), 'dd MMM yyyy', { locale: es })}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    <span className="font-mono">${parseFloat(reminder.amount).toLocaleString('es-ES', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Section */}
            <div className="flex sm:flex-col items-center sm:items-end gap-3 sm:gap-2">
              <div className="text-center sm:text-right">
                <p className={`text-2xl sm:text-3xl font-bold ${config.color}`}>
                  {Math.abs(reminder.daysUntil)}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {reminder.daysUntil < 0 ? 'días vencido' : 'días restantes'}
                </p>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLocation(reminder.type === 'client' ? '/clients' : '/invoices')}
                className="border-border text-foreground hover:bg-accent"
              >
                <Eye className="w-4 h-4 mr-2" />
                Ver
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6 lg:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Recordatorios</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Gestiona tus pagos y vencimientos pendientes
          </p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 lg:mb-8">
          <Card className="bg-red-500/10 border-red-500/20">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Vencidos</p>
                  <p className="text-3xl font-bold text-red-500">{overdueReminders.length}</p>
                </div>
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-yellow-500/10 border-yellow-500/20">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Urgentes</p>
                  <p className="text-3xl font-bold text-yellow-500">{urgentReminders.length}</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-blue-500/10 border-blue-500/20">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Próximos</p>
                  <p className="text-3xl font-bold text-blue-500">{upcomingReminders.length}</p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="all">Todos ({allReminders.length})</TabsTrigger>
            <TabsTrigger value="overdue">Vencidos ({overdueReminders.length})</TabsTrigger>
            <TabsTrigger value="urgent">Urgentes ({urgentReminders.length})</TabsTrigger>
            <TabsTrigger value="upcoming">Próximos ({upcomingReminders.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {allReminders.length === 0 ? (
              <Card className="bg-card border-border">
                <CardContent className="p-8 text-center">
                  <CheckCircle2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No hay recordatorios pendientes</p>
                </CardContent>
              </Card>
            ) : (
              allReminders.map(reminder => (
                <ReminderCard key={`${reminder.type}-${reminder.id}`} reminder={reminder} />
              ))
            )}
          </TabsContent>

          <TabsContent value="overdue" className="space-y-4">
            {overdueReminders.length === 0 ? (
              <Card className="bg-card border-border">
                <CardContent className="p-8 text-center">
                  <CheckCircle2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No hay pagos vencidos</p>
                </CardContent>
              </Card>
            ) : (
              overdueReminders.map(reminder => (
                <ReminderCard key={`${reminder.type}-${reminder.id}`} reminder={reminder} />
              ))
            )}
          </TabsContent>

          <TabsContent value="urgent" className="space-y-4">
            {urgentReminders.length === 0 ? (
              <Card className="bg-card border-border">
                <CardContent className="p-8 text-center">
                  <CheckCircle2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No hay pagos urgentes</p>
                </CardContent>
              </Card>
            ) : (
              urgentReminders.map(reminder => (
                <ReminderCard key={`${reminder.type}-${reminder.id}`} reminder={reminder} />
              ))
            )}
          </TabsContent>

          <TabsContent value="upcoming" className="space-y-4">
            {upcomingReminders.length === 0 ? (
              <Card className="bg-card border-border">
                <CardContent className="p-8 text-center">
                  <CheckCircle2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No hay pagos próximos</p>
                </CardContent>
              </Card>
            ) : (
              upcomingReminders.map(reminder => (
                <ReminderCard key={`${reminder.type}-${reminder.id}`} reminder={reminder} />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
