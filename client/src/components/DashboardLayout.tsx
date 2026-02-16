/**
 * DashboardLayout - Layout principal con sidebar y header fijo
 * Design Philosophy: Apple Minimalism - Responsive mobile-first
 */

import { Link, useLocation } from 'wouter';
import { Users, Settings, Menu, X, LogOut, FileText, TrendingUp, Target, LayoutDashboard, LineChart, Shield, Bug } from 'lucide-react';
import { cn } from '@/lib/utils';

import { Button } from '@/components/ui/button';

import { useState } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { NotificationsPanel } from '@/components/NotificationsPanel';
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { MobileHeader } from '@/components/MobileHeader';
import { MobileHeaderSpacer } from '@/components/MobileHeaderSpacer';
import { SupportChat } from '@/components/SupportChat';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  console.log('[DashboardLayout] Component mounted');
  
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    // Auth and access control
  const { user, isAuthenticated, logout } = useAuth();
  
  console.log('[DashboardLayout] Auth state:', { isAuthenticated, userId: user?.id });
  const { data: accessStatus } = trpc.auth.accessStatus.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchInterval: 60000, // Check every minute
  });
  
  const utils = trpc.useContext();
  
  console.log('[DashboardLayout] About to call useRealtimeNotifications');
  
  // Real-time notifications via SSE
  useRealtimeNotifications({
    onNotification: async (notification) => {
      console.log('[DashboardLayout] Real-time notification received:', notification);
      
      // Invalidate relevant queries based on notification source
      if (notification.source === 'invoice') {
        await utils.invoices.invalidate();
        console.log('[DashboardLayout] Invalidated invoices queries');
      } else if (notification.source === 'savings') {
        await utils.savings.invalidate();
        console.log('[DashboardLayout] Invalidated savings queries');
      }
      
      // Show toast with notification
      // Toast is handled by the hook's default behavior
    },
  });

  // Navigation organized by sections
  const navigationSections = [
    {
      title: 'GENERAL',
      items: [
        { name: 'Dashboard', href: '/', icon: LayoutDashboard },
      ]
    },
    {
      title: 'GESTIÓN',
      items: [
        { name: 'Clientes', href: '/clients', icon: Users },
        { name: 'Facturas', href: '/invoices', icon: FileText },
        { name: 'Finanzas', href: '/finances', icon: TrendingUp },
        { name: 'Ahorros', href: '/savings', icon: Target },
        { name: 'Mercados', href: '/markets', icon: LineChart },
      ]
    },
  ];

  // Settings at the bottom (separate)
  const settingsItems = [
    { name: 'Configuración', href: '/settings', icon: Settings },
    { name: 'Reportar Bug', href: '/bug-report', icon: Bug },
  ];

  // Admin section - only for super_admin
  const adminItems = user?.role === 'super_admin' ? [
    { name: 'Admin', href: '/admin', icon: Shield },
  ] : [];

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
          'hidden lg:flex fixed left-4 top-4 bottom-4 z-40 w-64 flex-col transition-all duration-300 ease-in-out rounded-[24px] overflow-hidden',
        )}
        style={{ 
          paddingTop: 'env(safe-area-inset-top)',
          background: 'rgba(10, 10, 10, 0.8)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        }}
      >
        {/* Logo */}
        <div className="h-16 flex items-center gap-3 px-6">
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
          
          {/* Admin - Only for super_admin */}
          {adminItems.length > 0 && (
            <div className="mb-6">
              <div className="px-3 mb-2">
                <h3 className="text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider">
                  ADMINISTRACIÓN
                </h3>
              </div>
              <div className="space-y-0.5">
                {adminItems.map((item) => {
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
          )}

          {/* Settings - Separate at bottom */}
          <div className="mt-auto pt-4">
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
            {'Cerrar sesión'}
          </Button>
        </div>

        {/* Footer */}
        <div className="p-4">
          <p className="text-xs text-muted-foreground text-center">
            Finwrk v1.0.0
          </p>
        </div>
      </aside>

      {/* Main Content with Fixed Header */}
      <main className="flex-1 overflow-hidden flex flex-col lg:ml-72">


        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto pb-24 md:pb-0">
          {/* Mobile Header - Fixed */}
          <MobileHeader onProfileClick={() => setIsMobileMenuOpen(true)} />
          
          {/* Spacer para compensar header fijo */}
          <MobileHeaderSpacer />
          
          {children}
        </div>
        
        {/* Mobile Bottom Navigation */}
        <MobileBottomNav />
      </main>
      
      {/* Support Chat - Available globally */}
      <SupportChat />
    </div>
  );
}
