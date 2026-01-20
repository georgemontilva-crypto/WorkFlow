/**
 * Verification Modal - Shown after signup
 */

import { Button } from '@/components/ui/button';
import { Mail, X } from 'lucide-react';

interface VerificationModalProps {
  email: string;
  onClose: () => void;
  onResend: () => void;
  isResending?: boolean;
}

export function VerificationModal({ email, onClose, onResend, isResending }: VerificationModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content */}
        <div className="p-8 text-center">
          {/* Icon */}
          <div className="inline-flex items-center justify-center w-16 h-16 mb-6 bg-primary/10 rounded-full">
            <Mail className="w-8 h-8 text-primary" />
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-foreground mb-3">
            Check your email
          </h2>

          {/* Description */}
          <p className="text-muted-foreground mb-2">
            We've sent a verification link to:
          </p>
          <p className="text-foreground font-medium mb-6">
            {email}
          </p>

          <p className="text-sm text-muted-foreground mb-8">
            Click the link in the email to verify your account and get started with Finwrk.
          </p>

          {/* Resend button */}
          <div className="space-y-3">
            <Button
              onClick={onResend}
              variant="outline"
              className="w-full"
              disabled={isResending}
            >
              {isResending ? 'Sending...' : 'Resend verification email'}
            </Button>

            <Button
              onClick={onClose}
              variant="ghost"
              className="w-full text-muted-foreground"
            >
              Close
            </Button>
          </div>

          {/* Help text */}
          <p className="mt-6 text-xs text-muted-foreground">
            Didn't receive the email? Check your spam folder or click resend.
          </p>
        </div>
      </div>
    </div>
  );
}
