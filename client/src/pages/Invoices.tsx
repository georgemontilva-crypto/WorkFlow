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
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Invoice, type InvoiceItem } from '@/lib/db';
import { FileText, Download, Plus, Trash2, MoreVertical, CheckCircle2, XCircle, Clock, AlertCircle, ChevronDown, ChevronUp, DollarSign, Search, User } from 'lucide-react';
import { format, parseISO, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import jsPDF from 'jspdf';
import { useState } from 'react';

export default function Invoices() {
  const { t } = useLanguage();
  const invoices = useLiveQuery(() => db.invoices.orderBy('createdAt').reverse().toArray());
  const clients = useLiveQuery(() => db.clients.toArray());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [showPartialPaymentDialog, setShowPartialPaymentDialog] = useState(false);
  const [partialPaymentAmount, setPartialPaymentAmount] = useState<number>(0);
  const [newStatus, setNewStatus] = useState<'pending' | 'paid' | 'overdue' | 'cancelled'>('pending');
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());
  const [showClientSelector, setShowClientSelector] = useState(false);
  const [clientSearch, setClientSearch] = useState('');
  const [formData, setFormData] = useState<Partial<Invoice>>({
    clientId: 0,
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: addDays(new Date(), 30).toISOString().split('T')[0],
    status: 'pending',
    paidAmount: 0,
    items: [],
    notes: '',
  });
  const [currentItem, setCurrentItem] = useState<Partial<InvoiceItem>>({
    description: '',
    quantity: 1,
    unitPrice: 0,
    total: 0,
  });

  const getClientName = (clientId: number) => {
    const client = clients?.find(c => c.id === clientId);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.clientId || !formData.items || formData.items.length === 0) {
      toast.error('Selecciona un cliente y agrega al menos un item');
      return;
    }

    const invoiceNumber = `INV-${Date.now()}`;
    const total = calculateTotal();

    await db.invoices.add({
      ...formData as Invoice,
      invoiceNumber,
      amount: total,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    toast.success('Factura creada exitosamente');
    setIsDialogOpen(false);
    setFormData({
      clientId: 0,
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: addDays(new Date(), 30).toISOString().split('T')[0],
      status: 'pending',
      items: [],
      notes: '',
    });
  };

  const handleStatusChange = async (invoice: Invoice, status: 'pending' | 'paid' | 'overdue' | 'cancelled') => {
    setSelectedInvoice(invoice);
    setNewStatus(status);
    
    // Si el cambio es a "paid" y la factura estaba pendiente, mostrar diálogo
    if (status === 'paid' && invoice.status === 'pending') {
      setShowStatusDialog(true);
    } else {
      // Cambiar estado directamente
      await db.invoices.update(invoice.id!, { status, updatedAt: new Date().toISOString() });
      toast.success('Estado actualizado');
    }
  };

  const confirmStatusChange = async (addToFinances: boolean) => {
    if (!selectedInvoice) return;

    await db.invoices.update(selectedInvoice.id!, { 
      status: newStatus, 
      updatedAt: new Date().toISOString() 
    });

    if (addToFinances) {
      // Agregar ingreso a finanzas
      const client = clients?.find(c => c.id === selectedInvoice.clientId);
      await db.transactions.add({
        type: 'income',
        amount: selectedInvoice.amount,
        category: 'Pago de Factura',
        description: `Pago de factura ${selectedInvoice.invoiceNumber} - ${client?.name || 'Cliente'}`,
        date: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      toast.success('Factura marcada como pagada e ingreso agregado a Finanzas');
    } else {
      toast.success('Factura marcada como pagada');
    }

    setShowStatusDialog(false);
    setSelectedInvoice(null);
  };

  const handlePartialPayment = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setPartialPaymentAmount(0);
    setShowPartialPaymentDialog(true);
  };

  const confirmPartialPayment = async () => {
    if (!selectedInvoice || partialPaymentAmount <= 0) {
      toast.error('Ingresa un monto válido');
      return;
    }

    const currentPaid = selectedInvoice.paidAmount || 0;
    const newPaidAmount = currentPaid + partialPaymentAmount;

    if (newPaidAmount > selectedInvoice.amount) {
      toast.error('El monto total pagado no puede exceder el monto de la factura');
      return;
    }

    // Actualizar factura con el pago parcial
    const newStatus = newPaidAmount >= selectedInvoice.amount ? 'paid' : selectedInvoice.status;
    await db.invoices.update(selectedInvoice.id!, {
      paidAmount: newPaidAmount,
      status: newStatus,
      updatedAt: new Date().toISOString(),
    });

    // Agregar transacción de ingreso
    const client = clients?.find(c => c.id === selectedInvoice.clientId);
    await db.transactions.add({
      type: 'income',
      amount: partialPaymentAmount,
      category: 'Pago Parcial de Factura',
      description: `Abono a factura ${selectedInvoice.invoiceNumber} - ${client?.name || 'Cliente'}`,
      date: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    toast.success(`Pago parcial de $${partialPaymentAmount.toFixed(2)} registrado exitosamente`);
    setShowPartialPaymentDialog(false);
    setSelectedInvoice(null);
    setPartialPaymentAmount(0);
  };

  const generatePDF = async (invoiceId: number) => {
    const invoice = await db.invoices.get(invoiceId);
    if (!invoice) return;

    const client = await db.clients.get(invoice.clientId);
    if (!client) return;

    const doc = new jsPDF();

    // Header
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('FACTURA', 105, 20, { align: 'center' });

    // Invoice Info
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Factura #: ${invoice.invoiceNumber}`, 20, 40);
    doc.text(`Fecha de Emisión: ${format(parseISO(invoice.issueDate), 'dd/MM/yyyy')}`, 20, 47);
    doc.text(`Fecha de Vencimiento: ${format(parseISO(invoice.dueDate), 'dd/MM/yyyy')}`, 20, 54);

    // Client Info
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Cliente:', 20, 70);
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
    doc.text('Descripción', 20, yPos);
    doc.text('Cant.', 120, yPos);
    doc.text('Precio Unit.', 145, yPos);
    doc.text('Total', 175, yPos);

    doc.setLineWidth(0.5);
    doc.line(20, yPos + 2, 190, yPos + 2);

    // Items
    yPos += 10;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    invoice.items.forEach(item => {
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
    doc.text('TOTAL:', 140, yPos);
    doc.text(`$${invoice.amount.toFixed(2)}`, 190, yPos, { align: 'right' });

    // Notes
    if (invoice.notes) {
      yPos += 20;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Notas:', 20, yPos);
      doc.setFont('helvetica', 'normal');
      const splitNotes = doc.splitTextToSize(invoice.notes, 170);
      doc.text(splitNotes, 20, yPos + 7);
    }

    doc.save(`factura-${invoice.invoiceNumber}.pdf`);
    toast.success('PDF generado exitosamente');
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; className: string; icon: any }> = {
      pending: { label: 'Pendiente', className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: Clock },
      paid: { label: 'Pagada', className: 'bg-green-500/20 text-green-400 border-green-500/30', icon: CheckCircle2 },
      overdue: { label: 'Vencida', className: 'bg-destructive/20 text-destructive border-destructive/30', icon: AlertCircle },
      cancelled: { label: 'Cancelada', className: 'bg-muted text-muted-foreground border-border', icon: XCircle },
    };
    return variants[status] || variants.pending;
  };

  const toggleCard = (invoiceId: number) => {
    if (!invoiceId) return; // Validar que el ID existe
    
    setExpandedCards(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(invoiceId)) {
        newExpanded.delete(invoiceId);
      } else {
        newExpanded.add(invoiceId);
      }
      return newExpanded;
    });
  };

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Facturas</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Crea, gestiona y genera facturas profesionales en PDF
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground hover:opacity-90">
                <Plus className="w-4 h-4 mr-2" />
                Nueva Factura
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-popover border-border max-w-4xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
              <DialogHeader className="pb-4">
                <DialogTitle className="text-foreground text-xl sm:text-2xl">Crear Nueva Factura</DialogTitle>
                <DialogDescription className="text-muted-foreground text-sm">
                  Completa los detalles de la factura y agrega los items correspondientes
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                {/* Client and Status */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="clientId" className="text-foreground font-semibold">
                      Cliente <span className="text-destructive">*</span>
                    </Label>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full h-11 justify-between bg-background border-border text-foreground hover:bg-accent"
                      onClick={() => setShowClientSelector(true)}
                    >
                      <span className="truncate">
                        {formData.clientId ? getClientName(formData.clientId) : 'Selecciona un cliente'}
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
                        <SelectItem value="pending">Pendiente</SelectItem>
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
                    <Label htmlFor="issueDate" className="text-foreground font-semibold">Fecha de Emisión</Label>
                    <Input
                      id="issueDate"
                      type="date"
                      value={formData.issueDate}
                      onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                      className="bg-background border-border text-foreground h-11"
                    />
                    <p className="text-xs text-muted-foreground">Fecha en que se emite la factura</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dueDate" className="text-foreground font-semibold">Fecha de Vencimiento</Label>
                    <Input
                      id="dueDate"
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
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
                              Cantidad: {item.quantity} × ${item.unitPrice.toFixed(2)} = ${item.total.toFixed(2)}
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
                      <div className="text-right pt-3 border-t border-border">
                        <p className="text-sm text-muted-foreground mb-1">Total de la Factura</p>
                        <p className="text-2xl font-bold font-mono text-foreground">
                          ${calculateTotal().toFixed(2)}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Add New Item */}
                  <Card className="bg-background border-border">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm sm:text-base">Agregar Nuevo Item</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label htmlFor="itemDescription" className="text-xs sm:text-sm text-foreground font-medium">
                            Descripción del Item
                          </Label>
                          <Input
                            id="itemDescription"
                            placeholder="Ej: Diseño"
                            value={currentItem.description}
                            onChange={(e) => setCurrentItem({ ...currentItem, description: e.target.value })}
                            className="bg-background border-border text-foreground h-10"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label htmlFor="itemQuantity" className="text-xs sm:text-sm text-foreground font-medium">
                              Cantidad
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
                              Precio ($)
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
                          Agregar
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
                    placeholder="Términos de pago, condiciones especiales, información adicional..."
                  />
                  <p className="text-xs text-muted-foreground">Información adicional que aparecerá en el PDF</p>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-border">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    className="border-border text-foreground hover:bg-accent"
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" className="bg-primary text-primary-foreground hover:opacity-90">
                    <FileText className="w-4 h-4 mr-2" />
                    Crear Factura
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Invoices List */}
        {!invoices || invoices.length === 0 ? (
          <Card className="bg-card border-border">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="w-32 h-32 rounded-full bg-accent/20 flex items-center justify-center mb-6">
                <FileText className="w-16 h-16 text-muted-foreground" strokeWidth={1} />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                No hay facturas aún
              </h3>
              <p className="text-muted-foreground mb-6">
                Comienza creando tu primera factura
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {invoices.map((invoice) => {
              const statusInfo = getStatusBadge(invoice.status);
              const StatusIcon = statusInfo.icon;
              const isExpanded = expandedCards.has(invoice.id!);
              
              return (
                <Card key={invoice.id} className="bg-card border-border hover:border-accent transition-colors">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-foreground text-lg truncate">
                          {invoice.invoiceNumber}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground truncate mt-1">
                          {getClientName(invoice.clientId)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleCard(invoice.id!)}
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
                            <DropdownMenuSeparator className="bg-border" />
                            <DropdownMenuItem 
                              onClick={() => handleStatusChange(invoice, 'cancelled')}
                              className="text-destructive hover:bg-destructive/10 cursor-pointer"
                            >
                              <XCircle className="w-4 h-4 mr-2" />
                              Cancelar Factura
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardHeader>

                  {isExpanded && (
                    <CardContent className="space-y-3 pt-0">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Vencimiento</p>
                          <p className="text-sm font-medium text-foreground">
                            {format(parseISO(invoice.dueDate), 'dd MMM yyyy', { locale: es })}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Monto Total</p>
                          <p className="text-lg font-bold font-mono text-foreground">
                            ${invoice.amount.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>

                      {/* Pagos Parciales */}
                      {(invoice.paidAmount && invoice.paidAmount > 0) && (
                        <div className="pt-2 border-t border-border">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Pagado</p>
                              <p className="text-sm font-medium text-green-500">
                                ${invoice.paidAmount.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Restante</p>
                              <p className="text-sm font-bold text-orange-400">
                                ${(invoice.amount - invoice.paidAmount).toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                              </p>
                            </div>
                          </div>
                          <div className="mt-2">
                            <Progress value={(invoice.paidAmount / invoice.amount) * 100} className="h-2" />
                          </div>
                        </div>
                      )}

                      <div className="pt-3 border-t border-border">
                        <p className="text-xs text-muted-foreground mb-2">Estado</p>
                        <Badge className={`${statusInfo.className} border px-3 py-1.5 flex items-center gap-1.5 w-fit`}>
                          <StatusIcon className="w-3.5 h-3.5" />
                          {statusInfo.label}
                        </Badge>
                      </div>

                      <div className="pt-3 border-t border-border">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => generatePDF(invoice.id!)}
                          className="w-full border-border text-foreground hover:bg-accent"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Descargar PDF
                        </Button>
                      </div>
                    </CardContent>
                  )}
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
                ¿Deseas agregar el monto de ${selectedInvoice?.amount.toFixed(2)} como ingreso en la sección de Finanzas?
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
                Factura: {selectedInvoice?.invoiceNumber}<br />
                Monto Total: ${selectedInvoice?.amount.toFixed(2)}<br />
                {selectedInvoice?.paidAmount && selectedInvoice.paidAmount > 0 && (
                  <>
                    Pagado: ${selectedInvoice.paidAmount.toFixed(2)}<br />
                    Restante: ${(selectedInvoice.amount - selectedInvoice.paidAmount).toFixed(2)}<br />
                  </>
                )}
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
                max={selectedInvoice ? selectedInvoice.amount - (selectedInvoice.paidAmount || 0) : 0}
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
                Cancelar
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
                        setFormData({ ...formData, clientId: client.id });
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
                Cancelar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
