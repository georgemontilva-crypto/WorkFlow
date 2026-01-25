import { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { DashboardLayout } from '../components/DashboardLayout';
import { Plus, Search, Mail, Phone, Building2, MoreVertical, Archive, Trash2, Edit, X } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardHeader } from '../components/ui/Card';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { trpc } from '../lib/trpc';

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
      } else {
        await createClientMutation.mutateAsync(formData);
      }
      handleCloseModal();
      refetch();
    } catch (error: any) {
      console.error('Error al guardar cliente:', error);
    }
  };

  const handleArchive = async (id: number) => {
    try {
      await updateClientMutation.mutateAsync({ id, archived: 1 });
      refetch();
    } catch (error: any) {
      console.error('Error al archivar cliente:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este cliente?')) {
      return;
    }
    
    try {
      await deleteClientMutation.mutateAsync({ id });
      refetch();
    } catch (error: any) {
      console.error('Error al eliminar cliente:', error);
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

  return (
    <DashboardLayout>
      {/* Main Container - Max Width 1280px */}
      <div className="max-w-[1440px] mx-auto p-6 space-y-6">
        
        {/* Header Card */}
        <Card>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-[#EDEDED]">{t.clients.title}</h1>
              <p className="text-[#8B92A8] mt-1">{t.clients.subtitle}</p>
            </div>
            <Button
              onClick={() => handleOpenModal()}
              variant="default"
              className="w-full md:w-auto"
            >
              <Plus className="w-5 h-5 mr-2" />
              {t.clients.addClient}
            </Button>
          </div>
        </Card>

        {/* Clients List Card with Filters */}
        <Card>
          {/* Filters Section */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#8B92A8] w-5 h-5" />
              <Input
                type="text"
                placeholder={t.clients.search}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-12 text-base"
              />
            </div>
            <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
              <SelectTrigger className="w-full md:w-[220px] h-12 text-base">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="active">Activo</SelectItem>
                <SelectItem value="inactive">Inactivo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Header - Solo contador */}
          <div className="mb-6">
            <p className="text-[#8B92A8] text-sm">{filteredClients.length} cliente{filteredClients.length !== 1 ? 's' : ''}</p>
          </div>
          
          <div className="space-y-3">
            {filteredClients.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-[#8B92A8] text-base">No se encontraron clientes</p>
              </div>
            ) : (
              filteredClients.map((client) => (
                <div
                  key={client.id}
                  className="bg-[#121212] rounded-[28px] border border-[#C4FF3D]/20 p-6 bg-[#C4FF3D]/5 transition-colors-smooth cursor-pointer group"
                >
                  <div className="flex items-start md:items-center justify-between gap-6">
                    {/* Left: Client Info */}
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-[20px] bg-[#C4FF3D]/10 border border-[#C4FF3D]/20 flex items-center justify-center flex-shrink-0">
                          <Building2 className="w-6 h-6 text-[#C4FF3D]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-[#EDEDED] font-medium text-lg leading-tight">
                            {client.name}
                          </h3>
                          {client.company && (
                            <p className="text-[#8B92A8] text-sm mt-0.5 truncate">
                              {client.company}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Center: Contact Info (Desktop) */}
                    <div className="hidden md:flex flex-col gap-2 flex-1">
                      <div className="flex items-center gap-2 text-[#8B92A8]">
                        <Mail className="w-4 h-4 flex-shrink-0" />
                        <span className="text-sm truncate">{client.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[#8B92A8]">
                        <Phone className="w-4 h-4 flex-shrink-0" />
                        <span className="text-sm">{client.phone}</span>
                      </div>
                    </div>

                    {/* Right: Status & Actions */}
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-4 py-2 rounded-[9999px] text-sm font-medium ${
                          client.status === 'active'
                            ? 'bg-[#C4FF3D]/10 text-[#C4FF3D] border border-[#C4FF3D]/20'
                            : 'bg-[#8B92A8]/10 text-[#8B92A8] border border-[#8B92A8]/20'
                        }`}
                      >
                        {client.status === 'active' ? 'Activo' : 'Inactivo'}
                      </span>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-[#8B92A8] hover:text-[#EDEDED] md:opacity-0 md:group-hover:opacity-100 transition-opacity min-h-[44px] min-w-[44px]"
                          >
                            <MoreVertical className="w-5 h-5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-[#0E0F12] border-[#C4FF3D]/30">
                          <DropdownMenuItem
                            onClick={() => handleOpenModal(client)}
                            className="text-[#EDEDED] hover:bg-[#C4FF3D]/10 cursor-pointer"
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleArchive(client.id)}
                            className="text-[#EDEDED] hover:bg-[#C4FF3D]/10 cursor-pointer"
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

                  {/* Mobile: Contact Info */}
                  <div className="md:hidden mt-4 pt-4 border-t border-[rgba(255,255,255,0.06)] space-y-2">
                    <div className="flex items-center gap-2 text-[#8B92A8]">
                      <Mail className="w-4 h-4 flex-shrink-0" />
                      <span className="text-sm truncate">{client.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[#8B92A8]">
                      <Phone className="w-4 h-4 flex-shrink-0" />
                      <span className="text-sm">{client.phone}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Modal para Crear/Editar Cliente */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="bg-[#121212] border-[rgba(255,255,255,0.06)] max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-[#EDEDED] text-2xl font-semibold">
              {editingClient ? 'Editar Cliente' : 'Nuevo Cliente'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-[#EDEDED]">
                  Nombre completo
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej: Juan Pérez"
                  required
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company" className="text-[#EDEDED]">
                  Empresa
                </Label>
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  placeholder="Ej: Acme Corp"
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-[#EDEDED]">
                  Correo electrónico
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="correo@ejemplo.com"
                  required
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-[#EDEDED]">
                  Teléfono
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1 234 567 8900"
                  required
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status" className="text-[#EDEDED]">
                  Estado
                </Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: 'active' | 'inactive') =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger className="h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Activo</SelectItem>
                    <SelectItem value="inactive">Inactivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes" className="text-[#EDEDED]">
                Notas (opcional)
              </Label>
              <textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Información adicional sobre el cliente..."
                rows={4}
                className="w-full bg-[#121212] border border-[#C4FF3D] rounded-[20px] px-4 py-3 text-[#EDEDED] placeholder:text-[#8B92A8] focus:outline-none focus:ring-2 focus:ring-[#C4FF3D]/50 transition-colors-smooth resize-none"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={handleCloseModal}
                className="flex-1 h-12"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="default"
                disabled={createClientMutation.isPending || updateClientMutation.isPending}
                className="flex-1 h-12"
              >
                {editingClient ? 'Actualizar' : 'Crear'} Cliente
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
