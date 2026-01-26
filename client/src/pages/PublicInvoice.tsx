/**
 * PublicInvoice - Portal público para que clientes vean facturas y suban comprobantes
 * Diseño consistente con el sistema visual de Finwrk
 */

import { useState, useEffect } from 'react';
import { useRoute } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Upload, Download, CheckCircle, AlertCircle, FileText, Building2, DollarSign, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import Toast from '@/components/Toast';

export default function PublicInvoice() {
  const [, params] = useRoute('/invoice/:token');
  const token = params?.token;
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [paymentReference, setPaymentReference] = useState('');
  const [uploading, setUploading] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [showToast, setShowToast] = useState(false);
  
  // Check if payment proof already uploaded on load
  useEffect(() => {
    if (invoice?.status === 'payment_submitted') {
      setSubmitSuccess(true);
    }
  }, [invoice?.status]);

  const { data: invoice, isLoading, error, refetch } = trpc.invoices.getByToken.useQuery(
    { token: token! },
    { enabled: !!token }
  );

  const uploadProof = trpc.invoices.uploadPaymentProof.useMutation({
    onSuccess: () => {
      setSubmitSuccess(true);
      setShowToast(true);
      setSelectedFile(null);
      setPaymentReference('');
      setUploading(false);
      // Refetch invoice data to show updated status
      refetch();
    },
    onError: (error) => {
      console.error('Error al subir comprobante:', error);
      setUploading(false);
    },
  });

  const downloadPDF = trpc.invoices.generatePDFByToken.useMutation({
    onSuccess: (data) => {
      if (data?.pdf) {
        const link = document.createElement('a');
        link.href = `data:application/pdf;base64,${data.pdf}`;
        link.download = `factura-${invoice?.invoice_number}.pdf`;
        link.click();
      }
    },
    onError: () => {
      console.error('Error al descargar PDF');
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !token) return;

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        await uploadProof.mutateAsync({
          token: token!,
          proof: base64.split(',')[1], // Remove data:image/... prefix
          mime: selectedFile.type, // Send MIME type
          comment: paymentReference || selectedFile.name,
        });
      };
      reader.readAsDataURL(selectedFile);
    } catch (error) {
      console.error('Error al procesar archivo:', error);
      setUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center">
        <div className="text-white">Cargando factura...</div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center p-6">
        <div className="bg-[#121212] rounded-[28px] p-8 max-w-md w-full text-center" style={{ boxShadow: 'inset 0 0 0 0.5px rgba(255,255,255,0.06)' }}>
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Factura no encontrada</h1>
          <p className="text-[#8B92A8]">
            El enlace de esta factura no es válido o ha expirado.
          </p>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return { label: 'Pagada', color: 'text-[#C4FF3D] bg-[#C4FF3D]/10', outline: '#C4FF3D' };
      case 'sent':
        return { label: 'Enviada', color: 'text-blue-400 bg-blue-400/10', outline: '#60A5FA' };
      case 'payment_submitted':
        return { label: 'Pago en Revisión', color: 'text-yellow-400 bg-yellow-400/10', outline: '#FBBF24' };
      case 'partial':
        return { label: 'Pago Parcial', color: 'text-orange-400 bg-orange-400/10', outline: '#FB923C' };
      case 'cancelled':
        return { label: 'Cancelada', color: 'text-red-400 bg-red-400/10', outline: '#EF4444' };
      default:
        return { label: 'Borrador', color: 'text-[#8B92A8] bg-[#8B92A8]/10', outline: '#8B92A8' };
    }
  };

  const statusBadge = getStatusBadge(invoice.status);
  const items = typeof invoice.items === 'string' ? JSON.parse(invoice.items) : invoice.items;
  const total = parseFloat(invoice.total);
  const paidAmount = parseFloat(invoice.paid_amount || '0');
  const balance = total - paidAmount;

  // @ts-ignore - companyProfile viene del backend
  const profile = invoice.companyProfile;

  return (
    <div className="min-h-screen bg-[#0D0D0D] py-12 px-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            {profile?.logo_url ? (
              <img 
                src={profile.logo_url} 
                alt={profile.company_name} 
                className="h-12 w-12 object-contain rounded"
              />
            ) : (
              <div className="h-12 w-12 bg-[#C4FF3D]/10 rounded flex items-center justify-center" style={{ boxShadow: 'inset 0 0 0 0.5px #C4FF3D' }}>
                <Building2 className="w-6 h-6 text-[#C4FF3D]" />
              </div>
            )}
            <h1 className="text-3xl font-bold text-white">{profile?.company_name || 'Finwrk'}</h1>
          </div>
          <p className="text-[#8B92A8]">Factura #{invoice.invoice_number}</p>
        </div>

        {/* Success Message */}
        {submitSuccess && (
          <div className="bg-[#121212] rounded-[28px] p-6" style={{ boxShadow: 'inset 0 0 0 0.5px #C4FF3D' }}>
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-[#C4FF3D]" />
              <div>
                <h3 className="text-white font-semibold">¡Comprobante enviado exitosamente!</h3>
                <p className="text-[#8B92A8] text-sm">
                  El emisor revisará tu pago y actualizará el estado de la factura.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Invoice Summary Card */}
        <div className="bg-[#121212] rounded-[28px] p-8" style={{ boxShadow: 'inset 0 0 0 0.5px rgba(255,255,255,0.06)' }}>
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-xl font-bold text-white">Resumen de Factura</h2>
            <span 
              className={`inline-block px-4 py-1.5 rounded-[9999px] text-sm font-medium ${statusBadge.color}`}
              style={{ boxShadow: `inset 0 0 0 0.5px ${statusBadge.outline}` }}
            >
              {statusBadge.label}
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-[#8B92A8] text-sm mb-1">Emisor</p>
              <p className="text-white font-semibold">{profile?.company_name || 'N/A'}</p>
            </div>
            
            <div>
              <p className="text-[#8B92A8] text-sm mb-1">Cliente</p>
              <p className="text-white font-semibold">{invoice.client?.name || 'N/A'}</p>
            </div>
            
            <div>
              <p className="text-[#8B92A8] text-sm mb-1">Fecha de Emisión</p>
              <p className="text-white font-semibold">{format(new Date(invoice.issue_date), 'dd/MM/yyyy')}</p>
            </div>
            
            <div>
              <p className="text-[#8B92A8] text-sm mb-1">Fecha de Vencimiento</p>
              <p className="text-white font-semibold">{format(new Date(invoice.due_date), 'dd/MM/yyyy')}</p>
            </div>
            
            <div className="md:col-span-2">
              <p className="text-[#8B92A8] text-sm mb-1">Monto Total</p>
              <p className="text-white font-bold text-3xl">${total.toFixed(2)}</p>
              {balance > 0 && balance < total && (
                <p className="text-yellow-400 text-sm mt-1">Saldo pendiente: ${balance.toFixed(2)}</p>
              )}
            </div>
          </div>

          {/* Items */}
          <div className="mt-8">
            <h3 className="text-white font-semibold mb-4">Detalles de Factura</h3>
            <div className="space-y-3">
              {items.map((item: any, index: number) => (
                <div 
                  key={index} 
                  className="bg-[#0A0A0A] rounded-[20px] p-4"
                  style={{ boxShadow: 'inset 0 0 0 0.5px rgba(255,255,255,0.06)' }}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-white font-medium">{item.description}</p>
                      <p className="text-[#8B92A8] text-sm">
                        {item.quantity} x ${parseFloat(item.unitPrice || item.unit_price).toFixed(2)}
                      </p>
                    </div>
                    <p className="text-white font-semibold">
                      ${parseFloat(item.total).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 pt-4 border-t border-[rgba(255,255,255,0.06)]">
              <div className="flex justify-between text-[#8B92A8] mb-2">
                <span>Subtotal:</span>
                <span>${parseFloat(invoice.subtotal).toFixed(2)}</span>
              </div>
              {invoice.tax && parseFloat(invoice.tax) > 0 && (
                <div className="flex justify-between text-[#8B92A8] mb-2">
                  <span>Impuestos:</span>
                  <span>${parseFloat(invoice.tax).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-white font-bold text-xl">
                <span>TOTAL:</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Notes Section - OBLIGATORIA */}
          {invoice.notes && (
            <div className="mt-8 bg-[#0A0A0A] rounded-[20px] p-6" style={{ boxShadow: 'inset 0 0 0 0.5px rgba(255,255,255,0.06)' }}>
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Instrucciones de Pago
              </h3>
              <p className="text-[#8B92A8] whitespace-pre-wrap">{invoice.notes}</p>
            </div>
          )}

          {invoice.payment_link && (
            <div className="mt-6 bg-[#0A0A0A] rounded-[20px] p-4" style={{ boxShadow: 'inset 0 0 0 0.5px #C4FF3D' }}>
              <h3 className="text-white font-semibold mb-2 text-sm">Link de Pago</h3>
              <a
                href={invoice.payment_link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#C4FF3D] hover:underline break-all text-sm"
              >
                {invoice.payment_link}
              </a>
            </div>
          )}
        </div>

        {/* Tutorial Module */}
        <div className="bg-[#121212] rounded-[28px] p-8" style={{ boxShadow: 'inset 0 0 0 0.5px rgba(255,255,255,0.06)' }}>
          <h2 className="text-xl font-bold text-white mb-6">¿Cómo pagar esta factura?</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-[#C4FF3D]/10 flex items-center justify-center mx-auto mb-3" style={{ boxShadow: 'inset 0 0 0 0.5px #C4FF3D' }}>
                <span className="text-[#C4FF3D] font-bold text-lg">1</span>
              </div>
              <p className="text-white font-medium text-sm mb-1">Realiza el pago</p>
              <p className="text-[#8B92A8] text-xs">Según las instrucciones arriba</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-[#C4FF3D]/10 flex items-center justify-center mx-auto mb-3" style={{ boxShadow: 'inset 0 0 0 0.5px #C4FF3D' }}>
                <span className="text-[#C4FF3D] font-bold text-lg">2</span>
              </div>
              <p className="text-white font-medium text-sm mb-1">Descarga tu comprobante</p>
              <p className="text-[#8B92A8] text-xs">Del banco o plataforma de pago</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-[#C4FF3D]/10 flex items-center justify-center mx-auto mb-3" style={{ boxShadow: 'inset 0 0 0 0.5px #C4FF3D' }}>
                <span className="text-[#C4FF3D] font-bold text-lg">3</span>
              </div>
              <p className="text-white font-medium text-sm mb-1">Súbelo aquí</p>
              <p className="text-[#8B92A8] text-xs">Usa el formulario abajo</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-[#C4FF3D]/10 flex items-center justify-center mx-auto mb-3" style={{ boxShadow: 'inset 0 0 0 0.5px #C4FF3D' }}>
                <span className="text-[#C4FF3D] font-bold text-lg">4</span>
              </div>
              <p className="text-white font-medium text-sm mb-1">El emisor confirmará</p>
              <p className="text-[#8B92A8] text-xs">Recibirás confirmación</p>
            </div>
          </div>
        </div>

        {/* Payment Proof Upload Card */}
        {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
          <div className="bg-[#121212] rounded-[28px] p-8" style={{ boxShadow: 'inset 0 0 0 0.5px rgba(255,255,255,0.06)' }}>
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 bg-[#C4FF3D]/10 rounded-[20px] flex items-center justify-center flex-shrink-0" style={{ boxShadow: 'inset 0 0 0 0.5px #C4FF3D' }}>
                <Upload className="w-6 h-6 text-[#C4FF3D]" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white mb-2">Cargar Comprobante de Pago</h2>
                <p className="text-[#8B92A8] text-sm">
                  Sube una captura o foto de tu comprobante para que podamos verificar tu pago.
                </p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Archivo de Comprobante (imagen o PDF)
                </label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileSelect}
                  className="w-full bg-[#0A0A0A] text-white rounded-[9999px] px-6 py-3 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-[9999px] file:border-0 file:text-sm file:font-semibold file:bg-[#C4FF3D] file:text-black hover:file:opacity-90 file:cursor-pointer cursor-pointer"
                  style={{ boxShadow: 'inset 0 0 0 0.5px rgba(255,255,255,0.06)' }}
                />
                {selectedFile && (
                  <p className="text-[#C4FF3D] text-sm mt-2 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Referencia de Pago (opcional)
                </label>
                <input
                  type="text"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  placeholder="Ej: Transferencia #123456"
                  className="w-full bg-[#0A0A0A] text-white rounded-[9999px] px-6 py-3 text-sm placeholder:text-[#8B92A8]"
                  style={{ boxShadow: 'inset 0 0 0 0.5px rgba(255,255,255,0.06)' }}
                />
              </div>
              
              <Button
                onClick={handleUpload}
                disabled={!selectedFile || uploading || submitSuccess}
                className="w-full"
                variant={submitSuccess ? "secondary" : "default"}
              >
                {submitSuccess ? (
                  <span className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Comprobante Enviado
                  </span>
                ) : uploading ? 'Enviando...' : 'Enviar Comprobante'}
              </Button>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center">
          <Button 
            variant="secondary" 
            onClick={() => downloadPDF.mutate({ token: token! })}
            disabled={downloadPDF.isLoading}
          >
            <Download className="w-4 h-4 mr-2" />
            {downloadPDF.isLoading ? 'Descargando...' : 'Descargar Factura'}
          </Button>
        </div>

        {/* Footer */}
        <div className="text-center text-[#8B92A8] text-sm mt-8">
          <p>{profile?.invoice_footer || 'Gracias por tu preferencia'}</p>
          <p className="mt-2">Portal seguro de Finwrk</p>
        </div>
      </div>
      
      {/* Toast Notification */}
      {showToast && (
        <Toast
          message="¡Comprobante enviado exitosamente! El emisor revisará tu pago."
          type="success"
          duration={4000}
          onClose={() => setShowToast(false)}
        />
      )}
    </div>
  );
}
