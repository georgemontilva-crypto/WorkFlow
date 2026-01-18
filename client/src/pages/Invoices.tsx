/**
 * Invoices Page - Gestión de Facturas
 * Design Philosophy: Apple Minimalism
 */

import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Invoice, type InvoiceItem } from '@/lib/db';
import { FileText, Download, Plus, Trash2 } from 'lucide-react';
import { format, parseISO, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import { useState } from 'react';

export default function Invoices() {
  const invoices = useLiveQuery(() => db.invoices.orderBy('createdAt').reverse().toArray());
  const clients = useLiveQuery(() => db.clients.toArray());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Invoice>>({
    clientId: 0,
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: addDays(new Date(), 30).toISOString().split('T')[0],
    status: 'pending',
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

  const generatePDF = async (invoiceId: number) => {
    const invoice = await db.invoices.get(invoiceId);
    if (!invoice) return;

    const client = await db.clients.get(invoice.clientId);
    if (!client) return;

    const doc = new jsPDF();

    // Header
    doc.setFontSize(24);
    doc.text('FACTURA', 105, 20, { align: 'center' });

    // Invoice Info
    doc.setFontSize(10);
    doc.text(`Factura #: ${invoice.invoiceNumber}`, 20, 40);
    doc.text(`Fecha de Emisión: ${format(parseISO(invoice.issueDate), 'dd/MM/yyyy')}`, 20, 47);
    doc.text(`Fecha de Vencimiento: ${format(parseISO(invoice.dueDate), 'dd/MM/yyyy')}`, 20, 54);

    // Client Info
    doc.setFontSize(12);
    doc.text('Cliente:', 20, 70);
    doc.setFontSize(10);
    doc.text(client.name, 20, 77);
    doc.text(client.email, 20, 84);
    if (client.phone) doc.text(client.phone, 20, 91);

    // Items Table
    let yPos = 110;
    doc.setFontSize(12);
    doc.text('Descripción', 20, yPos);
    doc.text('Cant.', 120, yPos);
    doc.text('Precio', 145, yPos);
    doc.text('Total', 175, yPos);

    doc.setLineWidth(0.5);
    doc.line(20, yPos + 2, 190, yPos + 2);

    yPos += 10;
    doc.setFontSize(10);

    invoice.items.forEach(item => {
      doc.text(item.description, 20, yPos);
      doc.text(item.quantity.toString(), 120, yPos);
      doc.text(`$${item.unitPrice.toFixed(2)}`, 145, yPos);
      doc.text(`$${item.total.toFixed(2)}`, 175, yPos);
      yPos += 7;
    });

    // Total
    yPos += 10;
    doc.setLineWidth(0.5);
    doc.line(140, yPos, 190, yPos);
    yPos += 10;
    doc.setFontSize(14);
    doc.text('TOTAL:', 140, yPos);
    doc.text(`$${invoice.amount.toFixed(2)}`, 175, yPos);

    // Notes
    if (invoice.notes) {
      yPos += 20;
      doc.setFontSize(10);
      doc.text('Notas:', 20, yPos);
      doc.text(invoice.notes, 20, yPos + 7);
    }

    doc.save(`factura-${invoice.invoiceNumber}.pdf`);
    toast.success('PDF generado exitosamente');
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; className: string }> = {
      pending: { label: 'Pendiente', className: 'bg-muted text-muted-foreground' },
      paid: { label: 'Pagada', className: 'bg-accent text-accent-foreground' },
      overdue: { label: 'Vencida', className: 'bg-destructive/20 text-destructive' },
      cancelled: { label: 'Cancelada', className: 'bg-muted text-muted-foreground' },
    };
    return variants[status] || variants.pending;
  };

  return (
    <DashboardLayout>
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Facturas</h1>
            <p className="text-muted-foreground">
              Gestiona y genera facturas en PDF
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground hover:opacity-90">
                <Plus className="w-4 h-4 mr-2" />
                Nueva Factura
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-popover border-border max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-foreground">Crear Nueva Factura</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="clientId" className="text-foreground">Cliente *</Label>
                    <Select
                      value={formData.clientId?.toString()}
                      onValueChange={(value) => setFormData({ ...formData, clientId: parseInt(value) })}
                    >
                      <SelectTrigger className="bg-background border-border text-foreground">
                        <SelectValue placeholder="Seleccionar cliente" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        {clients?.map(client => (
                          <SelectItem key={client.id} value={client.id!.toString()}>
                            {client.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status" className="text-foreground">Estado</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value: any) => setFormData({ ...formData, status: value })}
                    >
                      <SelectTrigger className="bg-background border-border text-foreground">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        <SelectItem value="pending">Pendiente</SelectItem>
                        <SelectItem value="paid">Pagada</SelectItem>
                        <SelectItem value="overdue">Vencida</SelectItem>
                        <SelectItem value="cancelled">Cancelada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="issueDate" className="text-foreground">Fecha de Emisión</Label>
                    <Input
                      id="issueDate"
                      type="date"
                      value={formData.issueDate}
                      onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                      className="bg-background border-border text-foreground"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dueDate" className="text-foreground">Fecha de Vencimiento</Label>
                    <Input
                      id="dueDate"
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                      className="bg-background border-border text-foreground"
                    />
                  </div>
                </div>

                {/* Items Section */}
                <div className="space-y-3 pt-4 border-t border-border">
                  <Label className="text-foreground font-semibold">Items de la Factura</Label>
                  
                  {/* Current Items */}
                  {formData.items && formData.items.length > 0 && (
                    <div className="space-y-2 mb-4">
                      {formData.items.map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-accent/20 rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium text-foreground">{item.description}</p>
                            <p className="text-sm text-muted-foreground">
                              {item.quantity} x ${item.unitPrice.toFixed(2)} = ${item.total.toFixed(2)}
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
                      <div className="text-right pt-2 border-t border-border">
                        <p className="text-lg font-bold font-mono text-foreground">
                          Total: ${calculateTotal().toFixed(2)}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Add New Item */}
                  <div className="grid grid-cols-12 gap-2">
                    <div className="col-span-5">
                      <Input
                        placeholder="Descripción"
                        value={currentItem.description}
                        onChange={(e) => setCurrentItem({ ...currentItem, description: e.target.value })}
                        className="bg-background border-border text-foreground"
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        placeholder="Cant."
                        value={currentItem.quantity}
                        onChange={(e) => setCurrentItem({ ...currentItem, quantity: parseInt(e.target.value) || 1 })}
                        className="bg-background border-border text-foreground"
                      />
                    </div>
                    <div className="col-span-3">
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Precio"
                        value={currentItem.unitPrice}
                        onChange={(e) => setCurrentItem({ ...currentItem, unitPrice: parseFloat(e.target.value) || 0 })}
                        className="bg-background border-border text-foreground font-mono"
                      />
                    </div>
                    <div className="col-span-2">
                      <Button
                        type="button"
                        onClick={addItem}
                        className="w-full bg-accent text-accent-foreground hover:bg-accent/80"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-foreground">Notas</Label>
                  <Input
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="bg-background border-border text-foreground"
                    placeholder="Notas adicionales..."
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    className="border-border text-foreground hover:bg-accent"
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" className="bg-primary text-primary-foreground hover:opacity-90">
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
          <div className="space-y-4">
            {invoices.map((invoice) => {
              const statusInfo = getStatusBadge(invoice.status);
              return (
                <Card key={invoice.id} className="bg-card border-border hover:border-accent transition-colors">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-accent flex items-center justify-center">
                          <FileText className="w-6 h-6 text-accent-foreground" strokeWidth={1.5} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">
                            Factura #{invoice.invoiceNumber}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {getClientName(invoice.clientId)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Vencimiento</p>
                          <p className="font-medium text-foreground">
                            {format(parseISO(invoice.dueDate), 'dd MMM yyyy', { locale: es })}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Monto</p>
                          <p className="text-lg font-bold font-mono text-foreground">
                            ${invoice.amount.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                          </p>
                        </div>

                        <div>
                          <Badge className={statusInfo.className}>
                            {statusInfo.label}
                          </Badge>
                        </div>

                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => generatePDF(invoice.id!)}
                          className="border-border text-foreground hover:bg-accent"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
