/**
 * Forgot Password Page
 * Allows users to request a password reset link
 * Includes 2FA verification for users with 2FA enabled
 */

import { useState } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Mail, Loader2, Shield } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

type Step = 'email' | '2fa' | 'success';

export default function ForgotPassword() {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [tempToken, setTempToken] = useState('');
  const [code, setCode] = useState('');
  const [attempts, setAttempts] = useState(0);
  
  const requestReset = trpc.auth.requestPasswordReset.useMutation();
  const verify2FA = trpc.auth.verifyPasswordReset2FA.useMutation();

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Por favor ingresa tu correo electrónico');
      return;
    }

    try {
      const result = await requestReset.mutateAsync({ email });
      
      if (result.requires2FA && result.tempToken) {
        // User has 2FA enabled - show 2FA verification step
        setTempToken(result.tempToken);
        setStep('2fa');
        toast.info('Se requiere verificación adicional');
      } else {
        // User does not have 2FA - show success
        setStep('success');
        toast.success('Si tu correo existe, recibirás un enlace de recuperación');
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al enviar el correo de recuperación');
    }
  };

  const handle2FASubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!code || code.length !== 6) {
      toast.error('Por favor ingresa un código de 6 dígitos');
      return;
    }

    try {
      const result = await verify2FA.mutateAsync({ tempToken, code });
      
      if (result.success) {
        setStep('success');
        toast.success('Verificación exitosa. Revisa tu correo.');
      } else {
        setAttempts(prev => prev + 1);
        toast.error(result.message || 'Código inválido');
        
        if (attempts >= 2) {
          // Max attempts reached
          setStep('email');
          setEmail('');
          setCode('');
          setTempToken('');
          setAttempts(0);
          toast.error('Demasiados intentos fallidos. Por favor intenta nuevamente.');
        }
      }
    } catch (error: any) {
      setAttempts(prev => prev + 1);
      toast.error(error.message || 'Error en la verificación');
      
      if (attempts >= 2) {
        setStep('email');
        setEmail('');
        setCode('');
        setTempToken('');
        setAttempts(0);
      }
    }
  };

  const resetForm = () => {
    setStep('email');
    setEmail('');
    setCode('');
    setTempToken('');
    setAttempts(0);
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      {/* Header */}
      <header 
        className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="container mx-auto px-4 h-16 flex items-center">
          <Link href="/">
            <img 
              src="/finwrk-logo.png" 
              alt="Finwrk" 
              className="h-8"
            />
          </Link>
        </div>
      </header>

      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">
            {step === 'email' && 'Recuperar Contraseña'}
            {step === '2fa' && 'Verificación de Seguridad'}
            {step === 'success' && 'Correo Enviado'}
          </CardTitle>
          <CardDescription>
            {step === 'email' && 'Ingresa tu correo para recibir un enlace de recuperación'}
            {step === '2fa' && 'Ingresa el código de tu aplicación de autenticación'}
            {step === 'success' && 'Revisa tu correo para continuar'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 'email' && (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Correo Electrónico
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@correo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={requestReset.isPending}
                  required
                />
              </div>

              <Button
                type="submit"
                variant="outline"
                className="w-full"
                disabled={requestReset.isPending}
              >
                {requestReset.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  'Enviar Enlace de Recuperación'
                )}
              </Button>

              <Link href="/login">
                <Button variant="ghost" className="w-full">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Volver al Login
                </Button>
              </Link>
            </form>
          )}

          {step === '2fa' && (
            <form onSubmit={handle2FASubmit} className="space-y-4">
              <div className="flex items-center justify-center w-16 h-16 mx-auto bg-orange-100 rounded-full">
                <Shield className="w-8 h-8 text-orange-600" />
              </div>
              
              <p className="text-center text-sm text-muted-foreground">
                Tu cuenta tiene seguridad adicional habilitada. Por favor ingresa el código de 6 dígitos de tu aplicación de autenticación.
              </p>

              <div className="space-y-2">
                <label htmlFor="code" className="text-sm font-medium">
                  Código de Autenticación
                </label>
                <Input
                  id="code"
                  type="text"
                  placeholder="000000"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  disabled={verify2FA.isPending}
                  maxLength={6}
                  className="text-center text-2xl tracking-widest font-mono"
                  required
                />
                <p className="text-xs text-muted-foreground text-center">
                  Intentos restantes: {3 - attempts}
                </p>
              </div>

              <Button
                type="submit"
                variant="outline"
                className="w-full"
                disabled={verify2FA.isPending || code.length !== 6}
              >
                {verify2FA.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  'Verificar Código'
                )}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={resetForm}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
            </form>
          )}

          {step === 'success' && (
            <div className="space-y-4">
              <div className="flex items-center justify-center w-16 h-16 mx-auto bg-green-100 rounded-full">
                <Mail className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-center text-muted-foreground">
                Si existe una cuenta con <strong>{email}</strong>, recibirás un enlace de recuperación en breve.
              </p>
              <p className="text-center text-sm text-muted-foreground">
                ¿No recibiste el correo? Revisa tu carpeta de spam o intenta nuevamente.
              </p>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={resetForm}
                >
                  Intentar con Otro Correo
                </Button>
                <Link href="/login">
                  <Button variant="ghost" className="w-full">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Volver al Login
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
