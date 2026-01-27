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
import { Loader2, CheckCircle2, ExternalLink, Upload, AlertCircle, FileText, CreditCard, Download, Send, CheckCheck } from 'lucide-react';

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
      refetch();
    },
    onError: (error) => {
      setIsUploading(false);
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        return;
      }
      setProofFile(file);
    }
  };

  const handleUploadProof = async () => {
    if (!proofFile || !token) return;

    setIsUploading(true);

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
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* Header with Logo */}
      <div className="border-b border-[rgba(255,255,255,0.06)] bg-[#0A0A0A]">
        <div className="container mx-auto px-4 py-6 max-w-6xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-[12px] bg-[#C4FF3D] flex items-center justify-center">
                <FileText className="w-6 h-6 text-black" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">FinWrk</h1>
                <p className="text-sm text-[#8B92A8]">Portal de Pagos</p>
              </div>
            </div>
            {getStatusBadge()}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Disclaimer - Prominente al inicio */}
        <div className="mb-8 p-4 bg-[#C4FF3D]/10 border border-[#C4FF3D]/30 rounded-[20px]">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-[#C4FF3D] flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-white font-medium mb-1">
                Importante: FinWrk no procesa pagos directamente
              </p>
              <p className="text-xs text-[#8B92A8] leading-relaxed">
                Somos una plataforma de gestión financiera. Los pagos se realizan a través de tus propios métodos de pago (transferencia bancaria, plataformas de pago, etc.). Solo te ayudamos a organizar y gestionar el proceso de cobro.
              </p>
            </div>
          </div>
        </div>

        {isPaid ? (
          /* Factura Pagada */
          <div className="max-w-2xl mx-auto">
            <Card className="border-[rgba(255,255,255,0.06)] bg-green-500/5">
              <CardContent className="pt-8 pb-8 text-center">
                <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-white mb-2">¡Factura Pagada!</h3>
                <p className="text-[#8B92A8]">
                  Esta factura ya ha sido pagada en su totalidad.
                </p>
              </CardContent>
            </Card>
          </div>
        ) : (
          <>
            {/* Payment Steps - PRIORIDAD MÁXIMA */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-6 text-center">
                ¿Cómo pagar esta factura?
              </h2>
              
              {/* Desktop: Grid */}
              <div className="hidden md:grid md:grid-cols-4 gap-4">
                {/* Step 1 */}
                <div className="bg-[#121212] border border-[rgba(255,255,255,0.06)] rounded-[20px] p-6 relative">
                  <div className="absolute -top-3 left-6">
                    <div className="w-8 h-8 rounded-full bg-[#C4FF3D] flex items-center justify-center">
                      <span className="text-black font-bold text-sm">1</span>
                    </div>
                  </div>
                  <div className="mt-4">
                    <CreditCard className="w-8 h-8 text-[#C4FF3D] mb-3" />
                    <h3 className="text-white font-semibold mb-2">Realiza el pago</h3>
                    <p className="text-sm text-[#8B92A8]">
                      Sigue las instrucciones de pago proporcionadas abajo
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="bg-[#121212] border border-[rgba(255,255,255,0.06)] rounded-[20px] p-6 relative">
                  <div className="absolute -top-3 left-6">
                    <div className="w-8 h-8 rounded-full bg-[#C4FF3D] flex items-center justify-center">
                      <span className="text-black font-bold text-sm">2</span>
                    </div>
                  </div>
                  <div className="mt-4">
                    <Download className="w-8 h-8 text-[#C4FF3D] mb-3" />
                    <h3 className="text-white font-semibold mb-2">Descarga tu comprobante</h3>
                    <p className="text-sm text-[#8B92A8]">
                      Del banco o plataforma de pago que usaste
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="bg-[#121212] border border-[rgba(255,255,255,0.06)] rounded-[20px] p-6 relative">
                  <div className="absolute -top-3 left-6">
                    <div className="w-8 h-8 rounded-full bg-[#C4FF3D] flex items-center justify-center">
                      <span className="text-black font-bold text-sm">3</span>
                    </div>
                  </div>
                  <div className="mt-4">
                    <Upload className="w-8 h-8 text-[#C4FF3D] mb-3" />
                    <h3 className="text-white font-semibold mb-2">Súbelo aquí</h3>
                    <p className="text-sm text-[#8B92A8]">
                      Usa el formulario de abajo para enviar tu comprobante
                    </p>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="bg-[#121212] border border-[rgba(255,255,255,0.06)] rounded-[20px] p-6 relative">
                  <div className="absolute -top-3 left-6">
                    <div className="w-8 h-8 rounded-full bg-[#C4FF3D] flex items-center justify-center">
                      <span className="text-black font-bold text-sm">4</span>
                    </div>
                  </div>
                  <div className="mt-4">
                    <CheckCheck className="w-8 h-8 text-[#C4FF3D] mb-3" />
                    <h3 className="text-white font-semibold mb-2">El emisor confirmará</h3>
                    <p className="text-sm text-[#8B92A8]">
                      Recibirás confirmación cuando se verifique
                    </p>
                  </div>
                </div>
              </div>

              {/* Mobile: Horizontal Scroll */}
              <div className="md:hidden overflow-x-auto pb-4 -mx-4 px-4">
                <div className="flex gap-4 min-w-max">
                  {/* Step 1 */}
                  <div className="bg-[#121212] border border-[rgba(255,255,255,0.06)] rounded-[20px] p-6 relative w-[280px] flex-shrink-0">
                    <div className="absolute -top-3 left-6">
                      <div className="w-8 h-8 rounded-full bg-[#C4FF3D] flex items-center justify-center">
                        <span className="text-black font-bold text-sm">1</span>
                      </div>
                    </div>
                    <div className="mt-4">
                      <CreditCard className="w-8 h-8 text-[#C4FF3D] mb-3" />
                      <h3 className="text-white font-semibold mb-2">Realiza el pago</h3>
                      <p className="text-sm text-[#8B92A8]">
                        Sigue las instrucciones de pago proporcionadas abajo
                      </p>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="bg-[#121212] border border-[rgba(255,255,255,0.06)] rounded-[20px] p-6 relative w-[280px] flex-shrink-0">
                    <div className="absolute -top-3 left-6">
                      <div className="w-8 h-8 rounded-full bg-[#C4FF3D] flex items-center justify-center">
                        <span className="text-black font-bold text-sm">2</span>
                      </div>
                    </div>
                    <div className="mt-4">
                      <Download className="w-8 h-8 text-[#C4FF3D] mb-3" />
                      <h3 className="text-white font-semibold mb-2">Descarga tu comprobante</h3>
                      <p className="text-sm text-[#8B92A8]">
                        Del banco o plataforma de pago que usaste
                      </p>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="bg-[#121212] border border-[rgba(255,255,255,0.06)] rounded-[20px] p-6 relative w-[280px] flex-shrink-0">
                    <div className="absolute -top-3 left-6">
                      <div className="w-8 h-8 rounded-full bg-[#C4FF3D] flex items-center justify-center">
                        <span className="text-black font-bold text-sm">3</span>
                      </div>
                    </div>
                    <div className="mt-4">
                      <Upload className="w-8 h-8 text-[#C4FF3D] mb-3" />
                      <h3 className="text-white font-semibold mb-2">Súbelo aquí</h3>
                      <p className="text-sm text-[#8B92A8]">
                        Usa el formulario de abajo para enviar tu comprobante
                      </p>
                    </div>
                  </div>

                  {/* Step 4 */}
                  <div className="bg-[#121212] border border-[rgba(255,255,255,0.06)] rounded-[20px] p-6 relative w-[280px] flex-shrink-0">
                    <div className="absolute -top-3 left-6">
                      <div className="w-8 h-8 rounded-full bg-[#C4FF3D] flex items-center justify-center">
                        <span className="text-black font-bold text-sm">4</span>
                      </div>
                    </div>
                    <div className="mt-4">
                      <CheckCheck className="w-8 h-8 text-[#C4FF3D] mb-3" />
                      <h3 className="text-white font-semibold mb-2">El emisor confirmará</h3>
                      <p className="text-sm text-[#8B92A8]">
                        Recibirás confirmación cuando se verifique
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Invoice Details & Payment Section */}
            <div className="grid lg:grid-cols-5 gap-6">
              {/* Invoice Details - 3 columns */}
              <div className="lg:col-span-3 space-y-6">
                <Card className="border-[rgba(255,255,255,0.06)] bg-[#121212]">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-2xl text-white">Factura #{invoice.invoice_number}</CardTitle>
                        <CardDescription className="mt-1 text-[#8B92A8]">
                          {invoice.clientName && `Para: ${invoice.clientName}`}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-4 pb-4 border-b border-[rgba(255,255,255,0.06)]">
                      <div>
                        <p className="text-sm text-[#8B92A8] mb-1">Fecha de emisión</p>
                        <p className="font-medium text-white">
                          {new Date(invoice.issue_date).toLocaleDateString('es-ES', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-[#8B92A8] mb-1">Fecha de vencimiento</p>
                        <p className="font-medium text-white">
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
                      <h3 className="font-semibold text-white mb-3">Detalles de la Factura</h3>
                      <div className="space-y-2">
                        {invoice.items.map((item, index) => (
                          <div key={index} className="flex justify-between items-start py-2 border-b border-[rgba(255,255,255,0.06)] last:border-0">
                            <div className="flex-1">
                              <p className="font-medium text-white">{item.description}</p>
                              <p className="text-sm text-[#8B92A8]">
                                {item.quantity} × ${item.unitPrice.toFixed(2)}
                              </p>
                            </div>
                            <p className="font-semibold text-white">${item.total.toFixed(2)}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Total */}
                    <div className="pt-4 border-t border-[rgba(255,255,255,0.06)] space-y-2">
                      <div className="flex justify-between text-lg">
                        <span className="font-semibold text-white">Total</span>
                        <span className="font-bold text-white">
                          ${parseFloat(invoice.total).toFixed(2)} {invoice.currency}
                        </span>
                      </div>
                      
                      {parseFloat(invoice.paid_amount) > 0 && (
                        <div className="flex justify-between text-sm text-[#8B92A8]">
                          <span>Pagado</span>
                          <span>-${parseFloat(invoice.paid_amount).toFixed(2)}</span>
                        </div>
                      )}
                      
                      {balance > 0 && (
                        <div className="flex justify-between text-xl pt-2 border-t border-[rgba(255,255,255,0.06)]">
                          <span className="font-bold text-white">Balance</span>
                          <span className="font-bold text-[#C4FF3D]">
                            ${balance.toFixed(2)} {invoice.currency}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Payment Section - 2 columns */}
              <div className="lg:col-span-2 space-y-6">
                {/* Payment Instructions */}
                {invoice.payment_link && !isPaymentSent && (
                  <Card className="border-[rgba(255,255,255,0.06)] bg-[#121212]">
                    <CardHeader>
                      <CardTitle className="text-white">Instrucciones de Pago</CardTitle>
                      <CardDescription className="text-[#8B92A8]">
                        Haz clic para ver cómo pagar
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button
                        className="w-full bg-[#C4FF3D] text-black hover:bg-[#C4FF3D]/90 font-semibold"
                        size="lg"
                        onClick={() => window.open(invoice.payment_link, '_blank')}
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Ver Instrucciones de Pago
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* Upload Proof */}
                {!isPaid && (
                  <Card className="border-[rgba(255,255,255,0.06)] bg-[#121212]">
                    <CardHeader>
                      <CardTitle className="text-white">
                        {isPaymentSent ? '✓ Comprobante Enviado' : 'Subir Comprobante de Pago'}
                      </CardTitle>
                      <CardDescription className="text-[#8B92A8]">
                        {isPaymentSent
                          ? 'Esperando confirmación del emisor'
                          : 'Después de realizar el pago, sube tu comprobante aquí'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {uploadSuccess || isPaymentSent ? (
                        <div className="text-center py-6">
                          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-3" />
                          <p className="font-medium text-white mb-1">¡Comprobante enviado exitosamente!</p>
                          <p className="text-sm text-[#8B92A8]">
                            El emisor revisará tu pago y actualizará el estado de la factura.
                          </p>
                        </div>
                      ) : (
                        <>
                          <div>
                            <Label htmlFor="proof-file" className="text-white mb-2 block">
                              Selecciona tu comprobante
                            </Label>
                            <div className="relative">
                              <Input
                                id="proof-file"
                                type="file"
                                accept="image/*,.pdf"
                                onChange={handleFileChange}
                                className="bg-[#0A0A0A] border-[rgba(255,255,255,0.06)] text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#C4FF3D] file:text-black hover:file:bg-[#C4FF3D]/90"
                              />
                            </div>
                            <p className="text-xs text-[#8B92A8] mt-2">
                              Formatos aceptados: JPG, PNG, PDF (máx. 5MB)
                            </p>
                          </div>

                          <div>
                            <Label htmlFor="proof-comment" className="text-white mb-2 block">
                              Comentario (opcional)
                            </Label>
                            <Textarea
                              id="proof-comment"
                              value={proofComment}
                              onChange={(e) => setProofComment(e.target.value)}
                              placeholder="Ej: Transferencia #123456, Pago realizado el 27/01/2026"
                              className="bg-[#0A0A0A] border-[rgba(255,255,255,0.06)] text-white placeholder:text-[#8B92A8] resize-none"
                              rows={3}
                            />
                          </div>

                          <Button
                            className="w-full bg-[#C4FF3D] text-black hover:bg-[#C4FF3D]/90 font-semibold"
                            size="lg"
                            onClick={handleUploadProof}
                            disabled={!proofFile || isUploading}
                          >
                            {isUploading ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Enviando comprobante...
                              </>
                            ) : (
                              <>
                                <Send className="w-4 h-4 mr-2" />
                                Enviar Comprobante
                              </>
                            )}
                          </Button>
                        </>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-[rgba(255,255,255,0.06)] mt-12">
        <div className="container mx-auto px-4 py-6 max-w-6xl">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-lg bg-[#C4FF3D] flex items-center justify-center">
              <FileText className="w-3 h-3 text-black" />
            </div>
            <span className="font-semibold text-white">FinWrk</span>
          </div>
          <p className="text-center text-sm text-[#8B92A8]">
            Plataforma de gestión financiera
          </p>
          <p className="text-center text-xs text-[#8B92A8] mt-2">
            © {new Date().getFullYear()} FinWrk. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </div>
  );
}
