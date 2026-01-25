import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
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
import { toast } from 'sonner';

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
  const archiveClientMutation = trpc.clients.archive.useMutation();
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
        toast.success('Cliente actualizado exitosamente');
      } else {
        await createClientMutation.mutateAsync(formData);
        toast.success('Cliente creado exitosamente');
      }
      handleCloseModal();
      refetch();
    } catch (error: any) {
      console.error('Error al guardar cliente:', error);
      toast.error(error.message || 'Error al guardar cliente');
    }
  };

  const handleArchive = async (id: number) => {
    try {
      await archiveClientMutation.mutateAsync({ id });
      toast.success('Cliente archivado exitosamente');
      refetch();
    } catch (error: any) {
      console.error('Error al archivar cliente:', error);
      toast.error(error.message || 'Error al archivar cliente');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este cliente?')) {
      return;
    }
    
    try {
      await deleteClientMutation.mutateAsync({ id });
      toast.success('Cliente eliminado exitosamente');
      refetch();
    } catch (error: any) {
      console.error('Error al eliminar cliente:', error);
      toast.error(error.message || 'Error al eliminar cliente');
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
    <div className="space-y-6">
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

      {/* Desktop Table */}
      <div className="hidden md:block bg-[#1A1A1A] rounded-lg border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left p-4 text-sm font-medium text-gray-400">Cliente</th>
                <th className="text-left p-4 text-sm font-medium text-gray-400">Contacto</th>
                <th className="text-left p-4 text-sm font-medium text-gray-400">Estado</th>
                <th className="text-left p-4 text-sm font-medium text-gray-400">Fecha de Creación</th>
                <th className="text-right p-4 text-sm font-medium text-gray-400">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-400">
                    No se encontraron clientes
                  </td>
                </tr>
              ) : (
                filteredClients.map((client) => {
                  const statusBadge = getStatusBadge(client.status);
                  
                  return (
                    <tr key={client.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="p-4">
                        <div>
                          <div className="font-medium text-white">{client.name}</div>
                          {client.company && (
                            <div className="text-sm text-gray-400 flex items-center gap-1 mt-1">
                              <Building2 className="w-3 h-3" />
                              {client.company}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-gray-400">
                            <Mail className="w-4 h-4" />
                            <span className="text-sm">{client.email}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-400">
                            <Phone className="w-4 h-4" />
                            <span className="text-sm">{client.phone}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBadge.color} text-white`}>
                          {statusBadge.label}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="text-white">
                          {format(new Date(client.created_at), 'dd/MM/yyyy', { locale: es })}
                        </div>
                        <div className="text-sm text-gray-400">
                          {format(new Date(client.created_at), 'hh:mm a')}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-[#2A2A2A] border-white/10">
                              <DropdownMenuItem
                                onClick={() => handleOpenModal(client)}
                                className="text-white hover:bg-white/10 cursor-pointer"
                              >
                                <Edit className="w-4 h-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleArchive(client.id)}
                                className="text-white hover:bg-white/10 cursor-pointer"
                              >
                                <Archive className="w-4 h-4 mr-2" />
                                Archivar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDelete(client.id)}
                                className="text-red-500 hover:bg-white/10 cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {filteredClients.length === 0 ? (
          <div className="bg-[#1A1A1A] rounded-lg border border-white/10 p-8 text-center text-gray-400">
            No se encontraron clientes
          </div>
        ) : (
          filteredClients.map((client) => {
            const statusBadge = getStatusBadge(client.status);
            
            return (
              <div key={client.id} className="bg-[#1A1A1A] rounded-lg border border-white/10 p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-white font-medium">{client.name}</h3>
                    {client.company && (
                      <p className="text-sm text-gray-400 flex items-center gap-1 mt-1">
                        <Building2 className="w-3 h-3" />
                        {client.company}
                      </p>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-[#2A2A2A] border-white/10">
                      <DropdownMenuItem
                        onClick={() => handleOpenModal(client)}
                        className="text-white hover:bg-white/10 cursor-pointer"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleArchive(client.id)}
                        className="text-white hover:bg-white/10 cursor-pointer"
                      >
                        <Archive className="w-4 h-4 mr-2" />
                        Archivar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(client.id)}
                        className="text-red-500 hover:bg-white/10 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-400 text-sm">
                    <Mail className="w-4 h-4" />
                    <span>{client.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-400 text-sm">
                    <Phone className="w-4 h-4" />
                    <span>{client.phone}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBadge.color} text-white`}>
                    {statusBadge.label}
                  </span>
                  <span className="text-sm text-gray-400">
                    {format(new Date(client.created_at), 'dd/MM/yyyy', { locale: es })}
                  </span>
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
  );
}
