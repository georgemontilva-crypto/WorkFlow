/**
 * Settings Page - Finwrk
 * User preferences and account management
 */

import { useState, useRef } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/lib/trpc';
// import { toast } from 'sonner';
import { Languages, Database, Download, Upload, Trash2, Shield, Key, AlertCircle, CheckCircle2, DollarSign } from 'lucide-react';
import CurrencySelector from '@/components/CurrencySelector';
import { getCurrency } from '@shared/currencies';

export default function Settings() {
  const { language, setLanguage, t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: user } = trpc.auth.me.useQuery();

  // Password Change State
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Currency State
  const [showCurrencyChange, setShowCurrencyChange] = useState(false);
  const [newCurrency, setNewCurrency] = useState(user?.primary_currency || 'USD');

  // 2FA State
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [show2FADisable, setShow2FADisable] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [disable2FAPassword, setDisable2FAPassword] = useState('');
  const [disable2FACode, setDisable2FACode] = useState('');

  // Mutations
  const updateCurrencyMutation = trpc.auth.updatePrimaryCurrency.useMutation();
  const generate2FAMutation = trpc.auth.generate2FA.useMutation();
  const verify2FAMutation = trpc.auth.verify2FA.useMutation();
  const disable2FAMutation = trpc.auth.disable2FA.useMutation();
  const changePasswordMutation = trpc.auth.changePassword.useMutation();

  // Data Management Functions
  const exportData = () => {
    const data = {
      exportDate: new Date().toISOString(),
      // Add export logic here
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finwrk-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    // toast.success('Data exported successfully');
  };

  const importData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target?.result as string);
          // Add import logic here
          // toast.success('Data imported successfully');
        } catch (error) {
          // toast.error('Invalid file format');
        }
      };
      reader.readAsText(file);
    }
  };

  const clearAllData = () => {
    if (window.confirm('Are you sure you want to delete all data? This action cannot be undone.')) {
      // Add clear logic here
      // toast.success('All data cleared');
    }
  };

  // Currency Change Function
  const handleChangeCurrency = async () => {
    if (!newCurrency || newCurrency === user?.primary_currency) {
      // toast.error('Please select a different currency');
      return;
    }

    try {
      await updateCurrencyMutation.mutateAsync({ currency: newCurrency });
      // toast.success('Currency updated successfully. Please refresh the page.');
      setShowCurrencyChange(false);
      // Refresh page to update all currency displays
      setTimeout(() => window.location.reload(), 1500);
    } catch (error: any) {
      // toast.error(error.message || 'Error updating currency');
    }
  };

  // 2FA Functions
  const handleGenerate2FA = async () => {
    try {
      const result = await generate2FAMutation.mutateAsync();
      setQrCodeUrl(result.qrCode);
      setShow2FASetup(true);
    } catch (error: any) {
      if (error.message === 'EMAIL_NOT_VERIFIED') {
        // toast.error('You must verify your email before enabling 2FA');
      } else {
        // toast.error('Error generating 2FA code');
      }
    }
  };

  const handleVerify2FA = async () => {
    if (twoFactorCode.length !== 6) {
      // toast.error('Please enter a 6-digit code');
      return;
    }

    try {
      await verify2FAMutation.mutateAsync({ token: twoFactorCode });
      // toast.success('2FA enabled successfully');
      setShow2FASetup(false);
      setQrCodeUrl('');
      setTwoFactorCode('');
    } catch (error) {
      // toast.error('Invalid 2FA code. Please try again.');
    }
  };

  const handleDisable2FA = async () => {
    if (!disable2FAPassword || !disable2FACode) {
      // toast.error('Please enter your password and 2FA code');
      return;
    }

    if (disable2FACode.length !== 6) {
      // toast.error('Please enter a 6-digit code');
      return;
    }

    try {
      await disable2FAMutation.mutateAsync({
        password: disable2FAPassword,
        code: disable2FACode,
      });
      // toast.success('2FA disabled successfully');
      setShow2FADisable(false);
      setDisable2FAPassword('');
      setDisable2FACode('');
    } catch (error: any) {
      if (error.message === 'Incorrect password') {
        // toast.error('Incorrect password');
      } else if (error.message === 'Invalid 2FA code') {
        // toast.error('Invalid 2FA code');
      } else {
        // toast.error('Error disabling 2FA');
      }
    }
  };

  // Password Change Functions
  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      // toast.error('Please complete all fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      // toast.error('Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      // toast.error('Password must be at least 8 characters');
      return;
    }

    try {
      await changePasswordMutation.mutateAsync({
        oldPassword,
        newPassword,
      });
      // toast.success('Password updated successfully. A confirmation email has been sent.');
      setShowPasswordChange(false);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      if (error.message === 'Current password is incorrect') {
        // toast.error('Current password is incorrect');
      } else {
        // toast.error('Error changing password');
      }
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-[1440px] mx-auto p-6 space-y-6">
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

          {/* Currency Settings */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-foreground text-base sm:text-lg">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" strokeWidth={1.5} />
                  Moneda Principal
                </div>
                {user?.primary_currency && (
                  <Badge className="bg-[#EBFF57]/10 hover:bg-[#EBFF57]/20 text-[#EBFF57] border border-[#EBFF57]/30">
                    {user.primary_currency}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Tu moneda principal se usa en todas las facturas y reportes financieros
              </p>
              
              {showCurrencyChange ? (
                <div className="space-y-4">
                  <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-foreground mb-1">
                          Advertencia Importante
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Cambiar la moneda NO recalcula los datos históricos. Las facturas y transacciones existentes mantendrán su moneda original.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-foreground">
                      Moneda Actual: {getCurrency(user?.primary_currency || 'USD')?.name}
                    </label>
                  </div>
                  
                  <CurrencySelector
                    selectedCurrency={newCurrency}
                    onSelect={setNewCurrency}
                    label="Nueva Moneda"
                    required
                  />
                  
                  <div className="flex gap-2">
                    <Button
                      onClick={handleChangeCurrency}
                      variant="outline"
                      className="flex-1 border-[#EBFF57] text-[#EBFF57] hover:bg-[#EBFF57] hover:text-black"
                      disabled={updateCurrencyMutation.isPending}
                    >
                      {updateCurrencyMutation.isPending ? 'Actualizando...' : 'Confirmar Cambio'}
                    </Button>
                    <Button
                      onClick={() => {
                        setShowCurrencyChange(false);
                        setNewCurrency(user?.primary_currency || 'USD');
                      }}
                      variant="outline"
                      className="border-border"
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-[#EBFF57]/10 border border-[#EBFF57]/30 rounded-lg">
                    <span className="text-sm font-medium text-foreground">
                      {getCurrency(user?.primary_currency || 'USD')?.name}
                    </span>
                    <span className="text-lg font-bold text-[#EBFF57]">
                      {getCurrency(user?.primary_currency || 'USD')?.symbol}
                    </span>
                  </div>
                  <Button
                    onClick={() => setShowCurrencyChange(true)}
                    variant="outline"
                    className="w-full border-border text-foreground hover:bg-accent"
                  >
                    <DollarSign className="w-4 h-4 mr-2" />
                    Cambiar Moneda
                  </Button>
                </div>
              )}
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
                  Two-Factor Authentication
                </div>
                {user?.two_factor_enabled && (
                  <Badge className="bg-green-500/10 hover:bg-green-500/20 text-green-500 border border-green-500/30">
                    Active
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Add an extra layer of security to your account
              </p>
              
              {user?.two_factor_enabled ? (
                <div className="space-y-3">
                  {!show2FADisable ? (
                    <>
                      <div className="flex items-center justify-between p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                        <span className="text-sm font-medium text-foreground">2FA Enabled</span>
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      </div>
                      <Button
                        onClick={() => setShow2FADisable(true)}
                        variant="outline"
                        size="sm"
                        className="w-full border-destructive text-destructive hover:bg-destructive/10"
                      >
                        Disable 2FA
                      </Button>
                    </>
                  ) : (
                    <div className="space-y-3">
                      <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                        <div className="flex items-start gap-2 mb-3">
                          <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-foreground mb-1">
                              Disable Two-Factor Authentication
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Enter your password and current 2FA code to disable
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="disable-password" className="text-foreground">Password</Label>
                        <Input
                          id="disable-password"
                          type="password"
                          value={disable2FAPassword}
                          onChange={(e) => setDisable2FAPassword(e.target.value)}
                          placeholder="Enter your password"
                          className="bg-background border-border text-foreground"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="disable-code" className="text-foreground">2FA Code</Label>
                        <Input
                          id="disable-code"
                          type="text"
                          placeholder="000000"
                          maxLength={6}
                          value={disable2FACode}
                          onChange={(e) => setDisable2FACode(e.target.value.replace(/\D/g, ''))}
                          className="bg-background border-border text-foreground text-center text-lg tracking-widest"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={handleDisable2FA}
                          variant="outline"
                          className="flex-1 border-destructive text-destructive hover:bg-destructive/10"
                          disabled={disable2FAMutation.isPending}
                        >
                          Confirm Disable
                        </Button>
                        <Button
                          onClick={() => {
                            setShow2FADisable(false);
                            setDisable2FAPassword('');
                            setDisable2FACode('');
                          }}
                          variant="outline"
                          className="border-border"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : show2FASetup ? (
                <div className="space-y-4">
                  {qrCodeUrl && (
                    <div className="flex justify-center p-6 bg-card border border-border rounded-lg">
                      <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48" />
                    </div>
                  )}
                  <div className="p-3 bg-muted/50 border border-border rounded-lg">
                    <p className="text-xs text-muted-foreground text-center">
                      Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="2fa-code" className="text-foreground">Verification Code</Label>
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
                      variant="outline"
                      className="flex-1 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                      disabled={verify2FAMutation.isPending}
                    >
                      Verify and Enable
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
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  onClick={handleGenerate2FA}
                  variant="outline"
                  className="w-full border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                  disabled={generate2FAMutation.isPending}
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Enable 2FA
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Password Change */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground text-base sm:text-lg">
                <Key className="w-5 h-5" strokeWidth={1.5} />
                Change Password
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Update your password regularly for better security
              </p>
              
              {showPasswordChange ? (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="old-password" className="text-foreground">Current Password</Label>
                    <Input
                      id="old-password"
                      type="password"
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      className="bg-background border-border text-foreground"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-password" className="text-foreground">New Password</Label>
                    <Input
                      id="new-password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="bg-background border-border text-foreground"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password" className="text-foreground">Confirm Password</Label>
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
                      variant="outline"
                      className="flex-1 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                      disabled={changePasswordMutation.isPending}
                    >
                      Update Password
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
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  onClick={() => setShowPasswordChange(true)}
                  variant="outline"
                  className="w-full border-border text-foreground hover:bg-accent"
                >
                  <Key className="w-4 h-4 mr-2" />
                  Change Password
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
