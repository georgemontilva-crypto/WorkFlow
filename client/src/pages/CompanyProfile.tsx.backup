/**
 * Company Profile - Configuración del perfil empresarial para facturas
 */

import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { Building2, Upload, Save, Image as ImageIcon } from 'lucide-react';

export default function CompanyProfile() {
  const { data: profile, refetch } = trpc.companyProfile.get.useQuery();
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    company_name: '',
    email: '',
    phone: '',
    website: '',
    address: '',
    city: '',
    state: '',
    postal_code: '',
    country: '',
    tax_id: '',
    bank_name: '',
    bank_account: '',
    bank_routing: '',
    payment_instructions: '',
    invoice_footer: '',
  });

  // Update form when profile loads
  useState(() => {
    if (profile) {
      setFormData({
        company_name: profile.company_name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        website: profile.website || '',
        address: profile.address || '',
        city: profile.city || '',
        state: profile.state || '',
        postal_code: profile.postal_code || '',
        country: profile.country || '',
        tax_id: profile.tax_id || '',
        bank_name: profile.bank_name || '',
        bank_account: profile.bank_account || '',
        bank_routing: profile.bank_routing || '',
        payment_instructions: profile.payment_instructions || '',
        invoice_footer: profile.invoice_footer || '',
      });
      if (profile.logo_url) {
        setLogoPreview(profile.logo_url);
      }
    }
  });

  const upsertMutation = trpc.companyProfile.upsert.useMutation({
    onSuccess: () => {
      toast.success('Perfil empresarial actualizado');
      refetch();
    },
    onError: (error) => {
      toast.error('Error al guardar: ' + error.message);
    },
  });

  const uploadLogoMutation = trpc.companyProfile.uploadLogo.useMutation({
    onSuccess: () => {
      toast.success('Logo actualizado');
      refetch();
    },
    onError: () => {
      toast.error('Error al subir logo');
    },
  });

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('El logo debe ser menor a 2MB');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('El archivo debe ser una imagen');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setLogoPreview(base64);
      uploadLogoMutation.mutate({ logo: base64 });
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    upsertMutation.mutate({
      ...formData,
      logo_url: logoPreview || undefined,
    });
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Building2 className="w-8 h-8" />
            Perfil Empresarial
          </h1>
          <p className="text-muted-foreground mt-2">
            Configura la información de tu empresa para personalizar tus facturas
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Logo Section */}
          <Card>
            <CardHeader className="py-6">
              <CardTitle className="text-lg">Logo de la Empresa</CardTitle>
              <CardDescription>
                Sube el logo que aparecerá en tus facturas (máximo 2MB)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 py-6">
              <div className="flex items-center gap-6">
                <div className="w-32 h-32 border border-border rounded-lg flex items-center justify-center bg-card overflow-hidden">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo" className="w-full h-full object-contain" />
                  ) : (
                    <ImageIcon className="w-12 h-12 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <Label htmlFor="logo" className="cursor-pointer">
                    <div className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity">
                      <Upload className="w-4 h-4" />
                      Subir Logo
                    </div>
                    <Input
                      id="logo"
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="hidden"
                    />
                  </Label>
                  <p className="text-xs text-muted-foreground mt-2">
                    PNG, JPG o SVG (recomendado: 400x400px)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Basic Information */}
          <Card>
            <CardHeader className="py-6">
              <CardTitle className="text-lg">Información Básica</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 py-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company_name">Nombre de la Empresa *</Label>
                  <Input
                    id="company_name"
                    value={formData.company_name}
                    onChange={(e) => handleChange('company_name', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Sitio Web</Label>
                  <Input
                    id="website"
                    value={formData.website}
                    onChange={(e) => handleChange('website', e.target.value)}
                    placeholder="https://ejemplo.com"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Address */}
          <Card>
            <CardHeader className="py-6">
              <CardTitle className="text-lg">Dirección</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 py-6">
              <div className="space-y-2">
                <Label htmlFor="address">Dirección</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">Ciudad</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleChange('city', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">Estado/Provincia</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => handleChange('state', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postal_code">Código Postal</Label>
                  <Input
                    id="postal_code"
                    value={formData.postal_code}
                    onChange={(e) => handleChange('postal_code', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">País</Label>
                  <Input
                    id="country"
                    value={formData.country}
                    onChange={(e) => handleChange('country', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tax & Banking */}
          <Card>
            <CardHeader className="py-6">
              <CardTitle className="text-lg">Información Fiscal y Bancaria</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 py-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tax_id">RIF / NIT / Tax ID</Label>
                  <Input
                    id="tax_id"
                    value={formData.tax_id}
                    onChange={(e) => handleChange('tax_id', e.target.value)}
                    placeholder="J-12345678-9"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bank_name">Banco</Label>
                  <Input
                    id="bank_name"
                    value={formData.bank_name}
                    onChange={(e) => handleChange('bank_name', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bank_account">Número de Cuenta</Label>
                  <Input
                    id="bank_account"
                    value={formData.bank_account}
                    onChange={(e) => handleChange('bank_account', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bank_routing">Código de Ruta</Label>
                  <Input
                    id="bank_routing"
                    value={formData.bank_routing}
                    onChange={(e) => handleChange('bank_routing', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Custom Text */}
          <Card>
            <CardHeader className="py-6">
              <CardTitle className="text-lg">Personalización de Facturas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 py-6">
              <div className="space-y-2">
                <Label htmlFor="payment_instructions">Instrucciones de Pago</Label>
                <Textarea
                  id="payment_instructions"
                  value={formData.payment_instructions}
                  onChange={(e) => handleChange('payment_instructions', e.target.value)}
                  placeholder="Ej: Transferencias bancarias a la cuenta indicada..."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invoice_footer">Pie de Página de Facturas</Label>
                <Textarea
                  id="invoice_footer"
                  value={formData.invoice_footer}
                  onChange={(e) => handleChange('invoice_footer', e.target.value)}
                  placeholder="Ej: Gracias por su preferencia. Para consultas: contacto@empresa.com"
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button
              type="submit"
              size="lg"
              disabled={upsertMutation.isLoading}
              className="gap-2"
            >
              <Save className="w-4 h-4" />
              {upsertMutation.isLoading ? 'Guardando...' : 'Guardar Perfil'}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
