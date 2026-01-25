/**
 * DashboardLayout - Layout principal con sidebar y header fijo
 * Design Philosophy: Apple Minimalism - Responsive mobile-first
 */

import { Link, useLocation } from 'wouter';
import { Users, Settings, Menu, X, LogOut, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

import { useState } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';



/**
 * UnreadAlertBadge - Badge que muestra el número de alertas sin leer
 * 
 * FUENTE ÚNICA DE VERDAD: Lee directamente desde la base de datos.
 * Se sincroniza cada 10 segundos y también se invalida cuando:
 * - Se marca una alerta como leída
 * - Se borran alertas
 * - Se crean nuevas alertas
 * 
 * El contador NO depende de los toasts visibles.
 */
// UnreadAlertBadge removed - alerts system disabled

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { t } = useLanguage();
  
  // Auth and access control
  const { user, isAuthenticated, logout } = useAuth();
  const { data: accessStatus } = trpc.auth.accessStatus.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchInterval: 60000, // Check every minute
  });
  
  // Simplified - no alerts for now
  
  // Simplified - no alerts for now
  // Simplified - no handlers needed

  // Navigation organized by sections
  const navigationSections = [
    {
      title: 'GESTIÓN',
      items: [
        { name: t.nav.clients, href: '/clients', icon: Users },
        { name: 'Facturas', href: '/invoices', icon: FileText },
      ]
    },
  ];

  // Settings at the bottom (separate)
  const settingsItems = [
    { name: t.nav.settings, href: '/settings', icon: Settings },
  ];

  // Handle upgrade action
  const handleUpgrade = () => {
    window.location.href = '/#pricing';
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">

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
          'fixed lg:static inset-y-0 left-0 z-40 w-64 bg-sidebar border-r border-sidebar-border flex flex-col transition-transform duration-300 ease-in-out',
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        {/* Logo */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-border">
          <img src="/finwrk-logo.png" alt="Finwrk" className="h-7 w-auto object-contain" />
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          {navigationSections.map((section, sectionIdx) => (
            <div key={section.title} className={cn("mb-6", sectionIdx === 0 && "mt-2")}>
              {/* Section Title */}
              <div className="px-3 mb-2">
                <h3 className="text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider">
                  {section.title}
                </h3>
              </div>
              {/* Section Items */}
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const isActive = location === item.href;
                  return (
                    <Link key={item.name} href={item.href}>
                      <a
                        className={cn(
                          'sidebar-item',
                          isActive && 'sidebar-item-active'
                        )}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <item.icon className="w-5 h-5" strokeWidth={1.5} />
                        {item.name}
                      </a>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
          
          {/* Settings - Separate at bottom */}
          <div className="mt-auto pt-4 border-t border-border">
            <div className="px-3 mb-2">
              <h3 className="text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider">
                CONFIGURACIÓN
              </h3>
            </div>
            <div className="space-y-0.5">
              {settingsItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.href} href={item.href}>
                    <a
                      className={cn(
                        'sidebar-item',
                        location === item.href && 'sidebar-item-active'
                      )}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Icon className="w-5 h-5" strokeWidth={1.5} />
                      {item.name}
                    </a>
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>

        {/* Subscription Plan Indicator */}
        {accessStatus && accessStatus.subscription_plan && user?.role === 'user' && (
          <div className="mx-3 mb-4">
            <div className="bg-primary/10 border border-primary/30 rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <p className="text-sm font-semibold text-foreground">
                  Plan {accessStatus.subscription_plan === 'free' ? 'Free' : accessStatus.subscription_plan === 'pro' ? 'Pro' : 'Business'}
                </p>
              </div>
              {accessStatus.subscription_plan === 'free' && (
                <p className="text-xs text-muted-foreground">
                  Actualiza a Pro para desbloquear funciones ilimitadas
                </p>
              )}
            </div>
          </div>
        )}

        {/* Logout Button */}
        <div className="mx-3 mb-3">
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
            Finwrk v1.0.0
          </p>
        </div>
      </aside>

      {/* Main Content with Fixed Header */}
      <main className="flex-1 overflow-hidden flex flex-col">
        {/* Fixed Header */}
        <header className="h-16 bg-background border-b border-border flex items-center justify-between px-4 sm:px-6 flex-shrink-0" style={{ paddingTop: 'env(safe-area-inset-top)', height: 'calc(4rem + env(safe-area-inset-top))' }}>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
          
          <div className="flex-1" />
          
          {/* Alert Center Button */}
          <button
            onClick={() => setIsAlertCenterOpen(true)}
            className="relative p-2 hover:bg-accent rounded-lg transition-colors"
          >
            <Bell className="w-5 h-5" />
            {/* Unread count badge */}
            <UnreadAlertBadge />
          </button>
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
      
      {/* Alert System */}
      <AlertToast />
      <AlertCenter isOpen={isAlertCenterOpen} onClose={() => setIsAlertCenterOpen(false)} />
    </div>
  );
}
