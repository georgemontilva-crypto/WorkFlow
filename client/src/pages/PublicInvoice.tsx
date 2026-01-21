/**
 * PublicInvoice - Página pública para que clientes vean facturas y suban comprobantes
 */

import { useEffect, useState } from 'react';
import { useRoute } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Upload, Download, CheckCircle2, Clock, FileText, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

export default function PublicInvoice() {
  const [, params] = useRoute('/invoice/:token');
  const token = params?.token;
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const { data: invoice, isLoading, error } = trpc.invoices.getByToken.useQuery(
    { token: token! },
    { enabled: !!token }
  );

  const uploadProof = trpc.invoices.uploadPaymentProof.useMutation({
    onSuccess: () => {
      toast.success('Comprobante enviado exitosamente');
      setSelectedFile(null);
    },
    onError: (error) => {
      toast.error('Error al enviar comprobante: ' + error.message);
    },
  });

  const downloadPDF = trpc.invoices.generatePDF.useMutation({
    onSuccess: (data) => {
      if (data?.pdf) {
        const link = document.createElement('a');
        link.href = `data:application/pdf;base64,${data.pdf}`;
        link.download = `factura-${invoice?.invoice_number}.pdf`;
        link.click();
        toast.success('PDF descargado');
      }
    },
    onError: () => {
      toast.error('Error al descargar PDF');
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !invoice) return;

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        await uploadProof.mutateAsync({
          token: token!,
          proof: base64.split(',')[1], // Remove data:image/...;base64, prefix
          comment: selectedFile.name, // Send filename as comment
        });
        setUploading(false);
      };
      reader.readAsDataURL(selectedFile);
    } catch (error) {
      setUploading(false);
      toast.error('Error al procesar archivo');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando factura...</p>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Factura no encontrada</h1>
          <p className="text-muted-foreground">
            El link de esta factura no es válido o ha expirado.
          </p>
        </Card>
      </div>
    );
  }

  const statusConfig = {
    draft: { label: 'Borrador', color: 'bg-gray-500', icon: FileText },
    sent: { label: 'Enviada', color: 'bg-blue-500', icon: Clock },
    payment_sent: { label: 'Pago Enviado', color: 'bg-yellow-500', icon: Upload },
    paid: { label: 'Pagada', color: 'bg-green-500', icon: CheckCircle2 },
    overdue: { label: 'Vencida', color: 'bg-red-500', icon: Clock },
    cancelled: { label: 'Cancelada', color: 'bg-gray-500', icon: FileText },
  };

  const status = statusConfig[invoice.status as keyof typeof statusConfig];
  const StatusIcon = status.icon;

  const items = JSON.parse(invoice.items as string);
  const total = parseFloat(invoice.total);
  const paidAmount = parseFloat(invoice.paid_amount);
  const balance = total - paidAmount;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Finwrk</h1>
              <p className="text-sm text-muted-foreground">Sistema de Gestión Empresarial</p>
            </div>
            <div className={`px-4 py-2 rounded-full ${status.color} text-white flex items-center gap-2`}>
              <StatusIcon className="w-4 h-4" />
              {status.label}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Invoice Header */}
        <Card className="p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-2">FACTURA</h2>
              <p className="text-lg text-muted-foreground">#{invoice.invoice_number}</p>
            </div>
            <Button
              variant="outline"
              onClick={() => downloadPDF.mutate({ id: invoice.id })}
              disabled={downloadPDF.isLoading}
            >
              <Download className="w-4 h-4 mr-2" />
              Descargar PDF
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-foreground mb-2">Fecha de Emisión</h3>
              <p className="text-muted-foreground">
                {new Date(invoice.issue_date).toLocaleDateString('es-ES')}
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-2">Fecha de Vencimiento</h3>
              <p className="text-muted-foreground">
                {new Date(invoice.due_date).toLocaleDateString('es-ES')}
              </p>
            </div>
          </div>

          {invoice.payment_link && (
            <div className="mt-6 p-4 bg-primary/10 rounded-lg">
              <h3 className="font-semibold text-foreground mb-2">Link de Pago</h3>
              <a
                href={invoice.payment_link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline break-all"
              >
                {invoice.payment_link}
              </a>
            </div>
          )}
        </Card>

        {/* Items */}
        <Card className="p-6">
          <h3 className="font-semibold text-foreground mb-4">Detalles de la Factura</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 text-muted-foreground font-medium">Descripción</th>
                  <th className="text-right py-3 text-muted-foreground font-medium">Cantidad</th>
                  <th className="text-right py-3 text-muted-foreground font-medium">Precio</th>
                  <th className="text-right py-3 text-muted-foreground font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item: any, index: number) => (
                  <tr key={index} className="border-b border-border">
                    <td className="py-3 text-foreground">{item.description}</td>
                    <td className="text-right py-3 text-foreground">{item.quantity}</td>
                    <td className="text-right py-3 text-foreground">${item.unitPrice.toFixed(2)}</td>
                    <td className="text-right py-3 text-foreground">${item.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 space-y-2">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal:</span>
              <span>${parseFloat(invoice.subtotal).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Impuestos:</span>
              <span>${parseFloat(invoice.tax).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xl font-bold text-foreground pt-2 border-t border-border">
              <span>TOTAL:</span>
              <span>${total.toFixed(2)}</span>
            </div>
            {balance > 0 && (
              <div className="flex justify-between text-lg font-semibold text-destructive">
                <span>Saldo Pendiente:</span>
                <span>${balance.toFixed(2)}</span>
              </div>
            )}
          </div>
        </Card>

        {/* Upload Payment Proof */}
        {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
          <Card className="p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                <Upload className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">Subir Comprobante de Pago</h3>
                <p className="text-sm text-muted-foreground">
                  Sube una captura de pantalla o foto de tu comprobante de pago para que podamos verificar tu pago.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="block w-full text-sm text-muted-foreground
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-lg file:border-0
                    file:text-sm file:font-semibold
                    file:bg-primary file:text-primary-foreground
                    hover:file:opacity-90
                    file:cursor-pointer cursor-pointer"
                />
              </div>

              {selectedFile && (
                <div className="flex items-center justify-between p-4 bg-accent rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{selectedFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={handleUpload}
                    disabled={uploading}
                  >
                    {uploading ? 'Enviando...' : 'Enviar Comprobante'}
                  </Button>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Notes */}
        {invoice.notes && (
          <Card className="p-6">
            <h3 className="font-semibold text-foreground mb-2">Notas</h3>
            <p className="text-muted-foreground whitespace-pre-wrap">{invoice.notes}</p>
          </Card>
        )}
      </div>

      {/* Footer */}
      <div className="bg-card border-t border-border mt-12">
        <div className="max-w-4xl mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          <p>Gracias por tu preferencia</p>
          <p className="mt-2">© 2026 Finwrk - Sistema de Gestión Empresarial</p>
        </div>
      </div>
    </div>
  );
}
