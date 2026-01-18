/**
 * Clients Page - Gestión de Clientes (CRM)
 * Design Philosophy: Apple Minimalism - Collapsible cards for space efficiency
 */

import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Client } from '@/lib/db';
import { Users, Plus, Search, MoreVertical, Pencil, Trash2, Mail, Phone, Calendar, DollarSign, Bell, Building2, ChevronDown, ChevronUp } from 'lucide-react';
import { format, parseISO, differenceInDays, addMonths, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { useState } from 'react';

export default function Clients() {
  const clients = useLiveQuery(() => db.clients.orderBy('createdAt').reverse().toArray());
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());
  const [formData, setFormData] = useState<Partial<Client>>({
    name: '',
    email: '',
    phone: '',
    company: '',
    billingCycle: 'monthly',
    amount: 0,
    nextPaymentDate: '',
    reminderDays: 7,
    status: 'active',
    notes: '',
  });

  const filteredClients = clients?.filter(client =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleCard = (clientId: number) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(clientId)) {
      newExpanded.delete(clientId);
    } else {
      newExpanded.add(clientId);
    }
    setExpandedCards(newExpanded);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.amount || !formData.nextPaymentDate) {
      toast.error('Por favor completa los campos requeridos');
      return;
    }

    const now = new Date().toISOString();

    if (editingClient) {
      await db.clients.update(editingClient.id!, {
        ...formData as Client,
        updatedAt: now,
      });
      toast.success('Cliente actualizado exitosamente');
    } else {
      await db.clients.add({
        ...formData as Client,
        createdAt: now,
        updatedAt: now,
      });
      toast.success('Cliente agregado exitosamente');
    }

    setIsDialogOpen(false);
    setEditingClient(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      company: '',
      billingCycle: 'monthly',
      amount: 0,
      nextPaymentDate: '',
      reminderDays: 7,
      status: 'active',
      notes: '',
    });
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      email: client.email,
      phone: client.phone,
      company: client.company,
      billingCycle: client.billingCycle,
      customCycleDays: client.customCycleDays,
      amount: client.amount,
      nextPaymentDate: client.nextPaymentDate.split('T')[0],
      reminderDays: client.reminderDays,
      status: client.status,
      notes: client.notes,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (clientId: number) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este cliente? Esta acción no se puede deshacer.')) {
      try {
        // Eliminar facturas asociadas
        const invoices = await db.invoices.where('clientId').equals(clientId).toArray();
        for (const invoice of invoices) {
          await db.invoices.delete(invoice.id!);
        }
        
        // Eliminar transacciones asociadas
        const transactions = await db.transactions.where('clientId').equals(clientId).toArray();
        for (const transaction of transactions) {
          await db.transactions.delete(transaction.id!);
        }
        
        // Eliminar cliente
        await db.clients.delete(clientId);
        toast.success('Cliente eliminado exitosamente');
      } catch (error) {
        toast.error('Error al eliminar el cliente');
      }
    }
  };

  const getPaymentStatus = (nextPaymentDate: string, reminderDays: number) => {
    const daysUntil = differenceInDays(parseISO(nextPaymentDate), new Date());
    
    if (daysUntil < 0) {
      return { color: 'bg-destructive/10 text-destructive border-destructive/30', label: 'Vencido', icon: '🔴' };
    } else if (daysUntil <= 3) {
      return { color: 'bg-orange-500/10 text-orange-500 border-orange-500/30', label: `${daysUntil} días`, icon: '🟠' };
    } else if (daysUntil <= reminderDays) {
      return { color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30', label: `${daysUntil} días`, icon: '🟡' };
    }
    return { color: 'bg-muted text-muted-foreground border-border', label: `${daysUntil} días`, icon: '🟢' };
  };

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Clientes</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Gestiona tu base de datos de clientes y recordatorios de pago
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setEditingClient(null);
              setFormData({
                name: '',
                email: '',
                phone: '',
                company: '',
                billingCycle: 'monthly',
                amount: 0,
                nextPaymentDate: '',
                reminderDays: 7,
                status: 'active',
                notes: '',
              });
            }
          }}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground hover:opacity-90">
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Cliente
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-popover border-border max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-foreground text-2xl">
                  {editingClient ? 'Editar Cliente' : 'Agregar Nuevo Cliente'}
                </DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  {editingClient ? 'Actualiza la información del cliente' : 'Completa los datos del nuevo cliente y su ciclo de facturación'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-foreground font-semibold">Nombre <span className="text-destructive">*</span></Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="bg-background border-border text-foreground h-11"
                      required
                    />
                    <p className="text-xs text-muted-foreground">Nombre completo o razón social</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-foreground font-semibold">Email <span className="text-destructive">*</span></Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="bg-background border-border text-foreground h-11"
                      required
                    />
                    <p className="text-xs text-muted-foreground">Correo electrónico de contacto</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-foreground font-semibold">Teléfono</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="bg-background border-border text-foreground h-11"
                    />
                    <p className="text-xs text-muted-foreground">Número de teléfono (opcional)</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company" className="text-foreground font-semibold">Empresa</Label>
                    <Input
                      id="company"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      className="bg-background border-border text-foreground h-11"
                    />
                    <p className="text-xs text-muted-foreground">Nombre de la empresa (opcional)</p>
                  </div>
                </div>

                {/* Billing Section */}
                <div className="pt-4 border-t-2 border-border space-y-4">
                  <div>
                    <h3 className="text-foreground font-semibold text-lg mb-1">Información de Facturación</h3>
                    <p className="text-sm text-muted-foreground">Configura el ciclo de cobro y recordatorios</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nextPaymentDate" className="text-foreground font-semibold">Fecha de Próximo Cobro <span className="text-destructive">*</span></Label>
                      <Input
                        id="nextPaymentDate"
                        type="date"
                        value={formData.nextPaymentDate}
                        onChange={(e) => setFormData({ ...formData, nextPaymentDate: e.target.value })}
                        className="bg-background border-border text-foreground h-11"
                        required
                      />
                      <p className="text-xs text-muted-foreground">Fecha del próximo pago esperado</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reminderDays" className="text-foreground font-semibold">Días de Anticipación</Label>
                      <Input
                        id="reminderDays"
                        type="number"
                        min="1"
                        max="30"
                        value={formData.reminderDays}
                        onChange={(e) => setFormData({ ...formData, reminderDays: parseInt(e.target.value) || 7 })}
                        className="bg-background border-border text-foreground h-11"
                      />
                      <p className="text-xs text-muted-foreground">Días antes para mostrar recordatorio</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="billingCycle" className="text-foreground font-semibold">Ciclo de Facturación</Label>
                      <Select
                        value={formData.billingCycle}
                        onValueChange={(value: any) => setFormData({ ...formData, billingCycle: value })}
                      >
                        <SelectTrigger className="bg-background border-border text-foreground h-11">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border">
                          <SelectItem value="monthly">Mensual</SelectItem>
                          <SelectItem value="quarterly">Trimestral</SelectItem>
                          <SelectItem value="yearly">Anual</SelectItem>
                          <SelectItem value="custom">Personalizado</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">Frecuencia de cobro recurrente</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="amount" className="text-foreground font-semibold">Monto <span className="text-destructive">*</span></Label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                        className="bg-background border-border text-foreground font-mono h-11"
                        required
                      />
                      <p className="text-xs text-muted-foreground">Monto a cobrar por ciclo</p>
                    </div>
                  </div>
                </div>

                {formData.billingCycle === 'custom' && (
                  <div className="space-y-2">
                    <Label htmlFor="customCycleDays" className="text-foreground font-semibold">Días del Ciclo Personalizado</Label>
                    <Input
                      id="customCycleDays"
                      type="number"
                      min="1"
                      value={formData.customCycleDays}
                      onChange={(e) => setFormData({ ...formData, customCycleDays: parseInt(e.target.value) })}
                      className="bg-background border-border text-foreground h-11"
                    />
                    <p className="text-xs text-muted-foreground">Cada cuántos días se repite el ciclo</p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="status" className="text-foreground font-semibold">Estado</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: any) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger className="bg-background border-border text-foreground h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      <SelectItem value="active">Activo</SelectItem>
                      <SelectItem value="inactive">Inactivo</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Estado actual del cliente</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-foreground font-semibold">Notas Adicionales</Label>
                  <Input
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="bg-background border-border text-foreground h-11"
                    placeholder="Información adicional sobre el cliente..."
                  />
                  <p className="text-xs text-muted-foreground">Notas privadas sobre el cliente (opcional)</p>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t border-border">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    className="border-border text-foreground hover:bg-accent"
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" className="bg-primary text-primary-foreground hover:opacity-90">
                    {editingClient ? 'Actualizar' : 'Agregar'} Cliente
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar clientes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-card border-border text-foreground h-11"
            />
          </div>
        </div>

        {/* Clients List */}
        <div className="mt-6">
        {!filteredClients || filteredClients.length === 0 ? (
          <Card className="bg-card border-border">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="w-32 h-32 rounded-full bg-accent/20 flex items-center justify-center mb-6">
                <Users className="w-16 h-16 text-muted-foreground" strokeWidth={1} />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                {searchQuery ? 'No se encontraron clientes' : 'No hay clientes aún'}
              </h3>
              <p className="text-muted-foreground mb-6">
                {searchQuery ? 'Intenta con otro término de búsqueda' : 'Comienza agregando tu primer cliente'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredClients.map((client) => {
              const paymentStatus = getPaymentStatus(client.nextPaymentDate, client.reminderDays);
              const isExpanded = expandedCards.has(client.id!);

              return (
                <Card key={client.id} className="bg-card border-border hover:border-accent transition-colors">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-foreground text-lg truncate">{client.name}</CardTitle>
                        {client.company && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1 truncate">
                            <Building2 className="w-3 h-3 flex-shrink-0" />
                            {client.company}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleCard(client.id!)}
                          className="text-muted-foreground hover:text-foreground h-8 w-8"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground h-8 w-8">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="bg-popover border-border" align="end">
                            <DropdownMenuItem 
                              onClick={() => handleEdit(client)}
                              className="text-foreground hover:bg-accent cursor-pointer"
                            >
                              <Pencil className="w-4 h-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-border" />
                            <DropdownMenuItem 
                              onClick={() => handleDelete(client.id!)}
                              className="text-destructive hover:bg-destructive/10 cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardHeader>

                  {isExpanded && (
                    <CardContent className="space-y-3 pt-0">
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">{client.email}</span>
                        </div>
                        {client.phone && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Phone className="w-4 h-4 flex-shrink-0" />
                            <span>{client.phone}</span>
                          </div>
                        )}
                      </div>

                      <div className="pt-3 border-t border-border">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-muted-foreground">Próximo Pago</span>
                          <span className="text-sm font-semibold text-foreground">
                            {format(parseISO(client.nextPaymentDate), 'dd/MM/yyyy')}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-muted-foreground">Monto</span>
                          <span className="text-lg font-bold font-mono text-foreground">
                            ${client.amount.toLocaleString('es-ES')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Bell className="w-4 h-4 text-muted-foreground" />
                          <Badge className={`${paymentStatus.color} border text-xs`}>
                            {paymentStatus.icon} {paymentStatus.label}
                          </Badge>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-border">
                        <Badge variant={client.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                          {client.status === 'active' ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </div>
                    </CardContent>
                  )}
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
