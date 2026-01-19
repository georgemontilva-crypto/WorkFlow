/**
 * Settings Page - Configuración
 * Design Philosophy: Apple Minimalism
 */

import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Settings as SettingsIcon, Database, Download, Trash2, Upload, Languages, Shield, Key } from 'lucide-react';

import { toast } from 'sonner';
import { useRef, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { trpc } from '@/lib/trpc';

export default function Settings() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { language, setLanguage, t } = useLanguage();
  
  // 2FA State
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  
  // Password Change State
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // tRPC Queries and Mutations
  const { data: user } = trpc.auth.me.useQuery();
  const generate2FAMutation = trpc.auth.generate2FA.useMutation();
  const verify2FAMutation = trpc.auth.verify2FA.useMutation();
  const disable2FAMutation = trpc.auth.disable2FA.useMutation();
  const changePasswordMutation = trpc.auth.changePassword.useMutation();

  // Fetch all data using tRPC
  const { data: clients } = trpc.clients.list.useQuery();
  const { data: invoices } = trpc.invoices.list.useQuery();
  const { data: transactions } = trpc.transactions.list.useQuery();
  const { data: savingsGoals } = trpc.savingsGoals.list.useQuery();

  const exportData = async () => {
    try {
      const data = {
        clients: clients || [],
        invoices: invoices || [],
        transactions: transactions || [],
        savingsGoals: savingsGoals || [],
        exportDate: new Date().toISOString(),
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `workflow-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);

      toast.success(t.settings.exportSuccess);
    } catch (error) {
      toast.error('Error exporting data');
    }
  };

  const importData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    toast.info('La funcionalidad de importación de datos se implementará próximamente.');
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const clearAllData = async () => {
    toast.info('Para eliminar todos los datos, contacta al administrador del sistema.');
  };

  // 2FA Functions
  const handleGenerate2FA = async () => {
    try {
      const result = await generate2FAMutation.mutateAsync();
      setQrCodeUrl(result.qrCode);
      setShow2FASetup(true);
      toast.success('Código QR generado. Escanea con tu app de autenticación.');
    } catch (error) {
      toast.error('Error al generar código 2FA');
    }
  };

  const handleVerify2FA = async () => {
    if (!twoFactorCode || twoFactorCode.length !== 6) {
      toast.error('Por favor ingresa un código de 6 dígitos');
      return;
    }

    try {
      await verify2FAMutation.mutateAsync({ token: twoFactorCode });
      toast.success('2FA activado correctamente');
      setShow2FASetup(false);
      setTwoFactorCode('');
      setQrCodeUrl('');
    } catch (error) {
      toast.error('Código inválido. Intenta nuevamente.');
    }
  };

  const handleDisable2FA = async () => {
    if (!window.confirm('¿Estás seguro de desactivar la autenticación de dos factores?')) {
      return;
    }

    try {
      await disable2FAMutation.mutateAsync();
      toast.success('2FA desactivado correctamente');
    } catch (error) {
      toast.error('Error al desactivar 2FA');
    }
  };

  // Password Change Functions
  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    if (newPassword.length < 8) {
      toast.error('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    try {
      await changePasswordMutation.mutateAsync({
        oldPassword,
        newPassword,
      });
      toast.success('Contraseña actualizada correctamente');
      setShowPasswordChange(false);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      toast.error('Error al cambiar contraseña. Verifica tu contraseña actual.');
    }
  };

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6 lg:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">{t.settings.title}</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            {t.settings.subtitle}
          </p>
        </div>

        {/* Settings Cards - Grid 2x2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
          {/* Language Settings */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground text-base sm:text-lg">
                <Languages className="w-5 h-5" strokeWidth={1.5} />
                {t.settings.language}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {t.settings.languageSubtitle}
              </p>
              <Select value={language} onValueChange={(value: 'es' | 'en') => setLanguage(value)}>
                <SelectTrigger className="w-full bg-background border-border text-foreground h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="es" className="text-foreground hover:bg-accent cursor-pointer">
                    {t.settings.spanish}
                  </SelectItem>
                  <SelectItem value="en" className="text-foreground hover:bg-accent cursor-pointer">
                    {t.settings.english}
                  </SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Data Management */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground text-base sm:text-lg">
                <Database className="w-5 h-5" strokeWidth={1.5} />
                {t.settings.dataManagement}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {t.settings.dataManagementSubtitle}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={exportData}
                  variant="outline"
                  size="sm"
                  className="border-border text-foreground hover:bg-accent"
                >
                  <Download className="w-4 h-4 mr-2" />
                  {t.settings.exportData}
                </Button>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  size="sm"
                  className="border-border text-foreground hover:bg-accent"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {t.settings.importData}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={importData}
                  className="hidden"
                />
                <Button
                  onClick={clearAllData}
                  variant="outline"
                  size="sm"
                  className="border-destructive text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete All
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Security Settings - 2FA */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-foreground text-base sm:text-lg">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5" strokeWidth={1.5} />
                  Autenticación de Dos Factores
                </div>
                {user?.two_factor_enabled && (
                  <Badge className="bg-green-500 hover:bg-green-600 text-white border-none">
                    Activo
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Agrega una capa adicional de seguridad a tu cuenta
              </p>
              
              {user?.two_factor_enabled ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                    <span className="text-sm font-medium text-foreground">2FA Activado</span>
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  </div>
                  <Button
                    onClick={handleDisable2FA}
                    variant="outline"
                    size="sm"
                    className="w-full border-destructive text-destructive hover:bg-destructive/10"
                  >
                    Desactivar 2FA
                  </Button>
                </div>
              ) : show2FASetup ? (
                <div className="space-y-4">
                  {qrCodeUrl && (
                    <div className="flex justify-center p-6 bg-card border border-border rounded-lg">
                      <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48" />
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="2fa-code" className="text-foreground">Código de Verificación</Label>
                    <Input
                      id="2fa-code"
                      type="text"
                      placeholder="000000"
                      maxLength={6}
                      value={twoFactorCode}
                      onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
                      className="bg-background border-border text-foreground text-center text-lg tracking-widest"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleVerify2FA}
                      className="flex-1 bg-primary text-primary-foreground"
                      disabled={verify2FAMutation.isPending}
                    >
                      Verificar y Activar
                    </Button>
                    <Button
                      onClick={() => {
                        setShow2FASetup(false);
                        setQrCodeUrl('');
                        setTwoFactorCode('');
                      }}
                      variant="outline"
                      className="border-border"
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  onClick={handleGenerate2FA}
                  className="w-full bg-primary text-primary-foreground"
                  disabled={generate2FAMutation.isPending}
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Activar 2FA
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Password Change */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground text-base sm:text-lg">
                <Key className="w-5 h-5" strokeWidth={1.5} />
                Cambiar Contraseña
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Actualiza tu contraseña periódicamente para mayor seguridad
              </p>
              
              {showPasswordChange ? (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="old-password" className="text-foreground">Contraseña Actual</Label>
                    <Input
                      id="old-password"
                      type="password"
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      className="bg-background border-border text-foreground"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-password" className="text-foreground">Nueva Contraseña</Label>
                    <Input
                      id="new-password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="bg-background border-border text-foreground"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password" className="text-foreground">Confirmar Contraseña</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="bg-background border-border text-foreground"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleChangePassword}
                      className="flex-1 bg-primary text-primary-foreground"
                      disabled={changePasswordMutation.isPending}
                    >
                      Actualizar Contraseña
                    </Button>
                    <Button
                      onClick={() => {
                        setShowPasswordChange(false);
                        setOldPassword('');
                        setNewPassword('');
                        setConfirmPassword('');
                      }}
                      variant="outline"
                      className="border-border"
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  onClick={() => setShowPasswordChange(true)}
                  className="w-full bg-primary text-primary-foreground"
                >
                  <Key className="w-4 h-4 mr-2" />
                  Cambiar Contraseña
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
