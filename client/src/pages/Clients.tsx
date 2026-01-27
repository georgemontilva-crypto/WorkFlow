import { useState } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Plus, Search, Mail, Phone, Building2, MoreVertical, Archive, Trash2, Edit, X, ChevronDown } from 'lucide-react';
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
import { useToast } from '../contexts/ToastContext';

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
  const { success, error: showError } = useToast();
  const [expandedClientId, setExpandedClientId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('active');
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    variant?: 'default' | 'danger' | 'success' | 'warning';
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {}, variant: 'default' });
  
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
        success('Cliente actualizado exitosamente');
      } else {
        await createClientMutation.mutateAsync(formData);
        success('Cliente creado exitosamente');
      }
      handleCloseModal();
      refetch();
    } catch (error: any) {
      console.error('Error al guardar cliente:', error);
      showError(error.message || 'Error al guardar cliente');
    }
  };

  const handleArchive = async (id: number) => {
    try {
      await updateClientMutation.mutateAsync({ id, archived: 1 });
      success('Cliente archivado exitosamente');
      refetch();
    } catch (error: any) {
      console.error('Error al archivar cliente:', error);
      showError(error.message || 'Error al archivar cliente');
    }
  };

  const handleDelete = async (id: number) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Eliminar Cliente' || 'Eliminar Cliente',
      message: '¿Estás seguro de que deseas eliminar este cliente?',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await deleteClientMutation.mutateAsync({ id });
          success('Cliente eliminado exitosamente');
          refetch();
        } catch (error: any) {
          console.error('Error al eliminar cliente:', error);
          showError(error.message || 'Error al eliminar cliente');
        }
      }
    });
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-[#EDEDED]">{'Clientes'}</h1>
              <p className="text-[#8B92A8] mt-1 hidden md:block">{'Gestiona tu cartera de clientes'}</p>
            </div>
            {/* Botones circulares en móvil, normales en desktop */}
            <div className="flex items-center gap-2">
              {/* Botón de Búsqueda */}
              <Button
                onClick={() => setIsSearchModalOpen(true)}
                variant="default"
                className="md:hidden w-12 h-12 rounded-full p-0 flex items-center justify-center"
              >
                <Search className="w-5 h-5" />
              </Button>
              
              {/* Botón de Agregar Cliente */}
              <Button
                onClick={() => handleOpenModal()}
                variant="default"
                className="md:w-auto w-12 h-12 md:h-auto rounded-full md:rounded-[9999px] p-0 md:px-4 md:py-2 flex items-center justify-center"
              >
                <Plus className="w-5 h-5 md:mr-2" />
                <span className="hidden md:inline">{'Agregar Cliente'}</span>
              </Button>
            </div>
          </div>
        </Card>

        {/* Clients List Card with Filters */}
        <Card>
          {/* Filters Section - Pills y Búsqueda */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            {/* Pills de Filtro de Estado */}
            <div className="flex gap-2 w-full md:w-auto">
              <button
                onClick={() => setStatusFilter(statusFilter === 'active' ? 'all' : 'active')}
                className={`flex-1 md:flex-none md:px-6 h-12 rounded-full border transition-all ${
                  statusFilter === 'active'
                    ? 'bg-[#C4FF3D] border-[#C4FF3D] text-[#121212] font-medium'
                    : 'border-[#C4FF3D]/30 text-[#8B92A8] hover:border-[#C4FF3D]/60'
                }`}
              >
                {'Activo'}
              </button>
              <button
                onClick={() => setStatusFilter(statusFilter === 'inactive' ? 'all' : 'inactive')}
                className={`flex-1 md:flex-none md:px-6 h-12 rounded-full border transition-all ${
                  statusFilter === 'inactive'
                    ? 'bg-[#C4FF3D] border-[#C4FF3D] text-[#121212] font-medium'
                    : 'border-[#C4FF3D]/30 text-[#8B92A8] hover:border-[#C4FF3D]/60'
                }`}
              >
                {'Inactivo'}
              </button>
            </div>
            
            {/* Búsqueda - Solo visible en desktop */}
            <div className="hidden md:flex relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#8B92A8] w-5 h-5" />
              <Input
                type="text"
                placeholder={'Buscar clientes...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-12 text-base w-full"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[#8B92A8] hover:text-[#EDEDED]"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
          
          {/* Header - Solo contador */}
          <div className="mb-6">
            <p className="text-[#8B92A8] text-sm">{filteredClients.length} {filteredClients.length !== 1 ? 'clientes' : 'cliente'}</p>
          </div>
          
          <div className="space-y-3">
            {filteredClients.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-[#8B92A8] text-base">{'No hay clientes registrados'}</p>
              </div>
            ) : (
              filteredClients.map((client) => {
                const isExpanded = expandedClientId === client.id;
                
                return (
                  <div
                    key={client.id}
                    className="bg-[#121212] rounded-[28px] border border-[rgba(255,255,255,0.06)] hover:border-[#C4FF3D]/40 transition-all duration-200 group"
                  >
                    {/* Header - Always Visible */}
                    <div 
                      className="p-6 cursor-pointer"
                      onClick={() => setExpandedClientId(isExpanded ? null : client.id)}
                    >
                      <div className="flex items-center justify-between gap-4">
                        {/* Left: Icon + Name + Company */}
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-12 h-12 rounded-[20px] bg-[#C4FF3D]/10 border border-[#C4FF3D]/20 flex items-center justify-center flex-shrink-0">
                            <Building2 className="w-6 h-6 text-[#C4FF3D]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-[#EDEDED] font-medium text-base md:text-lg leading-tight truncate">
                              {client.name}
                            </h3>
                            {client.company && (
                              <p className="text-[#8B92A8] text-sm mt-0.5 truncate">
                                {client.company}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Center: Contact Info (Desktop Only) */}
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

                        {/* Right: Status + Chevron (Mobile) / Actions (Desktop) */}
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-3 md:px-4 py-1.5 md:py-2 rounded-[9999px] text-xs md:text-sm font-medium whitespace-nowrap ${
                              client.status === 'active'
                                ? 'bg-[#C4FF3D]/10 text-[#C4FF3D] border border-[#C4FF3D]/20'
                                : 'bg-[#8B92A8]/10 text-[#8B92A8] border border-[#8B92A8]/20'
                            }`}
                          >
                            {client.status === 'active' ? 'Activo' : 'Inactivo'}
                          </span>

                          {/* Chevron for Mobile */}
                          <button
                            className="md:hidden text-[#8B92A8] hover:text-[#EDEDED] p-2 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedClientId(isExpanded ? null : client.id);
                            }}
                          >
                            <ChevronDown 
                              className={`w-5 h-5 transition-transform duration-200 ${
                                isExpanded ? 'rotate-180' : ''
                              }`}
                            />
                          </button>

                          {/* Actions Menu for Desktop */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => e.stopPropagation()}
                                className="hidden md:flex text-[#8B92A8] hover:text-[#EDEDED] opacity-0 group-hover:opacity-100 transition-opacity min-h-[44px] min-w-[44px]"
                              >
                                <MoreVertical className="w-5 h-5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-[#0E0F12] border-[#C4FF3D]/30 w-[200px] max-h-[300px] overflow-y-auto">
                              <DropdownMenuItem
                                onClick={() => handleOpenModal(client)}
                                className="text-[#EDEDED] hover:bg-[#C4FF3D]/10 cursor-pointer"
                              >
                                <Edit className="w-4 h-4 mr-2" />
                                {'Editar'}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleArchive(client.id)}
                                className="text-[#EDEDED] hover:bg-[#C4FF3D]/10 cursor-pointer"
                              >
                                <Archive className="w-4 h-4 mr-2" />
                                {'Archivar'}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDelete(client.id)}
                                className="text-[#EF4444] hover:bg-[#EF4444]/10 cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                {'Eliminar'}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Content - Mobile Only */}
                    {isExpanded && (
                      <div className="md:hidden px-6 pb-6 pt-0 space-y-4 border-t border-[rgba(255,255,255,0.06)] mt-4">
                        {/* Contact Info */}
                        <div className="space-y-3 pt-4">
                          <div className="flex items-center gap-3 text-[#8B92A8]">
                            <Mail className="w-4 h-4 flex-shrink-0" />
                            <span className="text-sm break-all">{client.email}</span>
                          </div>
                          <div className="flex items-center gap-3 text-[#8B92A8]">
                            <Phone className="w-4 h-4 flex-shrink-0" />
                            <span className="text-sm">{client.phone}</span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenModal(client);
                            }}
                            className="flex-1 bg-[#C4FF3D]/10 border-[#C4FF3D]/30 text-[#C4FF3D] hover:bg-[#C4FF3D]/20 h-10"
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Editar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleArchive(client.id);
                            }}
                            className="flex-1 bg-[#8B92A8]/10 border-[#8B92A8]/30 text-[#8B92A8] hover:bg-[#8B92A8]/20 h-10"
                          >
                            <Archive className="w-4 h-4 mr-2" />
                            Archivar
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(client.id);
                            }}
                            className="bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20 h-10 w-10 flex-shrink-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </Card>
      </div>

      {/* Modal para Crear/Editar Cliente */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="bg-[#121212] border-[rgba(255,255,255,0.06)] max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-[#EDEDED] text-2xl font-semibold">
              {editingClient ? 'Editar Cliente' : 'Agregar Cliente'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-[#EDEDED]">
                  {'Nombre del Cliente'}
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={'Ej: Juan Pérez'}
                  required
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company" className="text-[#EDEDED]">
                  {'Empresa'}
                </Label>
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  placeholder={'Ej: Acme Corp'}
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-[#EDEDED]">
                  {'Email'}
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder={'correo@ejemplo.com'}
                  required
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-[#EDEDED]">
                  {'Teléfono'}
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder={'+1 234 567 8900'}
                  required
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status" className="text-[#EDEDED]">
                  {'estados'}
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
                    <SelectItem value="active">{'Activo'}</SelectItem>
                    <SelectItem value="inactive">{'Inactivo'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes" className="text-[#EDEDED]">
                {'Notas'} ({'opcional'})
              </Label>
              <textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder={'Información adicional sobre el cliente...'}
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
                {'Cancelar'}
              </Button>
              <Button
                type="submit"
                variant="default"
                disabled={createClientMutation.isPending || updateClientMutation.isPending}
                className="flex-1 h-12"
              >
                {editingClient ? 'Actualizar' : 'Crear'} {'cliente'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Search Modal */}
      <Dialog open={isSearchModalOpen} onOpenChange={setIsSearchModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-[#EDEDED]">{'Buscar Clientes'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#8B92A8] w-5 h-5" />
              <Input
                type="text"
                placeholder={'Buscar por nombre, empresa o email...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-12 text-base"
                autoFocus
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setSearchTerm('');
                  setIsSearchModalOpen(false);
                }}
                className="flex-1 h-12"
              >
                {'Limpiar'}
              </Button>
              <Button
                type="button"
                variant="default"
                onClick={() => setIsSearchModalOpen(false)}
                className="flex-1 h-12"
              >
                {'Buscar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        variant={confirmDialog.variant}
      />
    </DashboardLayout>
  );
}
