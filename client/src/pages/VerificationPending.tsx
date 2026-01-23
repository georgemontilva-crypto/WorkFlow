/**
 * Verification Pending Page - Finwrk
 * Shown after signup while waiting for email verification
 */

import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Mail, RefreshCw, CheckCircle2, ArrowLeft } from 'lucide-react';

export default function VerificationPending() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState('');
  const [resendSuccess, setResendSuccess] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    // Get email from URL params
    const params = new URLSearchParams(window.location.search);
    const emailParam = params.get('email');
    if (emailParam) {
      setEmail(emailParam);
    } else {
      // No email provided, redirect to signup
      setLocation('/signup');
    }
  }, [setLocation]);

  // Countdown timer for resend button
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const resendMutation = trpc.auth.resendVerification.useMutation({
    onSuccess: () => {
      setResendSuccess(true);
      setCountdown(60); // 60 second cooldown
      setTimeout(() => setResendSuccess(false), 5000);
    },
    onError: (error) => {
      console.error('Failed to resend verification email:', error);
    },
  });

  const handleResend = () => {
    if (email && countdown === 0) {
      resendMutation.mutate({ email });
    }
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
            onClick={() => setLocation('/login')}
            className="text-muted-foreground hover:text-foreground"
            size="sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Login
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 pt-24 pb-12" style={{ paddingTop: 'calc(6rem + env(safe-area-inset-top))' }}>
        <div className="w-full max-w-md">
          <div className="bg-card border border-border rounded-2xl p-8 shadow-sm text-center">
            {/* Icon */}
            <div className="inline-flex items-center justify-center w-20 h-20 mb-6 bg-primary/10 rounded-2xl border border-primary/20">
              <Mail className="w-10 h-10 text-primary" />
            </div>

            {/* Title */}
            <h1 className="text-2xl font-bold text-foreground mb-3">
              Check your email
            </h1>

            {/* Description */}
            <p className="text-muted-foreground mb-2">
              We've sent a verification link to:
            </p>
            <p className="text-foreground font-medium mb-6 break-all">
              {email}
            </p>

            <p className="text-sm text-muted-foreground mb-8">
              Click the link in the email to verify your account and get started with Finwrk. The link will expire in 24 hours.
            </p>

            {/* Success message */}
            {resendSuccess && (
              <div className="flex items-center justify-center gap-2 mb-6 p-3 bg-green-500/10 border border-green-500/20 rounded-xl">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-500">Verification email sent!</span>
              </div>
            )}

            {/* Resend button */}
            <div className="space-y-4">
              <Button
                onClick={handleResend}
                variant="outline"
                className="w-full border-border"
                disabled={resendMutation.isPending || countdown > 0}
              >
                {resendMutation.isPending ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : countdown > 0 ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Resend in {countdown}s
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Resend verification email
                  </>
                )}
              </Button>

              <Button
                onClick={() => setLocation('/signup')}
                variant="ghost"
                className="w-full text-muted-foreground"
              >
                Use a different email
              </Button>
            </div>

            {/* Help text */}
            <div className="mt-8 pt-6 border-t border-border">
              <p className="text-xs text-muted-foreground">
                Didn't receive the email? Check your spam folder or click resend above.
              </p>
            </div>
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
