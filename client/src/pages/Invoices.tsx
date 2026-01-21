/**
 * Invoices Page - Gestión de Facturas
 * Design Philosophy: Apple Minimalism
 */

import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { trpc } from '@/lib/trpc';
import type { InvoiceItem } from '../../../drizzle/schema';

// Invoice type based on tRPC schema
type Invoice = {
  id: number;
  user_id: number;
  client_id: number;
  invoice_number: string;
  issue_date: Date;
  due_date: Date;
  items: string; // JSON string
  subtotal: string;
  tax: string;
  total: string;
  status: 'draft' | 'sent' | 'payment_sent' | 'paid' | 'overdue' | 'cancelled';
  notes?: string | null;
  created_at: Date;
  updated_at: Date;
};

// Form data type with string dates for inputs
type InvoiceFormData = {
  client_id?: number;
  issue_date?: string;
  due_date?: string;
  status?: 'draft' | 'sent' | 'payment_sent' | 'paid' | 'overdue' | 'cancelled';
  items?: InvoiceItem[];
  notes?: string;
  paid_amount?: string;
  payment_link?: string;
  // Recurring fields
  is_recurring?: boolean;
  recurrence_frequency?: 'every_minute' | 'monthly' | 'biweekly' | 'annual' | 'custom';
  recurrence_interval?: number;
};
import { FileText, Download, Plus, Trash2, MoreVertical, CheckCircle2, XCircle, Clock, AlertCircle, ChevronDown, ChevronUp, DollarSign, Search, User, FolderArchive, ArchiveRestore, Link as LinkIcon, Copy, Eye, Repeat, Mail } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { format, parseISO, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/_core/hooks/useAuth';
import { PlanLimitDialog } from '@/components/PlanLimitDialog';
import jsPDF from 'jspdf';
import { useState, useEffect } from 'react';
import { useLocation, useSearch } from 'wouter';

// Helper function to parse invoice items
const parseInvoiceItems = (items: string | InvoiceItem[]): InvoiceItem[] => {
  if (typeof items === 'string') {
    try {
      return JSON.parse(items);
    } catch (e) {
      return [];
    }
  }
  return items || [];
};

export default function Invoices() {
  const { t } = useLanguage();
  const utils = trpc.useUtils();
  const search = useSearch();
  const [, setLocation] = useLocation();
  
  // Fetch data using tRPC
  const { data: allInvoices, isLoading: invoicesLoading } = trpc.invoices.list.useQuery();
  const { data: clients, isLoading: clientsLoading } = trpc.clients.list.useQuery();
  
  // Filter invoices
  const invoices = allInvoices?.filter(inv => inv.status !== 'cancelled');
  const archivedInvoices = allInvoices?.filter(inv => inv.status === 'cancelled');
  
  // Mutations
  const createInvoice = trpc.invoices.create.useMutation({
    onSuccess: () => {
      utils.invoices.list.invalidate();
    },
    onError: () => {
      toast.error('Error al crear la factura');
    },
  });
  
  const sendByEmail = trpc.invoices.sendByEmail.useMutation({
    onSuccess: () => {
      toast.success('Email enviado exitosamente');
    },
    onError: () => {
      toast.error('Error al enviar el email');
    },
  });
  
  const generatePDFMutation = trpc.invoices.generatePDF.useMutation();
  
  const updateInvoice = trpc.invoices.update.useMutation({
    onSuccess: () => {
      utils.invoices.list.invalidate();
    },
    onError: () => {
      toast.error('Error al actualizar la factura');
    },
  });
  
  const deleteInvoice = trpc.invoices.delete.useMutation({
    onSuccess: () => {
      utils.invoices.list.invalidate();
      toast.success('Factura eliminada exitosamente');
    },
    onError: () => {
      toast.error('Error al eliminar la factura');
    },
  });
  
  const createTransaction = trpc.transactions.create.useMutation({
    onSuccess: () => {
      utils.transactions.list.invalidate();
    },
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [showPartialPaymentDialog, setShowPartialPaymentDialog] = useState(false);
  const [showLimitDialog, setShowLimitDialog] = useState(false);
  
  // Get user subscription plan
  const { user } = useAuth();
  const [partialPaymentAmount, setPartialPaymentAmount] = useState<number>(0);
  const [newStatus, setNewStatus] = useState<'pending' | 'paid' | 'overdue' | 'cancelled'>('pending');
  const [expandedCardId, setExpandedCardId] = useState<number | null>(null);
  const [showClientSelector, setShowClientSelector] = useState(false);
  const [showArchivedDialog, setShowArchivedDialog] = useState(false);
  const [clientSearch, setClientSearch] = useState('');
  const [formData, setFormData] = useState<InvoiceFormData>({
    client_id: 0,
    issue_date: new Date().toISOString().split('T')[0],
    due_date: addDays(new Date(), 30).toISOString().split('T')[0],
    status: 'draft',
    items: [],
    notes: '',
    paid_amount: '0',
  });
  const [currentItem, setCurrentItem] = useState<Partial<InvoiceItem>>({
    description: '',
    quantity: 1,
    unitPrice: 0,
    total: 0,
  });

  // Open dialog automatically if ?new=true in URL
  useEffect(() => {
    const params = new URLSearchParams(search);
    if (params.get('new') === 'true') {
      setIsDialogOpen(true);
      // Remove the parameter from URL
      setLocation('/invoices', { replace: true });
    }
  }, [search, setLocation]);

  const getClientName = (client_id: number) => {
    const client = clients?.find(c => c.id === client_id);
    return client?.name || 'Cliente Desconocido';
  };

  const filteredClients = clients?.filter(client => {
    const searchLower = clientSearch.toLowerCase();
    return (
      client.name.toLowerCase().includes(searchLower) ||
      client.email.toLowerCase().includes(searchLower) ||
      client.company?.toLowerCase().includes(searchLower)
    );
  }) || [];

  const addItem = () => {
    if (!currentItem.description || !currentItem.quantity || !currentItem.unitPrice) {
      toast.error('Completa todos los campos del item');
      return;
    }

    const total = currentItem.quantity * currentItem.unitPrice;
    const newItem: InvoiceItem = {
      description: currentItem.description,
      quantity: currentItem.quantity,
      unitPrice: currentItem.unitPrice,
      total,
    };

    setFormData({
      ...formData,
      items: [...(formData.items || []), newItem],
    });

    setCurrentItem({
      description: '',
      quantity: 1,
      unitPrice: 0,
      total: 0,
    });

    toast.success('Item agregado');
  };

  const removeItem = (index: number) => {
    const newItems = [...(formData.items || [])];
    newItems.splice(index, 1);
    setFormData({ ...formData, items: newItems });
  };

  const calculateTotal = () => {
    return (formData.items || []).reduce((sum, item) => sum + item.total, 0);
  };

  const handleSubmit = async (e: React.FormEvent, action: 'create_only' | 'create_and_send' | 'download' | 'copy_link' = 'create_only') => {
    e.preventDefault();

    if (!formData.client_id || !formData.items || formData.items.length === 0) {
      toast.error('Selecciona un cliente y agrega al menos un item');
      return;
    }

    const invoice_number = `INV-${Date.now()}`;
    const subtotal = calculateTotal();
    const tax = subtotal * 0; // 0% tax, can be changed
    const total = subtotal + tax;

    const result = await createInvoice.mutateAsync({
      client_id: formData.client_id!,
      invoice_number,
      issue_date: formData.issue_date!,
      due_date: formData.due_date!,
      subtotal: subtotal.toString(),
      tax: tax.toString(),
      total: total.toString(),
      paid_amount: formData.paid_amount || '0',
      status: formData.status || 'draft',
      items: formData.items!,
      payment_link: formData.payment_link,
      notes: formData.notes,
      // Recurring fields
      is_recurring: formData.is_recurring,
      recurrence_frequency: formData.recurrence_frequency,
      recurrence_interval: formData.recurrence_interval,
    });

    // Handle different actions
    if (action === 'create_and_send' && result?.id) {
      try {
        await sendByEmail.mutateAsync({ id: result.id });
        toast.success('Factura creada y enviada al cliente');
      } catch (error) {
        toast.error('Factura creada pero falló el envío del email');
      }
    } else if (action === 'download' && result?.id) {
      try {
        const pdfResult = await generatePDFMutation.mutateAsync({ id: result.id });
        if (pdfResult?.pdf) {
          const link = document.createElement('a');
          link.href = `data:application/pdf;base64,${pdfResult.pdf}`;
          link.download = `factura-${invoice_number}.pdf`;
          link.click();
          toast.success('Factura creada y PDF descargado');
        }
      } catch (error) {
        toast.error('Factura creada pero falló la descarga del PDF');
      }
    } else if (action === 'copy_link' && formData.payment_link) {
      navigator.clipboard.writeText(formData.payment_link);
      toast.success('Factura creada y link de pago copiado');
    } else {
      toast.success('Factura creada exitosamente');
    }

    setIsDialogOpen(false);
    setFormData({
      client_id: 0,
      issue_date: new Date().toISOString().split('T')[0],
      due_date: addDays(new Date(), 30).toISOString().split('T')[0],
      status: 'draft',
      items: [],
      notes: '',
      paid_amount: '0',
    });
  };

  const handleStatusChange = async (invoice: Invoice, status: 'pending' | 'paid' | 'overdue' | 'cancelled') => {
    setSelectedInvoice(invoice);
    setNewStatus(status);
    
    // Si el cambio es a "paid" y la factura estaba pendiente, mostrar diálogo
    if (status === 'paid' && (invoice.status === 'draft' || invoice.status === 'sent')) {
      setShowStatusDialog(true);
    } else {
      // Cambiar estado directamente
      await updateInvoice.mutateAsync({ id: invoice.id, status });
      toast.success('Estado actualizado');
    }
  };

  const confirmStatusChange = async (addToFinances: boolean) => {
    if (!selectedInvoice) return;

    await updateInvoice.mutateAsync({ 
      id: selectedInvoice.id, 
      status: newStatus
    });

    if (addToFinances) {
      // Agregar ingreso a finanzas
      const client = clients?.find(c => c.id === selectedInvoice.client_id);
      await createTransaction.mutateAsync({
        type: 'income',
        amount: selectedInvoice.total,
        category: 'Pago de Factura',
        description: `Pago de factura ${selectedInvoice.invoice_number} - ${client?.name || 'Cliente'}`,
        date: new Date().toISOString(),
      });
      toast.success('Factura marcada como pagada e ingreso agregado a Finanzas');
    } else {
      toast.success('Factura marcada como pagada');
    }

    setShowStatusDialog(false);
    setSelectedInvoice(null);
  };

  const handleArchive = async (invoice: Invoice) => {
    // Check if user has Pro or Business plan (skip for super admins)
    if (user?.role !== 'super_admin' && user?.subscription_plan === 'free') {
      setShowLimitDialog(true);
      return;
    }
    
    if (invoice.status !== 'paid') {
      toast.error('Solo se pueden archivar facturas pagadas');
      return;
    }
    
    await updateInvoice.mutateAsync({ 
      id: invoice.id, 
      status: 'archived'
    });
    toast.success('Factura archivada exitosamente');
  };

  const handleUnarchive = async (invoice: Invoice) => {
    await updateInvoice.mutateAsync({ 
      id: invoice.id, 
      status: 'paid'
    });
    toast.success('Factura restaurada');
  };

  const handlePartialPayment = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setPartialPaymentAmount(0);
    setShowPartialPaymentDialog(true);
  };

  const confirmPartialPayment = async () => {
    // Funcionalidad de pagos parciales deshabilitada temporalmente
    // El backend actual no soporta paid_amount
    toast.error('Funcionalidad no disponible');
    setShowPartialPaymentDialog(false);
  };

  const generatePDF = async (invoiceId: number) => {
    const invoice = allInvoices?.find(inv => inv.id === invoiceId);
    if (!invoice) return;

    const client = clients?.find(c => c.id === invoice.client_id);
    if (!client) return;

    const doc = new jsPDF();
    const pdfT = t.invoices.pdf; // PDF translations

    // Header
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text(pdfT.title, 105, 20, { align: 'center' });

    // Invoice Info
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`${pdfT.invoiceNumber} ${invoice.invoice_number}`, 20, 40);
    doc.text(`${pdfT.issueDate} ${format(new Date(invoice.issue_date), 'dd/MM/yyyy')}`, 20, 47);
    doc.text(`${pdfT.dueDate} ${format(new Date(invoice.due_date), 'dd/MM/yyyy')}`, 20, 54);

    // Client Info
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(pdfT.client, 20, 70);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(client.name, 20, 77);
    doc.text(client.email, 20, 84);
    if (client.phone) doc.text(client.phone, 20, 91);
    if (client.company) doc.text(client.company, 20, 98);

    // Items Table Header
    let yPos = 115;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(pdfT.description, 20, yPos);
    doc.text(pdfT.quantity, 120, yPos);
    doc.text(pdfT.unitPrice, 145, yPos);
    doc.text(pdfT.total, 175, yPos);

    doc.setLineWidth(0.5);
    doc.line(20, yPos + 2, 190, yPos + 2);

    // Items
    yPos += 10;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    const items = typeof invoice.items === 'string' ? JSON.parse(invoice.items) : invoice.items;
    items.forEach((item: any) => {
      doc.text(item.description, 20, yPos, { maxWidth: 95 });
      doc.text(item.quantity.toString(), 125, yPos, { align: 'center' });
      doc.text(`$${item.unitPrice.toFixed(2)}`, 165, yPos, { align: 'right' });
      doc.text(`$${item.total.toFixed(2)}`, 190, yPos, { align: 'right' });
      yPos += 7;
    });

    // Total
    yPos += 10;
    doc.setLineWidth(0.5);
    doc.line(140, yPos, 190, yPos);
    yPos += 10;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(pdfT.totalLabel, 140, yPos);
    doc.text(`$${parseFloat(invoice.total).toFixed(2)}`, 190, yPos, { align: 'right' });

    // Payment Button
    if (invoice.payment_token) {
      yPos += 25;
      const paymentUrl = `${window.location.origin}/pay?token=${invoice.payment_token}`;
      
      // Draw button background
      doc.setFillColor(0, 0, 0); // Black background
      doc.roundedRect(70, yPos - 5, 70, 15, 3, 3, 'F');
      
      // Add clickable link to button
      doc.link(70, yPos - 5, 70, 15, { url: paymentUrl });
      
      // Button text
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255); // White text
      doc.text(pdfT.payButton, 105, yPos + 4, { align: 'center' });
      doc.setTextColor(0, 0, 0); // Reset to black
      
      // Helper text below button
      yPos += 20;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100); // Gray
      doc.text(pdfT.payHelper, 105, yPos, { align: 'center' });
      doc.setTextColor(0, 0, 0); // Reset to black
    }

    // Notes
    if (invoice.notes) {
      yPos += 20;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(pdfT.notes, 20, yPos);
      doc.setFont('helvetica', 'normal');
      const splitNotes = doc.splitTextToSize(invoice.notes, 170);
      doc.text(splitNotes, 20, yPos + 7);
    }

    doc.save(`factura-${invoice.invoice_number}.pdf`);
    toast.success('PDF generado exitosamente');
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; className: string; icon: any }> = {
      draft: { label: 'Borrador', className: 'bg-gray-500/20 text-gray-400 border-gray-500/30', icon: FileText },
      sent: { label: 'Enviada', className: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: Clock },
      payment_sent: { label: 'Pago Enviado', className: 'bg-purple-500/20 text-purple-400 border-purple-500/30', icon: DollarSign },
      paid: { label: 'Pagada', className: 'bg-green-500/20 text-green-400 border-green-500/30', icon: CheckCircle2 },
      overdue: { label: 'Vencida', className: 'bg-destructive/20 text-destructive border-destructive/30', icon: AlertCircle },
      cancelled: { label: 'Cancelada', className: 'bg-muted text-muted-foreground border-border', icon: XCircle },
    };
    return variants[status] || variants.sent;
  };

  const toggleCard = (invoiceId: number) => {
    if (!invoiceId) return; // Validar que el ID existe
    
    // Si la tarjeta ya está expandida, la cerramos; si no, la abrimos (y cerramos cualquier otra)
    setExpandedCardId(prev => prev === invoiceId ? null : invoiceId);
  };

  // Calculate statistics
  const totalInvoices = invoices?.length || 0;
  const pendingInvoices = invoices?.filter(inv => inv.status === 'draft' || inv.status === 'sent').length || 0;
  const paidInvoices = invoices?.filter(inv => inv.status === 'paid').length || 0;
  const overdueInvoices = invoices?.filter(inv => inv.status === 'overdue').length || 0;
  const totalAmount = invoices?.reduce((sum, inv) => sum + parseFloat(inv.total), 0) || 0;
  const paid_amount = invoices?.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + parseFloat(inv.total), 0) || 0;

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">{t.invoices.title}</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              {t.invoices.subtitle}
            </p>
          </div>
          <div className="flex gap-2 sm:gap-3">
            <Button
              onClick={() => {
                // Check plan limits for Free users (skip for super admins)
                if (user?.role !== 'super_admin' && user?.subscription_plan === 'free') {
                  const invoiceLimit = 5; // Free plan limit
                  const currentCount = invoices?.length || 0;
                  
                  if (currentCount >= invoiceLimit) {
                    setShowLimitDialog(true);
                    return;
                  }
                }
                setIsDialogOpen(true);
              }}
              className="bg-primary text-primary-foreground hover:opacity-90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nueva Factura
            </Button>
          </div>
        </div>

        {/* New Invoice Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="bg-popover border-border max-w-7xl max-h-[92vh] overflow-y-auto w-[98vw] lg:w-[95vw]">
              <DialogHeader className="pb-4">
                <DialogTitle className="text-foreground text-xl sm:text-2xl">{t.invoices.createInvoice}</DialogTitle>
                <DialogDescription className="text-muted-foreground text-sm">
                  {t.invoices.createInvoiceSubtitle}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                {/* Client and Status */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="client_id" className="text-foreground font-semibold">
                      Cliente <span className="text-destructive">*</span>
                    </Label>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full h-11 justify-between bg-background border-border text-foreground hover:bg-accent"
                      onClick={() => setShowClientSelector(true)}
                    >
                      <span className="truncate">
                        {formData.client_id ? getClientName(formData.client_id) : 'Selecciona un cliente'}
                      </span>
                      <Search className="w-4 h-4 ml-2 flex-shrink-0" />
                    </Button>
                    <p className="text-xs text-muted-foreground">Haz clic para buscar y seleccionar un cliente</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status" className="text-foreground font-semibold">Estado Inicial</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value: any) => setFormData({ ...formData, status: value })}
                    >
                      <SelectTrigger className="bg-background border-border text-foreground h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        <SelectItem value="draft">Borrador</SelectItem>
                        <SelectItem value="sent">Enviada</SelectItem>
                        <SelectItem value="paid">Pagada</SelectItem>
                        <SelectItem value="overdue">Vencida</SelectItem>
                        <SelectItem value="cancelled">Cancelada</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">Estado actual de la factura</p>
                  </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="issue_date" className="text-foreground font-semibold">Fecha de Emisión</Label>
                    <Input
                      id="issue_date"
                      type="date"
                      value={formData.issue_date}
                      onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                      className="bg-background border-border text-foreground h-11"
                    />
                    <p className="text-xs text-muted-foreground">Fecha en que se emite la factura</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="due_date" className="text-foreground font-semibold">Fecha de Vencimiento</Label>
                    <Input
                      id="due_date"
                      type="date"
                      value={formData.due_date}
                      onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                      className="bg-background border-border text-foreground h-11"
                    />
                    <p className="text-xs text-muted-foreground">Fecha límite de pago</p>
                  </div>
                </div>

                {/* Items Section */}
                <div className="space-y-4 pt-4 border-t-2 border-border">
                  <div>
                    <Label className="text-foreground font-semibold text-lg">
                      Items de la Factura <span className="text-destructive">*</span>
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Agrega los productos o servicios incluidos en esta factura
                    </p>
                  </div>
                  
                  {/* Current Items */}
                  {formData.items && formData.items.length > 0 && (
                    <div className="space-y-2 mb-4">
                      {formData.items.map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-4 bg-accent/10 border border-border rounded-lg hover:bg-accent/20 transition-colors">
                          <div className="flex-1">
                            <p className="font-medium text-foreground">{item.description}</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {t.invoices.quantity}: {item.quantity} × ${item.unitPrice.toFixed(2)} = ${item.total.toFixed(2)}
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeItem(index)}
                            className="text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                      <div className="space-y-3 pt-3 border-t border-border">
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground mb-1">{t.invoices.totalInvoice}</p>
                          <p className="text-2xl font-bold font-mono text-foreground">
                            ${calculateTotal().toFixed(2)}
                          </p>
                        </div>
                        
                        {/* Paid Amount Field */}
                        <div className="space-y-2">
                          <Label htmlFor="paid_amount" className="text-foreground font-semibold">
                            {t.invoices.paidAmountLabel}
                          </Label>
                          <Input
                            id="paid_amount"
                            type="number"
                            step="0.01"
                            min="0"
                            max={calculateTotal()}
                            placeholder="0.00"
                            value={formData.paid_amount || ''}
                            onChange={(e) => setFormData({ ...formData, paid_amount: e.target.value })}
                            className="bg-background border-border text-foreground h-11"
                          />
                          <p className="text-xs text-muted-foreground">
                            {t.invoices.paidAmountHelper}
                          </p>
                          {formData.paid_amount && parseFloat(formData.paid_amount) > 0 && (
                            <div className="mt-2 p-3 bg-accent/20 rounded-lg">
                              <p className="text-sm font-medium text-foreground">
                                {t.invoices.balancePending}: ${(calculateTotal() - parseFloat(formData.paid_amount || '0')).toFixed(2)}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Add New Item */}
                  <Card className="bg-background border-border">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm sm:text-base">{t.invoices.addNewItem}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label htmlFor="itemDescription" className="text-xs sm:text-sm text-foreground font-medium">
                            {t.invoices.itemDescription}
                          </Label>
                          <Input
                            id="itemDescription"
                            placeholder={t.invoices.itemDescriptionPlaceholder}
                            value={currentItem.description}
                            onChange={(e) => setCurrentItem({ ...currentItem, description: e.target.value })}
                            className="bg-background border-border text-foreground h-10"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label htmlFor="itemQuantity" className="text-xs sm:text-sm text-foreground font-medium">
                              {t.invoices.quantity}
                            </Label>
                            <Input
                              id="itemQuantity"
                              type="number"
                              min="1"
                              placeholder="1"
                              value={currentItem.quantity}
                              onChange={(e) => setCurrentItem({ ...currentItem, quantity: parseInt(e.target.value) || 1 })}
                              className="bg-background border-border text-foreground h-10"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="itemPrice" className="text-xs sm:text-sm text-foreground font-medium">
                              {t.invoices.price}
                            </Label>
                            <Input
                              id="itemPrice"
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="0.00"
                              value={currentItem.unitPrice}
                              onChange={(e) => setCurrentItem({ ...currentItem, unitPrice: parseFloat(e.target.value) || 0 })}
                              className="bg-background border-border text-foreground font-mono h-10"
                            />
                          </div>
                        </div>
                        <Button
                          type="button"
                          onClick={addItem}
                          className="w-full bg-accent text-accent-foreground hover:bg-accent/80 h-10"
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          {t.invoices.addItem}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-foreground font-semibold">Notas Adicionales</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="bg-background border-border text-foreground min-h-[80px]"
                    placeholder={t.invoices.notesPlaceholder}
                  />
                  <p className="text-xs text-muted-foreground">Información adicional que aparecerá en el PDF</p>
                </div>

                {/* Payment Link */}
                <div className="space-y-2">
                  <Label htmlFor="payment_link" className="text-foreground font-semibold">Link de Pago (Opcional)</Label>
                  <Input
                    id="payment_link"
                    type="url"
                    value={formData.payment_link || ''}
                    onChange={(e) => setFormData({ ...formData, payment_link: e.target.value })}
                    className="bg-background border-border text-foreground h-11"
                    placeholder="https://tu-link-de-pago.com"
                  />
                  <p className="text-xs text-muted-foreground">Link externo donde el cliente puede realizar el pago (PayPal, wallet cripto, etc.)</p>
                </div>

                {/* Recurring Invoice Section */}
                <div className="space-y-4 p-4 border border-border rounded-lg bg-accent/5">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Repeat className="w-4 h-4 text-primary" />
                        <Label htmlFor="is_recurring" className="text-foreground font-semibold cursor-pointer">
                          Factura Recurrente
                        </Label>
                        <Badge variant="secondary" className="text-xs">Pro</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Genera automáticamente esta factura de forma periódica
                      </p>
                    </div>
                    <Switch
                      id="is_recurring"
                      checked={formData.is_recurring || false}
                      onCheckedChange={(checked) => {
                        // Check if user has Pro or Business plan (skip for super admins)
                        if (user?.role !== 'super_admin' && user?.subscription_plan === 'free' && checked) {
                          // Show upgrade modal
                          setShowLimitDialog(true);
                          return;
                        }
                        setFormData({ ...formData, is_recurring: checked });
                      }}
                    />
                  </div>

                  {formData.is_recurring && (
                    <div className="space-y-3 pt-3 border-t border-border">
                      <div className="space-y-2">
                        <Label className="text-foreground font-semibold">Frecuencia</Label>
                        <Select
                          value={formData.recurrence_frequency || 'monthly'}
                          onValueChange={(value: any) => setFormData({ ...formData, recurrence_frequency: value })}
                        >
                          <SelectTrigger className="bg-background border-border text-foreground h-11">
                            <SelectValue placeholder="Selecciona frecuencia" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="every_minute">🧪 Cada minuto (Testing)</SelectItem>
                            <SelectItem value="monthly">Mensual</SelectItem>
                            <SelectItem value="biweekly">Quincenal</SelectItem>
                            <SelectItem value="annual">Anual</SelectItem>
                            <SelectItem value="custom">Personalizado</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {formData.recurrence_frequency === 'custom' && (
                        <div className="space-y-2">
                          <Label htmlFor="recurrence_interval" className="text-foreground font-semibold">
                            Cada cuántos días
                          </Label>
                          <Input
                            id="recurrence_interval"
                            type="number"
                            min="1"
                            value={formData.recurrence_interval || ''}
                            onChange={(e) => setFormData({ ...formData, recurrence_interval: parseInt(e.target.value) })}
                            className="bg-background border-border text-foreground h-11"
                            placeholder="30"
                          />
                        </div>
                      )}

                      <div className="text-xs text-muted-foreground bg-blue-500/10 border border-blue-500/20 rounded p-3">
                        <p className="font-medium text-blue-600 dark:text-blue-400 mb-1">ℹ️ Cómo funciona:</p>
                        <p>Esta factura se generará automáticamente según la frecuencia seleccionada. Podrás ver el historial y detener la recurrencia cuando quieras.</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-6 border-t border-border">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    className="border-border text-foreground hover:bg-accent"
                  >
                    {t.common.cancel}
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button type="button" className="bg-primary text-primary-foreground hover:opacity-90">
                        <FileText className="w-4 h-4 mr-2" />
                        Crear Factura
                        <ChevronDown className="w-4 h-4 ml-2" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuItem onClick={(e) => { e.preventDefault(); handleSubmit(e as any, 'create_and_send'); }}>
                        <Mail className="w-4 h-4 mr-2" />
                        Crear y Enviar al Cliente
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => { e.preventDefault(); handleSubmit(e as any, 'download'); }}>
                        <Download className="w-4 h-4 mr-2" />
                        Crear y Descargar PDF
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => { e.preventDefault(); handleSubmit(e as any, 'copy_link'); }}>
                        <LinkIcon className="w-4 h-4 mr-2" />
                        Crear y Copiar Link de Pago
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={(e) => { e.preventDefault(); handleSubmit(e as any, 'create_only'); }}>
                        <FileText className="w-4 h-4 mr-2" />
                        Solo Crear Factura
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </form>
            </DialogContent>
          </Dialog>

        {/* Invoices List */}
        {!invoices || invoices.length === 0 ? (
          <Card className="bg-card border-border">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="w-32 h-32 rounded-full bg-accent/20 flex items-center justify-center mb-6">
                <FileText className="w-16 h-16 text-muted-foreground" strokeWidth={1} />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                {t.invoices.noInvoices}
              </h3>
              <p className="text-muted-foreground mb-6">
                {t.invoices.noInvoicesSubtitle}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {invoices.map((invoice) => {
              const statusInfo = getStatusBadge(invoice.status);
              const StatusIcon = statusInfo.icon;
              const isExpanded = expandedCardId === invoice.id;
              
              return (
                <Card key={invoice.id} className="bg-card border-border hover:border-accent/50 transition-all h-fit">
                  <CardContent className="p-4">
                    {/* Collapsed View - Invoice Number, Client, Status */}
                    {!isExpanded ? (
                      <div className="space-y-2">
                        {/* Header Row: Invoice Number + Status Badge */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-lg text-foreground truncate">{invoice.invoice_number}</p>
                            <p className="text-sm text-muted-foreground truncate">{getClientName(invoice.client_id)}</p>
                          </div>
                          <Badge className={`${statusInfo.className} border px-2 py-1 text-xs flex items-center gap-1 flex-shrink-0`}>
                            <StatusIcon className="w-3 h-3" />
                            {statusInfo.label}
                          </Badge>
                        </div>
                        
                        {/* Action Buttons Row */}
                        <div className="flex items-center justify-end gap-1 pt-2 border-t border-border">
                          <div className="flex items-center gap-1 flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleCard(invoice.id!)}
                            className="text-muted-foreground hover:text-foreground h-8 w-8"
                          >
                            <ChevronDown className="w-4 h-4" />
                          </Button>
                          <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground h-8 w-8">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="bg-popover border-border w-56" align="end">
                            <DropdownMenuItem 
                              onClick={() => handleStatusChange(invoice, 'pending')}
                              className="text-foreground hover:bg-accent cursor-pointer"
                            >
                              <Clock className="w-4 h-4 mr-2 text-yellow-400" />
                              Marcar como Pendiente
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleStatusChange(invoice, 'paid')}
                              className="text-foreground hover:bg-accent cursor-pointer"
                            >
                              <CheckCircle2 className="w-4 h-4 mr-2 text-green-400" />
                              Marcar como Pagada
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handlePartialPayment(invoice)}
                              className="text-foreground hover:bg-accent cursor-pointer"
                            >
                              <DollarSign className="w-4 h-4 mr-2 text-blue-400" />
                              Registrar Pago Parcial
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleStatusChange(invoice, 'overdue')}
                              className="text-foreground hover:bg-accent cursor-pointer"
                            >
                              <AlertCircle className="w-4 h-4 mr-2 text-destructive" />
                              Marcar como Vencida
                            </DropdownMenuItem>
                            {invoice.status === 'paid' && (
                              <DropdownMenuItem 
                                onClick={() => handleArchive(invoice)}
                                className="text-green-400 hover:bg-accent cursor-pointer"
                              >
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                Archivar Factura
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator className="bg-border" />
                            <DropdownMenuItem 
                              onClick={() => handleStatusChange(invoice, 'cancelled')}
                              className="text-destructive hover:bg-destructive/10 cursor-pointer"
                            >
                              <XCircle className="w-4 h-4 mr-2" />
                              {t.invoices.cancelInvoice}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Expanded View - Full Details */
                      <div className="space-y-4">
                        {/* Header with Invoice Number, Client and Actions */}
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-lg text-foreground truncate">{invoice.invoice_number}</p>
                            <p className="text-sm text-muted-foreground truncate">{getClientName(invoice.client_id)}</p>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => toggleCard(invoice.id!)}
                              className="text-muted-foreground hover:text-foreground h-8 w-8"
                            >
                              <ChevronUp className="w-4 h-4" />
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground h-8 w-8">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent className="bg-popover border-border w-56" align="end">
                                <DropdownMenuItem 
                                  onClick={() => handleStatusChange(invoice, 'pending')}
                                  className="text-foreground hover:bg-accent cursor-pointer"
                                >
                                  <Clock className="w-4 h-4 mr-2 text-yellow-400" />
                                  Marcar como Pendiente
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleStatusChange(invoice, 'paid')}
                                  className="text-foreground hover:bg-accent cursor-pointer"
                                >
                                  <CheckCircle2 className="w-4 h-4 mr-2 text-green-400" />
                                  Marcar como Pagada
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handlePartialPayment(invoice)}
                                  className="text-foreground hover:bg-accent cursor-pointer"
                                >
                                  <DollarSign className="w-4 h-4 mr-2 text-blue-400" />
                                  Registrar Pago Parcial
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleStatusChange(invoice, 'overdue')}
                                  className="text-foreground hover:bg-accent cursor-pointer"
                                >
                                  <AlertCircle className="w-4 h-4 mr-2 text-destructive" />
                                  Marcar como Vencida
                                </DropdownMenuItem>
                                {invoice.status === 'paid' && (
                                  <DropdownMenuItem 
                                    onClick={() => handleArchive(invoice)}
                                    className="text-green-400 hover:bg-accent cursor-pointer"
                                  >
                                    <CheckCircle2 className="w-4 h-4 mr-2" />
                                    Archivar Factura
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator className="bg-border" />
                                <DropdownMenuItem 
                                  onClick={() => handleStatusChange(invoice, 'cancelled')}
                                  className="text-destructive hover:bg-destructive/10 cursor-pointer"
                                >
                                  <XCircle className="w-4 h-4 mr-2" />
                                  {t.invoices.cancelInvoice}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>

                        {/* Details Grid */}
                        <div className="grid grid-cols-2 gap-4 pt-3 border-t border-border">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Vencimiento</p>
                            <p className="text-sm font-medium text-foreground">
                              {format(new Date(invoice.due_date), 'dd MMM yyyy', { locale: es })}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Monto</p>
                            <p className="text-lg font-bold font-mono text-foreground">
                              ${parseFloat(invoice.total).toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                        </div>

                      {/* Pagos Parciales - Deshabilitado temporalmente */}

                      <div className="pt-3 border-t border-border">
                        <p className="text-xs text-muted-foreground mb-2">Estado</p>
                        <Badge className={`${statusInfo.className} border px-3 py-1.5 flex items-center gap-1.5 w-fit`}>
                          <StatusIcon className="w-3.5 h-3.5" />
                          {statusInfo.label}
                        </Badge>
                      </div>

                      <div className="pt-3 border-t border-border space-y-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => generatePDF(invoice.id!)}
                          className="w-full border-border text-foreground hover:bg-accent"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Descargar PDF
                        </Button>
                        
                        {invoice.payment_token && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const paymentUrl = `${window.location.origin}/pay?token=${invoice.payment_token}`;
                              navigator.clipboard.writeText(paymentUrl);
                              toast.success('Link de pago copiado al portapapeles');
                            }}
                            className="w-full border-border text-foreground hover:bg-accent"
                          >
                            <Copy className="w-4 h-4 mr-2" />
                            Copiar Link de Pago
                          </Button>
                        )}
                      </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Status Change Dialog */}
        <AlertDialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
          <AlertDialogContent className="bg-popover border-border">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-foreground flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
                Factura Pagada
              </AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground">
                ¿Deseas agregar el monto de ${parseFloat(selectedInvoice?.total || '0').toFixed(2)} como ingreso en la sección de Finanzas?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel 
                onClick={() => confirmStatusChange(false)}
                className="border-border text-foreground hover:bg-accent"
              >
                No, solo cambiar estado
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => confirmStatusChange(true)}
                className="bg-primary text-primary-foreground hover:opacity-90"
              >
                Sí, agregar a Finanzas
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Partial Payment Dialog */}
        <AlertDialog open={showPartialPaymentDialog} onOpenChange={setShowPartialPaymentDialog}>
          <AlertDialogContent className="bg-popover border-border">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-foreground flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-blue-400" />
                Registrar Pago Parcial
              </AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground">
                {t.invoices.invoice_number} {selectedInvoice?.invoice_number}<br />
                Total: ${parseFloat(selectedInvoice?.total || '0').toFixed(2)}<br />
                <span className="text-xs text-orange-400">Funcionalidad de pagos parciales temporalmente deshabilitada</span>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4">
              <Label htmlFor="partialAmount" className="text-foreground text-sm mb-2 block">
                Monto del Abono *
              </Label>
              <Input
                id="partialAmount"
                type="number"
                step="0.01"
                min="0"
                max={selectedInvoice ? parseFloat(selectedInvoice.total) : 0}
                value={partialPaymentAmount}
                onChange={(e) => setPartialPaymentAmount(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="bg-background border-border text-foreground h-10"
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel 
                onClick={() => setShowPartialPaymentDialog(false)}
                className="border-border text-foreground hover:bg-accent"
              >
                {t.common.cancel}
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={confirmPartialPayment}
                className="bg-primary text-primary-foreground hover:opacity-90"
              >
                Registrar Pago
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Client Selector Modal */}
        <Dialog open={showClientSelector} onOpenChange={setShowClientSelector}>
          <DialogContent className="bg-popover border-border max-w-3xl max-h-[85vh] overflow-hidden w-[95vw] sm:w-full flex flex-col">
            <DialogHeader className="pb-4">
              <DialogTitle className="text-foreground text-xl flex items-center gap-2">
                <User className="w-5 h-5" />
                Seleccionar Cliente
              </DialogTitle>
              <DialogDescription className="text-muted-foreground text-sm">
                Busca y selecciona un cliente para la factura
              </DialogDescription>
            </DialogHeader>
            
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder={t.clientSelector.searchPlaceholder}
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
                className="pl-10 bg-background border-border text-foreground h-11"
                autoFocus
              />
            </div>

            {/* Clients List */}
            <div className="flex-1 overflow-y-auto pr-2 space-y-2 min-h-0">
              {!filteredClients || filteredClients.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mb-4">
                    <User className="w-8 h-8 text-muted-foreground" strokeWidth={1} />
                  </div>
                  <p className="text-muted-foreground text-sm">
                    {clientSearch ? 'No se encontraron clientes con ese criterio' : 'No hay clientes registrados'}
                  </p>
                  {!clientSearch && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Ve a la sección de Clientes para agregar uno
                    </p>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2">
                  {filteredClients.map((client) => (
                    <button
                      key={client.id}
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, client_id: client.id });
                        setShowClientSelector(false);
                        setClientSearch('');
                        toast.success(`Cliente seleccionado: ${client.name}`);
                      }}
                      className="w-full text-left p-4 rounded-lg border border-border bg-card hover:bg-accent hover:border-accent-foreground/20 transition-all group"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-foreground text-base group-hover:text-accent-foreground truncate">
                            {client.name}
                          </h4>
                        </div>
                        {client.company && (
                          <div className="flex-shrink-0">
                            <p className="text-sm text-muted-foreground truncate">
                              {client.company}
                            </p>
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="pt-4 border-t border-border flex justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowClientSelector(false);
                  setClientSearch('');
                }}
                className="border-border text-foreground hover:bg-accent"
              >
                {t.common.cancel}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Archived Invoices Dialog */}
        <Dialog open={showArchivedDialog} onOpenChange={setShowArchivedDialog}>
          <DialogContent className="bg-popover border-border max-w-4xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
            <DialogHeader>
              <DialogTitle className="text-foreground text-xl sm:text-2xl">Facturas Archivadas</DialogTitle>
              <DialogDescription className="text-muted-foreground text-sm">
                Gestiona tus facturas archivadas y restáuralas cuando sea necesario
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              {archivedInvoices && archivedInvoices.length === 0 ? (
                <div className="text-center py-12">
                  <FolderArchive className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No hay facturas archivadas</p>
                </div>
              ) : (
                archivedInvoices?.map((invoice) => {
                  const client = clients?.find(c => c.id === invoice.client_id);
                  return (
                    <Card key={invoice.id} className="bg-card border-border">
                      <CardContent className="p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <FileText className="w-4 h-4 text-muted-foreground" />
                              <span className="font-mono text-sm text-muted-foreground">{invoice.invoice_number}</span>
                            </div>
                            <h3 className="font-semibold text-foreground mb-1">{client?.name || 'Cliente desconocido'}</h3>
                            {client?.company && (
                              <p className="text-sm text-muted-foreground">{client.company}</p>
                            )}
                            <div className="flex flex-wrap gap-3 mt-2 text-sm text-muted-foreground">
                              <span>Emitida: {format(new Date(invoice.issue_date), 'dd/MM/yyyy')}</span>
                              <span>Vencimiento: {format(new Date(invoice.due_date), 'dd/MM/yyyy')}</span>
                            </div>
                          </div>
                          <div className="flex flex-col sm:items-end gap-2">
                            <div className="text-2xl font-bold font-mono text-foreground">
                              ${parseFloat(invoice.total).toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={async () => {
                                await updateInvoice.mutateAsync({ id: invoice.id, status: 'pending' });
                                toast.success('Factura restaurada correctamente');
                              }}
                              className="border-border text-foreground hover:bg-accent"
                            >
                              <ArchiveRestore className="w-3 h-3 mr-1" />
                              Restaurar
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </DialogContent>
        </Dialog>
        
        {/* Plan Limit Dialog */}
        <PlanLimitDialog
          open={showLimitDialog}
          onOpenChange={setShowLimitDialog}
          limitType="invoices"
          currentCount={invoices?.length || 0}
          limit={5}
        />
      </div>
    </DashboardLayout>
  );
}
