/**
 * Company Profile - Perfil Empresarial con Identidad y Perfil Financiero
 */

import { useState, useEffect, useMemo } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { Building2, Upload, Save, Image as ImageIcon, TrendingUp, CheckCircle2, AlertCircle, DollarSign, Briefcase } from 'lucide-react';

export default function CompanyProfile() {
  const { data: profile, refetch } = trpc.companyProfile.get.useQuery();
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  
  // Identity Block
  const [identityData, setIdentityData] = useState({
    company_name: '',
    logo_url: '',
    business_type: '' as 'freelancer' | 'empresa' | 'agencia' | '',
    country: '',
    email: '',
    phone: '',
    website: '',
    address: '',
    city: '',
    state: '',
    postal_code: '',
    tax_id: '',
  });

  // Financial Profile Block
  const [financialData, setFinancialData] = useState({
    base_currency: 'USD',
    monthly_income_goal: '',
    goal_currency: 'USD',
  });

  // Banking & Invoice Block
  const [bankingData, setBankingData] = useState({
    bank_name: '',
    bank_account: '',
    bank_routing: '',
    payment_instructions: '',
    invoice_footer: '',
  });

  // Update form when profile loads
  useEffect(() => {
    if (profile) {
      setIdentityData({
        company_name: profile.company_name || '',
        logo_url: profile.logo_url || '',
        business_type: (profile.business_type as 'freelancer' | 'empresa' | 'agencia') || '',
        country: profile.country || '',
        email: profile.email || '',
        phone: profile.phone || '',
        website: profile.website || '',
        address: profile.address || '',
        city: profile.city || '',
        state: profile.state || '',
        postal_code: profile.postal_code || '',
        tax_id: profile.tax_id || '',
      });
      setFinancialData({
        base_currency: profile.base_currency || 'USD',
        monthly_income_goal: profile.monthly_income_goal?.toString() || '',
        goal_currency: profile.goal_currency || profile.base_currency || 'USD',
      });
      setBankingData({
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
  }, [profile]);

  // Calculate profile completion
  const profileCompletion = useMemo(() => {
    const identityFields = [
      identityData.company_name,
      identityData.business_type,
      identityData.country,
      identityData.email,
    ];
    const financialFields = [
      financialData.base_currency,
      financialData.monthly_income_goal,
      financialData.goal_currency,
    ];
    
    const identityComplete = identityFields.filter(Boolean).length;
    const financialComplete = financialFields.filter(Boolean).length;
    
    return {
      identity: {
        complete: identityComplete,
        total: identityFields.length,
        percentage: Math.round((identityComplete / identityFields.length) * 100),
      },
      financial: {
        complete: financialComplete,
        total: financialFields.length,
        percentage: Math.round((financialComplete / financialFields.length) * 100),
      },
      overall: {
        complete: identityComplete + financialComplete,
        total: identityFields.length + financialFields.length,
        percentage: Math.round(((identityComplete + financialComplete) / (identityFields.length + financialFields.length)) * 100),
      },
    };
  }, [identityData, financialData]);

  const upsertMutation = trpc.companyProfile.upsert.useMutation({
    onSuccess: () => {
      toast.success('Perfil actualizado exitosamente');
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

    if (file.size > 2 * 1024 * 1024) {
      toast.error('El logo debe ser menor a 2MB');
      return;
    }

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

  const handleSave = () => {
    const dataToSave = {
      ...identityData,
      ...financialData,
      ...bankingData,
      monthly_income_goal: financialData.monthly_income_goal ? parseFloat(financialData.monthly_income_goal) : undefined,
    };
    upsertMutation.mutate(dataToSave);
  };

  const currencies = [
    { code: 'USD', name: 'Dólar (USD)', symbol: '$' },
    { code: 'EUR', name: 'Euro (EUR)', symbol: '€' },
    { code: 'GBP', name: 'Libra (GBP)', symbol: '£' },
    { code: 'VES', name: 'Bolívar (VES)', symbol: 'Bs' },
    { code: 'COP', name: 'Peso Colombiano (COP)', symbol: '$' },
    { code: 'MXN', name: 'Peso Mexicano (MXN)', symbol: '$' },
    { code: 'ARS', name: 'Peso Argentino (ARS)', symbol: '$' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Perfil Empresarial</h1>
            <p className="text-muted-foreground mt-1">
              Configura tu identidad y perfil financiero para personalizar tu experiencia
            </p>
          </div>
          <Button onClick={handleSave} disabled={upsertMutation.isPending}>
            <Save className="w-4 h-4 mr-2" />
            {upsertMutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </div>

        {/* Progress Indicator */}
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                {profileCompletion.overall.percentage === 100 ? (
                  <CheckCircle2 className="w-6 h-6 text-green-500" />
                ) : (
                  <AlertCircle className="w-6 h-6 text-yellow-500" />
                )}
                <div>
                  <h3 className="font-semibold text-lg">
                    Progreso del Perfil: {profileCompletion.overall.percentage}%
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {profileCompletion.overall.complete} de {profileCompletion.overall.total} campos completados
                  </p>
                </div>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-500"
                style={{ width: `${profileCompletion.overall.percentage}%` }}
              />
            </div>

            {/* Sub-progress */}
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Identidad: {profileCompletion.identity.complete}/{profileCompletion.identity.total}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Financiero: {profileCompletion.financial.complete}/{profileCompletion.financial.total}
                </span>
              </div>
            </div>

            {profileCompletion.overall.percentage < 100 && (
              <p className="text-sm text-muted-foreground mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <AlertCircle className="w-4 h-4 inline mr-2" />
                Completa tu perfil para recibir alertas personalizadas sobre tus objetivos financieros
              </p>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Block 1: Identity */}
          <Card className="border-border">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                <CardTitle>Identidad</CardTitle>
              </div>
              <CardDescription>
                Información básica de tu negocio o actividad profesional
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Logo Upload */}
              <div className="space-y-2">
                <Label>Logo o Foto</Label>
                <div className="flex items-center gap-4">
                  <div className="w-24 h-24 border-2 border-dashed border-border rounded-lg flex items-center justify-center bg-muted overflow-hidden">
                    {logoPreview ? (
                      <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <input
                      type="file"
                      id="logo-upload"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('logo-upload')?.click()}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Subir Logo
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">
                      Máximo 2MB. Aparecerá en tus facturas.
                    </p>
                  </div>
                </div>
              </div>

              {/* Company Name */}
              <div className="space-y-2">
                <Label htmlFor="company_name">Nombre Comercial *</Label>
                <Input
                  id="company_name"
                  value={identityData.company_name}
                  onChange={(e) => setIdentityData({ ...identityData, company_name: e.target.value })}
                  placeholder="Tu nombre o nombre de tu empresa"
                />
                <p className="text-xs text-muted-foreground">
                  Aparecerá en facturas y comunicaciones oficiales
                </p>
              </div>

              {/* Business Type */}
              <div className="space-y-2">
                <Label htmlFor="business_type">Tipo de Actividad *</Label>
                <Select 
                  value={identityData.business_type} 
                  onValueChange={(value) => setIdentityData({ ...identityData, business_type: value as 'freelancer' | 'empresa' | 'agencia' })}
                >
                  <SelectTrigger className="bg-background border-border">
                    <SelectValue placeholder="Selecciona tu tipo de actividad" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    <SelectItem value="freelancer">
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4" />
                        <span>Freelancer</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="empresa">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        <span>Empresa</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="agencia">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        <span>Agencia</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Personaliza alertas y métricas según tu tipo de negocio
                </p>
              </div>

              {/* Country */}
              <div className="space-y-2">
                <Label htmlFor="country">País *</Label>
                <Input
                  id="country"
                  value={identityData.country}
                  onChange={(e) => setIdentityData({ ...identityData, country: e.target.value })}
                  placeholder="Ej: Venezuela, Colombia, México"
                />
                <p className="text-xs text-muted-foreground">
                  Determina formato de fechas y moneda por defecto
                </p>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email de Contacto *</Label>
                <Input
                  id="email"
                  type="email"
                  value={identityData.email}
                  onChange={(e) => setIdentityData({ ...identityData, email: e.target.value })}
                  placeholder="contacto@tuempresa.com"
                />
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  value={identityData.phone}
                  onChange={(e) => setIdentityData({ ...identityData, phone: e.target.value })}
                  placeholder="+58 412 1234567"
                />
              </div>

              {/* Website */}
              <div className="space-y-2">
                <Label htmlFor="website">Sitio Web</Label>
                <Input
                  id="website"
                  value={identityData.website}
                  onChange={(e) => setIdentityData({ ...identityData, website: e.target.value })}
                  placeholder="https://tuempresa.com"
                />
              </div>

              {/* Address */}
              <div className="space-y-2">
                <Label htmlFor="address">Dirección</Label>
                <Textarea
                  id="address"
                  value={identityData.address}
                  onChange={(e) => setIdentityData({ ...identityData, address: e.target.value })}
                  placeholder="Calle, número, urbanización..."
                  rows={2}
                />
              </div>

              {/* City, State, Postal Code */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="city">Ciudad</Label>
                  <Input
                    id="city"
                    value={identityData.city}
                    onChange={(e) => setIdentityData({ ...identityData, city: e.target.value })}
                    placeholder="Caracas"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">Estado/Provincia</Label>
                  <Input
                    id="state"
                    value={identityData.state}
                    onChange={(e) => setIdentityData({ ...identityData, state: e.target.value })}
                    placeholder="Miranda"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="postal_code">Código Postal</Label>
                <Input
                  id="postal_code"
                  value={identityData.postal_code}
                  onChange={(e) => setIdentityData({ ...identityData, postal_code: e.target.value })}
                  placeholder="1060"
                />
              </div>

              {/* Tax ID */}
              <div className="space-y-2">
                <Label htmlFor="tax_id">RIF / NIT / Tax ID</Label>
                <Input
                  id="tax_id"
                  value={identityData.tax_id}
                  onChange={(e) => setIdentityData({ ...identityData, tax_id: e.target.value })}
                  placeholder="J-123456789"
                />
                <p className="text-xs text-muted-foreground">
                  Identificación fiscal para facturas
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Block 2: Financial Profile */}
          <div className="space-y-6">
            <Card className="border-border">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  <CardTitle>Perfil Financiero</CardTitle>
                </div>
                <CardDescription>
                  Define tus objetivos para recibir alertas personalizadas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Base Currency */}
                <div className="space-y-2">
                  <Label htmlFor="base_currency">Moneda Base *</Label>
                  <Select 
                    value={financialData.base_currency} 
                    onValueChange={(value) => setFinancialData({ ...financialData, base_currency: value, goal_currency: value })}
                  >
                    <SelectTrigger className="bg-background border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      {currencies.map((currency) => (
                        <SelectItem key={currency.code} value={currency.code}>
                          {currency.symbol} {currency.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Moneda principal para reportes y métricas
                  </p>
                </div>

                {/* Monthly Income Goal */}
                <div className="space-y-2">
                  <Label htmlFor="monthly_income_goal">Objetivo Mensual de Ingresos</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="monthly_income_goal"
                      type="number"
                      value={financialData.monthly_income_goal}
                      onChange={(e) => setFinancialData({ ...financialData, monthly_income_goal: e.target.value })}
                      placeholder="5000"
                      className="pl-10"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Recibirás alertas al alcanzar 50%, 75% y 100% de tu objetivo
                  </p>
                </div>

                {/* Goal Currency */}
                <div className="space-y-2">
                  <Label htmlFor="goal_currency">Moneda del Objetivo</Label>
                  <Select 
                    value={financialData.goal_currency} 
                    onValueChange={(value) => setFinancialData({ ...financialData, goal_currency: value })}
                  >
                    <SelectTrigger className="bg-background border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      {currencies.map((currency) => (
                        <SelectItem key={currency.code} value={currency.code}>
                          {currency.symbol} {currency.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Por defecto usa tu moneda base
                  </p>
                </div>

                {/* Info Card */}
                <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg space-y-2">
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-blue-500" />
                    Alertas Automáticas
                  </h4>
                  <ul className="text-xs text-muted-foreground space-y-1 ml-6 list-disc">
                    <li>Progreso hacia tu objetivo (50%, 75%, 100%)</li>
                    <li>Mes finalizado sin alcanzar objetivo</li>
                    <li>Objetivo superado (¡felicitaciones!)</li>
                    <li>Personalización según tipo de actividad</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Block 3: Banking & Invoice Settings */}
            <Card className="border-border">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-primary" />
                  <CardTitle>Datos Bancarios y Facturación</CardTitle>
                </div>
                <CardDescription>
                  Información para pagos e instrucciones en facturas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Bank Name */}
                <div className="space-y-2">
                  <Label htmlFor="bank_name">Banco</Label>
                  <Input
                    id="bank_name"
                    value={bankingData.bank_name}
                    onChange={(e) => setBankingData({ ...bankingData, bank_name: e.target.value })}
                    placeholder="Banco de Venezuela"
                  />
                </div>

                {/* Bank Account */}
                <div className="space-y-2">
                  <Label htmlFor="bank_account">Número de Cuenta</Label>
                  <Input
                    id="bank_account"
                    value={bankingData.bank_account}
                    onChange={(e) => setBankingData({ ...bankingData, bank_account: e.target.value })}
                    placeholder="0102-1234-56-7890123456"
                  />
                </div>

                {/* Bank Routing */}
                <div className="space-y-2">
                  <Label htmlFor="bank_routing">Código de Ruta / SWIFT</Label>
                  <Input
                    id="bank_routing"
                    value={bankingData.bank_routing}
                    onChange={(e) => setBankingData({ ...bankingData, bank_routing: e.target.value })}
                    placeholder="BOFAVE2VXXX"
                  />
                </div>

                {/* Payment Instructions */}
                <div className="space-y-2">
                  <Label htmlFor="payment_instructions">Instrucciones de Pago</Label>
                  <Textarea
                    id="payment_instructions"
                    value={bankingData.payment_instructions}
                    onChange={(e) => setBankingData({ ...bankingData, payment_instructions: e.target.value })}
                    placeholder="Transferencia bancaria, Zelle, PayPal..."
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">
                    Aparecerá en tus facturas para facilitar el pago
                  </p>
                </div>

                {/* Invoice Footer */}
                <div className="space-y-2">
                  <Label htmlFor="invoice_footer">Nota al Pie de Factura</Label>
                  <Textarea
                    id="invoice_footer"
                    value={bankingData.invoice_footer}
                    onChange={(e) => setBankingData({ ...bankingData, invoice_footer: e.target.value })}
                    placeholder="Gracias por tu preferencia. Términos y condiciones..."
                    rows={2}
                  />
                  <p className="text-xs text-muted-foreground">
                    Texto personalizado al final de cada factura
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Save Button (Bottom) */}
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={upsertMutation.isPending} size="lg">
            <Save className="w-4 h-4 mr-2" />
            {upsertMutation.isPending ? 'Guardando...' : 'Guardar Todos los Cambios'}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
