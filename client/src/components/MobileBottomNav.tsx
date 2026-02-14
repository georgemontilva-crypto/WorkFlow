/**
 * MobileBottomNav - Barra de navegación inferior tipo isla con glassmorfismo
 * Design: Isla flotante con efecto glassmorfismo oscuro
 */

import { Link, useLocation } from 'wouter';
import { Users, FileText, LayoutDashboard, TrendingUp, LineChart } from 'lucide-react';
import { cn } from '@/lib/utils';

export function MobileBottomNav() {
  const [location] = useLocation();

  const navItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Clientes', href: '/clients', icon: Users },
    { name: 'Facturas', href: '/invoices', icon: FileText },
    { name: 'Finanzas', href: '/finances', icon: TrendingUp },
    { name: 'Mercados', href: '/markets', icon: LineChart },
  ];

  return (
    <nav 
      className="md:hidden fixed left-4 right-4 z-50"
      style={{ 
        bottom: 'max(4px, env(safe-area-inset-bottom))',
      }}
    >
      {/* Isla con glassmorfismo */}
      <div 
        className="flex items-center justify-around px-4 py-3 rounded-full"
        style={{
          background: 'rgba(10, 10, 10, 0.8)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        }}
      >
        {navItems.map((item) => {
          const isActive = location === item.href;
          const Icon = item.icon;
          
          return (
            <Link key={item.name} href={item.href}>
              <a
                className={cn(
                  'flex items-center justify-center w-12 h-12 rounded-full transition-all',
                  isActive 
                    ? 'bg-[#C4FF3D] text-black' 
                    : 'text-[#8B92A8] hover:text-white'
                )}
              >
                <Icon className="w-6 h-6" strokeWidth={isActive ? 2 : 1.5} />
              </a>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
