/**
 * Finwrk Landing Page
 * Slogan: "Get paid. Stay in control."
 */

import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { 
  Users, FileText, TrendingUp, Target, Bell, Shield,
  Check, X, Menu, Zap, Globe, Lock, Key, Database,
  ArrowRight, Star, ChevronDown, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/_core/hooks/useAuth';
import { LanguageSelector } from '@/components/LanguageSelector';
import { Pricing } from '@/components/Pricing';

export default function Landing() {
  const [, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAuthenticated, loading } = useAuth();
    // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (!loading && isAuthenticated) {
      setLocation('/dashboard');
    }
  }, [isAuthenticated, loading, setLocation]);

  const features = [
    {
      icon: FileText,
      title: "Professional Invoicing",
      description: "Create and send beautiful invoices in seconds"
    },
    {
      icon: Users,
      title: "Client Management",
      description: "Organize all your clients and projects in one place"
    },
    {
      icon: Globe,
      title: "Multi-Currency & Crypto",
      description: "Accept payments in fiat and cryptocurrency"
    },
    {
      icon: Zap,
      title: "Payment Links",
      description: "Share custom payment links with your clients"
    },
    {
      icon: TrendingUp,
      title: "Financial Reports",
      description: "Automated reports and insights"
    },
    {
      icon: Bell,
      title: "Smart Reminders",
      description: "Never miss a payment with automatic reminders"
    }
  ];

  const securityFeatures = [
    {
      icon: Lock,
      title: "Two-Factor Authentication",
      description: "Extra layer of security for your account"
    },
    {
      icon: Database,
      title: "End-to-End Encryption",
      description: "Your data is encrypted at rest and in transit"
    },
    {
      icon: Key,
      title: "External Wallet Custody",
      description: "Crypto assets secured with industry standards"
    },
    {
      icon: Shield,
      title: "Compliance Ready",
      description: "Built to meet financial regulations"
    }
  ];

  const plans = [
    {
      name: "Free",
      price: "$0",
      period: "/forever",
      description: "Perfect for getting started",
      features: [
        { text: "Basic dashboard", included: true },
        { text: "Up to 3 clients", included: true },
        { text: "Maximum 5 invoices", included: true },
        { text: "Crypto visualization", included: true },
        { text: "Payment links", included: false },
        { text: "Automations", included: false }
      ],
      cta: "Start Free",
      highlighted: false
    },
    {
      name: "Pro",
      price: "$15",
      period: "/month",
      description: "For growing businesses",
      features: [
        { text: "Unlimited clients", included: true },
        { text: "Unlimited invoices", included: true },
        { text: "Multi-currency", included: true },
        { text: "Payment links", included: true },
        { text: "Crypto payments", included: true },
        { text: "Automations", included: true },
        { text: "Financial reports", included: true }
      ],
      cta: "Start Pro Trial",
      highlighted: true
    },
    {
      name: "Business",
      price: "$29",
      period: "/month",
      description: "For teams and agencies",
      features: [
        { text: "Everything in Pro", included: true },
        { text: "Multi-user accounts", included: true },
        { text: "Roles & permissions", included: true },
        { text: "Public API", included: true },
        { text: "White label", included: true },
        { text: "Priority support", included: true }
      ],
      cta: "Contact Sales",
      highlighted: false
    }
  ];

  const howItWorks = [
    {
      step: "1",
      title: "Sign Up Free",
      description: "Create your account in less than 60 seconds"
    },
    {
      step: "2",
      title: "Add Clients & Create Invoices",
      description: "Set up your clients and start invoicing"
    },
    {
      step: "3",
      title: "Get Paid",
      description: "Share payment links and receive payments instantly"
    }
  ];

  const faqs = [
    {
      question: "Is Finwrk really free?",
      answer: "Yes! Our Free plan is completely free forever with no credit card required."
    },
    {
      question: "Can I accept cryptocurrency payments?",
      answer: "Yes, Pro and Business plans support crypto payments with external custody for maximum security."
    },
    {
      question: "Is my financial data secure?",
      answer: "Absolutely. We use end-to-end encryption, 2FA, and follow industry best practices for data security."
    },
    {
      question: "Can I upgrade or downgrade my plan?",
      answer: "Yes, you can upgrade or downgrade at any time. Changes take effect immediately."
    }
  ];

  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center">
            <img src="/finwrk-logo.png" alt="Finwrk" className="h-10 w-auto" />
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <button 
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors bg-transparent border-none cursor-pointer"
            >
              Features
            </button>
            <button 
              onClick={() => document.getElementById('security')?.scrollIntoView({ behavior: 'smooth' })}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors bg-transparent border-none cursor-pointer"
            >
              Security
            </button>
            <button 
              onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors bg-transparent border-none cursor-pointer"
            >
              Pricing
            </button>
            <button 
              onClick={() => document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' })}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors bg-transparent border-none cursor-pointer"
            >
              FAQ
            </button>
            <LanguageSelector />
            <Button 
              onClick={() => setLocation('/login')} 
              variant="outline"
              className="border-white text-white bg-black hover:bg-white hover:text-black transition-colors"
            >
              Login
            </Button>
            <Button onClick={() => setLocation('/signup')} className="">
              Start Free
            </Button>
          </nav>
          
          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-foreground hover:bg-accent rounded-md transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
        
        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-background border-t border-border">
            <nav className="container mx-auto px-4 py-4 flex flex-col gap-4">
              <button 
                onClick={() => {
                  setMobileMenuOpen(false);
                  setTimeout(() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' }), 100);
                }}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors py-2 text-left bg-transparent border-none cursor-pointer"
              >
                Features
              </button>
              <button 
                onClick={() => {
                  setMobileMenuOpen(false);
                  setTimeout(() => document.getElementById('security')?.scrollIntoView({ behavior: 'smooth' }), 100);
                }}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors py-2 text-left bg-transparent border-none cursor-pointer"
              >
                Security
              </button>
              <button 
                onClick={() => {
                  setMobileMenuOpen(false);
                  setTimeout(() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' }), 100);
                }}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors py-2 text-left bg-transparent border-none cursor-pointer"
              >
                Pricing
              </button>
              <button 
                onClick={() => {
                  setMobileMenuOpen(false);
                  setTimeout(() => document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' }), 100);
                }}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors py-2 text-left bg-transparent border-none cursor-pointer"
              >
                FAQ
              </button>
              <div className="pt-2 border-t border-border space-y-3">
                <LanguageSelector />
                <div className="flex items-center gap-3">
                  <Button 
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setLocation('/login');
                    }} 
                    variant="outline"
                    className="border-white text-white bg-black hover:bg-white hover:text-black transition-colors flex-1"
                  >
                    Login
                  </Button>
                  <Button 
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setLocation('/signup');
                    }} 
                    className="bg-primary text-primary-foreground hover:opacity-90 flex-1"
                  >
                    Start Free
                  </Button>
                </div>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-4" style={{ paddingTop: 'calc(8rem + env(safe-area-inset-top))' }}>
        <div className="container mx-auto max-w-5xl text-center">
          <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 bg-primary/10 text-primary rounded-md text-sm font-medium">
            <Sparkles className="w-4 h-4" />
            <span>Now accepting crypto payments</span>
          </div>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 leading-tight">
            Get paid.
            <br />
            <span className="text-primary">Stay in control.</span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Professional invoicing and financial management for freelancers and businesses. 
            Accept payments in fiat and crypto with bank-level security.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              size="lg" 
              onClick={() => setLocation('/signup')}
              className="bg-primary text-primary-foreground hover:opacity-90 text-lg px-8 py-6"
            >
              Start Free <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              className="text-lg px-8 py-6"
            >
              See How It Works
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-6">
            No credit card required • Free forever plan available
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-accent/5">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Everything you need to get paid
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Powerful features designed for modern businesses
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border hover:border-primary/50 transition-all hover:shadow-lg">
                <CardHeader>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section id="security" className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 bg-primary/10 text-primary rounded-md text-sm font-medium">
              <Shield className="w-4 h-4" />
              <span>Security First</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Bank-level security for your financial data
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Your security is our top priority. We implement industry-leading practices to keep your data safe.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {securityFeatures.map((feature, index) => (
              <Card key={index} className="border">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center shrink-0">
                      <feature.icon className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <CardTitle className="text-xl mb-2">{feature.title}</CardTitle>
                      <p className="text-muted-foreground">{feature.description}</p>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>



      {/* How It Works Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Get started in minutes
            </h2>
            <p className="text-xl text-muted-foreground">
              Three simple steps to start getting paid
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {howItWorks.map((step, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-3xl font-bold text-primary mx-auto mb-4">
                  {step.step}
                </div>
                <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 px-4 bg-accent/5">
        <div className="container mx-auto max-w-3xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Frequently Asked Questions
            </h2>
          </div>
          
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <Card key={index} className="border">
                <CardHeader 
                  className="cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                >
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{faq.question}</CardTitle>
                    <ChevronDown 
                      className={`w-5 h-5 transition-transform ${openFaq === index ? 'rotate-180' : ''}`}
                    />
                  </div>
                </CardHeader>
                {openFaq === index && (
                  <CardContent>
                    <p className="text-muted-foreground">{faq.answer}</p>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Ready to take control of your finances?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join thousands of businesses using Finwrk to get paid faster
          </p>
          <Button 
            size="lg" 
            onClick={() => setLocation('/signup')}
            className="bg-primary text-primary-foreground hover:opacity-90 text-lg px-8 py-6"
          >
            Start Free Today <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </section>

      {/* Pricing Section */}
      <Pricing />

      {/* Footer */}
      <footer className="border-t border-border py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center mb-4">
                <img src="/finwrk-logo.png" alt="Finwrk" className="h-8 w-auto" />
              </div>
              <p className="text-sm text-muted-foreground">
                Get paid. Stay in control.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><button onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-foreground transition-colors bg-transparent border-none cursor-pointer p-0">Features</button></li>
                <li><button onClick={() => document.getElementById('security')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-foreground transition-colors bg-transparent border-none cursor-pointer p-0">Security</button></li>
                <li><button onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-foreground transition-colors bg-transparent border-none cursor-pointer p-0">Pricing</button></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">About</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Contact</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Terms</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Security</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-border pt-8 text-center text-sm text-muted-foreground">
            <p>© 2026 Finwrk. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
