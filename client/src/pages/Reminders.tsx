/**
 * Reminders Page - Recordatorios de Pago
 * Design Philosophy: Apple Minimalism - Clean, efficient, focused
 */

import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { Bell, BellOff, Calendar, DollarSign, User, AlertCircle, CheckCircle2 } from 'lucide-react';
import { format, parseISO, differenceInDays, isPast } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { useState } from 'react';

export default function Reminders() {
  const clients = useLiveQuery(() => db.clients.where('status').equals('active').toArray());
  const invoices = useLiveQuery(() => db.invoices.where('status').equals('pending').toArray());
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());

  const toggleCard = (clientId: number) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(clientId)) {
      newExpanded.delete(clientId);
    } else {
      newExpanded.add(clientId);
    }
    setExpandedCards(newExpanded);
  };

  // Obtener recordatorios de clientes
  const clientReminders = clients?.map(client => {
    const daysUntilPayment = differenceInDays(parseISO(client.nextPaymentDate), new Date());
    const isOverdue = daysUntilPayment < 0;
    const isUrgent = daysUntilPayment <= client.reminderDays && daysUntilPayment >= 0;
    
    return {
      ...client,
      daysUntilPayment,
      isOverdue,
      isUrgent,
      priority: isOverdue ? 3 : (isUrgent ? 2 : 1)
    };
  }).sort((a, b) => b.priority - a.priority) || [];

  // Obtener recordatorios de facturas pendientes
  const invoiceReminders = invoices?.map(invoice => {
    const daysUntilDue = differenceInDays(parseISO(invoice.dueDate), new Date());
    const isOverdue = daysUntilDue < 0;
    const isUrgent = daysUntilDue <= 7 && daysUntilDue >= 0;
    
    return {
      ...invoice,
      daysUntilDue,
      isOverdue,
      isUrgent,
      priority: isOverdue ? 3 : (isUrgent ? 2 : 1)
    };
  }).sort((a, b) => b.priority - a.priority) || [];

  const getPriorityBadge = (isOverdue: boolean, isUrgent: boolean) => {
    if (isOverdue) {
      return {
        label: 'Vencido',
        className: 'bg-red-500/10 text-red-400 border-red-500/20',
        icon: AlertCircle
      };
    }
    if (isUrgent) {
      return {
        label: 'Urgente',
        className: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
        icon: Bell
      };
    }
    return {
      label: 'Próximo',
      className: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
      icon: Calendar
    };
  };

  const markAsNotified = async (clientId: number) => {
    toast.success('Cliente notificado');
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Recordatorios</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1">
            Gestiona alertas de pagos próximos y vencidos
          </p>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Vencidos</p>
                <AlertCircle className="w-4 h-4 text-red-400" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-red-400">
                {clientReminders.filter(c => c.isOverdue).length + invoiceReminders.filter(i => i.isOverdue).length}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Urgentes</p>
                <Bell className="w-4 h-4 text-orange-400" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-orange-400">
                {clientReminders.filter(c => c.isUrgent).length + invoiceReminders.filter(i => i.isUrgent).length}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Total Activos</p>
                <Calendar className="w-4 h-4 text-blue-400" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">
                {clientReminders.length + invoiceReminders.length}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recordatorios de Clientes */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <User className="w-5 h-5" />
            Pagos Recurrentes de Clientes
          </h2>
          
          {clientReminders.length === 0 ? (
            <Card className="bg-card border-border">
              <CardContent className="py-12 text-center">
                <BellOff className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">No hay recordatorios de clientes activos</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {clientReminders.map((client) => {
                const priorityInfo = getPriorityBadge(client.isOverdue, client.isUrgent);
                const PriorityIcon = priorityInfo.icon;
                const isExpanded = expandedCards.has(client.id!);

                return (
                  <Card key={client.id} className="bg-card border-border hover:border-accent transition-colors">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-foreground truncate">{client.name}</h3>
                            <Badge className={`${priorityInfo.className} border px-2 py-0.5 flex items-center gap-1 text-xs shrink-0`}>
                              <PriorityIcon className="w-3 h-3" />
                              {priorityInfo.label}
                            </Badge>
                          </div>
                          {client.company && (
                            <p className="text-sm text-muted-foreground truncate">{client.company}</p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleCard(client.id!)}
                          className="text-muted-foreground hover:text-foreground shrink-0"
                        >
                          {isExpanded ? 'Ocultar' : 'Ver más'}
                        </Button>
                      </div>
                    </CardHeader>

                    {isExpanded && (
                      <CardContent className="space-y-3 pt-0 border-t border-border mt-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Próximo Pago</p>
                            <p className="text-sm font-medium text-foreground">
                              {format(parseISO(client.nextPaymentDate), 'dd MMM yyyy', { locale: es })}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {client.isOverdue 
                                ? `Vencido hace ${Math.abs(client.daysUntilPayment)} días` 
                                : `En ${client.daysUntilPayment} días`}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Monto</p>
                            <p className="text-lg font-bold font-mono text-foreground">
                              ${client.amount.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                        </div>

                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Contacto</p>
                          <p className="text-sm text-foreground">{client.email}</p>
                          {client.phone && <p className="text-sm text-muted-foreground">{client.phone}</p>}
                        </div>

                        <div className="pt-2 border-t border-border">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => markAsNotified(client.id!)}
                            className="w-full border-border text-foreground hover:bg-accent"
                          >
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Marcar como Notificado
                          </Button>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Recordatorios de Facturas */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Facturas Pendientes
          </h2>
          
          {invoiceReminders.length === 0 ? (
            <Card className="bg-card border-border">
              <CardContent className="py-12 text-center">
                <BellOff className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">No hay facturas pendientes</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {invoiceReminders.map((invoice) => {
                const priorityInfo = getPriorityBadge(invoice.isOverdue, invoice.isUrgent);
                const PriorityIcon = priorityInfo.icon;
                const client = clients?.find(c => c.id === invoice.clientId);

                return (
                  <Card key={invoice.id} className="bg-card border-border hover:border-accent transition-colors">
                    <CardContent className="py-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-foreground text-sm">{invoice.invoiceNumber}</h3>
                            <Badge className={`${priorityInfo.className} border px-2 py-0.5 flex items-center gap-1 text-xs`}>
                              <PriorityIcon className="w-3 h-3" />
                              {priorityInfo.label}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{client?.name || 'Cliente Desconocido'}</p>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <p className="text-xs text-muted-foreground">Vencimiento</p>
                              <p className="text-sm font-medium text-foreground">
                                {format(parseISO(invoice.dueDate), 'dd MMM yyyy', { locale: es })}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {invoice.isOverdue 
                                  ? `Vencido hace ${Math.abs(invoice.daysUntilDue)} días` 
                                  : `En ${invoice.daysUntilDue} días`}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Monto</p>
                              <p className="text-lg font-bold font-mono text-foreground">
                                ${invoice.amount.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
