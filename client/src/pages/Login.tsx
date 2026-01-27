/**
 * Login Page - Finwrk
 * Design Philosophy: Apple Minimalism - Clean, elegant, and professional
 */

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Loader2, Mail, AlertCircle } from 'lucide-react';

export default function Login() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showVerificationMessage, setShowVerificationMessage] = useState(false);

  const resendMutation = trpc.auth.resendVerification.useMutation({
    onSuccess: () => {
      setLocation(`/verification-pending?email=${encodeURIComponent(email)}`);
    },
    onError: (error) => {
      setError(error.message);
    },
  });

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: (data) => {
      if (data.requires2FA) {
        // Store temp token and redirect to 2FA verification
        sessionStorage.setItem('2fa_temp_token', data.tempToken);
        setLocation('/verify-2fa');
      } else {
        // Redirect to dashboard after successful login
        setLocation('/');
      }
    },
    onError: (error) => {
      if (error.message === 'EMAIL_NOT_VERIFIED') {
        setShowVerificationMessage(true);
        setError('');
      } else {
        setError(error.message);
        setShowVerificationMessage(false);
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setShowVerificationMessage(false);
    
    loginMutation.mutate({
      email,
      password,
    });
  };

  const handleResendVerification = () => {
    resendMutation.mutate({ email });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center">
            <img src="/finwrk-logo.png" alt="Finwrk" className="h-10 w-auto" />
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="text-xs sm:text-sm text-muted-foreground hidden sm:inline">¿No tienes cuenta?</span>
            <Button
              variant="outline"
              onClick={() => setLocation('/signup')}
              className="border-border text-foreground hover:bg-accent text-sm"
              size="sm"
            >
              Registrarse
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 pt-24 pb-12" style={{ paddingTop: 'calc(6rem + env(safe-area-inset-top))' }}>
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Bienvenido de nuevo
            </h1>
            <p className="text-muted-foreground">
              Inicia sesión en tu cuenta de Finwrk
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg p-8 shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-destructive/10 border border-destructive/30 text-destructive rounded-lg p-3 text-sm flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {showVerificationMessage && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-amber-500/20 rounded-lg">
                      <Mail className="w-5 h-5 text-amber-500" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-foreground mb-1">
                        Correo no verificado
                      </h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        Por favor verifica tu dirección de correo electrónico antes de iniciar sesión. Revisa tu bandeja de entrada para el enlace de verificación.
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleResendVerification}
                        disabled={resendMutation.isPending}
                        className="border-amber-500/50 text-amber-500 hover:bg-amber-500/10"
                      >
                        {resendMutation.isPending ? (
                          <>
                            <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                            Enviando...
                          </>
                        ) : (
                          'Reenviar correo de verificación'
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground">
                  Correo Electrónico
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="juan@ejemplo.com"
                  required
                  className="bg-background border-border text-foreground"
                  disabled={loginMutation.isPending}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground">
                  Contraseña
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ingresa tu contraseña"
                  required
                  className="bg-background border-border text-foreground"
                  disabled={loginMutation.isPending}
                />
              </div>

              <Button
                type="submit"
                variant="outline"
                className="w-full border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Iniciando sesión...
                  </>
                ) : (
                  'Iniciar Sesión'
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <a
                href="/forgot-password"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                ¿Olvidaste tu contraseña?
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
