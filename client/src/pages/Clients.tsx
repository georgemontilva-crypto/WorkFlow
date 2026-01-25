import { useState, useMemo } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { DashboardLayout } from '../components/DashboardLayout';
import { Plus, Search, Mail, Phone, Building2, MoreVertical, Archive, Trash2, Edit, X } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { trpc } from '../lib/trpc';
// import { toast } from 'sonner';

type Client = {
  id: number;
  name: string;
  email: string;
  phone: string;
  company?: string | null;
  status: 'active' | 'inactive';
  archived: number;
  notes?: string | null;
  created_at: Date;
  updated_at: Date;
};

export default function Clients() {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    status: 'active' as 'active' | 'inactive',
    notes: '',
  });

  const { data: clients = [], refetch } = trpc.clients.list.useQuery();
  const createClientMutation = trpc.clients.create.useMutation();
  const updateClientMutation = trpc.clients.update.useMutation();
  const deleteClientMutation = trpc.clients.delete.useMutation();

  const handleOpenModal = (client?: Client) => {
    if (client) {
      setEditingClient(client);
      setFormData({
        name: client.name,
        email: client.email,
        phone: client.phone,
        company: client.company || '',
        status: client.status,
        notes: client.notes || '',
      });
    } else {
      setEditingClient(null);
      setFormData({
        name: '',
        email: '',
        phone: '',
        company: '',
        status: 'active',
        notes: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingClient(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      company: '',
      status: 'active',
      notes: '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingClient) {
        await updateClientMutation.mutateAsync({
          id: editingClient.id,
          ...formData,
        });
        // toast.success('Cliente actualizado exitosamente');
      } else {
        await createClientMutation.mutateAsync(formData);
        // toast.success('Cliente creado exitosamente');
      }
      handleCloseModal();
      refetch();
    } catch (error: any) {
      console.error('Error al guardar cliente:', error);
      // toast.error(error.message || 'Error al guardar cliente');
    }
  };

  const handleArchive = async (id: number) => {
    try {
      await updateClientMutation.mutateAsync({ id, archived: 1 });
      // toast.success('Cliente archivado exitosamente');
      refetch();
    } catch (error: any) {
      console.error('Error al archivar cliente:', error);
      // toast.error(error.message || 'Error al archivar cliente');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este cliente?')) {
      return;
    }
    
    try {
      await deleteClientMutation.mutateAsync({ id });
      // toast.success('Cliente eliminado exitosamente');
      refetch();
    } catch (error: any) {
      console.error('Error al eliminar cliente:', error);
      // toast.error(error.message || 'Error al eliminar cliente');
    }
  };

  const filteredClients = clients.filter(client => {
    if (client.archived) return false;
    
    const matchesSearch = 
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (client.company && client.company.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || client.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    if (status === 'inactive') {
      return { label: 'Inactivo', color: 'bg-gray-500' };
    }
    return { label: 'Activo', color: 'bg-green-500' };
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">{t.clients.title}</h1>
          <p className="text-gray-400 mt-1">{t.clients.subtitle}</p>
        </div>
        <Button
          onClick={() => handleOpenModal()}
          className="bg-[#FF9500] hover:bg-[#FF9500]/90 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          {t.clients.addClient}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder={t.clients.search}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-[#2A2A2A] border-white/10 text-white h-11"
          />
        </div>
        <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
          <SelectTrigger className="w-full sm:w-[200px] bg-[#2A2A2A] border-white/10 text-white h-11">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="active">Activo</SelectItem>
            <SelectItem value="inactive">Inactivo</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Lista de Clientes - Filas tipo tarjeta (FASE 4) */}
      <div className="space-y-4">
        {filteredClients.length === 0 ? (
          <div className="bg-[#1B1E24] rounded-[12px] border border-[rgba(255,255,255,0.06)] p-12 text-center">
            <p className="text-[#9AA0AA] text-base">No se encontraron clientes</p>
          </div>
        ) : (
          filteredClients.map((client) => {
            const statusBadge = getStatusBadge(client.status);
            
            return (
              <div 
                key={client.id} 
                className="bg-[#1B1E24] rounded-[12px] border border-[rgba(255,255,255,0.06)] p-4 md:p-6 hover:bg-[#4ADE80]/5 transition-colors cursor-pointer group"
              >
                <div className="flex items-center justify-between gap-6">
                  {/* Información Principal - Izquierda */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-medium text-lg mb-1">{client.name}</h3>
                    {client.company && (
                      <p className="text-[#9AA0AA] flex items-center gap-2 text-base">
                        <Building2 className="w-4 h-4 flex-shrink-0" />
                        {client.company}
                      </p>
                    )}
                  </div>

                  {/* Contacto - Centro */}
                  <div className="hidden md:flex flex-col gap-2 flex-1">
                    <div className="flex items-center gap-2 text-[#9AA0AA]">
                      <Mail className="w-4 h-4 flex-shrink-0" />
                      <span className="text-base truncate">{client.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[#9AA0AA]">
                      <Phone className="w-4 h-4 flex-shrink-0" />
                      <span className="text-base">{client.phone}</span>
                    </div>
                  </div>

                  {/* Estado y Acciones - Derecha */}
                  <div className="flex items-center gap-2 md:gap-4">
                    <span className={`inline-flex items-center px-3 py-1.5 rounded-[6px] text-sm font-medium ${statusBadge.color} text-white`}>
                      {statusBadge.label}
                    </span>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-[#9AA0AA] hover:text-white md:opacity-0 md:group-hover:opacity-100 transition-opacity min-h-[44px] min-w-[44px]">
                          <MoreVertical className="w-5 h-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-[#0E0F12] border-[#4ADE80]/30">
                        <DropdownMenuItem
                          onClick={() => handleOpenModal(client)}
                          className="text-white hover:bg-[#4ADE80]/10 cursor-pointer"
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleArchive(client.id)}
                          className="text-white hover:bg-[#4ADE80]/10 cursor-pointer"
                        >
                          <Archive className="w-4 h-4 mr-2" />
                          Archivar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(client.id)}
                          className="text-[#EF4444] hover:bg-[#EF4444]/10 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Contacto Mobile - Debajo */}
                <div className="md:hidden mt-4 pt-4 border-t border-[rgba(255,255,255,0.06)] space-y-2">
                  <div className="flex items-center gap-2 text-[#9AA0AA]">
                    <Mail className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm truncate">{client.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#9AA0AA]">
                    <Phone className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm">{client.phone}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-[#1A1A1A] rounded-lg border border-white/10 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-[#1A1A1A] border-b border-white/10 p-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">
                {editingClient ? 'Editar Cliente' : t.clients.addClient}
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-white font-medium text-sm">
                    {t.clients.name} *
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="bg-[#2A2A2A] border-white/10 text-white h-11"
                    placeholder="Nombre completo"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white font-medium text-sm">
                    {t.clients.email} *
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
                  <Label htmlFor="phone" className="text-white font-medium text-sm">
                    {t.clients.phone} *
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="bg-[#2A2A2A] border-white/10 text-white h-11"
                    placeholder="+1 (555) 000-0000"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company" className="text-white font-medium text-sm">
                    {t.clients.company}
                  </Label>
                  <Input
                    id="company"
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="bg-[#2A2A2A] border-white/10 text-white h-11"
                    placeholder="Nombre de la empresa"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status" className="text-white font-medium text-sm">Estado</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: 'active' | 'inactive') => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger className="bg-[#2A2A2A] border-white/10 text-white h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Activo</SelectItem>
                    <SelectItem value="inactive">Inactivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes" className="text-white font-medium text-sm">Notas Adicionales</Label>
                <textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full min-h-[100px] bg-[#2A2A2A] border border-white/10 rounded-md p-3 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FF9500]"
                  placeholder="Información adicional sobre el cliente..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseModal}
                  className="flex-1 border-white/10 text-white hover:bg-white/10"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-[#FF9500] hover:bg-[#FF9500]/90 text-white"
                  disabled={createClientMutation.isPending || updateClientMutation.isPending}
                >
                  {createClientMutation.isPending || updateClientMutation.isPending ? 'Guardando...' : 'Guardar'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </DashboardLayout>
  );
}
