/**
 * Signup Page - Finwrk
 * Design Philosophy: Apple Minimalism - Clean, elegant, and professional
 */

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Loader2, User, Building2, Users } from 'lucide-react';

export default function Signup() {
  const [, setLocation] = useLocation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [businessType, setBusinessType] = useState<'freelancer' | 'agencia' | 'empresa' | ''>('');
  const [error, setError] = useState('');

  // Password strength calculator
  const getPasswordStrength = (pwd: string): { strength: number; label: string; color: string } => {
    if (pwd.length === 0) return { strength: 0, label: '', color: '' };
    
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (pwd.length >= 12) strength++;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) strength++;
    if (/\d/.test(pwd)) strength++;
    if (/[^a-zA-Z0-9]/.test(pwd)) strength++;
    
    if (strength <= 2) return { strength: 33, label: 'Weak', color: 'bg-red-500' };
    if (strength <= 3) return { strength: 66, label: 'Medium', color: 'bg-yellow-500' };
    return { strength: 100, label: 'Strong', color: 'bg-green-500' };
  };

  const passwordStrength = getPasswordStrength(password);

  const signupMutation = trpc.auth.signup.useMutation({
    onSuccess: (data) => {
      if (data.requiresVerification) {
        // Redirect to verification pending page
        setLocation(`/verification-pending?email=${encodeURIComponent(email)}`);
      } else {
        // Old flow - direct login (shouldn't happen anymore)
        setLocation('/dashboard');
      }
    },
    onError: (error) => {
      setError(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!businessType) {
      setError('Please select your business type');
      return;
    }
    
    signupMutation.mutate({
      name,
      email,
      password,
      businessType,
    });
  };

  const businessTypes = [
    {
      value: 'freelancer' as const,
      label: 'Freelancer',
      description: 'Independent professional',
      icon: User,
    },
    {
      value: 'agencia' as const,
      label: 'Agency',
      description: 'Creative or service agency',
      icon: Users,
    },
    {
      value: 'empresa' as const,
      label: 'Company',
      description: 'Established business',
      icon: Building2,
    },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center">
            <img src="/finwrk-logo.png" alt="Finwrk" className="h-10 w-auto" />
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="text-xs sm:text-sm text-muted-foreground hidden sm:inline">Already have an account?</span>
            <Button
              variant="outline"
              onClick={() => setLocation('/login')}
              className="border-border text-foreground hover:bg-accent text-sm"
              size="sm"
            >
              Sign In
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 pt-24 pb-12" style={{ paddingTop: 'calc(6rem + env(safe-area-inset-top))' }}>
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Create your account
            </h1>
            <p className="text-muted-foreground">
              Start your 7-day free trial. No credit card required.
            </p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-destructive/10 border border-destructive/30 text-destructive rounded-lg p-3 text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="name" className="text-foreground">
                  Full Name
                </Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  required
                  className="bg-background border-border text-foreground"
                  disabled={signupMutation.isPending}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@example.com"
                  required
                  className="bg-background border-border text-foreground"
                  disabled={signupMutation.isPending}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  required
                  minLength={8}
                  className="bg-background border-border text-foreground"
                  disabled={signupMutation.isPending}
                />
                {password.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                          style={{ width: `${passwordStrength.strength}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-foreground">
                        {passwordStrength.label}
                      </span>
                    </div>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Must be at least 8 characters long
                </p>
              </div>

              {/* Business Type Selection */}
              <div className="space-y-3">
                <Label className="text-foreground">
                  Business Type
                </Label>
                <div className="grid grid-cols-3 gap-3">
                  {businessTypes.map((type) => {
                    const Icon = type.icon;
                    const isSelected = businessType === type.value;
                    return (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setBusinessType(type.value)}
                        disabled={signupMutation.isPending}
                        className={`
                          flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all
                          ${isSelected 
                            ? 'border-primary bg-primary/5' 
                            : 'border-border hover:border-muted-foreground/50 bg-background'
                          }
                          disabled:opacity-50 disabled:cursor-not-allowed
                        `}
                      >
                        <Icon className={`w-6 h-6 mb-2 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                        <span className={`text-sm font-medium ${isSelected ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {type.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <Button
                type="submit"
                variant="outline"
                className="w-full border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                disabled={signupMutation.isPending}
              >
                {signupMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  'Create Account'
                )}
              </Button>
            </form>

            <div className="mt-6 text-center text-xs text-muted-foreground">
              By creating an account, you agree to our{' '}
              <a href="/terms" className="text-foreground hover:underline">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="/privacy" className="text-foreground hover:underline">
                Privacy Policy
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
