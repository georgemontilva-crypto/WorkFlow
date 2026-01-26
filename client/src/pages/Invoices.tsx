/**
 * Invoices Page - REBUILT FROM SCRATCH
 * Clean, minimal, functional UI for invoice management
 */

import { useState, useEffect } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Card, CardHeader } from '../components/ui/Card';
import { Plus, Search, Send, Download, Trash2, Eye, X, MoreVertical, Clock, CheckCircle, DollarSign, AlertCircle, XCircle, FileText, Calendar, ChevronDown } from 'lucide-react';
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
import { useToast } from '../contexts/ToastContext';
import { format } from 'date-fns';
import { getCurrency } from '@shared/currencies';
import { Badge } from '../components/ui/badge';

type Invoice = {
  id: number;
  invoice_number: string;
  client_id: number;
  status: 'draft' | 'sent' | 'paid' | 'partial' | 'cancelled';
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
    const { success, error: showError } = useToast();
  
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'sent' | 'paid' | 'partial' | 'cancelled'>('all');
  const [clientFilter, setClientFilter] = useState<'all' | number>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingInvoice, setViewingInvoice] = useState<number | null>(null);
  const [isCreatingAndSending, setIsCreatingAndSending] = useState(false);
  const [showCreateDropdown, setShowCreateDropdown] = useState(false);
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [selectedClientName, setSelectedClientName] = useState('');
  const [showRecurringModal, setShowRecurringModal] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
  
  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    variant?: 'default' | 'danger' | 'success' | 'warning';
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {}, variant: 'default' });
  
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
  // Note: Real-time updates handled by SSE in DashboardLayout
  const { data: clients = [] } = trpc.clients.list.useQuery();
  const { data: viewInvoiceData } = trpc.invoices.getById.useQuery(
    { id: viewingInvoice! },
    { enabled: viewingInvoice !== null }
  );
  const { data: paymentSummary } = trpc.payments.getSummary.useQuery(
    { invoice_id: viewingInvoice! },
    { enabled: viewingInvoice !== null }
  );
  const { data: invoicePayments = [] } = trpc.payments.listByInvoice.useQuery(
    { invoice_id: viewingInvoice! },
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
    setClientSearchTerm('');
    setShowClientDropdown(false);
    setSelectedClientName('');
    setFormData({
      client_id: '',
      issue_date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      notes: '',
      terms: '',
      is_recurring: false,
      recurrence_frequency: 'monthly',
      recurrence_end_date: '',
    });
    setItems([{ description: '', quantity: 1, unit_price: 0, total: 0 }]);
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
  
  const handleSubmit = async (e: React.FormEvent, shouldSend: boolean = false) => {
    e.preventDefault();
    
    try {
      // Validate
      if (!formData.client_id) {
        showError('SelectClient');
        return;
      }
      
      if (items.length === 0 || items.every(item => !item.description)) {
        showError('AddItem');
        return;
      }
      
      // Create invoice
      const result = await createInvoiceMutation.mutateAsync({
        client_id: parseInt(formData.client_id),
        issue_date: formData.issue_date,
        due_date: formData.due_date,
        items: items.filter(item => item.description), // Only non-empty items
        notes: formData.notes || undefined,
        terms: formData.terms || undefined,
        status: shouldSend ? 'sent' : 'draft',
        is_recurring: formData.is_recurring,
        recurrence_frequency: formData.is_recurring ? formData.recurrence_frequency : undefined,
        recurrence_end_date: formData.is_recurring && formData.recurrence_end_date ? formData.recurrence_end_date : undefined,
      });
      
      // If shouldSend, send email
      if (shouldSend && result.invoice?.id) {
        console.log('[Invoices] Sending email for invoice:', result.invoice.id);
        await sendEmailMutation.mutateAsync({ id: result.invoice.id });
        success('CreatedAndSent');
      } else {
        success('Created');
      }
      
      handleCloseModal();
      utils.invoices.list.invalidate();
    } catch (error: any) {
      console.error('Error al crear factura:', error);
      showError(error.message || 'Error al crear factura');
    }
  };
  
  const handleCreateAndSend = async (e: React.FormEvent) => {
    setIsCreatingAndSending(true);
    setShowCreateDropdown(false);
    await handleSubmit(e, true);
    setIsCreatingAndSending(false);
  };
  
  const handleCreateAndDownload = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingAndSending(true);
    setShowCreateDropdown(false);
    
    try {
      // Validate
      if (!formData.client_id) {
        showError('SelectClient');
        setIsCreatingAndSending(false);
        return;
      }
      
      if (items.length === 0 || items.every(item => !item.description)) {
        showError('AddItem');
        setIsCreatingAndSending(false);
        return;
      }
      
      // Create invoice as draft
      const result = await createInvoiceMutation.mutateAsync({
        client_id: parseInt(formData.client_id),
        issue_date: formData.issue_date,
        due_date: formData.due_date,
        items: items.filter(item => item.description),
        notes: formData.notes || undefined,
        terms: formData.terms || undefined,
        status: 'draft',
        is_recurring: formData.is_recurring,
        recurrence_frequency: formData.is_recurring ? formData.recurrence_frequency : undefined,
        recurrence_end_date: formData.is_recurring && formData.recurrence_end_date ? formData.recurrence_end_date : undefined,
      });
      
      // Download PDF
      if (result.invoice?.id) {
        console.log('[Invoices] Downloading PDF for invoice:', result.invoice.id);
        const pdfResult = await downloadPDFMutation.mutateAsync({ id: result.invoice.id });
        if (pdfResult.pdf) {
          const link = document.createElement('a');
          link.href = `data:application/pdf;base64,${pdfResult.pdf}`;
          link.download = pdfResult.filename;
          link.click();
        }
        success('CreatedAndDownloaded');
      }
      
      handleCloseModal();
      utils.invoices.list.invalidate();
    } catch (error: any) {
      console.error('Error al crear y descargar factura:', error);
      showError(error.message || 'Error al crear y descargar factura');
    } finally {
      setIsCreatingAndSending(false);
    }
  };
  
  const handleJustCreate = async (e: React.FormEvent) => {
    setShowCreateDropdown(false);
    await handleSubmit(e, false);
  };
  
  const handleSendEmail = async (id: number) => {
    try {
      console.log('[Invoices] Sending email for invoice:', id);
      await sendEmailMutation.mutateAsync({ id });
      success('Sent');
      utils.invoices.list.invalidate();
    } catch (error: any) {
      console.error('Error al enviar email:', error);
      showError('Error al enviar email: ' + (error.message || 'Error desconocido'));
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
      
      success('PDF descargado exitosamente');
    } catch (error: any) {
      console.error('Error al descargar PDF:', error);
      showError('Error al descargar PDF: ' + (error.message || 'Error desconocido'));
    }
  };
  
  const handleUpdateStatus = async (id: number, status: 'draft' | 'sent' | 'payment_submitted' | 'paid' | 'partial' | 'cancelled') => {
    try {
      await updateStatusMutation.mutateAsync({ id, status });
      utils.invoices.list.invalidate();
    } catch (error: any) {
      console.error('Error al actualizar estado:', error);
      showError('Error al actualizar estado: ' + (error.message || 'Error desconocido'));
    }
  };
  
  const handleCancel = async (id: number) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Cancelar Factura',
      message: '¿Estás seguro de que deseas cancelar esta factura?',
      variant: 'warning',
      onConfirm: async () => {
        try {
          await updateStatusMutation.mutateAsync({ id, status: 'cancelled' });
          utils.invoices.list.invalidate();
        } catch (error: any) {
          console.error('Error al cancelar factura:', error);
        }
      }
    });
  };
  
  const handleDelete = async (id: number) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Eliminar Factura',
      message: '¿Estás seguro de que deseas eliminar esta factura? Esta acción no se puede deshacer.',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await deleteInvoiceMutation.mutateAsync({ id });
          utils.invoices.list.invalidate();
        } catch (error: any) {
          console.error('Error al eliminar factura:', error);
        }
      }
    });
  };
  
  const handleMarkAsPaid = async (id: number) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Confirmar Pago Recibido',
      message: '¿Confirmar que el pago ha sido recibido? Esto marcará la factura como pagada.',
      variant: 'success',
      onConfirm: async () => {
    
        try {
          await updateStatusMutation.mutateAsync({ id, status: 'paid' });
          success('MarkedAsPaid');
          utils.invoices.list.invalidate();
          setViewingInvoice(null);
        } catch (error: any) {
          console.error('Error al confirmar pago:', error);
          showError(error.message || 'Error al confirmar pago');
        }
      }
    });
  };
  
  const getStatusBadge = (status: string) => {
    const badges = {
      draft: { label: 'Borrador', color: 'bg-gray-500' },
      sent: { label: 'Enviada', color: 'bg-blue-500' },
      payment_submitted: { label: 'Pago en Revisión', color: 'bg-yellow-500' },
      paid: { label: 'Pagada', color: 'bg-green-500' },
      partial: { label: 'Pago Parcial', color: 'bg-yellow-500' },
      cancelled: { label: 'Cancelada', color: 'bg-red-500' },
    };
    return badges[status as keyof typeof badges] || badges.draft;
  };
  
  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClient = clientFilter === 'all' || invoice.client_id === clientFilter;
    return matchesSearch && matchesClient;
  });
  
  return (
    <DashboardLayout>
      <div className="max-w-[1440px] mx-auto p-6 space-y-6">
        
        {/* Header Card - Isla 1 */}
        <Card>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-[#EDEDED]">{'Facturas'}</h1>
              <p className="text-[#8B92A8] mt-1">{'Gestiona tus facturas'}</p>
            </div>
            <Button
              onClick={handleOpenModal}
              variant="default"
              className="w-full md:w-auto"
            >
              <Plus className="w-5 h-5 mr-2" />
              {'Crear Factura'}
            </Button>
          </div>
        </Card>

        {/* Invoices List Card with Filters */}
        <Card>
          {/* Filters Section */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#8B92A8] w-5 h-5" />
              <Input
                type="text"
                placeholder={'Buscar facturas...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-12 text-base"
              />
            </div>
            <Select value={clientFilter.toString()} onValueChange={(value: any) => setClientFilter(value === 'all' ? 'all' : parseInt(value))}>
              <SelectTrigger className="w-full md:w-[220px] h-12 text-base">
                <SelectValue placeholder={'FilterByClient'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{'Todos'} {'clientes'}</SelectItem>
                {clients.map(client => (
                  <SelectItem key={client.id} value={client.id.toString()}>{client.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
              <SelectTrigger className="w-full md:w-[220px] h-12 text-base">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{'Todos'}</SelectItem>
                <SelectItem value="draft">{'Drafts'}</SelectItem>
                <SelectItem value="sent">{'Sents'}</SelectItem>
                <SelectItem value="paid">{'Paids'}</SelectItem>
                <SelectItem value="partial">{'Partials'}</SelectItem>
                <SelectItem value="cancelled">{'Cancelleds'}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Header - Solo contador */}
          <div className="mb-6">
            <p className="text-[#8B92A8] text-sm">{filteredInvoices.length} factura{filteredInvoices.length !== 1 ? 's' : ''}</p>
          </div>
          
          <div className="h-[calc(100vh-400px)] overflow-y-auto space-y-3">
            {filteredInvoices.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-[#8B92A8] text-base">No se encontraron facturas</p>
              </div>
          ) : (
            filteredInvoices.map((invoice) => {
              const badge = getStatusBadge(invoice.status);
              const client = clients.find(c => c.id === invoice.client_id);
              
              return (
                <div
                  key={invoice.id}
                  className="bg-[#121212] rounded-[28px] border border-[rgba(255,255,255,0.06)] hover:border-[#C4FF3D]/40 p-6 transition-all duration-200 cursor-pointer group"
                >
                  <div className="flex flex-col md:flex-row md:items-center gap-6">
                    {/* Columna Izquierda: Icono + Info */}
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-12 h-12 rounded-[20px] bg-[#C4FF3D]/10 border border-[#C4FF3D]/30 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-6 h-6 text-[#C4FF3D]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-medium text-[#EDEDED]">{invoice.invoice_number}</h3>
                        <p className="text-sm text-[#8B92A8]">{client?.name || 'Desconocido'}</p>
                      </div>
                    </div>

                    {/* Columna Centro: Monto y Vencimiento */}
                    <div className="hidden md:flex flex-col gap-2 min-w-[200px]">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-[#8B92A8]" />
                        <span className="text-sm text-[#EDEDED] font-medium">
                          {new Intl.NumberFormat('es-ES', { style: 'currency', currency: invoice.currency }).format(parseFloat(invoice.total))}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-[#8B92A8]" />
                        <span className="text-sm text-[#8B92A8]">
                          {format(new Date(invoice.due_date), 'dd/MM/yyyy')}
                        </span>
                      </div>
                    </div>

                    {/* Columna Derecha: Badge + Acciones */}
                    <div className="flex items-center gap-3">
                      <span className={`px-4 py-1.5 rounded-[9999px] text-sm font-medium border ${badge.color === 'bg-green-500' ? 'text-[#C4FF3D] bg-[#C4FF3D]/10 border-[#C4FF3D]/30' : badge.color === 'bg-yellow-500' ? 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30' : badge.color === 'bg-red-500' ? 'text-red-400 bg-red-400/10 border-red-400/30' : 'text-[#8B92A8] bg-[#8B92A8]/10 border-[#8B92A8]/30'}`}>
                        {badge.label}
                      </span>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={(e) => { e.stopPropagation(); setViewingInvoice(invoice.id); }}
                        className="text-[#8B92A8] hover:text-white min-h-[44px] min-w-[44px]"
                      >
                        <Eye className="w-5 h-5" />
                      </Button>
                      
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={(e) => { e.stopPropagation(); handleDownloadPDF(invoice.id, invoice.invoice_number); }}
                        disabled={downloadPDFMutation.isPending}
                        className="text-[#8B92A8] hover:text-white disabled:opacity-50 min-h-[44px] min-w-[44px] hidden md:flex"
                      >
                        <Download className="w-5 h-5" />
                      </Button>
                      
                      {/* Actions Dropdown */}
                      <div className="relative">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={(e) => { e.stopPropagation(); setOpenDropdownId(openDropdownId === invoice.id ? null : invoice.id); }}
                          className="text-[#8B92A8] hover:text-white min-h-[44px] min-w-[44px]"
                        >
                          <MoreVertical className="w-5 h-5" />
                        </Button>
                        
                        {openDropdownId === invoice.id && (
                          <>
                            {/* Backdrop to close dropdown */}
                            <div 
                              className="fixed inset-0 z-10" 
                              onClick={() => setOpenDropdownId(null)}
                            />
                            
                            {/* Dropdown Menu */}
                            <div className="absolute right-0 mt-2 w-56 bg-[#0E0F12] border border-[#C4FF3D]/30 rounded-[28px] shadow-lg z-20 py-1">
                              {/* Ver Factura */}
                              <button
                                onClick={() => {
                                  setViewingInvoice(invoice.id);
                                  setOpenDropdownId(null);
                                }}
                                className="w-full px-4 py-2 text-left text-white hover:bg-gray-800 flex items-center gap-3 transition-colors"
                              >
                                <Eye className="w-4 h-4 text-blue-400" />
                                {'ViewInvoice'}
                              </button>
                              

                              {/* Marcar como Pendiente */}
                              {invoice.status !== 'draft' && invoice.status !== 'cancelled' && (
                                <button
                                  onClick={() => {
                                    handleUpdateStatus(invoice.id, 'sent');
                                    setOpenDropdownId(null);
                                  }}
                                  className="w-full px-4 py-2 text-left text-white hover:bg-gray-800 flex items-center gap-3 transition-colors"
                                >
                                  <Clock className="w-4 h-4 text-yellow-400" />
                                  Marcar como Pendiente
                                </button>
                              )}
                              
                              {/* Marcar como Pagada */}
                              {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
                                <button
                                  onClick={() => {
                                    handleMarkAsPaid(invoice.id);
                                    setOpenDropdownId(null);
                                  }}
                                  className="w-full px-4 py-2 text-left text-white hover:bg-gray-800 flex items-center gap-3 transition-colors"
                                >
                                  <CheckCircle className="w-4 h-4 text-green-400" />
                                  {'MarkAsPaid'}
                                </button>
                              )}
                              
                              {/* Enviar por Email */}
                              {invoice.status === 'draft' && (
                                <button
                                  onClick={() => {
                                    handleSendEmail(invoice.id);
                                    setOpenDropdownId(null);
                                  }}
                                  disabled={sendEmailMutation.isPending}
                                  className="w-full px-4 py-2 text-left text-white hover:bg-gray-800 flex items-center gap-3 transition-colors disabled:opacity-50"
                                >
                                  <Send className="w-4 h-4 text-blue-400" />
                                  Enviar por Email
                                </button>
                              )}
                              
                              {/* Divider */}
                              {invoice.status !== 'cancelled' && (
                                <div className="border-t border-[rgba(255,255,255,0.06)] my-1" />
                              )}
                              
                              {/* Cancelar Factura */}
                              {invoice.status !== 'cancelled' && (
                                <button
                                  onClick={() => {
                                    handleUpdateStatus(invoice.id, 'cancelled');
                                    setOpenDropdownId(null);
                                  }}
                                  className="w-full px-4 py-2 text-left text-red-400 hover:bg-red-900/20 flex items-center gap-3 transition-colors"
                                >
                                  <XCircle className="w-4 h-4" />
                                  {'CancelInvoice'}
                                </button>
                              )}
                              
                              {/* Eliminar (solo draft) */}
                              {invoice.status === 'draft' && (
                                <button
                                  onClick={() => {
                                    handleDelete(invoice.id);
                                    setOpenDropdownId(null);
                                  }}
                                  className="w-full px-4 py-2 text-left text-red-400 hover:bg-red-900/20 flex items-center gap-3 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  {'Eliminar'}
                                </button>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          </div>
        </Card>
      </div>
      
      {/* Create Invoice Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0A0A0A] rounded-lg border border-[rgba(255,255,255,0.06)] w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">{'Crear Factura'}</h2>
                <button onClick={handleCloseModal} className="text-[#8B92A8] hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Client Selection with Search */}
                <div className="relative">
                  <Label className="text-white block mb-2">{'Client'} *</Label>
                  <div className="relative">
                    <input
                      type="text"
                      value={selectedClientName || clientSearchTerm}
                      onChange={(e) => {
                        setClientSearchTerm(e.target.value);
                        setSelectedClientName('');
                        setFormData({ ...formData, client_id: '' });
                        setShowClientDropdown(true);
                      }}
                      onFocus={() => setShowClientDropdown(true)}
                      placeholder={'SearchClientPlaceholder'}
                      className="w-full bg-[#0A0A0A] border border-[rgba(255,255,255,0.06)] rounded-md p-2.5 text-white placeholder:text-[#8B92A8] focus:outline-none focus:border-[rgba(196,255,61,0.3)]"
                    />
                    {showClientDropdown && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-[#0A0A0A] rounded-[20px] shadow-lg z-50 max-h-[300px] overflow-y-auto" style={{ boxShadow: 'inset 0 0 0 0.5px rgba(255,255,255,0.06), 0 10px 40px rgba(0,0,0,0.5)' }}>
                        {clients
                          .filter(client => {
                            const searchLower = clientSearchTerm.toLowerCase();
                            return (
                              client.name.toLowerCase().includes(searchLower) ||
                              (client.company && client.company.toLowerCase().includes(searchLower))
                            );
                          })
                          .map((client, index, array) => (
                            <button
                              key={client.id}
                              type="button"
                              onClick={() => {
                                setFormData({ ...formData, client_id: client.id.toString() });
                                setSelectedClientName(client.name);
                                setClientSearchTerm('');
                                setShowClientDropdown(false);
                              }}
                              className={`w-full px-4 py-3 text-left text-white hover:bg-[#121212] transition-colors ${
                                index === 0 ? 'rounded-t-[20px]' : ''
                              } ${
                                index === array.length - 1 ? 'rounded-b-[20px]' : ''
                              }`}
                            >
                              <div>
                                <p className="font-medium">{client.name}</p>
                                {client.company && (
                                  <p className="text-xs text-[#8B92A8]">{client.company}</p>
                                )}
                              </div>
                            </button>
                          ))}
                        {clients.filter(client => {
                          const searchLower = clientSearchTerm.toLowerCase();
                          return (
                            client.name.toLowerCase().includes(searchLower) ||
                            (client.company && client.company.toLowerCase().includes(searchLower))
                          );
                        }).length === 0 && (
                          <div className="px-4 py-6 text-center text-[#8B92A8]">
                            No se encontraron clientes
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-white block mb-2">{'IssueDate'} *</Label>
                    <Input
                      type="date"
                      value={formData.issue_date}
                      onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                      className="bg-[#0A0A0A] border-[rgba(255,255,255,0.06)] text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-white block mb-2">{'DueDate'} *</Label>
                    <Input
                      type="date"
                      value={formData.due_date}
                      onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                      className="bg-[#0A0A0A] border-[rgba(255,255,255,0.06)] text-white"
                    />
                  </div>
                </div>
                

                
                {/* Currency Info */}
                <div className="p-3 bg-[#EBFF57]/10 border border-[#EBFF57]/30 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-[#8B92A8] mb-1">{'InvoiceCurrency'}</p>
                      <p className="text-sm font-medium text-white">
                        {getCurrency(user?.primary_currency || 'USD')?.name}
                      </p>
                    </div>
                    <Badge className="bg-[#EBFF57]/10 text-[#EBFF57] border border-[#EBFF57]/30">
                      {getCurrency(user?.primary_currency || 'USD')?.symbol} {user?.primary_currency || 'USD'}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {'CurrencyAutoAssigned'}
                  </p>
                </div>
                
                {/* Items */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-white">{'Items'} *</Label>
                    <Button type="button" size="sm" onClick={handleAddItem} variant="default">
                      <Plus className="w-4 h-4 mr-1" />
                      {'AddItem'}
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    {items.map((item, index) => (
                      <div key={index} className="space-y-2">
                        <div className="grid grid-cols-12 gap-2 items-end">
                          <div className="col-span-6">
                            <Label className="text-white text-xs mb-1">{'Description'}</Label>
                            <Input
                              placeholder={'ItemDescriptionPlaceholder'}
                              value={item.description}
                              onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                              className="bg-[#0A0A0A] border-[rgba(255,255,255,0.06)] text-white"
                            />
                          </div>
                          <div className="col-span-2">
                            <Label className="text-white text-xs mb-1">{'Quantity'}</Label>
                            <Input
                              type="number"
                              placeholder="1"
                              value={item.quantity}
                              onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                              className="bg-[#0A0A0A] border-[rgba(255,255,255,0.06)] text-white"
                            />
                          </div>
                          <div className="col-span-2">
                            <Label className="text-white text-xs mb-1">{'UnitPrice'}</Label>
                            <Input
                              type="number"
                              placeholder="0.00"
                              value={item.unit_price}
                              onChange={(e) => handleItemChange(index, 'unit_price', parseFloat(e.target.value) || 0)}
                              className="bg-[#0A0A0A] border-[rgba(255,255,255,0.06)] text-white"
                            />
                          </div>
                          <div className="col-span-2">
                            <Label className="text-white text-xs mb-1">{'Total'}</Label>
                            <Input
                              type="number"
                              placeholder="0.00"
                              value={item.total}
                              readOnly
                              className="bg-[#2a2a2a] border-[rgba(255,255,255,0.06)] text-white"
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
                      {'Subtotal'}: ${calculateSubtotal().toFixed(2)}
                    </p>
                  </div>
                </div>
                
                {/* Notes and Terms - Side by Side */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-white block mb-2">{'Notes'}</Label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="w-full min-h-[80px] bg-[#0A0A0A] border border-[rgba(255,255,255,0.06)] rounded-md p-2 text-white"
                      placeholder={'NotesPlaceholder'}
                    />
                  </div>
                  
                  <div>
                    <Label className="text-white block mb-2">{'Terms'}</Label>
                    <textarea
                      value={formData.terms}
                      onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                      className="w-full min-h-[80px] bg-[#0A0A0A] border border-[rgba(255,255,255,0.06)] rounded-md p-2 text-white"
                      placeholder={'TermsPlaceholder'}
                    />
                  </div>
                </div>
                
                {/* Actions */}
                <div className="flex gap-3 justify-between items-center">
                  {/* Recurring Invoice - Bottom Left */}
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="is_recurring"
                      checked={formData.is_recurring}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setShowRecurringModal(true);
                        } else {
                          setFormData({ 
                            ...formData, 
                            is_recurring: false,
                            recurrence_frequency: 'monthly',
                            recurrence_end_date: ''
                          });
                        }
                      }}
                      className="w-4 h-4 bg-[#0A0A0A] border-[rgba(255,255,255,0.06)] rounded accent-[#C4FF3D]"
                    />
                    <Label htmlFor="is_recurring" className="text-white cursor-pointer text-sm">
                      {'RecurringInvoice'}
                    </Label>
                  </div>
                  
                  {/* Action Buttons - Bottom Right */}
                  <div className="flex gap-3 items-center">
                  <Button type="button" variant="outline" onClick={handleCloseModal} className="border-[rgba(255,255,255,0.06)] text-white hover:bg-gray-800">
                    {'Cancelar'}
                  </Button>
                  
                  {/* Dropdown Button */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowCreateDropdown(!showCreateDropdown)}
                      disabled={isCreatingAndSending}
                      className="px-6 py-2.5 bg-[#C4FF3D] text-black rounded-[9999px] font-medium hover:bg-[#C4FF3D]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      style={{ boxShadow: 'inset 0 0 0 0.5px rgba(0,0,0,0.1)' }}
                    >
                      {isCreatingAndSending ? 'Processing' : 'CreateInvoice'}
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    
                    {/* Dropdown Menu */}
                    {showCreateDropdown && (
                      <div className="absolute right-0 bottom-full mb-2 w-56 bg-[#0A0A0A] rounded-[20px] shadow-lg z-50" style={{ boxShadow: 'inset 0 0 0 0.5px rgba(255,255,255,0.06), 0 10px 40px rgba(0,0,0,0.5)' }}>
                        <div className="py-2">
                          <button
                            type="button"
                            onClick={handleCreateAndSend}
                            className="w-full px-4 py-3 text-left text-white hover:bg-[#121212] transition-colors flex items-center gap-3 rounded-t-[20px]"
                          >
                            <Send className="w-4 h-4 text-[#C4FF3D]" />
                            <div>
                              <p className="font-medium">{'CreateAndSend'}</p>
                              <p className="text-xs text-[#8B92A8]">{'CreateAndSendDesc'}</p>
                            </div>
                          </button>
                          
                          <button
                            type="button"
                            onClick={handleCreateAndDownload}
                            className="w-full px-4 py-3 text-left text-white hover:bg-[#121212] transition-colors flex items-center gap-3"
                          >
                            <Download className="w-4 h-4 text-[#C4FF3D]" />
                            <div>
                              <p className="font-medium">{'CreateAndDownload'}</p>
                              <p className="text-xs text-[#8B92A8]">{'CreateAndDownloadDesc'}</p>
                            </div>
                          </button>
                          
                          <button
                            type="submit"
                            onClick={handleJustCreate}
                            className="w-full px-4 py-3 text-left text-white hover:bg-[#121212] transition-colors flex items-center gap-3 rounded-b-[20px]"
                          >
                            <FileText className="w-4 h-4 text-[#C4FF3D]" />
                            <div>
                              <p className="font-medium">{'JustCreate'}</p>
                              <p className="text-xs text-[#8B92A8]">{'JustCreateDesc'}</p>
                            </div>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      
      {/* Recurring Invoice Configuration Modal */}
      {showRecurringModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-[#0A0A0A] rounded-[28px] border border-[rgba(255,255,255,0.06)] w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">{'ConfigureRecurring'}</h2>
                <button 
                  onClick={() => setShowRecurringModal(false)} 
                  className="text-[#8B92A8] hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-6">
                {/* Frequency */}
                <div>
                  <Label className="text-white block mb-2">{'Frequency'} *</Label>
                  <Select 
                    value={formData.recurrence_frequency} 
                    onValueChange={(value: any) => setFormData({ ...formData, recurrence_frequency: value })}
                  >
                    <SelectTrigger className="bg-[#0A0A0A] border-[rgba(255,255,255,0.06)] text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0A0A0A] border-[rgba(255,255,255,0.06)] z-[70]">
                      <SelectItem value="weekly">{'Weekly'}</SelectItem>
                      <SelectItem value="biweekly">{'Biweekly'}</SelectItem>
                      <SelectItem value="monthly">{'Monthly'}</SelectItem>
                      <SelectItem value="quarterly">{'Quarterly'}</SelectItem>
                      <SelectItem value="semiannually">{'Semiannually'}</SelectItem>
                      <SelectItem value="annually">{'Annually'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* End Date */}
                <div>
                  <Label className="text-white block mb-2">{'EndDate'} ({'opcional'})</Label>
                  <Input
                    type="date"
                    value={formData.recurrence_end_date}
                    onChange={(e) => setFormData({ ...formData, recurrence_end_date: e.target.value })}
                    className="bg-[#0A0A0A] border-[rgba(255,255,255,0.06)] text-white"
                    placeholder="Sin fecha de fin"
                  />
                  <p className="text-xs text-[#8B92A8] mt-2">
                    {'RecurringEndDateInfo'}
                  </p>
                </div>
                
                {/* Info */}
                <div className="p-3 bg-[#C4FF3D]/10 border border-[#C4FF3D]/30 rounded-lg">
                  <p className="text-xs text-[#C4FF3D]">
                    {'RecurringInfo'}
                  </p>
                </div>
                
                {/* Actions */}
                <div className="flex gap-3 justify-end">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setShowRecurringModal(false);
                      setFormData({ 
                        ...formData, 
                        is_recurring: false,
                        recurrence_frequency: 'monthly',
                        recurrence_end_date: ''
                      });
                    }}
                    className="border-[rgba(255,255,255,0.06)] text-white hover:bg-gray-800"
                  >
                    {'Cancelar'}
                  </Button>
                  <Button 
                    type="button" 
                    onClick={() => {
                      setFormData({ ...formData, is_recurring: true });
                      setShowRecurringModal(false);
                    }}
                    className="bg-[#C4FF3D] text-black hover:bg-[#C4FF3D]/90 rounded-[9999px]"
                  >
                    {'Confirmar'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* View Invoice Modal */}
      {viewingInvoice && viewInvoiceData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0A0A0A] rounded-[28px] border border-[rgba(255,255,255,0.06)] w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Detalle de Factura</h2>
                <button onClick={() => setViewingInvoice(null)} className="text-[#8B92A8] hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <p className="text-[#8B92A8] text-sm">Número de Factura</p>
                  <p className="text-white font-semibold">{viewInvoiceData.invoice_number}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[#8B92A8] text-sm">Fecha de Emisión</p>
                    <p className="text-white">{format(new Date(viewInvoiceData.issue_date), 'dd/MM/yyyy')}</p>
                  </div>
                  <div>
                    <p className="text-[#8B92A8] text-sm">Fecha de Vencimiento</p>
                    <p className="text-white">{format(new Date(viewInvoiceData.due_date), 'dd/MM/yyyy')}</p>
                  </div>
                </div>
                
                <div>
                  <p className="text-[#8B92A8] text-sm">Estado</p>
                  <span className={`inline-block px-4 py-1.5 rounded-[9999px] text-sm font-medium border ${getStatusBadge(viewInvoiceData.status).color === 'bg-green-500' ? 'text-[#C4FF3D] bg-[#C4FF3D]/10 border-[#C4FF3D]/30' : getStatusBadge(viewInvoiceData.status).color === 'bg-yellow-500' ? 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30' : getStatusBadge(viewInvoiceData.status).color === 'bg-red-500' ? 'text-red-400 bg-red-400/10 border-red-400/30' : 'text-[#8B92A8] bg-[#8B92A8]/10 border-[#8B92A8]/30'}`}>
                    {getStatusBadge(viewInvoiceData.status).label}
                  </span>
                </div>
                
                <div>
                  <p className="text-[#8B92A8] text-sm mb-2">Ítems</p>
                  <div className="space-y-2">
                    {viewInvoiceData.items.map((item: any, index: number) => (
                       <div key={index} className="bg-[#121212] p-4 rounded-[20px] border border-[rgba(255,255,255,0.06)]">
                        <p className="text-white font-medium">{item.description}</p>
                        <p className="text-[#8B92A8] text-sm">
                          {item.quantity} x ${item.unit_price} = ${item.total}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="border-t border-[rgba(255,255,255,0.06)] pt-4">
                  <div className="flex justify-between">
                    <p className="text-[#8B92A8]">Subtotal</p>
                    <p className="text-white">${viewInvoiceData.subtotal}</p>
                  </div>
                  <div className="flex justify-between mt-2">
                    <p className="text-white font-semibold">Total</p>
                    <p className="text-white font-semibold">${viewInvoiceData.total} {viewInvoiceData.currency}</p>
                  </div>
                </div>
                
                {viewInvoiceData.notes && (
                  <div>
                    <p className="text-[#8B92A8] text-sm">Notas</p>
                    <p className="text-white">{viewInvoiceData.notes}</p>
                  </div>
                )}
                
                {viewInvoiceData.terms && (
                  <div>
                    <p className="text-[#8B92A8] text-sm">Términos</p>
                    <p className="text-white">{viewInvoiceData.terms}</p>
                  </div>
                )}
                
                {/* Payment Proof Section - NUEVO */}
                {viewInvoiceData.status === 'payment_submitted' && viewInvoiceData.receipt_path && (
                  <div className="border-t border-[rgba(255,255,255,0.06)] pt-4">
                    <div className="bg-yellow-400/10 border border-yellow-400/30 rounded-[20px] p-4 mb-4">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <h3 className="text-yellow-400 font-semibold mb-1">⚠️ Pago Pendiente de Confirmación</h3>
                          <p className="text-[#8B92A8] text-sm">
                            El cliente ha subido un comprobante de pago. Revisa el comprobante y confirma el pago.
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-[#121212] rounded-[20px] border border-[rgba(255,255,255,0.06)] p-4">
                      <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-[#C4FF3D]" />
                        Comprobante de Pago
                      </h3>
                      
                      {viewInvoiceData.payment_reference && (
                        <div className="mb-3">
                          <p className="text-[#8B92A8] text-sm">Referencia del cliente:</p>
                          <p className="text-white">{viewInvoiceData.payment_reference}</p>
                        </div>
                      )}
                      
                      {viewInvoiceData.payment_proof_uploaded_at && (
                        <div className="mb-3">
                          <p className="text-[#8B92A8] text-sm">Fecha de envío:</p>
                          <p className="text-white">{format(new Date(viewInvoiceData.payment_proof_uploaded_at), 'dd/MM/yyyy HH:mm')}</p>
                        </div>
                      )}
                      
                      <div className="mt-3">
                        <img 
                          src={`/uploads/${viewInvoiceData.receipt_path}`}
                          alt="Comprobante de pago"
                          className="w-full rounded-[12px] border border-[rgba(255,255,255,0.06)]"
                          onError={(e) => {
                            console.error('Error loading receipt image');
                          }}
                        />
                        <p className="text-[#8B92A8] text-xs mt-2">
                          Tamaño: {viewInvoiceData.receipt_size ? `${(viewInvoiceData.receipt_size / 1024).toFixed(1)} KB` : 'N/A'}
                        </p>
                      </div>
                      
                      <button
                        onClick={() => handleMarkAsPaid(viewInvoiceData.id)}
                        className="w-full mt-4 px-6 py-3 text-black bg-[#C4FF3D] hover:bg-[#C4FF3D]/90 rounded-[9999px] transition-colors font-semibold flex items-center justify-center gap-2"
                      >
                        <CheckCircle className="w-5 h-5" />
                        Confirmar Pago y Marcar como Pagada
                      </button>
                    </div>
                  </div>
                )}
                
                {/* Payment Summary */}
                {paymentSummary && (
                  <div className="border-t border-[rgba(255,255,255,0.06)] pt-4">
                    <h3 className="text-white font-semibold mb-3">Resumen de Pagos</h3>
                    <div className="bg-[#121212] p-4 rounded-[20px] border border-[rgba(255,255,255,0.06)] space-y-2">
                      <div className="flex justify-between">
                        <span className="text-[#8B92A8]">Total Factura:</span>
                        <span className="text-white">${paymentSummary.invoice_total.toFixed(2)} {viewInvoiceData.currency}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#8B92A8]">Total Pagado:</span>
                        <span className="text-green-500">${paymentSummary.total_paid.toFixed(2)} {viewInvoiceData.currency}</span>
                      </div>
                      <div className="flex justify-between border-t border-[rgba(255,255,255,0.06)] pt-2">
                        <span className="text-white font-semibold">Restante:</span>
                        <span className="text-white font-semibold">${paymentSummary.remaining.toFixed(2)} {viewInvoiceData.currency}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#8B92A8] text-sm">Pagos Registrados:</span>
                        <span className="text-[#8B92A8] text-sm">{paymentSummary.payment_count}</span>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Payment History */}
                {invoicePayments.length > 0 && (
                  <div className="border-t border-[rgba(255,255,255,0.06)] pt-4">
                    <h3 className="text-white font-semibold mb-3">Historial de Pagos</h3>
                    <div className="space-y-2">
                      {invoicePayments.map((payment: any) => (
                        <div key={payment.id} className="bg-[#0A0A0A] p-3 rounded border border-[rgba(255,255,255,0.06)]">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-white font-medium">${parseFloat(payment.amount).toFixed(2)} {viewInvoiceData.currency}</p>
                              <p className="text-[#8B92A8] text-sm">
                                {format(new Date(payment.payment_date), 'dd/MM/yyyy')}
                              </p>
                              <p className="text-[#8B92A8] text-sm capitalize">
                                Método: {payment.method === 'cash' ? 'Efectivo' : payment.method === 'transfer' ? 'Transferencia' : payment.method === 'card' ? 'Tarjeta' : 'Otro'}
                              </p>
                            </div>
                            {payment.reference && (
                              <span className="text-xs text-gray-500">Ref: {payment.reference}</span>
                            )}
                          </div>
                          {payment.notes && (
                            <p className="text-[#8B92A8] text-sm mt-2">{payment.notes}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
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
