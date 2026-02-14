/**
 * MobileBottomNav - Barra de navegación inferior tipo iOS para móvil
 * Design: Inspirado en iOS con botón central destacado
 */

import { Link, useLocation } from 'wouter';
import { Users, FileText, LayoutDashboard, TrendingUp, LineChart } from 'lucide-react';
import { cn } from '@/lib/utils';

export function MobileBottomNav() {
  const [location] = useLocation();

  const navItems = [
    { name: 'Clientes', href: '/clients', icon: Users },
    { name: 'Facturas', href: '/invoices', icon: FileText },
    { name: 'Dashboard', href: '/', icon: LayoutDashboard, isCenter: true },
    { name: 'Finanzas', href: '/finances', icon: TrendingUp },
    { name: 'Mercados', href: '/markets', icon: LineChart },
  ];

  return (
    <nav 
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0A0A0A] border-t border-[rgba(255,255,255,0.06)]"
      style={{ 
        paddingBottom: 'env(safe-area-inset-bottom)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const isActive = location === item.href;
          const Icon = item.icon;
          
          return (
            <Link key={item.name} href={item.href}>
              <a
                className={cn(
                  'flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-2xl transition-all min-w-[60px]',
                  item.isCenter && 'relative -mt-6',
                )}
              >
                {/* Botón central destacado */}
                {item.isCenter ? (
                  <div className={cn(
                    'w-14 h-14 rounded-full flex items-center justify-center transition-all',
                    isActive 
                      ? 'bg-[#C4FF3D] text-black' 
                      : 'bg-[#C4FF3D]/20 text-[#C4FF3D] border border-[#C4FF3D]/30'
                  )}>
                    <Icon className="w-6 h-6" strokeWidth={2} />
                  </div>
                ) : (
                  <>
                    {/* Iconos laterales */}
                    <div className={cn(
                      'w-10 h-10 rounded-xl flex items-center justify-center transition-all',
                      isActive 
                        ? 'bg-[#C4FF3D]/10 text-[#C4FF3D]' 
                        : 'text-[#8B92A8]'
                    )}>
                      <Icon className="w-5 h-5" strokeWidth={1.5} />
                    </div>
                    {/* Etiqueta */}
                    <span className={cn(
                      'text-[10px] font-medium transition-colors',
                      isActive ? 'text-[#C4FF3D]' : 'text-[#8B92A8]'
                    )}>
                      {item.name}
                    </span>
                  </>
                )}
              </a>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
