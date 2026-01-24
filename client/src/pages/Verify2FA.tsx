/**
 * 2FA Verification Page - Finwrk
 * Design Philosophy: Apple Minimalism - Clean, elegant, and professional
 */

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Loader2, Shield } from 'lucide-react';

export default function Verify2FA() {
  const [, setLocation] = useLocation();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [tempToken, setTempToken] = useState('');

  useEffect(() => {
    // Get temp token from session storage
    const token = sessionStorage.getItem('2fa_temp_token');
    if (!token) {
      // No temp token, redirect to login
      setLocation('/login');
      return;
    }
    setTempToken(token);
  }, [setLocation]);

  const verify2FAMutation = trpc.auth.verify2FALogin.useMutation({
    onSuccess: () => {
      // Clear temp token
      sessionStorage.removeItem('2fa_temp_token');
      // Redirect to dashboard after successful verification
      setLocation('/dashboard');
    },
    onError: (error) => {
      setError(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (code.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }

    verify2FAMutation.mutate({
      tempToken,
      code,
    });
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setCode(value);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center">
            <img src="/finwrk-logo.png" alt="Finwrk" className="h-10 w-auto" />
          </div>
          <Button
            variant="ghost"
            onClick={() => {
              sessionStorage.removeItem('2fa_temp_token');
              setLocation('/login');
            }}
            className="text-muted-foreground hover:text-foreground text-sm"
            size="sm"
          >
            Back to Login
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 pt-24 pb-12" style={{ paddingTop: 'calc(6rem + env(safe-area-inset-top))' }}>
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Two-Factor Authentication
            </h1>
            <p className="text-muted-foreground">
              Enter the 6-digit code from your authenticator app
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg p-8 shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-destructive/10 border border-destructive/30 text-destructive rounded-lg p-3 text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="code" className="text-foreground">
                  Authentication Code
                </Label>
                <Input
                  id="code"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={code}
                  onChange={handleCodeChange}
                  placeholder="000000"
                  required
                  className="bg-background border-border text-foreground text-center text-2xl tracking-widest font-mono"
                  disabled={verify2FAMutation.isPending}
                  autoFocus
                  maxLength={6}
                />
                <p className="text-xs text-muted-foreground text-center">
                  Open your authenticator app to get the code
                </p>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={verify2FAMutation.isPending || code.length !== 6}
              >
                {verify2FAMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify & Sign In'
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-xs text-muted-foreground">
                Lost access to your authenticator app?{' '}
                <a href="/support" className="text-primary hover:underline">
                  Contact Support
                </a>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
