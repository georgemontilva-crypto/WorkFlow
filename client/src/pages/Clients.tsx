/**
 * Clients Page - Gestión de Clientes (CRM)
 * Design Philosophy: Modern Fintech - Clean table list with status badges
 * Responsive: Table in desktop, collapsible list in mobile
 */

import DashboardLayout from '@/components/DashboardLayout';
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { trpc } from '@/lib/trpc';
import { 
  Plus, 
  MoreVertical, 
  Pencil, 
  Trash2, 
  MapPin, 
  ChevronLeft, 
  ChevronRight, 
  Repeat,
  Search,
  Filter,
  ChevronDown,
  Mail,
  Phone,
  Building2,
  DollarSign,
  Calendar,
  Eye,
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { format, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { useState, useEffect, useMemo } from 'react';
import { useLocation, useSearch } from 'wouter';

// Client type based on tRPC schema
type Client = {
  id: number;
  name: string;
  email: string;
  phone: string;
  company?: string | null;
  billing_cycle: 'monthly' | 'quarterly' | 'yearly' | 'custom';
  custom_cycle_days?: number | null;
  amount: string;
  next_payment_date: Date;
  reminder_days: number;
  status: 'active' | 'inactive' | 'overdue';
  archived: number;
  notes?: string | null;
  created_at: Date;
  updated_at: Date;
};

export default function Clients() {
  const { t } = useLanguage();
  const utils = trpc.useUtils();
  const search = useSearch();
  const [, setLocation] = useLocation();
  
  // Fetch clients using tRPC
  const { data: clients, isLoading } = trpc.clients.list.useQuery();
  
  // Mutations
  const createClient = trpc.clients.create.useMutation({
    onSuccess: () => {
      utils.clients.list.invalidate();
      toast.success(t.clients.clientAdded);
    },
    onError: () => {
      toast.error(t.clients.clientAddError);
    },
  });
  
  const updateClient = trpc.clients.update.useMutation({
    onSuccess: () => {
      utils.clients.list.invalidate();
      toast.success(t.clients.clientUpdated);
    },
    onError: () => {
      toast.error(t.clients.clientUpdateError);
    },
  });
  
  const deleteClient = trpc.clients.delete.useMutation({
    onSuccess: () => {
      utils.clients.list.invalidate();
      toast.success(t.clients.clientDeleted);
    },
    onError: () => {
      toast.error(t.clients.clientDeleteError);
    },
  });
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  
  const [formData, setFormData] = useState<any>({
    name: '',
    email: '',
    phone: '',
    company: '',
    has_recurring_billing: false,
    billing_cycle: 'monthly',
    amount: '0',
    next_payment_date: '',
    reminder_days: 7,
    status: 'active',
    notes: '',
  });

  // Open dialog automatically if ?new=true in URL
  useEffect(() => {
    const params = new URLSearchParams(search);
    if (params.get('new') === 'true') {
      setIsDialogOpen(true);
      setLocation('/clients', { replace: true });
    }
  }, [search, setLocation]);

  // Filter and search logic
  const filteredClients = useMemo(() => {
    if (!clients) return [];
    
    return clients.filter(client => {
      // Status filter
      if (statusFilter === 'active' && client.status !== 'active') return false;
      if (statusFilter === 'inactive' && client.status !== 'inactive') return false;
      
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = client.name.toLowerCase().includes(query);
        const matchesCompany = client.company?.toLowerCase().includes(query);
        const matchesEmail = client.email.toLowerCase().includes(query);
        
        if (!matchesName && !matchesCompany && !matchesEmail) return false;
      }
      
      return true;
    });
  }, [clients, searchQuery, statusFilter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email) {
      toast.error(t.clients.completeRequiredFields);
      return;
    }

    // Validate recurring billing fields only if enabled
    if (formData.has_recurring_billing && (!formData.amount || !formData.next_payment_date)) {
      toast.error('Complete los campos de facturación recurrente');
      return;
    }

    if (editingClient) {
      await updateClient.mutateAsync({
        id: editingClient.id,
        ...formData,
      });
    } else {
      await createClient.mutateAsync(formData);
    }

    setIsDialogOpen(false);
    setEditingClient(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      company: '',
      has_recurring_billing: false,
      billing_cycle: 'monthly',
      amount: '0',
      next_payment_date: '',
      reminder_days: 7,
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
      company: client.company || '',
      billing_cycle: client.billing_cycle,
      custom_cycle_days: client.custom_cycle_days,
      amount: client.amount,
      next_payment_date: format(new Date(client.next_payment_date), 'yyyy-MM-dd'),
      reminder_days: client.reminder_days,
      status: client.status,
      notes: client.notes || '',
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (client_id: number) => {
    if (window.confirm(`${t.clients.deleteConfirm} ${t.clients.deleteWarning}`)) {
      await deleteClient.mutateAsync({ id: client_id });
    }
  };

  const getStatusBadge = (client: Client) => {
    const daysUntil = differenceInDays(new Date(client.next_payment_date), new Date());
    
    if (client.status === 'inactive') {
      return { label: 'Inactivo', color: 'bg-gray-500' };
    }
    
    if (daysUntil < 0) {
      return { label: 'Vencido', color: 'bg-red-500' };
    } else if (daysUntil <= 3) {
      return { label: 'Urgente', color: 'bg-red-500' };
    } else if (daysUntil <= 7) {
      return { label: 'Próximo', color: 'bg-yellow-500' };
    }
    return { label: 'Activo', color: 'bg-green-500' };
  };

  // Pagination
  const totalPages = Math.ceil((filteredClients?.length || 0) / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedClients = filteredClients?.slice(startIndex, endIndex) || [];

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-400">{t.clients.loadingClients}</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Clientes</h1>
            <p className="text-sm sm:text-base text-gray-400">
              Gestiona tu cartera de clientes y pagos recurrentes
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
                billing_cycle: 'monthly',
                amount: '0',
                next_payment_date: '',
                reminder_days: 7,
                status: 'active',
                notes: '',
              });
            }
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                {t.clients.newClient}
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#1C1C1C] border-white/10 max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader className="pb-4">
                <DialogTitle className="text-white text-xl sm:text-2xl">
                  {editingClient ? t.clients.editClient : t.clients.addClient}
                </DialogTitle>
                <DialogDescription className="text-gray-400 text-sm">
                  {editingClient ? t.clients.updateClientInfo : t.clients.completeClientInfo}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Información Básica */}
                <div className="space-y-4">
                  <h3 className="text-white font-semibold text-sm uppercase tracking-wide text-gray-400 border-b border-white/10 pb-2">Información Básica</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-white font-medium text-sm">
                        {t.clients.name} <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="bg-[#2A2A2A] border-white/10 text-white h-11"
                        placeholder="Nombre completo o razón social"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-white font-medium text-sm">
                        {t.clients.email} <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="bg-[#2A2A2A] border-white/10 text-white h-11"
                        placeholder="correo@ejemplo.com"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-white font-medium text-sm">{t.clients.phone}</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="bg-[#2A2A2A] border-white/10 text-white h-11"
                        placeholder="+58 412 1234567"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="company" className="text-white font-medium text-sm">{t.clients.company}</Label>
                      <Input
                        id="company"
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                        className="bg-[#2A2A2A] border-white/10 text-white h-11"
                        placeholder="Nombre de la empresa"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status" className="text-white font-medium text-sm">{t.clients.status}</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setFormData({ ...formData, status: value })}
                    >
                      <SelectTrigger className="bg-[#2A2A2A] border-white/10 text-white h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1C1C1C] border-white/10">
                        <SelectItem value="active" className="text-white hover:bg-white/5">Activo</SelectItem>
                        <SelectItem value="inactive" className="text-white hover:bg-white/5">Inactivo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Facturación */}
                <div className="space-y-4">
                  <h3 className="text-white font-semibold text-sm uppercase tracking-wide text-gray-400 border-b border-white/10 pb-2">Facturación</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="billing_cycle" className="text-white font-medium text-sm">{t.clients.billingCycle}</Label>
                    <Select
                      value={formData.billing_cycle}
                      onValueChange={(value) => setFormData({ ...formData, billing_cycle: value })}
                    >
                      <SelectTrigger className="bg-[#2A2A2A] border-white/10 text-white h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1C1C1C] border-white/10">
                        <SelectItem value="monthly" className="text-white hover:bg-white/5">{t.clients.monthly}</SelectItem>
                        <SelectItem value="quarterly" className="text-white hover:bg-white/5">{t.clients.quarterly}</SelectItem>
                        <SelectItem value="yearly" className="text-white hover:bg-white/5">{t.clients.yearly}</SelectItem>
                        <SelectItem value="custom" className="text-white hover:bg-white/5">{t.clients.custom}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.billing_cycle === 'custom' && (
                    <div className="space-y-2">
                      <Label htmlFor="custom_cycle_days" className="text-white font-medium text-sm">{t.clients.customCycleDays}</Label>
                      <Input
                        id="custom_cycle_days"
                        type="number"
                        value={formData.custom_cycle_days || ''}
                        onChange={(e) => setFormData({ ...formData, custom_cycle_days: parseInt(e.target.value) })}
                        className="bg-[#2A2A2A] border-white/10 text-white h-11"
                        placeholder="Número de días"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="amount" className="text-white font-medium text-sm">Monto</Label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                        className="bg-[#2A2A2A] border-white/10 text-white h-11"
                        placeholder="0.00"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="next_payment_date" className="text-white font-medium text-sm">Próximo Pago</Label>
                      <Input
                        id="next_payment_date"
                        type="date"
                        value={formData.next_payment_date}
                        onChange={(e) => setFormData({ ...formData, next_payment_date: e.target.value })}
                        className="bg-[#2A2A2A] border-white/10 text-white h-11"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reminder_days" className="text-white font-medium text-sm">Días de Recordatorio</Label>
                    <Input
                      id="reminder_days"
                      type="number"
                      value={formData.reminder_days}
                      onChange={(e) => setFormData({ ...formData, reminder_days: parseInt(e.target.value) })}
                      className="bg-[#2A2A2A] border-white/10 text-white h-11"
                      placeholder="7"
                    />
                    <p className="text-xs text-gray-400">Días antes del vencimiento para enviar recordatorio</p>
                  </div>
                </div>

                {/* Notas Adicionales */}
                <div className="space-y-4">
                  <h3 className="text-white font-semibold text-sm uppercase tracking-wide text-gray-400 border-b border-white/10 pb-2">Notas Adicionales</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="notes" className="text-white font-medium text-sm">{t.clients.notes}</Label>
                    <textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="w-full bg-[#2A2A2A] border border-white/10 text-white rounded-lg p-3 min-h-[100px] focus:ring-2 focus:ring-white/20 focus:border-white/20 transition-all"
                      placeholder="Información adicional sobre el cliente..."
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-6 border-t border-white/10">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    className="flex-1 h-11"
                  >
                    {t.common.cancel}
                  </Button>
                  <Button 
                    type="submit"
                    disabled={createClient.isPending || updateClient.isPending}
                    variant="outline"
                    className="flex-1 h-11 border-white/20 text-white hover:bg-white/5 hover:border-white/40"
                  >
                    {editingClient ? t.common.update : t.common.create}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-[#1C1C1C] rounded-lg border border-white/5 p-4 mb-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Buscar por nombre, empresa o email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-[#2A2A2A] border-white/10 text-white h-10"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
              <SelectTrigger className="w-full sm:w-[180px] bg-[#2A2A2A] border-white/10 text-white h-10">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1C1C1C] border-white/10">
                <SelectItem value="all" className="text-white hover:bg-white/5">Todos</SelectItem>
                <SelectItem value="active" className="text-white hover:bg-white/5">Activos</SelectItem>
                <SelectItem value="inactive" className="text-white hover:bg-white/5">Inactivos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Results count */}
          <div className="mt-3 text-sm text-gray-400">
            Mostrando {filteredClients.length} {filteredClients.length === 1 ? 'cliente' : 'clientes'}
            {(searchQuery || statusFilter !== 'all') && ` (filtrado de ${clients?.length || 0} total)`}
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block bg-[#1C1C1C] rounded-lg border border-white/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left p-4 text-sm font-semibold text-gray-400">Nombre Cliente</th>
                  <th className="text-left p-4 text-sm font-semibold text-gray-400">Empresa</th>
                  <th className="text-left p-4 text-sm font-semibold text-gray-400">Fecha de Pago</th>
                  <th className="text-left p-4 text-sm font-semibold text-gray-400">Contacto</th>
                  <th className="text-left p-4 text-sm font-semibold text-gray-400">Monto</th>
                  <th className="text-left p-4 text-sm font-semibold text-gray-400">Estado</th>
                  <th className="text-left p-4 text-sm font-semibold text-gray-400"></th>
                </tr>
              </thead>
              <tbody>
                {paginatedClients.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-gray-400">
                      {searchQuery || statusFilter !== 'all' 
                        ? 'No se encontraron clientes con los filtros aplicados'
                        : 'No hay clientes registrados'}
                    </td>
                  </tr>
                ) : (
                  paginatedClients.map((client) => {
                    const statusBadge = getStatusBadge(client);
                    return (
                      <tr key={client.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="p-4">
                          <div className="font-semibold text-white">{client.name}</div>
                        </td>
                        <td className="p-4">
                          <div className="text-gray-400">{client.company || '-'}</div>
                        </td>
                        <td className="p-4">
                          <div className="text-white">
                            {format(new Date(client.next_payment_date), 'dd/MM/yyyy', { locale: es })}
                          </div>
                          <div className="text-sm text-gray-400">
                            {format(new Date(client.next_payment_date), 'hh:mm a')}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="text-white">{client.phone || '-'}</div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2 text-gray-400">
                            <MapPin className="w-4 h-4" />
                            <span className="font-mono text-white">${parseFloat(client.amount).toLocaleString('es-ES')}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${statusBadge.color}`}></div>
                            <span className="text-white text-sm">{statusBadge.label}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-primary hover:text-primary/80 hover:bg-white/5">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="bg-[#1C1C1C] border-white/10" align="end">
                              <DropdownMenuItem 
                                onClick={() => handleEdit(client)}
                                className="text-white hover:bg-white/5 cursor-pointer"
                              >
                                <Pencil className="w-4 h-4 mr-2" />
                                {t.clients.editAction}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="bg-white/10" />
                              <DropdownMenuItem 
                                onClick={() => handleDelete(client.id)}
                                className="text-red-400 hover:bg-red-500/10 cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                {t.clients.deleteAction}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-white/10">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="text-white hover:bg-white/5 disabled:opacity-30"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              
              <div className="flex items-center gap-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 rounded-full text-sm font-semibold transition-colors ${
                      currentPage === page
                        ? 'bg-[#FF9500] text-black'
                        : 'text-white hover:bg-white/5'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="disabled:opacity-30"
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          )}
        </div>

        {/* Mobile Collapsible List View */}
        <div className="lg:hidden space-y-3">
          {paginatedClients.length === 0 ? (
            <div className="bg-[#1C1C1C] rounded-lg border border-white/5 p-8 text-center">
              <p className="text-gray-400">
                {searchQuery || statusFilter !== 'all' 
                  ? 'No se encontraron clientes con los filtros aplicados'
                  : 'No hay clientes registrados'}
              </p>
            </div>
          ) : (
            paginatedClients.map((client) => {
              const statusBadge = getStatusBadge(client);
              return (
                <Collapsible key={client.id}>
                  <div className="bg-[#1C1C1C] rounded-lg border border-white/5 overflow-hidden">
                    <CollapsibleTrigger className="w-full p-4 hover:bg-white/5 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 text-left">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-white">{client.name}</h3>
                            <div className={`w-2 h-2 rounded-full ${statusBadge.color}`}></div>
                          </div>
                          {client.company && (
                            <p className="text-sm text-gray-400">{client.company}</p>
                          )}
                        </div>
                        <ChevronDown className="w-5 h-5 text-gray-400 transition-transform ui-expanded:rotate-180" />
                      </div>
                    </CollapsibleTrigger>
                    
                    <CollapsibleContent>
                      <div className="px-4 pb-4 space-y-3 border-t border-white/5 pt-4">
                        {/* Email */}
                        <div className="flex items-start gap-3">
                          <Mail className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-400 mb-0.5">Email</p>
                            <p className="text-sm text-white break-all">{client.email}</p>
                          </div>
                        </div>

                        {/* Phone */}
                        {client.phone && (
                          <div className="flex items-start gap-3">
                            <Phone className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                            <div className="flex-1">
                              <p className="text-xs text-gray-400 mb-0.5">Teléfono</p>
                              <p className="text-sm text-white">{client.phone}</p>
                            </div>
                          </div>
                        )}

                        {/* Next Payment Date */}
                        <div className="flex items-start gap-3">
                          <Calendar className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                          <div className="flex-1">
                            <p className="text-xs text-gray-400 mb-0.5">Próximo Pago</p>
                            <p className="text-sm text-white">
                              {format(new Date(client.next_payment_date), 'dd/MM/yyyy', { locale: es })}
                            </p>
                          </div>
                        </div>

                        {/* Amount */}
                        <div className="flex items-start gap-3">
                          <DollarSign className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                          <div className="flex-1">
                            <p className="text-xs text-gray-400 mb-0.5">Monto</p>
                            <p className="text-sm text-white font-mono">
                              ${parseFloat(client.amount).toLocaleString('es-ES')}
                            </p>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div className="flex items-center gap-2 pt-2">
                          <Badge className={`${statusBadge.color} text-white border-0`}>
                            {statusBadge.label}
                          </Badge>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(client)}
                            className="flex-1"
                          >
                            <Pencil className="w-3 h-3 mr-1.5" />
                            Editar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(client.id)}
                            className="flex-1 text-red-400 border-red-400/20 hover:bg-red-500/10"
                          >
                            <Trash2 className="w-3 h-3 mr-1.5" />
                            Eliminar
                          </Button>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              );
            })
          )}

          {/* Mobile Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Anterior
              </Button>
              
              <span className="text-sm text-gray-400">
                Página {currentPage} de {totalPages}
              </span>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                Siguiente
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
