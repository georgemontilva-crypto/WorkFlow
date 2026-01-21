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
import { trpc } from '@/lib/trpc';
import { Users, Plus, Search, MoreVertical, Pencil, Trash2, Mail, Phone, Calendar, DollarSign, Bell, Building2, ChevronDown, ChevronUp } from 'lucide-react';
import { format, parseISO, differenceInDays, addMonths, addDays } from 'date-fns';
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
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());
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
      // Remove the parameter from URL
      setLocation('/clients', { replace: true });
    }
  }, [search, setLocation]);

  const filteredClients = clients?.filter(client =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleCard = (client_id: number) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(client_id)) {
      newExpanded.delete(client_id);
    } else {
      newExpanded.add(client_id);
    }
    setExpandedCards(newExpanded);
  };

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

  const getPaymentStatus = (next_payment_date: Date, reminder_days: number) => {
    const daysUntil = differenceInDays(new Date(next_payment_date), new Date());
    
    if (daysUntil < 0) {
      return { color: 'bg-destructive/10 text-destructive border-destructive/30', label: t.clients.overdue, icon: '🔴' };
    } else if (daysUntil <= 3) {
      return { color: 'bg-orange-500/10 text-orange-500 border-orange-500/30', label: `${daysUntil} ${t.common.days}`, icon: '🟠' };
    } else if (daysUntil <= reminder_days) {
      return { color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30', label: `${daysUntil} ${t.common.days}`, icon: '🟡' };
    }
    return { color: 'bg-muted text-muted-foreground border-border', label: `${daysUntil} ${t.common.days}`, icon: '🟢' };
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground">{t.clients.loadingClients}</p>
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
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">{t.clients.title}</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              {t.clients.subtitle}
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
              <Button className="bg-primary text-primary-foreground hover:opacity-90">
                <Plus className="w-4 h-4 mr-2" />
                {t.clients.newClient}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto w-[95vw] lg:w-[85vw]">
              <DialogHeader className="pb-4">
                <DialogTitle className="text-foreground text-xl sm:text-2xl">
                  {editingClient ? t.clients.editClient : t.clients.addClient}
                </DialogTitle>
                <DialogDescription className="text-muted-foreground text-sm">
                  {editingClient ? t.clients.updateClientInfo : t.clients.completeClientInfo}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-foreground font-semibold text-sm">{t.clients.name} <span className="text-destructive">*</span></Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="bg-background border-border text-foreground h-10"
                      required
                    />
                    <p className="text-xs text-muted-foreground">{t.clients.nameHelper}</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-foreground font-semibold">{t.clients.email} <span className="text-destructive">*</span></Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="bg-background border-border text-foreground h-11"
                      required
                    />
                    <p className="text-xs text-muted-foreground">{t.clients.emailHelper}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-foreground font-semibold">{t.clients.phone}</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="bg-background border-border text-foreground h-11"
                    />
                    <p className="text-xs text-muted-foreground">{t.clients.phoneHelper}</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company" className="text-foreground font-semibold">{t.clients.company}</Label>
                    <Input
                      id="company"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      className="bg-background border-border text-foreground h-11"
                    />
                    <p className="text-xs text-muted-foreground">{t.clients.companyHelper}</p>
                  </div>
                </div>

                {/* Billing Section */}
                <div className="pt-4 border-t-2 border-border space-y-4">
                  <div>
                    <h3 className="text-foreground font-semibold text-lg mb-1">{t.clients.billingInformation}</h3>
                    <p className="text-sm text-muted-foreground">{t.clients.billingInformationSubtitle}</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="next_payment_date" className="text-foreground font-semibold">{t.clients.next_payment_date} <span className="text-destructive">*</span></Label>
                      <Input
                        id="next_payment_date"
                        type="date"
                        value={formData.next_payment_date}
                        onChange={(e) => setFormData({ ...formData, next_payment_date: e.target.value })}
                        className="bg-background border-border text-foreground h-11"
                        required
                      />
                      <p className="text-xs text-muted-foreground">{t.clients.nextPaymentDateHelper}</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reminder_days" className="text-foreground font-semibold">{t.clients.daysInAdvanceLabel}</Label>
                      <Input
                        id="reminder_days"
                        type="number"
                        min="1"
                        max="30"
                        value={formData.reminder_days}
                        onChange={(e) => setFormData({ ...formData, reminder_days: parseInt(e.target.value) || 7 })}
                        className="bg-background border-border text-foreground h-11"
                      />
                      <p className="text-xs text-muted-foreground">{t.clients.daysInAdvanceHelper}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="billing_cycle" className="text-foreground font-semibold">{t.clients.billing_cycle}</Label>
                      <Select
                        value={formData.billing_cycle}
                        onValueChange={(value: any) => setFormData({ ...formData, billing_cycle: value })}
                      >
                        <SelectTrigger className="bg-background border-border text-foreground h-11">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border">
                          <SelectItem value="monthly">{t.clients.monthly}</SelectItem>
                          <SelectItem value="quarterly">{t.clients.quarterly}</SelectItem>
                          <SelectItem value="yearly">{t.clients.yearly}</SelectItem>
                          <SelectItem value="custom">{t.clients.custom}</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">{t.clients.billingCycleHelper}</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="amount" className="text-foreground font-semibold">{t.clients.amount} <span className="text-destructive">*</span></Label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                        className="bg-background border-border text-foreground font-mono h-11"
                        required
                      />
                      <p className="text-xs text-muted-foreground">{t.clients.billingAmount}</p>
                    </div>
                  </div>
                </div>

                {formData.billing_cycle === 'custom' && (
                  <div className="space-y-2">
                    <Label htmlFor="custom_cycle_days" className="text-foreground font-semibold">{t.clients.customCycleDays}</Label>
                    <Input
                      id="custom_cycle_days"
                      type="number"
                      min="1"
                      value={formData.custom_cycle_days}
                      onChange={(e) => setFormData({ ...formData, custom_cycle_days: parseInt(e.target.value) })}
                      className="bg-background border-border text-foreground h-11"
                    />
                    <p className="text-xs text-muted-foreground">{t.clients.reminder_days}</p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="status" className="text-foreground font-semibold">{t.clients.status}</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: any) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger className="bg-background border-border text-foreground h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      <SelectItem value="active">{t.clients.active}</SelectItem>
                      <SelectItem value="inactive">{t.clients.inactive}</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">{t.clients.statusHelper}</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-foreground font-semibold">{t.clients.notes}</Label>
                  <Input
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="bg-background border-border text-foreground h-10"
                    placeholder={t.clients.notesPlaceholder}
                  />
                  <p className="text-xs text-muted-foreground">{t.clients.notesHelper}</p>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t border-border">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    className="border-border text-foreground hover:bg-accent"
                  >
                    {t.common.cancel}
                  </Button>
                  <Button type="submit" className="bg-primary text-primary-foreground hover:opacity-90">
                    {editingClient ? t.clients.updateButton : t.clients.addButton} {t.clients.clientLabel}
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
              placeholder={t.clients.searchPlaceholder}
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
                {searchQuery ? t.clients.noClientsFound : t.clients.noClients}
              </h3>
              <p className="text-muted-foreground mb-6">
                {searchQuery ? t.clients.tryAnotherSearch : t.clients.noClientsSubtitle}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredClients.map((client) => {
              const paymentStatus = getPaymentStatus(client.next_payment_date, client.reminder_days);
              const isExpanded = expandedCards.has(client.id);

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
                          onClick={() => toggleCard(client.id)}
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
                              {t.clients.editAction}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-border" />
                            <DropdownMenuItem 
                              onClick={() => handleDelete(client.id)}
                              className="text-destructive hover:bg-destructive/10 cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              {t.clients.deleteAction}
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
                          <span className="text-sm text-muted-foreground">{t.clients.nextPayment}</span>
                          <span className="text-sm font-semibold text-foreground">
                            {format(new Date(client.next_payment_date), 'dd/MM/yyyy')}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-muted-foreground">{t.common.amount}</span>
                          <span className="text-lg font-bold font-mono text-foreground">
                            ${parseFloat(client.amount).toLocaleString('es-ES')}
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
                          {client.status === 'active' ? t.clients.active : t.clients.inactive}
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
