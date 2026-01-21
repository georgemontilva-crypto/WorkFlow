/**
 * Reminders Page - Sistema de Alertas y Recordatorios
 * Design Philosophy: Modern Fintech - Clean cards with colored backgrounds and simple list
 */

import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { trpc } from '@/lib/trpc';
import { 
  AlertCircle, 
  Clock, 
  CheckCircle2, 
  Eye, 
  Plus, 
  Calendar, 
  Mail, 
  Download,
  MoreVertical,
  Trash2,
  Edit,
  Bell
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLocation } from 'wouter';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type ReminderItem = {
  id: number;
  type: 'client' | 'invoice' | 'custom';
  clientName: string;
  company?: string;
  amount: string;
  due_date: string;
  daysUntil: number;
  status: 'overdue' | 'urgent' | 'upcoming';
  invoice_number?: string;
  description?: string;
  category?: string;
  priority?: string;
  notify_email?: number;
};

export default function Reminders() {
  const { t } = useLanguage();
  const [, setLocation] = useLocation();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<any>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    reminder_date: '',
    reminder_time: '',
    category: 'other' as const,
    priority: 'medium' as const,
    notify_email: true,
    notify_days_before: 1,
  });
  
  // Fetch data using tRPC
  const { data: clients } = trpc.clients.list.useQuery();
  const { data: invoices } = trpc.invoices.list.useQuery();
  const { data: customReminders, refetch: refetchReminders } = trpc.reminders.list.useQuery();

  // Mutations
  const createReminderMutation = trpc.reminders.create.useMutation({
    onSuccess: () => {
      toast.success('Recordatorio creado exitosamente');
      setIsCreateDialogOpen(false);
      resetForm();
      refetchReminders();
    },
    onError: (error) => {
      toast.error(error.message || 'Error al crear recordatorio');
    },
  });

  const updateReminderMutation = trpc.reminders.update.useMutation({
    onSuccess: () => {
      toast.success('Recordatorio actualizado');
      setEditingReminder(null);
      resetForm();
      refetchReminders();
    },
    onError: (error) => {
      toast.error(error.message || 'Error al actualizar');
    },
  });

  const deleteReminderMutation = trpc.reminders.delete.useMutation({
    onSuccess: () => {
      toast.success('Recordatorio eliminado');
      refetchReminders();
    },
    onError: (error) => {
      toast.error(error.message || 'Error al eliminar');
    },
  });

  const completeReminderMutation = trpc.reminders.complete.useMutation({
    onSuccess: () => {
      toast.success('Recordatorio completado');
      refetchReminders();
    },
  });

  const exportCalendarMutation = trpc.reminders.exportCalendar.useMutation({
    onSuccess: (data) => {
      // Download the ICS file
      const blob = new Blob([data.content], { type: 'text/calendar;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = data.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Archivo de calendario descargado');
    },
    onError: (error) => {
      toast.error(error.message || 'Error al exportar');
    },
  });

  const sendEmailMutation = trpc.reminders.sendEmailNotification.useMutation({
    onSuccess: () => {
      toast.success('Notificación enviada por correo');
    },
    onError: (error) => {
      toast.error(error.message || 'Error al enviar correo');
    },
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      reminder_date: '',
      reminder_time: '',
      category: 'other',
      priority: 'medium',
      notify_email: true,
      notify_days_before: 1,
    });
  };

  const handleSubmit = () => {
    if (!formData.title || !formData.reminder_date) {
      toast.error('Título y fecha son requeridos');
      return;
    }

    if (editingReminder) {
      updateReminderMutation.mutate({
        id: editingReminder.id,
        ...formData,
      });
    } else {
      createReminderMutation.mutate(formData);
    }
  };

  const handleEdit = (reminder: any) => {
    setEditingReminder(reminder);
    setFormData({
      title: reminder.title,
      description: reminder.description || '',
      reminder_date: reminder.reminder_date ? new Date(reminder.reminder_date).toISOString().split('T')[0] : '',
      reminder_time: reminder.reminder_time || '',
      category: reminder.category || 'other',
      priority: reminder.priority || 'medium',
      notify_email: reminder.notify_email === 1,
      notify_days_before: reminder.notify_days_before || 1,
    });
    setIsCreateDialogOpen(true);
  };

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

  // Procesar recordatorios personalizados
  const customReminderItems: ReminderItem[] = (customReminders || [])
    .filter((r: any) => r.status === 'pending')
    .map((reminder: any) => {
      const daysUntil = differenceInDays(new Date(reminder.reminder_date), new Date());
      let status: 'overdue' | 'urgent' | 'upcoming' = 'upcoming';
      
      if (daysUntil < 0) status = 'overdue';
      else if (daysUntil <= 5) status = 'urgent';
      
      return {
        id: reminder.id,
        type: 'custom' as const,
        clientName: reminder.title,
        description: reminder.description,
        company: undefined,
        amount: '0',
        due_date: new Date(reminder.reminder_date).toISOString(),
        daysUntil,
        status,
        category: reminder.category,
        priority: reminder.priority,
        notify_email: reminder.notify_email,
      };
    });

  // Combinar y ordenar todos los recordatorios
  const allReminders = [...clientReminders, ...invoiceReminders, ...customReminderItems]
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

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      payment: 'Pago',
      meeting: 'Reunión',
      deadline: 'Fecha límite',
      personal: 'Personal',
      other: 'Otro',
    };
    return labels[category] || category;
  };

  const ReminderListItem = ({ reminder }: { reminder: ReminderItem }) => {
    const config = getStatusConfig(reminder.status);
    const Icon = config.icon;
    const isCustom = reminder.type === 'custom';

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
                {reminder.type === 'client' ? 'Cliente' : reminder.type === 'invoice' ? 'Factura' : getCategoryLabel(reminder.category || 'other')}
              </Badge>
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold text-white truncate">
                {reminder.clientName}
              </h3>
              {(reminder.company || reminder.description) && (
                <p className="text-sm text-gray-400 truncate">{reminder.company || reminder.description}</p>
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
            
            {reminder.type !== 'custom' && (
              <div className="text-right min-w-[120px]">
                <p className="text-lg font-mono font-bold text-white">
                  ${parseFloat(reminder.amount).toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                </p>
              </div>
            )}
            
            {isCustom ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-card border-border">
                  <DropdownMenuItem onClick={() => handleEdit(customReminders?.find((r: any) => r.id === reminder.id))}>
                    <Edit className="w-4 h-4 mr-2" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => exportCalendarMutation.mutate({ id: reminder.id })}>
                    <Calendar className="w-4 h-4 mr-2" />
                    Exportar a Calendario
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => sendEmailMutation.mutate({ id: reminder.id })}>
                    <Mail className="w-4 h-4 mr-2" />
                    Enviar Notificación
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => completeReminderMutation.mutate({ id: reminder.id })}>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Marcar Completado
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => deleteReminderMutation.mutate({ id: reminder.id })}
                    className="text-red-400"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Eliminar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLocation(reminder.type === 'client' ? '/clients' : '/invoices')}
                className="bg-transparent border-white/10 text-white hover:bg-white/5"
              >
                <Eye className="w-4 h-4 mr-2" />
                Ver
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 lg:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Recordatorios</h1>
            <p className="text-sm sm:text-base text-gray-400">
              Gestiona tus pagos y vencimientos pendientes
            </p>
          </div>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
            setIsCreateDialogOpen(open);
            if (!open) {
              setEditingReminder(null);
              resetForm();
            }
          }}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 text-black font-semibold">
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Recordatorio
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border max-w-md">
              <DialogHeader>
                <DialogTitle className="text-foreground">
                  {editingReminder ? 'Editar Recordatorio' : 'Crear Recordatorio'}
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Ej: Reunión con cliente"
                    className="bg-background border-border"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Detalles adicionales..."
                    className="bg-background border-border"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Fecha *</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.reminder_date}
                      onChange={(e) => setFormData({ ...formData, reminder_date: e.target.value })}
                      className="bg-background border-border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="time">Hora</Label>
                    <Input
                      id="time"
                      type="time"
                      value={formData.reminder_time}
                      onChange={(e) => setFormData({ ...formData, reminder_time: e.target.value })}
                      className="bg-background border-border"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Categoría</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value: any) => setFormData({ ...formData, category: value })}
                    >
                      <SelectTrigger className="bg-background border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        <SelectItem value="payment">Pago</SelectItem>
                        <SelectItem value="meeting">Reunión</SelectItem>
                        <SelectItem value="deadline">Fecha límite</SelectItem>
                        <SelectItem value="personal">Personal</SelectItem>
                        <SelectItem value="other">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Prioridad</Label>
                    <Select
                      value={formData.priority}
                      onValueChange={(value: any) => setFormData({ ...formData, priority: value })}
                    >
                      <SelectTrigger className="bg-background border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        <SelectItem value="low">Baja</SelectItem>
                        <SelectItem value="medium">Media</SelectItem>
                        <SelectItem value="high">Alta</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center justify-between py-2">
                  <div className="space-y-0.5">
                    <Label>Notificar por correo</Label>
                    <p className="text-xs text-muted-foreground">Recibe un recordatorio por email</p>
                  </div>
                  <Switch
                    checked={formData.notify_email}
                    onCheckedChange={(checked) => setFormData({ ...formData, notify_email: checked })}
                  />
                </div>

                {formData.notify_email && (
                  <div className="space-y-2">
                    <Label>Días antes para notificar</Label>
                    <Select
                      value={formData.notify_days_before.toString()}
                      onValueChange={(value) => setFormData({ ...formData, notify_days_before: parseInt(value) })}
                    >
                      <SelectTrigger className="bg-background border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        <SelectItem value="0">El mismo día</SelectItem>
                        <SelectItem value="1">1 día antes</SelectItem>
                        <SelectItem value="2">2 días antes</SelectItem>
                        <SelectItem value="3">3 días antes</SelectItem>
                        <SelectItem value="7">1 semana antes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <Button 
                  onClick={handleSubmit}
                  className="w-full bg-primary hover:bg-primary/90 text-black font-semibold"
                  disabled={createReminderMutation.isPending || updateReminderMutation.isPending}
                >
                  {createReminderMutation.isPending || updateReminderMutation.isPending ? 'Guardando...' : editingReminder ? 'Actualizar' : 'Crear Recordatorio'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
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
                <AlertCircle className="w-6 h-6 text-[#FF9500]" />
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
                <Clock className="w-6 h-6 text-[#FF9500]" />
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
                <CheckCircle2 className="w-6 h-6 text-[#FF9500]" />
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
                  <Bell className="w-12 h-12 text-[#FF9500] mx-auto mb-4" />
                  <p className="text-gray-400 mb-4">No hay recordatorios pendientes</p>
                  <Button 
                    onClick={() => setIsCreateDialogOpen(true)}
                    className="bg-primary hover:bg-primary/90 text-black"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Crear Recordatorio
                  </Button>
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
                  <CheckCircle2 className="w-12 h-12 text-[#FF9500] mx-auto mb-4" />
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
                  <CheckCircle2 className="w-12 h-12 text-[#FF9500] mx-auto mb-4" />
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
                  <CheckCircle2 className="w-12 h-12 text-[#FF9500] mx-auto mb-4" />
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
