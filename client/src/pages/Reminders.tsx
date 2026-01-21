/**
 * Reminders Page - Sistema de Alertas y Recordatorios
 * Design Philosophy: Modern Fintech - Clean cards with colored backgrounds and simple list
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
          color: 'text-red-400',
          badgeClass: 'reminder-badge vencido',
          label: 'Vencido'
        };
      case 'urgent':
        return {
          icon: Clock,
          color: 'text-yellow-400',
          badgeClass: 'reminder-badge urgente',
          label: 'Urgente'
        };
      case 'upcoming':
        return {
          icon: CheckCircle2,
          color: 'text-blue-400',
          badgeClass: 'reminder-badge proximo',
          label: 'Próximo'
        };
    }
  };

  const ReminderListItem = ({ reminder }: { reminder: ReminderItem }) => {
    const config = getStatusConfig(reminder.status);
    const Icon = config.icon;

    return (
      <div className="reminder-list-item">
        <div className="flex items-center justify-between gap-4">
          {/* Left Section */}
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <Badge className={config.badgeClass}>
                {config.label}
              </Badge>
              <Badge variant="outline" className="text-xs border-white/10">
                {reminder.type === 'client' ? 'Cliente' : 'Factura'}
              </Badge>
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold text-white truncate">
                {reminder.clientName}
              </h3>
              {reminder.company && (
                <p className="text-sm text-gray-400 truncate">{reminder.company}</p>
              )}
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-sm text-gray-400">
                {format(new Date(reminder.due_date), 'dd MMM yyyy', { locale: es })}
              </p>
            </div>
            
            <div className="text-right min-w-[120px]">
              <p className="text-lg font-mono font-bold text-white">
                ${parseFloat(reminder.amount).toLocaleString('es-ES', { minimumFractionDigits: 2 })}
              </p>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocation(reminder.type === 'client' ? '/clients' : '/invoices')}
              className="bg-transparent border-white/10 text-white hover:bg-white/5"
            >
              <Eye className="w-4 h-4 mr-2" />
              Ver
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6 lg:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Recordatorios</h1>
          <p className="text-sm sm:text-base text-gray-400">
            Gestiona tus pagos y vencimientos pendientes
          </p>
        </div>

        {/* Summary Stats - Con fondo de color completo */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="reminder-summary-card reminder-summary-overdue">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-200 mb-1 font-medium">Vencidos</p>
                <p className="text-4xl font-bold text-white">{overdueReminders.length}</p>
              </div>
              <div className="reminder-icon-circle overdue">
                <AlertCircle className="w-6 h-6 text-red-400" />
              </div>
            </div>
          </div>

          <div className="reminder-summary-card reminder-summary-urgent">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-200 mb-1 font-medium">Urgentes</p>
                <p className="text-4xl font-bold text-white">{urgentReminders.length}</p>
              </div>
              <div className="reminder-icon-circle urgent">
                <Clock className="w-6 h-6 text-yellow-400" />
              </div>
            </div>
          </div>

          <div className="reminder-summary-card reminder-summary-upcoming">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-200 mb-1 font-medium">Próximos</p>
                <p className="text-4xl font-bold text-white">{upcomingReminders.length}</p>
              </div>
              <div className="reminder-icon-circle upcoming">
                <CheckCircle2 className="w-6 h-6 text-blue-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 gap-2 h-auto mb-6 p-1 bg-[#1C1C1C]">
            <TabsTrigger value="all" className="reminder-tab">
              Todos ({allReminders.length})
            </TabsTrigger>
            <TabsTrigger value="overdue" className="reminder-tab">
              Vencidos ({overdueReminders.length})
            </TabsTrigger>
            <TabsTrigger value="urgent" className="reminder-tab">
              Urgentes ({urgentReminders.length})
            </TabsTrigger>
            <TabsTrigger value="upcoming" className="reminder-tab">
              Próximos ({upcomingReminders.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-3">
            {allReminders.length === 0 ? (
              <Card className="bg-[#2A2A2A] border-white/5">
                <CardContent className="p-8 text-center">
                  <CheckCircle2 className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-400">No hay recordatorios pendientes</p>
                </CardContent>
              </Card>
            ) : (
              allReminders.map(reminder => (
                <ReminderListItem key={`${reminder.type}-${reminder.id}`} reminder={reminder} />
              ))
            )}
          </TabsContent>

          <TabsContent value="overdue" className="space-y-3">
            {overdueReminders.length === 0 ? (
              <Card className="bg-[#2A2A2A] border-white/5">
                <CardContent className="p-8 text-center">
                  <CheckCircle2 className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-400">No hay pagos vencidos</p>
                </CardContent>
              </Card>
            ) : (
              overdueReminders.map(reminder => (
                <ReminderListItem key={`${reminder.type}-${reminder.id}`} reminder={reminder} />
              ))
            )}
          </TabsContent>

          <TabsContent value="urgent" className="space-y-3">
            {urgentReminders.length === 0 ? (
              <Card className="bg-[#2A2A2A] border-white/5">
                <CardContent className="p-8 text-center">
                  <CheckCircle2 className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-400">No hay pagos urgentes</p>
                </CardContent>
              </Card>
            ) : (
              urgentReminders.map(reminder => (
                <ReminderListItem key={`${reminder.type}-${reminder.id}`} reminder={reminder} />
              ))
            )}
          </TabsContent>

          <TabsContent value="upcoming" className="space-y-3">
            {upcomingReminders.length === 0 ? (
              <Card className="bg-[#2A2A2A] border-white/5">
                <CardContent className="p-8 text-center">
                  <CheckCircle2 className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-400">No hay pagos próximos</p>
                </CardContent>
              </Card>
            ) : (
              upcomingReminders.map(reminder => (
                <ReminderListItem key={`${reminder.type}-${reminder.id}`} reminder={reminder} />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
