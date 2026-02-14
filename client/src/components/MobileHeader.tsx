/**
 * MobileHeader - Header móvil con saludo personalizado y notificaciones flotantes
 * Design: Minimalista con círculo de perfil y campanita flotante
 */

import { Bell } from 'lucide-react';
import { useAuth } from '@/_core/hooks/useAuth';
import { NotificationsPanel } from '@/components/NotificationsPanel';
import { cn } from '@/lib/utils';

interface MobileHeaderProps {
  onProfileClick: () => void;
}

export function MobileHeader({ onProfileClick }: MobileHeaderProps) {
  const { user } = useAuth();
  
  // Obtener el primer nombre del usuario
  const firstName = user?.name?.split(' ')[0] || 'Usuario';

  return (
    <>
      {/* Header móvil */}
      <div 
        className="md:hidden px-4 pb-3" 
        style={{ paddingTop: 'calc(1rem + env(safe-area-inset-top))' }}
      >
        <div className="flex items-center justify-between">
          {/* Saludo y perfil - Clickeable */}
          <button 
            onClick={onProfileClick}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity active:scale-95"
          >
            {/* Círculo de perfil */}
            <div className="w-10 h-10 rounded-full bg-[#C4FF3D]/10 border border-[#C4FF3D]/30 flex items-center justify-center flex-shrink-0">
              <span className="text-[#C4FF3D] text-sm font-semibold">
                {firstName.charAt(0).toUpperCase()}
              </span>
            </div>
            
            {/* Saludo */}
            <div className="text-left">
              <p className="text-[10px] text-[#8B92A8] font-medium">Hola</p>
              <p className="text-sm text-[#EDEDED] font-semibold">{firstName}</p>
            </div>
          </button>
        </div>
      </div>

      {/* Botón flotante de notificaciones - Solo móvil */}
      <div 
        className="md:hidden fixed right-4 z-40" 
        style={{ top: 'calc(1rem + env(safe-area-inset-top))' }}
      >
        <NotificationsPanel />
      </div>
    </>
  );
}
