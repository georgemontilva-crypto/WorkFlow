/**
 * DashboardLayout - Layout principal con sidebar y header fijo
 * Design Philosophy: Apple Minimalism - Responsive mobile-first
 */

import { Link, useLocation } from 'wouter';
import { Users, Settings, Menu, X, LogOut, FileText, TrendingUp, Target } from 'lucide-react';
import { cn } from '@/lib/utils';

import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

import { useState } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { NotificationsPanel } from '@/components/NotificationsPanel';

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

  // Navigation organized by sections
  const navigationSections = [
    {
      title: 'GESTIÓN',
      items: [
        { name: t.nav.clients, href: '/clients', icon: Users },
        { name: 'Facturas', href: '/invoices', icon: FileText },
        { name: 'Finanzas', href: '/finances', icon: TrendingUp },
        { name: 'Ahorros', href: '/savings', icon: Target },
      ]
    },
  ];

  // Settings at the bottom (separate)
  const settingsItems = [
    { name: t.nav.settings, href: '/settings', icon: Settings },
  ];

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
            className="lg:hidden min-h-[44px] min-w-[44px]"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </Button>
          
          <div className="flex-1" />
          
          {/* Notifications Panel */}
          <NotificationsPanel />
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
