/**
 * useRealtimeNotifications Hook
 * Uses polling to check for new notifications every 5 seconds
 * Shows toast notifications when new notifications arrive
 */

import { useEffect, useRef } from 'react';
import { trpc } from '@/lib/trpc';
import { useToast } from '@/contexts/ToastContext';

export function useRealtimeNotifications() {
  const utils = trpc.useContext();
  const toast = useToast();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastUnreadCountRef = useRef<number | null>(null);

  // Query to get unread count
  const { data: unreadCount } = trpc.notifications.unreadCount.useQuery(undefined, {
    refetchInterval: 5000, // Refetch every 5 seconds
  });

  // Query to get latest notifications
  const { data: notifications } = trpc.notifications.list.useQuery(
    { limit: 5, offset: 0 },
    { refetchInterval: 5000 }
  );

  useEffect(() => {
    // Check if there are new notifications
    if (unreadCount !== undefined && lastUnreadCountRef.current !== null) {
      const hasNewNotifications = unreadCount > lastUnreadCountRef.current;
      
      if (hasNewNotifications && notifications && notifications.length > 0) {
        // Get the most recent unread notification
        const latestNotification = notifications.find(n => n.is_read === 0);
        
        if (latestNotification) {
          console.log('[Realtime Notifications] New notification detected:', latestNotification.title);
          
          // Determine toast variant based on notification type
          let variant: 'info' | 'success' | 'warning' | 'error' = 'info';
          if (latestNotification.type === 'success') variant = 'success';
          else if (latestNotification.type === 'warning') variant = 'warning';
          else if (latestNotification.type === 'error') variant = 'error';
          
          // Show toast
          toast.showToast({
            title: latestNotification.title,
            description: latestNotification.message,
            variant,
          });
        }
      }
    }
    
    // Update last unread count
    lastUnreadCountRef.current = unreadCount ?? 0;
  }, [unreadCount, notifications, toast]);

  // Also invalidate invoices list to refresh dashboard
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      utils.invoices.list.invalidate();
    }, 5000);

    console.log('[Realtime Notifications] Polling started (5s interval)');

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      console.log('[Realtime Notifications] Polling stopped');
    };
  }, [utils]);

  return null; // This hook doesn't return anything, it just manages the polling
}
