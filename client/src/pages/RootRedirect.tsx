/**
 * RootRedirect Component
 * Redirige automáticamente según el estado de autenticación:
 * - Usuario no logueado → /login
 * - Usuario logueado → /dashboard
 */

import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/_core/hooks/useAuth';

export default function RootRedirect() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (isAuthenticated) {
        setLocation('/dashboard');
      } else {
        setLocation('/login');
      }
    }
  }, [isAuthenticated, loading, setLocation]);

  // Mostrar pantalla de carga mientras verifica autenticación
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-[#C4FF3D] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-white/60">Cargando...</p>
      </div>
    </div>
  );
}
