/**
 * Invoices Page - REBUILT FROM SCRATCH
 * Clean, minimal, functional UI for invoice management
 */

import { useState } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { Plus, Search, Send, Download, Trash2, Eye, X } from 'lucide-react';
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
import { trpc } from '../lib/trpc';
// import { toast } from 'sonner';
import { format } from 'date-fns';
import { getCurrency } from '@shared/currencies';
import { Badge } from '../components/ui/badge';

type Invoice = {
  id: number;
  invoice_number: string;
  client_id: number;
  status: 'draft' | 'sent' | 'paid' | 'cancelled';
  currency: string;
  subtotal: string;
  total: string;
  issue_date: Date;
  due_date: Date;
  notes?: string | null;
  terms?: string | null;
  created_at: Date;
};

type InvoiceItem = {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
};

export default function Invoices() {
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'sent' | 'paid' | 'cancelled'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingInvoice, setViewingInvoice] = useState<number | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    client_id: '',
    issue_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notes: '',
    terms: '',
    is_recurring: false,
    recurrence_frequency: 'monthly' as 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'semiannually' | 'annually',
    recurrence_end_date: '',
  });
  
  const [items, setItems] = useState<InvoiceItem[]>([
    { description: '', quantity: 1, unit_price: 0, total: 0 },
  ]);
  
  // Queries
  const utils = trpc.useContext();
  const { data: user } = trpc.auth.me.useQuery();
  const { data: invoices = [] } = trpc.invoices.list.useQuery({ status: statusFilter });
  const { data: clients = [] } = trpc.clients.list.useQuery();
  const { data: viewInvoiceData } = trpc.invoices.getById.useQuery(
    { id: viewingInvoice! },
    { enabled: viewingInvoice !== null }
  );
  
  // Mutations
  const createInvoiceMutation = trpc.invoices.create.useMutation();
  const sendEmailMutation = trpc.invoices.sendByEmail.useMutation();
  const downloadPDFMutation = trpc.invoices.downloadPDF.useMutation();
  const updateStatusMutation = trpc.invoices.updateStatus.useMutation();
  const deleteInvoiceMutation = trpc.invoices.delete.useMutation();
  
  // Handlers
  const handleOpenModal = () => {
    setFormData({
      client_id: '',
      issue_date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      notes: '',
      terms: '',
    });
    setItems([{ description: '', quantity: 1, unit_price: 0, total: 0 }]);
    setIsModalOpen(true);
  };
  
  const handleCloseModal = () => {
    setIsModalOpen(false);
  };
  
  const handleAddItem = () => {
    setItems([...items, { description: '', quantity: 1, unit_price: 0, total: 0 }]);
  };
  
  const handleRemoveItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };
  
  const handleItemChange = (index: number, field: keyof InvoiceItem, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Calculate total
    if (field === 'quantity' || field === 'unit_price') {
      newItems[index].total = newItems[index].quantity * newItems[index].unit_price;
    }
    
    setItems(newItems);
  };
  
  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + item.total, 0);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Validate
      if (!formData.client_id) {
        // toast.error('Debe seleccionar un cliente');
        return;
      }
      
      if (items.length === 0 || items.every(item => !item.description)) {
        // toast.error('Debe agregar al menos un ítem');
        return;
      }
      
      // Create invoice
      await createInvoiceMutation.mutateAsync({
        client_id: parseInt(formData.client_id),
        issue_date: formData.issue_date,
        due_date: formData.due_date,
        items: items.filter(item => item.description), // Only non-empty items
        notes: formData.notes || undefined,
        terms: formData.terms || undefined,
        is_recurring: formData.is_recurring,
        recurrence_frequency: formData.is_recurring ? formData.recurrence_frequency : undefined,
        recurrence_end_date: formData.is_recurring && formData.recurrence_end_date ? formData.recurrence_end_date : undefined,
      });
      
      // toast.success('Factura creada exitosamente');
      handleCloseModal();
      utils.invoices.list.invalidate();
    } catch (error: any) {
      console.error('Error al crear factura:', error);
      // toast.error(error.message || 'Error al crear factura');
    }
  };
  
  const handleSendEmail = async (id: number) => {
    try {
      console.log('[Invoices] Sending email for invoice:', id);
      await sendEmailMutation.mutateAsync({ id });
      alert('Factura enviada por email exitosamente');
      utils.invoices.list.invalidate();
    } catch (error: any) {
      console.error('Error al enviar email:', error);
      alert('Error al enviar email: ' + (error.message || 'Error desconocido'));
    }
  };
  
  const handleDownloadPDF = async (id: number, invoice_number: string) => {
    try {
      console.log('[Invoices] Downloading PDF for invoice:', id);
      const result = await downloadPDFMutation.mutateAsync({ id });
      
      console.log('[Invoices] PDF received, size:', result.pdf?.length);
      
      // Download PDF
      const link = document.createElement('a');
      link.href = `data:application/pdf;base64,${result.pdf}`;
      link.download = result.filename;
      link.click();
      
      alert('PDF descargado exitosamente');
    } catch (error: any) {
      console.error('Error al descargar PDF:', error);
      alert('Error al descargar PDF: ' + (error.message || 'Error desconocido'));
    }
  };
  
  const handleMarkAsPaid = async (id: number) => {
    try {
      await updateStatusMutation.mutateAsync({ id, status: 'paid' });
      // toast.success('Factura marcada como pagada');
      utils.invoices.list.invalidate();
    } catch (error: any) {
      console.error('Error al marcar como pagada:', error);
      // toast.error(error.message || 'Error al marcar como pagada');
    }
  };
  
  const handleCancel = async (id: number) => {
    if (!confirm('¿Estás seguro de que deseas cancelar esta factura?')) {
      return;
    }
    
    try {
      await updateStatusMutation.mutateAsync({ id, status: 'cancelled' });
      // toast.success('Factura cancelada');
      utils.invoices.list.invalidate();
    } catch (error: any) {
      console.error('Error al cancelar factura:', error);
      // toast.error(error.message || 'Error al cancelar factura');
    }
  };
  
  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta factura?')) {
      return;
    }
    
    try {
      await deleteInvoiceMutation.mutateAsync({ id });
      // toast.success('Factura eliminada');
      utils.invoices.list.invalidate();
    } catch (error: any) {
      console.error('Error al eliminar factura:', error);
      // toast.error(error.message || 'Error al eliminar factura');
    }
  };
  
  const getStatusBadge = (status: string) => {
    const badges = {
      draft: { label: 'Borrador', color: 'bg-gray-500' },
      sent: { label: 'Enviada', color: 'bg-blue-500' },
      paid: { label: 'Pagada', color: 'bg-green-500' },
      cancelled: { label: 'Cancelada', color: 'bg-red-500' },
    };
    return badges[status as keyof typeof badges] || badges.draft;
  };
  
  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });
  
  return (
    <DashboardLayout>
      <div className="min-h-screen p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Facturas</h1>
            <p className="text-gray-400 mt-1">Gestiona tus facturas</p>
          </div>
          <Button
            onClick={handleOpenModal}
            className="bg-[#EBFF57] hover:bg-[#EBFF57]/90 text-black"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nueva Factura
          </Button>
        </div>
        
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Buscar por número de factura..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-[#222222] border-gray-700 text-white"
              />
            </div>
          </div>
          <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
            <SelectTrigger className="w-full sm:w-48 bg-[#222222] border-gray-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="draft">Borradores</SelectItem>
              <SelectItem value="sent">Enviadas</SelectItem>
              <SelectItem value="paid">Pagadas</SelectItem>
              <SelectItem value="cancelled">Canceladas</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Invoices List */}
        <div className="grid gap-4">
          {filteredInvoices.length === 0 ? (
            <div className="text-center py-12 bg-[#222222] rounded-lg border border-gray-700">
              <p className="text-gray-400">No hay facturas</p>
            </div>
          ) : (
            filteredInvoices.map((invoice) => {
              const badge = getStatusBadge(invoice.status);
              const client = clients.find(c => c.id === invoice.client_id);
              
              return (
                <div
                  key={invoice.id}
                  className="bg-[#222222] rounded-lg border border-gray-700 p-4 hover:border-gray-600 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-white">{invoice.invoice_number}</h3>
                        <span className={`px-2 py-1 rounded text-xs font-medium text-white ${badge.color}`}>
                          {badge.label}
                        </span>
                      </div>
                      <p className="text-gray-400 text-sm mb-1">Cliente: {client?.name || 'Desconocido'}</p>
                      <p className="text-gray-400 text-sm">
                        Vencimiento: {format(new Date(invoice.due_date), 'dd/MM/yyyy')}
                      </p>
                      <p className="text-white font-semibold mt-2">
                        {new Intl.NumberFormat('es-ES', { style: 'currency', currency: invoice.currency }).format(parseFloat(invoice.total))}
                      </p>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setViewingInvoice(invoice.id)}
                        className="border-gray-700 text-white hover:bg-gray-800"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownloadPDF(invoice.id, invoice.invoice_number)}
                        disabled={downloadPDFMutation.isLoading}
                        className="border-gray-700 text-white hover:bg-gray-800 disabled:opacity-50"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      
                      {invoice.status === 'draft' && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleSendEmail(invoice.id)}
                            disabled={sendEmailMutation.isLoading}
                            className="bg-[#EBFF57] hover:bg-[#EBFF57]/90 text-black disabled:opacity-50"
                          >
                            <Send className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(invoice.id)}
                            className="border-red-700 text-red-500 hover:bg-red-900/20"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                      
                      {invoice.status === 'sent' && (
                        <Button
                          size="sm"
                          onClick={() => handleMarkAsPaid(invoice.id)}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          Marcar Pagada
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
      
      {/* Create Invoice Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] rounded-lg border border-gray-700 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Nueva Factura</h2>
                <button onClick={handleCloseModal} className="text-gray-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Client Selection */}
                <div>
                  <Label className="text-white">Cliente *</Label>
                  <Select value={formData.client_id} onValueChange={(value) => setFormData({ ...formData, client_id: value })}>
                    <SelectTrigger className="bg-[#222222] border-gray-700 text-white">
                      <SelectValue placeholder="Seleccionar cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id.toString()}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-white">Fecha de Emisión *</Label>
                    <Input
                      type="date"
                      value={formData.issue_date}
                      onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                      className="bg-[#222222] border-gray-700 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-white">Fecha de Vencimiento *</Label>
                    <Input
                      type="date"
                      value={formData.due_date}
                      onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                      className="bg-[#222222] border-gray-700 text-white"
                    />
                  </div>
                </div>
                
                {/* Recurring Invoice */}
                <div className="space-y-4 p-4 bg-[#1a1a1a] border border-gray-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="is_recurring"
                      checked={formData.is_recurring}
                      onChange={(e) => setFormData({ ...formData, is_recurring: e.target.checked })}
                      className="w-4 h-4 bg-[#222222] border-gray-700 rounded"
                    />
                    <Label htmlFor="is_recurring" className="text-white cursor-pointer">
                      Factura Recurrente
                    </Label>
                  </div>
                  
                  {formData.is_recurring && (
                    <div className="grid grid-cols-2 gap-4 mt-3">
                      <div>
                        <Label className="text-white text-sm">Frecuencia</Label>
                        <Select 
                          value={formData.recurrence_frequency} 
                          onValueChange={(value: any) => setFormData({ ...formData, recurrence_frequency: value })}
                        >
                          <SelectTrigger className="bg-[#222222] border-gray-700 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-[#1a1a1a] border-gray-700">
                            <SelectItem value="weekly">Semanal</SelectItem>
                            <SelectItem value="biweekly">Quincenal</SelectItem>
                            <SelectItem value="monthly">Mensual</SelectItem>
                            <SelectItem value="quarterly">Trimestral</SelectItem>
                            <SelectItem value="semiannually">Semestral</SelectItem>
                            <SelectItem value="annually">Anual</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-white text-sm">Fecha de Fin (Opcional)</Label>
                        <Input
                          type="date"
                          value={formData.recurrence_end_date}
                          onChange={(e) => setFormData({ ...formData, recurrence_end_date: e.target.value })}
                          className="bg-[#222222] border-gray-700 text-white"
                          placeholder="Sin fecha de fin"
                        />
                      </div>
                    </div>
                  )}
                  
                  {formData.is_recurring && (
                    <p className="text-xs text-gray-500 mt-2">
                      Las facturas se generarán automáticamente según la frecuencia seleccionada
                    </p>
                  )}
                </div>
                
                {/* Currency Info */}
                <div className="p-3 bg-[#EBFF57]/10 border border-[#EBFF57]/30 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Moneda de la factura</p>
                      <p className="text-sm font-medium text-white">
                        {getCurrency(user?.primary_currency || 'USD')?.name}
                      </p>
                    </div>
                    <Badge className="bg-[#EBFF57]/10 text-[#EBFF57] border border-[#EBFF57]/30">
                      {getCurrency(user?.primary_currency || 'USD')?.symbol} {user?.primary_currency || 'USD'}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    La moneda se asigna automáticamente desde tu perfil
                  </p>
                </div>
                
                {/* Items */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-white">Ítems *</Label>
                    <Button type="button" size="sm" onClick={handleAddItem} className="bg-[#EBFF57] hover:bg-[#EBFF57]/90 text-black">
                      <Plus className="w-4 h-4 mr-1" />
                      Agregar Ítem
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    {items.map((item, index) => (
                      <div key={index} className="space-y-2">
                        <div className="grid grid-cols-12 gap-2 items-end">
                          <div className="col-span-6">
                            <Label className="text-white text-xs mb-1">Descripción</Label>
                            <Input
                              placeholder="Descripción del servicio o producto"
                              value={item.description}
                              onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                              className="bg-[#222222] border-gray-700 text-white"
                            />
                          </div>
                          <div className="col-span-2">
                            <Label className="text-white text-xs mb-1">Cantidad</Label>
                            <Input
                              type="number"
                              placeholder="1"
                              value={item.quantity}
                              onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                              className="bg-[#222222] border-gray-700 text-white"
                            />
                          </div>
                          <div className="col-span-2">
                            <Label className="text-white text-xs mb-1">Precio Unitario</Label>
                            <Input
                              type="number"
                              placeholder="0.00"
                              value={item.unit_price}
                              onChange={(e) => handleItemChange(index, 'unit_price', parseFloat(e.target.value) || 0)}
                              className="bg-[#222222] border-gray-700 text-white"
                            />
                          </div>
                          <div className="col-span-2">
                            <Label className="text-white text-xs mb-1">Total</Label>
                            <Input
                              type="number"
                              placeholder="0.00"
                              value={item.total}
                              readOnly
                              className="bg-[#2a2a2a] border-gray-700 text-white"
                            />
                          </div>
                        </div>
                        <div className="col-span-1">
                          {items.length > 1 && (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => handleRemoveItem(index)}
                              className="border-red-700 text-red-500 hover:bg-red-900/20 w-full"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-4 text-right">
                    <p className="text-white font-semibold">
                      Subtotal: ${calculateSubtotal().toFixed(2)}
                    </p>
                  </div>
                </div>
                
                {/* Notes */}
                <div>
                  <Label className="text-white">Notas</Label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full min-h-[80px] bg-[#222222] border border-gray-700 rounded-md p-2 text-white"
                    placeholder="Notas adicionales..."
                  />
                </div>
                
                {/* Terms */}
                <div>
                  <Label className="text-white">Términos y Condiciones</Label>
                  <textarea
                    value={formData.terms}
                    onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                    className="w-full min-h-[80px] bg-[#222222] border border-gray-700 rounded-md p-2 text-white"
                    placeholder="Términos y condiciones..."
                  />
                </div>
                
                {/* Actions */}
                <div className="flex gap-3 justify-end">
                  <Button type="button" variant="outline" onClick={handleCloseModal} className="border-gray-700 text-white hover:bg-gray-800">
                    Cancelar
                  </Button>
                  <Button type="submit" className="bg-[#EBFF57] hover:bg-[#EBFF57]/90 text-black">
                    Crear Factura
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      
      {/* View Invoice Modal */}
      {viewingInvoice && viewInvoiceData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] rounded-lg border border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Detalle de Factura</h2>
                <button onClick={() => setViewingInvoice(null)} className="text-gray-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <p className="text-gray-400 text-sm">Número de Factura</p>
                  <p className="text-white font-semibold">{viewInvoiceData.invoice_number}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-400 text-sm">Fecha de Emisión</p>
                    <p className="text-white">{format(new Date(viewInvoiceData.issue_date), 'dd/MM/yyyy')}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Fecha de Vencimiento</p>
                    <p className="text-white">{format(new Date(viewInvoiceData.due_date), 'dd/MM/yyyy')}</p>
                  </div>
                </div>
                
                <div>
                  <p className="text-gray-400 text-sm">Estado</p>
                  <span className={`inline-block px-2 py-1 rounded text-xs font-medium text-white ${getStatusBadge(viewInvoiceData.status).color}`}>
                    {getStatusBadge(viewInvoiceData.status).label}
                  </span>
                </div>
                
                <div>
                  <p className="text-gray-400 text-sm mb-2">Ítems</p>
                  <div className="space-y-2">
                    {viewInvoiceData.items.map((item: any, index: number) => (
                      <div key={index} className="bg-[#222222] p-3 rounded border border-gray-700">
                        <p className="text-white font-medium">{item.description}</p>
                        <p className="text-gray-400 text-sm">
                          {item.quantity} x ${item.unit_price} = ${item.total}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="border-t border-gray-700 pt-4">
                  <div className="flex justify-between">
                    <p className="text-gray-400">Subtotal</p>
                    <p className="text-white">${viewInvoiceData.subtotal}</p>
                  </div>
                  <div className="flex justify-between mt-2">
                    <p className="text-white font-semibold">Total</p>
                    <p className="text-white font-semibold">${viewInvoiceData.total} {viewInvoiceData.currency}</p>
                  </div>
                </div>
                
                {viewInvoiceData.notes && (
                  <div>
                    <p className="text-gray-400 text-sm">Notas</p>
                    <p className="text-white">{viewInvoiceData.notes}</p>
                  </div>
                )}
                
                {viewInvoiceData.terms && (
                  <div>
                    <p className="text-gray-400 text-sm">Términos</p>
                    <p className="text-white">{viewInvoiceData.terms}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
