import { useEffect } from 'react';
import { trpc } from '../lib/trpc';
import { toast } from 'sonner';

/**
 * Hook para gestionar notificaciones
 * - Toasts emergentes desde Redis (temporales)
 * - Historial desde base de datos (permanente)
 */
export function useNotifications() {
  // Obtener toasts pendientes desde Redis
  const { data: pendingToasts, refetch: refetchPending } = trpc.notifications.getPending.useQuery(
    undefined,
    {
      refetchInterval: 5000, // Polling cada 5 segundos
      refetchOnWindowFocus: true,
    }
  );

  // Limpiar toasts después de mostrarlos
  const clearPending = trpc.notifications.clearPending.useMutation();

  // Obtener historial desde DB
  const { data: history, refetch: refetchHistory } = trpc.notifications.getHistory.useQuery(
    { limit: 50 },
    {
      refetchOnWindowFocus: true,
    }
  );

  // Obtener contador de no leídas
  const { data: unreadData, refetch: refetchUnread } = trpc.notifications.getUnreadCount.useQuery(
    undefined,
    {
      refetchInterval: 10000, // Cada 10 segundos
      refetchOnWindowFocus: true,
    }
  );

  // Marcar como leída
  const markAsRead = trpc.notifications.markAsRead.useMutation({
    onSuccess: () => {
      refetchHistory();
      refetchUnread();
    },
  });

  // Marcar todas como leídas
  const markAllAsRead = trpc.notifications.markAllAsRead.useMutation({
    onSuccess: () => {
      refetchHistory();
      refetchUnread();
      toast.success('Todas las notificaciones marcadas como leídas');
    },
  });

  // Mostrar toasts cuando hay notificaciones pendientes
  useEffect(() => {
    if (pendingToasts && pendingToasts.length > 0) {
      pendingToasts.forEach((notification: any) => {
        // Mapear tipo a función de toast
        const toastFn = {
          success: toast.success,
          error: toast.error,
          warning: toast.warning,
          info: toast.info,
        }[notification.type] || toast;

        // Mostrar toast con estilo personalizado
        toastFn(notification.title, {
          description: notification.message,
          duration: notification.priority === 'high' ? 7000 : 5000,
          className: 'bg-[#222222] border-none text-white',
          descriptionClassName: 'text-[#999999]',
        });
      });

      // Limpiar de Redis después de mostrar
      clearPending.mutate();
      
      // Refrescar historial y contador
      refetchHistory();
      refetchUnread();
    }
  }, [pendingToasts]);

  return {
    // Historial
    history: history || [],
    
    // Contador de no leídas
    unreadCount: unreadData?.count || 0,
    
    // Acciones
    markAsRead: (id: number) => markAsRead.mutate({ id }),
    markAllAsRead: () => markAllAsRead.mutate(),
    
    // Refetch manual
    refetch: () => {
      refetchPending();
      refetchHistory();
      refetchUnread();
    },
  };
}
