/**
 * Clients Page - Gestión de Clientes (CRM)
 * Design Philosophy: Modern Fintech - Clean table list with status badges
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
import { trpc } from '@/lib/trpc';
import { Plus, MoreVertical, Pencil, Trash2, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { useState, useEffect } from 'react';
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
  const [formData, setFormData] = useState<any>({
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

  // Open dialog automatically if ?new=true in URL
  useEffect(() => {
    const params = new URLSearchParams(search);
    if (params.get('new') === 'true') {
      setIsDialogOpen(true);
      setLocation('/clients', { replace: true });
    }
  }, [search, setLocation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.amount || !formData.next_payment_date) {
      toast.error(t.clients.completeRequiredFields);
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
  const totalPages = Math.ceil((clients?.length || 0) / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedClients = clients?.slice(startIndex, endIndex) || [];

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
              <Button className="bg-[#FF9500] text-black hover:bg-[#FFA500] font-semibold">
                <Plus className="w-4 h-4 mr-2" />
                {t.clients.newClient}
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#1C1C1C] border-white/10 max-w-6xl max-h-[90vh] overflow-y-auto w-[95vw] lg:w-[90vw]">
              <DialogHeader className="pb-4">
                <DialogTitle className="text-white text-xl sm:text-2xl">
                  {editingClient ? t.clients.editClient : t.clients.addClient}
                </DialogTitle>
                <DialogDescription className="text-gray-400 text-sm">
                  {editingClient ? t.clients.updateClientInfo : t.clients.completeClientInfo}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-white font-semibold text-sm">{t.clients.name} <span className="text-red-500">*</span></Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="bg-[#2A2A2A] border-white/10 text-white h-10"
                      required
                    />
                    <p className="text-xs text-gray-400">{t.clients.nameHelper}</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-white font-semibold">{t.clients.email} <span className="text-red-500">*</span></Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="bg-[#2A2A2A] border-white/10 text-white h-11"
                      required
                    />
                    <p className="text-xs text-gray-400">{t.clients.emailHelper}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-white font-semibold">{t.clients.phone}</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="bg-[#2A2A2A] border-white/10 text-white h-11"
                    />
                    <p className="text-xs text-gray-400">{t.clients.phoneHelper}</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company" className="text-white font-semibold">{t.clients.company}</Label>
                    <Input
                      id="company"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      className="bg-[#2A2A2A] border-white/10 text-white h-11"
                    />
                    <p className="text-xs text-gray-400">{t.clients.companyHelper}</p>
                  </div>
                </div>

                {/* Billing Section */}
                <div className="pt-4 border-t-2 border-white/10 space-y-4">
                  <div>
                    <h3 className="text-white font-semibold text-lg mb-1">{t.clients.billingInformation}</h3>
                    <p className="text-sm text-gray-400">{t.clients.billingInformationSubtitle}</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="next_payment_date" className="text-white font-semibold">{t.clients.next_payment_date} <span className="text-red-500">*</span></Label>
                      <Input
                        id="next_payment_date"
                        type="date"
                        value={formData.next_payment_date}
                        onChange={(e) => setFormData({ ...formData, next_payment_date: e.target.value })}
                        className="bg-[#2A2A2A] border-white/10 text-white h-11"
                        required
                      />
                      <p className="text-xs text-gray-400">{t.clients.nextPaymentDateHelper}</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reminder_days" className="text-white font-semibold">{t.clients.daysInAdvanceLabel}</Label>
                      <Input
                        id="reminder_days"
                        type="number"
                        min="1"
                        max="30"
                        value={formData.reminder_days}
                        onChange={(e) => setFormData({ ...formData, reminder_days: parseInt(e.target.value) || 7 })}
                        className="bg-[#2A2A2A] border-white/10 text-white h-11"
                      />
                      <p className="text-xs text-gray-400">{t.clients.daysInAdvanceHelper}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="billing_cycle" className="text-white font-semibold">{t.clients.billing_cycle}</Label>
                      <Select
                        value={formData.billing_cycle}
                        onValueChange={(value: any) => setFormData({ ...formData, billing_cycle: value })}
                      >
                        <SelectTrigger className="bg-[#2A2A2A] border-white/10 text-white h-11">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1C1C1C] border-white/10">
                          <SelectItem value="monthly">{t.clients.monthly}</SelectItem>
                          <SelectItem value="quarterly">{t.clients.quarterly}</SelectItem>
                          <SelectItem value="yearly">{t.clients.yearly}</SelectItem>
                          <SelectItem value="custom">{t.clients.custom}</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-400">{t.clients.billingCycleHelper}</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="amount" className="text-white font-semibold">{t.clients.amount} <span className="text-red-500">*</span></Label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                        className="bg-[#2A2A2A] border-white/10 text-white font-mono h-11"
                        required
                      />
                      <p className="text-xs text-gray-400">{t.clients.billingAmount}</p>
                    </div>
                  </div>
                </div>

                {formData.billing_cycle === 'custom' && (
                  <div className="space-y-2">
                    <Label htmlFor="custom_cycle_days" className="text-white font-semibold">{t.clients.customCycleDays}</Label>
                    <Input
                      id="custom_cycle_days"
                      type="number"
                      min="1"
                      value={formData.custom_cycle_days}
                      onChange={(e) => setFormData({ ...formData, custom_cycle_days: parseInt(e.target.value) })}
                      className="bg-[#2A2A2A] border-white/10 text-white h-11"
                    />
                    <p className="text-xs text-gray-400">{t.clients.customCycleDaysHelper}</p>
                  </div>
                )}

                {/* Status Section */}
                <div className="pt-4 border-t-2 border-white/10 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="status" className="text-white font-semibold">{t.clients.status}</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value: any) => setFormData({ ...formData, status: value })}
                    >
                      <SelectTrigger className="bg-[#2A2A2A] border-white/10 text-white h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1C1C1C] border-white/10">
                        <SelectItem value="active">{t.clients.active}</SelectItem>
                        <SelectItem value="inactive">{t.clients.inactive}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    className="border-white/10 text-white hover:bg-white/5"
                  >
                    {t.common.cancel}
                  </Button>
                  <Button 
                    type="submit" 
                    className="bg-[#FF9500] text-black hover:bg-[#FFA500] font-semibold"
                    disabled={createClient.isPending || updateClient.isPending}
                  >
                    {editingClient ? t.common.update : t.common.create}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Clients Table */}
        <div className="bg-[#1C1C1C] rounded-2xl border border-white/5 overflow-hidden">
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
                      No hay clientes registrados
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
                              <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-white/5">
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
                className="text-white hover:bg-white/5 disabled:opacity-30 bg-[#FF9500] text-black"
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
