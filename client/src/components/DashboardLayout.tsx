/**
 * DashboardLayout - Layout principal con sidebar y header fijo
 * Design Philosophy: Apple Minimalism - Responsive mobile-first
 */

import { Link, useLocation } from 'wouter';
import { LayoutDashboard, Users, FileText, TrendingUp, Target, Bell, Settings, Menu, X, Sparkles, LogOut, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { PaymentNotifications } from '@/components/PaymentNotifications';
import { WelcomeDialog } from '@/components/WelcomeDialog';
import { AccessBlocker } from './AccessBlocker';

import { differenceInDays, parseISO } from 'date-fns';
import { useEffect, useState } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';



export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { t } = useLanguage();
  
  // Auth and access control
  const { user, isAuthenticated, logout } = useAuth();
  const { data: accessStatus } = trpc.auth.accessStatus.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchInterval: 60000, // Check every minute
  });
  
  // Alert system state
  const [showOverdueAlert, setShowOverdueAlert] = useState(false);
  const [showUrgentAlert, setShowUrgentAlert] = useState(false);
  
  // Fetch clients and invoices for alerts using tRPC
  const { data: allClients } = trpc.clients.list.useQuery(undefined, { enabled: isAuthenticated });
  const { data: allInvoices } = trpc.invoices.list.useQuery(undefined, { enabled: isAuthenticated });
  
  const clients = allClients?.filter(c => c.status === 'active');
  const invoices = allInvoices?.filter(i => i.status === 'draft' || i.status === 'sent');
  
  // Check for overdue and urgent reminders
  useEffect(() => {
    if (!clients || !invoices) return;
    
    // Check localStorage for dismissed alerts
    const dismissedOverdue = localStorage.getItem('dismissedOverdueAlert');
    const dismissedUrgent = localStorage.getItem('dismissedUrgentAlert');
    
    // Count overdue items
    const overdueClients = clients.filter(c => {
      const daysUntil = differenceInDays(new Date(c.next_payment_date), new Date());
      return daysUntil < 0;
    });
    const overdueInvoices = invoices.filter(i => {
      const daysUntil = differenceInDays(new Date(i.due_date), new Date());
      return daysUntil < 0;
    });
    const overdueCount = overdueClients.length + overdueInvoices.length;
    
    // Count urgent items (5 days or less)
    const urgentClients = clients.filter(c => {
      const daysUntil = differenceInDays(new Date(c.next_payment_date), new Date());
      return daysUntil >= 0 && daysUntil <= 5;
    });
    const urgentInvoices = invoices.filter(i => {
      const daysUntil = differenceInDays(new Date(i.due_date), new Date());
      return daysUntil >= 0 && daysUntil <= 5;
    });
    const urgentCount = urgentClients.length + urgentInvoices.length;
    
    // Show alerts if not dismissed and there are items
    if (overdueCount > 0 && !dismissedOverdue) {
      setTimeout(() => setShowOverdueAlert(true), 1000);
    }
    else if (urgentCount > 0 && !dismissedUrgent) {
      setTimeout(() => setShowUrgentAlert(true), 1000);
    }
  }, [clients, invoices]);
  
  const handleDismissOverdue = () => {
    localStorage.setItem('dismissedOverdueAlert', 'true');
    setShowOverdueAlert(false);
  };
  
  const handleDismissUrgent = () => {
    localStorage.setItem('dismissedUrgentAlert', 'true');
    setShowUrgentAlert(false);
  };
  
  const handleViewReminders = () => {
    window.location.href = '/reminders';
  };
  
  // Calculate counts for alerts
  const overdueCount = clients && invoices ? 
    clients.filter(c => differenceInDays(new Date(c.next_payment_date), new Date()) < 0).length +
    invoices.filter(i => differenceInDays(new Date(i.due_date), new Date()) < 0).length : 0;
  
  const urgentCount = clients && invoices ?
    clients.filter(c => {
      const d = differenceInDays(new Date(c.next_payment_date), new Date());
      return d >= 0 && d <= 5;
    }).length +
    invoices.filter(i => {
      const d = differenceInDays(new Date(i.due_date), new Date());
      return d >= 0 && d <= 5;
    }).length : 0;

  // Base navigation items
  const baseNavigation = [
    { name: t.nav.dashboard, href: '/dashboard', icon: LayoutDashboard },
    { name: t.nav.clients, href: '/clients', icon: Users },
    { name: t.nav.invoices, href: '/invoices', icon: FileText },
    { name: t.nav.finances, href: '/finances', icon: TrendingUp },
    { name: 'Mercados', href: '/markets', icon: TrendingUp },
    { name: t.nav.goals, href: '/savings', icon: Target },
    { name: t.nav.reminders, href: '/reminders', icon: Bell },
    { name: t.nav.settings, href: '/settings', icon: Settings },
  ];

  // Add admin link for super admins
  const navigation = user?.role === 'super_admin'
    ? [...baseNavigation, { name: 'Admin', href: '/admin', icon: Shield }]
    : baseNavigation;

  // Handle upgrade action
  const handleUpgrade = () => {
    window.location.href = '/#pricing';
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Access Blocker */}
      {accessStatus && !accessStatus.has_lifetime_access && (
        <AccessBlocker 
          trialDaysRemaining={accessStatus.trialDaysRemaining}
          onUpgrade={handleUpgrade}
        />
      )}
      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed lg:static inset-y-0 left-0 z-40 w-64 bg-card border-r border-border flex flex-col transition-transform duration-300 ease-in-out',
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-border">
          <img src="/logo.png" alt="HiWork" className="h-8 sm:h-10 lg:h-12 w-auto object-contain" />
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.name} href={item.href}>
                <div
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 cursor-pointer',
                    isActive
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                  )}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <item.icon className="w-5 h-5" strokeWidth={1.5} />
                  {item.name}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Trial Status Indicator */}
        {accessStatus && !accessStatus.has_lifetime_access && accessStatus.trialDaysRemaining !== null && (
          <div className="mx-3 mb-4">
            <div className="bg-primary/10 border border-primary/30 rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <p className="text-sm font-semibold text-foreground">
                  {accessStatus.trialDaysRemaining > 0 
                    ? `Quedan ${accessStatus.trialDaysRemaining} día${accessStatus.trialDaysRemaining !== 1 ? 's' : ''} de prueba`
                    : 'Período de prueba finalizado'
                  }
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                Disfruta de todas las funcionalidades durante tu período de prueba
              </p>
            </div>
          </div>
        )}

        {/* Logout Button */}
        <div className="mx-3 mb-4">
          <Button
            onClick={logout}
            variant="outline"
            className="w-full justify-start text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="w-4 h-4 mr-2" />
            {t.nav?.logout || 'Cerrar Sesión'}
          </Button>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">
            {t.nav.offlineMode}
          </p>
        </div>
      </aside>

      {/* Main Content with Fixed Header */}
      <main className="flex-1 overflow-hidden flex flex-col">
        {/* Fixed Header */}
        <header className="h-16 bg-card border-b border-border flex items-center justify-between px-4 sm:px-6 flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
          
          <div className="flex-1" />
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
      
      {/* Alert Popups */}
      {/* Payment Notifications */}
      <PaymentNotifications />
      
      {/* Welcome Dialog for new users */}
      <WelcomeDialog />
    </div>
  );
}
