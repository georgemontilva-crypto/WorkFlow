/**
 * Public Invoice Payment Page - Finwrk
 * Design Philosophy: Apple Minimalism - Clean, Professional, Responsive
 */

import { useState } from 'react';
import { useSearch } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, CheckCircle2, ExternalLink, Upload, AlertCircle, FileText } from 'lucide-react';
import { toast } from 'sonner';

interface InvoiceData {
  id: number;
  invoice_number: string;
  issue_date: Date;
  due_date: Date;
  total: string;
  paid_amount: string;
  balance: string;
  status: string;
  currency: string;
  payment_link?: string;
  clientName?: string;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
}

export default function PayInvoice() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const token = params.get('token');

  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofComment, setProofComment] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const { data: invoice, isLoading, error, refetch } = trpc.invoices.getByPaymentToken.useQuery(
    { token: token || '' },
    { enabled: !!token }
  );

  const uploadProofMutation = trpc.invoices.uploadPaymentProof.useMutation({
    onSuccess: () => {
      setUploadSuccess(true);
      setIsUploading(false);
      toast.success('Comprobante enviado exitosamente');
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
      setIsUploading(false);
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('El archivo no debe superar 5MB');
        return;
      }
      setProofFile(file);
    }
  };

  const handleUploadProof = async () => {
    if (!proofFile || !token) return;

    setIsUploading(true);

    // Convert file to base64
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      
      await uploadProofMutation.mutateAsync({
        token,
        proof: base64,
        comment: proofComment,
      });
    };
    reader.readAsDataURL(proofFile);
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-border">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">Link Inválido</h2>
            <p className="text-muted-foreground">
              El link de pago no es válido o ha expirado.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-foreground" />
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-border">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">Factura No Encontrada</h2>
            <p className="text-muted-foreground">
              No se pudo encontrar la factura solicitada.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isPaid = invoice.status === 'paid';
  const isPaymentSent = invoice.status === 'payment_sent';
  const balance = parseFloat(invoice.balance);

  const getStatusBadge = () => {
    switch (invoice.status) {
      case 'paid':
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Pagada</Badge>;
      case 'payment_sent':
        return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">Pago Enviado</Badge>;
      case 'overdue':
        return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">Vencida</Badge>;
      case 'sent':
        return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Pendiente</Badge>;
      default:
        return <Badge variant="secondary">Borrador</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-6 max-w-4xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-foreground flex items-center justify-center">
                <FileText className="w-5 h-5 text-background" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-foreground">Finwrk</h1>
                <p className="text-sm text-muted-foreground">Factura de Pago</p>
              </div>
            </div>
            {getStatusBadge()}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="grid md:grid-cols-5 gap-6">
          {/* Invoice Details - 3 columns */}
          <div className="md:col-span-3 space-y-6">
            <Card className="border-border">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl">#{invoice.invoice_number}</CardTitle>
                    <CardDescription className="mt-1">
                      {invoice.clientName && `Para: ${invoice.clientName}`}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Dates */}
                <div className="grid grid-cols-2 gap-4 pb-4 border-b border-border">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Fecha de emisión</p>
                    <p className="font-medium text-foreground">
                      {new Date(invoice.issue_date).toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Fecha de vencimiento</p>
                    <p className="font-medium text-foreground">
                      {new Date(invoice.due_date).toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>

                {/* Items */}
                <div>
                  <h3 className="font-semibold text-foreground mb-3">Conceptos</h3>
                  <div className="space-y-2">
                    {invoice.items.map((item, index) => (
                      <div key={index} className="flex justify-between items-start py-2 border-b border-border last:border-0">
                        <div className="flex-1">
                          <p className="font-medium text-foreground">{item.description}</p>
                          <p className="text-sm text-muted-foreground">
                            {item.quantity} × ${item.unitPrice.toFixed(2)}
                          </p>
                        </div>
                        <p className="font-semibold text-foreground">${item.total.toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Total */}
                <div className="pt-4 border-t border-border space-y-2">
                  <div className="flex justify-between text-lg">
                    <span className="font-semibold text-foreground">Total</span>
                    <span className="font-bold text-foreground">
                      ${parseFloat(invoice.total).toFixed(2)} {invoice.currency}
                    </span>
                  </div>
                  
                  {parseFloat(invoice.paid_amount) > 0 && (
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Pagado</span>
                      <span>-${parseFloat(invoice.paid_amount).toFixed(2)}</span>
                    </div>
                  )}
                  
                  {balance > 0 && (
                    <div className="flex justify-between text-xl pt-2 border-t border-border">
                      <span className="font-bold text-foreground">Balance</span>
                      <span className="font-bold text-foreground">
                        ${balance.toFixed(2)} {invoice.currency}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment Section - 2 columns */}
          <div className="md:col-span-2 space-y-6">
            {isPaid ? (
              <Card className="border-border bg-green-500/5">
                <CardContent className="pt-6 text-center">
                  <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-foreground mb-2">Factura Pagada</h3>
                  <p className="text-muted-foreground">
                    Esta factura ya ha sido pagada en su totalidad.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Payment Button */}
                {invoice.payment_link && !isPaymentSent && (
                  <Card className="border-border">
                    <CardHeader>
                      <CardTitle>Realizar Pago</CardTitle>
                      <CardDescription>
                        Haz clic para proceder con el pago
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button
                        className="w-full"
                        size="lg"
                        onClick={() => window.open(invoice.payment_link, '_blank')}
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Pagar Ahora
                      </Button>
                      <p className="text-xs text-muted-foreground text-center mt-3">
                        El pago se realiza fuera de Finwrk
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Upload Proof */}
                {!isPaid && (
                  <Card className="border-border">
                    <CardHeader>
                      <CardTitle>Comprobante de Pago</CardTitle>
                      <CardDescription>
                        {isPaymentSent
                          ? 'Comprobante enviado. Esperando confirmación.'
                          : 'Sube tu comprobante después de pagar'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {uploadSuccess || isPaymentSent ? (
                        <div className="text-center py-4">
                          <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
                          <p className="font-medium text-foreground mb-1">¡Comprobante Enviado!</p>
                          <p className="text-sm text-muted-foreground">
                            Recibirás una confirmación cuando se verifique el pago.
                          </p>
                        </div>
                      ) : (
                        <>
                          <div>
                            <Label htmlFor="proof-file" className="text-foreground">
                              Archivo (máx. 5MB)
                            </Label>
                            <Input
                              id="proof-file"
                              type="file"
                              accept="image/*,.pdf"
                              onChange={handleFileChange}
                              className="mt-1.5 border-border"
                            />
                          </div>

                          <div>
                            <Label htmlFor="proof-comment" className="text-foreground">
                              Comentario (opcional)
                            </Label>
                            <Textarea
                              id="proof-comment"
                              value={proofComment}
                              onChange={(e) => setProofComment(e.target.value)}
                              placeholder="Referencia de pago, número de transacción, etc."
                              className="mt-1.5 border-border resize-none"
                              rows={3}
                            />
                          </div>

                          <Button
                            className="w-full"
                            onClick={handleUploadProof}
                            disabled={!proofFile || isUploading}
                          >
                            {isUploading ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Enviando...
                              </>
                            ) : (
                              <>
                                <Upload className="w-4 h-4 mr-2" />
                                Enviar Comprobante
                              </>
                            )}
                          </Button>
                        </>
                      )}
                    </CardContent>
                  </Card>
                )}
              </>
            )}

            {/* Disclaimer */}
            <Card className="border-border bg-muted/30">
              <CardContent className="pt-6">
                <p className="text-xs text-muted-foreground text-center leading-relaxed">
                  <strong className="text-foreground">Aviso:</strong> Finwrk no procesa ni custodia pagos. 
                  La confirmación del pago es responsabilidad del emisor de la factura.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-border mt-12">
        <div className="container mx-auto px-4 py-6 max-w-4xl">
          <p className="text-center text-sm text-muted-foreground">
            Procesado de forma segura por <span className="font-semibold text-foreground">Finwrk</span>
          </p>
          <p className="text-center text-xs text-muted-foreground mt-2">
            © {new Date().getFullYear()} Finwrk. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </div>
  );
}
