/**
 * Email Verification Page - Finwrk
 * Shown when user clicks verification link from email
 */

import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

export default function VerifyEmail() {
  const [, setLocation] = useLocation();
  const [token, setToken] = useState<string | null>(null);
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [errorMessage, setErrorMessage] = useState('');

  const verifyMutation = trpc.auth.verifyEmail.useMutation({
    onSuccess: () => {
      setStatus('success');
      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        setLocation('/dashboard');
      }, 2000);
    },
    onError: (error) => {
      setStatus('error');
      setErrorMessage(error.message);
    },
  });

  useEffect(() => {
    // Get token from URL
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get('token');
    
    if (tokenParam) {
      setToken(tokenParam);
      // Verify token
      verifyMutation.mutate({ token: tokenParam });
    } else {
      setStatus('error');
      setErrorMessage('No verification token provided');
    }
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center">
            <img src="/finwrk-logo.png" alt="Finwrk" className="h-10 w-auto" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 pt-24 pb-12" style={{ paddingTop: 'calc(6rem + env(safe-area-inset-top))' }}>
        <div className="w-full max-w-md">
          <div className="bg-card border border-border rounded-2xl p-8 shadow-sm text-center">
            {status === 'verifying' && (
              <>
                <div className="inline-flex items-center justify-center w-16 h-16 mb-6 bg-primary/10 rounded-full">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
                <h1 className="text-2xl font-bold text-foreground mb-3">
                  Verifying your email...
                </h1>
                <p className="text-muted-foreground">
                  Please wait while we verify your email address.
                </p>
              </>
            )}

            {status === 'success' && (
              <>
                <div className="inline-flex items-center justify-center w-16 h-16 mb-6 bg-green-500/10 rounded-full">
                  <CheckCircle2 className="w-8 h-8 text-green-500" />
                </div>
                <h1 className="text-2xl font-bold text-foreground mb-3">
                  Email verified!
                </h1>
                <p className="text-muted-foreground mb-6">
                  Your email has been successfully verified. You're being redirected to your dashboard...
                </p>
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Redirecting...</span>
                </div>
              </>
            )}

            {status === 'error' && (
              <>
                <div className="inline-flex items-center justify-center w-16 h-16 mb-6 bg-red-500/10 rounded-full">
                  <XCircle className="w-8 h-8 text-red-500" />
                </div>
                <h1 className="text-2xl font-bold text-foreground mb-3">
                  Verification failed
                </h1>
                <p className="text-muted-foreground mb-6">
                  {errorMessage || 'The verification link is invalid or has expired.'}
                </p>
                <div className="space-y-3">
                  <Button
                    onClick={() => setLocation('/signup')}
                    className="w-full bg-primary text-primary-foreground hover:opacity-90"
                  >
                    Go to Sign Up
                  </Button>
                  <Button
                    onClick={() => setLocation('/login')}
                    variant="outline"
                    className="w-full"
                  >
                    Go to Login
                  </Button>
                </div>
              </>
            )}
          </div>

          {/* Footer text */}
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Need help? Contact us at{' '}
            <a href="mailto:support@finwrk.app" className="text-primary hover:underline">
              support@finwrk.app
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}
