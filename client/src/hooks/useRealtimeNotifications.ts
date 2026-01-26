/**
 * useRealtimeNotifications Hook
 * Uses polling to check for new notifications every 5 seconds
 */

import { useEffect, useRef } from 'react';
import { trpc } from '@/lib/trpc';

export function useRealtimeNotifications() {
  const utils = trpc.useContext();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastCheckRef = useRef<number>(Date.now());

  useEffect(() => {
    // Check for new notifications every 5 seconds
    const checkNotifications = () => {
      // Invalidate queries to fetch latest data
      utils.notifications.unreadCount.invalidate();
      utils.invoices.list.invalidate();
      
      lastCheckRef.current = Date.now();
    };

    // Initial check
    checkNotifications();

    // Set up polling interval (5 seconds)
    intervalRef.current = setInterval(checkNotifications, 5000);

    console.log('[Realtime Notifications] Polling started (5s interval)');

    // Cleanup on unmount
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
