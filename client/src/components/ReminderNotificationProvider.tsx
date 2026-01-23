/**
 * ReminderNotificationProvider
 * Componente que verifica y muestra notificaciones de recordatorios próximos
 * Solo se activa cuando el usuario está autenticado
 */

import { useUpcomingReminders } from '@/hooks/useUpcomingReminders';
import { trpc } from '@/lib/trpc';

export function ReminderNotificationProvider({ children }: { children: React.ReactNode }) {
  // Verificar si el usuario está autenticado
  // Use retry: false to prevent multiple failed requests on public pages
  const { data: user, isLoading } = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });
  
  // Solo activar las notificaciones si el usuario está autenticado
  // Pass the user to the hook so it can conditionally run
  useUpcomingReminders(!!user);

  return <>{children}</>;
}
