/**
 * Invoices Page - Gestión de Facturas
 * Design Philosophy: Apple Minimalism
 */

import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { FileText, Download, Plus } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import jsPDF from 'jspdf';

export default function Invoices() {
  const invoices = useLiveQuery(() => db.invoices.orderBy('createdAt').reverse().toArray());
  const clients = useLiveQuery(() => db.clients.toArray());

  const getClientName = (clientId: number) => {
    const client = clients?.find(c => c.id === clientId);
    return client?.name || 'Cliente Desconocido';
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
          <Button 
            className="bg-primary text-primary-foreground hover:opacity-90"
            onClick={() => toast.info('Función de crear factura próximamente')}
          >
            <Plus className="w-4 h-4 mr-2" />
            Nueva Factura
          </Button>
        </div>

        {/* Invoices List */}
        {!invoices || invoices.length === 0 ? (
          <Card className="bg-card border-border">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <img 
                src="/images/empty-state-invoices.png" 
                alt="No hay facturas" 
                className="w-64 h-64 object-contain opacity-50 mb-6"
              />
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
