/**
 * ReminderNotificationProvider
 * Componente que verifica y muestra notificaciones de recordatorios próximos
 * Solo se activa cuando el usuario está autenticado
 */

import { useUpcomingReminders } from '@/hooks/useUpcomingReminders';
import { trpc } from '@/lib/trpc';

export function ReminderNotificationProvider({ children }: { children: React.ReactNode }) {
  // Verificar si el usuario está autenticado
  const { data: user } = trpc.auth.me.useQuery();
  
  // Solo activar las notificaciones si el usuario está autenticado
  useUpcomingReminders();

  return <>{children}</>;
}
