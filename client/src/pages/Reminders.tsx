/**
 * Reminders Page - Sistema de Alertas y Recordatorios
 * Design Philosophy: Apple Minimalism - Clean timeline with visual priority
 */

import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { AlertCircle, Clock, CheckCircle2, Eye, Building2, Calendar, DollarSign } from 'lucide-react';
import { format, parseISO, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLocation } from 'wouter';

type ReminderItem = {
  id: number;
  type: 'client' | 'invoice';
  clientName: string;
  company?: string;
  amount: number;
  due_date: string;
  daysUntil: number;
  status: 'overdue' | 'urgent' | 'upcoming';
  invoice_number?: string;
};

export default function Reminders() {
  const { t } = useLanguage();
  const [, setLocation] = useLocation();
  const clients = useLiveQuery(() => 
    db.clients.where('status').equals('active').toArray()
  );
  const invoices = useLiveQuery(() => db.invoices.where('status').equals('pending').toArray());

  // Procesar recordatorios de clientes
  const clientReminders: ReminderItem[] = clients?.map(client => {
    const daysUntil = differenceInDays(parseISO(client.next_payment_date), new Date());
    let status: 'overdue' | 'urgent' | 'upcoming' = 'upcoming';
    
    if (daysUntil < 0) status = 'overdue';
    else if (daysUntil <= 5) status = 'urgent';
    
    return {
      id: client.id!,
      type: 'client' as const,
      clientName: client.name,
      company: client.company,
      amount: client.amount,
      due_date: client.next_payment_date,
      daysUntil,
      status
    };
  }) || [];

  // Procesar recordatorios de facturas
  const invoiceReminders: ReminderItem[] = invoices?.map(invoice => {
    const daysUntil = differenceInDays(parseISO(invoice.due_date), new Date());
    let status: 'overdue' | 'urgent' | 'upcoming' = 'upcoming';
    
    if (daysUntil < 0) status = 'overdue';
    else if (daysUntil <= 5) status = 'urgent';
    
    const client = clients?.find(c => c.id === invoice.client_id);
    
    return {
      id: invoice.id!,
      type: 'invoice' as const,
      clientName: client?.name || 'Cliente Desconocido',
      company: client?.company,
      amount: invoice.amount,
      due_date: invoice.due_date,
      daysUntil,
      status,
      invoice_number: invoice.invoice_number
    };
  }) || [];

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
          label: t.reminders.overdue,
          icon: AlertCircle,
          badgeClass: 'bg-red-500/10 text-red-500 border-red-500/30',
          cardBorder: 'border-l-4 border-l-red-500',
          iconColor: 'text-red-500'
        };
      case 'urgent':
        return {
          label: t.reminders.urgent,
          icon: Clock,
          badgeClass: 'bg-orange-500/10 text-orange-500 border-orange-500/30',
          cardBorder: 'border-l-4 border-l-orange-500',
          iconColor: 'text-orange-500'
        };
      case 'upcoming':
        return {
          label: t.reminders.upcoming,
          icon: CheckCircle2,
          badgeClass: 'bg-green-500/10 text-green-500 border-green-500/30',
          cardBorder: 'border-l-4 border-l-green-500',
          iconColor: 'text-green-500'
        };
    }
  };

  const getDaysText = (daysUntil: number) => {
    if (daysUntil < 0) {
      return `${Math.abs(daysUntil)} ${t.common.days} ${t.reminders.overdueAgo}`;
    } else if (daysUntil === 0) {
      return 'Vence hoy';
    } else if (daysUntil === 1) {
      return 'Vence mañana';
    } else {
      return `Vence en ${daysUntil} ${t.common.days}`;
    }
  };

  const handleViewItem = (item: ReminderItem) => {
    if (item.type === 'invoice') {
      setLocation('/invoices');
    } else {
      setLocation('/clients');
    }
  };



  const ReminderCard = ({ item }: { item: ReminderItem }) => {
    const config = getStatusConfig(item.status);
    const StatusIcon = config.icon;

    return (
      <Card className={`bg-card border-border hover:bg-accent/5 transition-all ${config.cardBorder}`}>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-start sm:justify-between gap-4">
            {/* Left: Icon and Info */}
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className={`p-2 rounded-lg bg-accent/20 ${config.iconColor} flex-shrink-0`}>
                <StatusIcon className="w-5 h-5" />
              </div>
              
              <div className="flex-1 min-w-0">
                {/* Client Name and Company */}
                <div className="mb-2">
                  <h3 className="font-semibold text-foreground truncate">{item.clientName}</h3>
                  {item.company && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mt-0.5">
                      <Building2 className="w-3 h-3" />
                      <span className="truncate">{item.company}</span>
                    </div>
                  )}
                </div>

                {/* Invoice Number (if applicable) */}
                {item.invoice_number && (
                  <p className="text-xs text-muted-foreground mb-2">
                    {t.invoices.invoice}: {item.invoice_number}
                  </p>
                )}

                {/* Date and Days */}
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>{format(parseISO(item.due_date), 'dd MMM yyyy', { locale: es })}</span>
                  </div>
                  <Badge variant="outline" className={config.badgeClass}>
                    {getDaysText(item.daysUntil)}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Right: Amount and Actions */}
            <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 flex-shrink-0 w-full sm:w-auto">
              <div className="flex items-center gap-1 text-foreground">
                <DollarSign className="w-4 h-4 text-muted-foreground" />
                <span className="font-bold font-mono text-lg">
                  ${item.amount.toLocaleString('es-ES')}
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleViewItem(item)}
                  className="border-border text-foreground hover:bg-accent whitespace-nowrap"
                >
                  <Eye className="w-3 h-3 mr-1" />
                  Ver
                </Button>

              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const EmptyState = ({ message }: { message: string }) => (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mb-4">
        <CheckCircle2 className="w-8 h-8 text-muted-foreground" />
      </div>
      <p className="text-muted-foreground">{message}</p>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6 max-w-[90%] sm:max-w-full">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            {t.reminders.title}
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">
            {t.reminders.subtitle}
          </p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="bg-muted/50 border border-border">
            <TabsTrigger value="all" className="data-[state=active]:bg-background">
              Todas
              <Badge variant="secondary" className="ml-2 bg-accent text-accent-foreground">
                {allReminders.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="overdue" className="data-[state=active]:bg-background">
              {t.reminders.overdue}
              {overdueReminders.length > 0 && (
                <Badge className="ml-2 bg-red-500/10 text-red-500 border-red-500/30">
                  {overdueReminders.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="urgent" className="data-[state=active]:bg-background">
              {t.reminders.urgent}
              {urgentReminders.length > 0 && (
                <Badge className="ml-2 bg-orange-500/10 text-orange-500 border-orange-500/30">
                  {urgentReminders.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="upcoming" className="data-[state=active]:bg-background">
              {t.reminders.upcoming}
              <Badge variant="secondary" className="ml-2 bg-accent text-accent-foreground">
                {upcomingReminders.length}
              </Badge>
            </TabsTrigger>

          </TabsList>

          {/* All Reminders */}
          <TabsContent value="all" className="space-y-3">
            {allReminders.length === 0 ? (
              <EmptyState message={t.reminders.noReminders} />
            ) : (
              allReminders.map(item => (
                <ReminderCard key={`${item.type}-${item.id}`} item={item} />
              ))
            )}
          </TabsContent>

          {/* Overdue Reminders */}
          <TabsContent value="overdue" className="space-y-3">
            {overdueReminders.length === 0 ? (
              <EmptyState message="No hay recordatorios vencidos" />
            ) : (
              overdueReminders.map(item => (
                <ReminderCard key={`${item.type}-${item.id}`} item={item} />
              ))
            )}
          </TabsContent>

          {/* Urgent Reminders */}
          <TabsContent value="urgent" className="space-y-3">
            {urgentReminders.length === 0 ? (
              <EmptyState message="No hay recordatorios urgentes" />
            ) : (
              urgentReminders.map(item => (
                <ReminderCard key={`${item.type}-${item.id}`} item={item} />
              ))
            )}
          </TabsContent>

          {/* Upcoming Reminders */}
          <TabsContent value="upcoming" className="space-y-3">
            {upcomingReminders.length === 0 ? (
              <EmptyState message="No hay recordatorios próximos" />
            ) : (
              upcomingReminders.map(item => (
                <ReminderCard key={`${item.type}-${item.id}`} item={item} />
              ))
            )}
          </TabsContent>


        </Tabs>
      </div>
    </DashboardLayout>
  );
}
