import { Building2, Mail, Phone, FileText, Calendar, Clock } from "lucide-react";

interface CompanyProfileSnapshot {
  company_name: string;
  logo_url?: string | null;
  business_type?: string | null;
  email: string;
  phone?: string | null;
  website?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  country?: string | null;
  tax_id?: string | null;
}

interface InvoiceHeaderPreviewProps {
  profile: CompanyProfileSnapshot | null;
  invoiceNumber?: string;
  issueDate?: Date;
  dueDate?: Date;
  status?: string;
}

const getBusinessTypeLabel = (businessType?: string | null): string => {
  if (!businessType) return '';
  
  const labels: Record<string, string> = {
    'freelancer': 'Freelancer',
    'empresa': 'Empresa',
    'agencia': 'Agencia'
  };
  
  return labels[businessType] || businessType;
};

const getStatusLabel = (status?: string): string => {
  if (!status) return 'Borrador';
  
  const labels: Record<string, string> = {
    'draft': 'Borrador',
    'sent': 'Enviada',
    'payment_sent': 'Pago Enviado',
    'paid': 'Pagada',
    'overdue': 'Vencida',
    'cancelled': 'Cancelada'
  };
  
  return labels[status] || status;
};

const getStatusColor = (status?: string): string => {
  if (!status) return 'text-gray-500';
  
  const colors: Record<string, string> = {
    'draft': 'text-gray-500',
    'sent': 'text-blue-600',
    'payment_sent': 'text-indigo-600',
    'paid': 'text-green-600',
    'overdue': 'text-red-600',
    'cancelled': 'text-gray-400'
  };
  
  return colors[status] || 'text-gray-500';
};

export function InvoiceHeaderPreview({ 
  profile, 
  invoiceNumber = 'INV-0001',
  issueDate = new Date(),
  dueDate = new Date(),
  status = 'draft'
}: InvoiceHeaderPreviewProps) {
  
  if (!profile) {
    return (
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-6">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Building2 className="h-4 w-4" />
          <span>Completa tu Perfil Empresarial para ver la vista previa del encabezado</span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      {/* Header Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Left Side - Company Information */}
        <div className="space-y-2">
          {/* Company Name */}
          <h3 className="text-lg font-bold text-gray-900">
            {profile.company_name}
          </h3>
          
          {/* Business Type */}
          {profile.business_type && (
            <p className="text-sm text-gray-600">
              {getBusinessTypeLabel(profile.business_type)}
            </p>
          )}
          
          {/* Country */}
          {profile.country && (
            <p className="text-sm text-gray-600">
              {profile.country}
            </p>
          )}
          
          {/* Contact Information */}
          <div className="space-y-1 pt-2">
            {profile.email && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Mail className="h-3.5 w-3.5 text-gray-400" />
                <span>{profile.email}</span>
              </div>
            )}
            
            {profile.phone && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Phone className="h-3.5 w-3.5 text-gray-400" />
                <span>{profile.phone}</span>
              </div>
            )}
            
            {profile.tax_id && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <FileText className="h-3.5 w-3.5 text-gray-400" />
                <span>RIF/NIT: {profile.tax_id}</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Right Side - Invoice Information */}
        <div className="space-y-3 md:text-right">
          {/* Invoice Title */}
          <h2 className="text-2xl font-bold text-gray-900">
            FACTURA
          </h2>
          
          {/* Invoice Details */}
          <div className="space-y-2">
            <div className="flex items-center justify-between md:justify-end gap-3">
              <span className="text-sm text-gray-500">Número:</span>
              <span className="text-sm font-semibold text-gray-900">{invoiceNumber}</span>
            </div>
            
            <div className="flex items-center justify-between md:justify-end gap-3">
              <span className="text-sm text-gray-500 flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                Fecha emisión:
              </span>
              <span className="text-sm text-gray-900">
                {issueDate.toLocaleDateString('es-ES')}
              </span>
            </div>
            
            <div className="flex items-center justify-between md:justify-end gap-3">
              <span className="text-sm text-gray-500 flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                Vencimiento:
              </span>
              <span className="text-sm text-gray-900">
                {dueDate.toLocaleDateString('es-ES')}
              </span>
            </div>
            
            <div className="flex items-center justify-between md:justify-end gap-3">
              <span className="text-sm text-gray-500">Estado:</span>
              <span className={`text-sm font-semibold ${getStatusColor(status)}`}>
                {getStatusLabel(status)}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Separator */}
      <div className="mt-6 border-t border-gray-200" />
    </div>
  );
}
