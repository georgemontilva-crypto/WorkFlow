/**
 * Landing Page - HiWork
 * Design Philosophy: Apple Minimalism - Elegante, limpio y profesional
 * Multilingual: English/Spanish
 */

import { Button } from '@/components/ui/button';
import { Check, TrendingUp, FileText, Users, Target, Bell, Shield } from 'lucide-react';
import { getLoginUrl } from '@/const';
import { LandingLanguageProvider, useLandingLanguage } from '@/contexts/LandingLanguageContext';
import { LanguageSelector } from '@/components/LanguageSelector';

function LandingContent() {
  const { t } = useLandingLanguage();

  const features = [
    {
      icon: Users,
      title: t.features.clients.title,
      description: t.features.clients.description,
    },
    {
      icon: FileText,
      title: t.features.invoices.title,
      description: t.features.invoices.description,
    },
    {
      icon: TrendingUp,
      title: t.features.finances.title,
      description: t.features.finances.description,
    },
    {
      icon: Target,
      title: t.features.goals.title,
      description: t.features.goals.description,
    },
    {
      icon: Bell,
      title: t.features.reminders.title,
      description: t.features.reminders.description,
    },
    {
      icon: Shield,
      title: t.features.security.title,
      description: t.features.security.description,
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/hiwork-logo-final.png" alt="HiWork" className="h-8 w-auto" />
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              {t.nav.features}
            </a>
            <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              {t.nav.pricing}
            </a>
            <a href="#compliance" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              {t.nav.security}
            </a>
            <LanguageSelector />
          </nav>
          <div className="flex items-center gap-3">
            <div className="md:hidden">
              <LanguageSelector />
            </div>
            <Button onClick={() => window.location.href = getLoginUrl()} className="bg-primary text-primary-foreground hover:opacity-90">
              {t.nav.startTrial}
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 leading-tight">
            {t.hero.title1}
            <br />
            <span className="text-primary">{t.hero.title2}</span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            {t.hero.subtitle}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              size="lg" 
              onClick={() => window.location.href = getLoginUrl()}
              className="bg-primary text-primary-foreground hover:opacity-90 text-lg px-8 py-6"
            >
              {t.hero.cta1}
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
              className="text-lg px-8 py-6"
            >
              {t.hero.cta2}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            {t.hero.noCreditCard}
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-card/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              {t.features.title}
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {t.features.subtitle}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="bg-card border border-border rounded-2xl p-8 hover:border-primary/50 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary" strokeWidth={1.5} />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              {t.pricing.title}
            </h2>
            <p className="text-xl text-muted-foreground">
              {t.pricing.subtitle}
            </p>
          </div>

          <div className="bg-card border-2 border-primary rounded-3xl p-8 md:p-12 max-w-lg mx-auto">
            <div className="text-center mb-8">
              <div className="inline-block bg-primary/10 text-primary text-sm font-medium px-4 py-1 rounded-full mb-4">
                {t.pricing.badge}
              </div>
              <div className="flex items-baseline justify-center gap-2 mb-2">
                <span className="text-5xl md:text-6xl font-bold text-foreground">{t.pricing.price}</span>
                <span className="text-xl text-muted-foreground">{t.pricing.currency}</span>
              </div>
              <p className="text-muted-foreground">{t.pricing.period}</p>
            </div>

            <div className="space-y-4 mb-8">
              {t.pricing.benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-primary" strokeWidth={3} />
                  </div>
                  <span className="text-foreground">{benefit}</span>
                </div>
              ))}
            </div>

            <Button 
              size="lg" 
              onClick={() => window.location.href = getLoginUrl()}
              className="w-full bg-primary text-primary-foreground hover:opacity-90 text-lg py-6"
            >
              {t.pricing.cta}
            </Button>
            <p className="text-center text-sm text-muted-foreground mt-4">
              {t.pricing.afterTrial}
            </p>
          </div>
        </div>
      </section>

      {/* Compliance Section */}
      <section id="compliance" className="py-20 px-4 bg-card/30">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {t.compliance.title}
          </h2>
          <p className="text-lg text-muted-foreground mb-12 max-w-2xl mx-auto">
            {t.compliance.subtitle}
          </p>
          
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
            <div className="flex flex-col items-center gap-2">
              <div className="w-20 h-20 rounded-full bg-blue-500/10 flex items-center justify-center">
                <span className="text-2xl font-bold text-blue-500">GDPR</span>
              </div>
              <span className="text-xs text-muted-foreground">{t.compliance.gdpr}</span>
            </div>
            
            <div className="flex flex-col items-center gap-2">
              <div className="w-20 h-20 rounded-full bg-blue-400/10 flex items-center justify-center">
                <span className="text-lg font-bold text-blue-400">ISO 27001</span>
              </div>
              <span className="text-xs text-muted-foreground">{t.compliance.iso27001}</span>
            </div>
            
            <div className="flex flex-col items-center gap-2">
              <div className="w-20 h-20 rounded-full bg-yellow-500/10 flex items-center justify-center">
                <span className="text-lg font-bold text-yellow-600">ISO 9001</span>
              </div>
              <span className="text-xs text-muted-foreground">{t.compliance.iso9001}</span>
            </div>
            
            <div className="flex flex-col items-center gap-2">
              <div className="w-20 h-20 rounded-full bg-cyan-500/10 flex items-center justify-center">
                <span className="text-sm font-bold text-cyan-500">SOC 2</span>
              </div>
              <span className="text-xs text-muted-foreground">{t.compliance.soc2}</span>
            </div>
            
            <div className="flex flex-col items-center gap-2">
              <div className="w-20 h-20 rounded-full bg-purple-500/10 flex items-center justify-center">
                <span className="text-sm font-bold text-purple-500">HIPAA</span>
              </div>
              <span className="text-xs text-muted-foreground">{t.compliance.hipaa}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-border">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <img src="/hiwork-logo-final.png" alt="HiWork" className="h-8 w-auto mb-4" />
              <p className="text-sm text-muted-foreground">
                {t.footer.description}
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-foreground mb-4">{t.footer.product}</h4>
              <ul className="space-y-2">
                <li><a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t.nav.features}</a></li>
                <li><a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t.nav.pricing}</a></li>
                <li><a href="#compliance" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t.nav.security}</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-foreground mb-4">{t.footer.legal}</h4>
              <ul className="space-y-2">
                <li><a href="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t.footer.terms}</a></li>
                <li><a href="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t.footer.privacy}</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-foreground mb-4">{t.footer.support}</h4>
              <ul className="space-y-2">
                <li><a href="mailto:support@hiwork.app" className="text-sm text-muted-foreground hover:text-foreground transition-colors">support@hiwork.app</a></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-border text-center">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} HiWork. {t.footer.rights}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function Landing() {
  return (
    <LandingLanguageProvider>
      <LandingContent />
    </LandingLanguageProvider>
  );
}
