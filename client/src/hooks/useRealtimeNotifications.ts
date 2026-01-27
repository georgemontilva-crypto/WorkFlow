/**
 * useRealtimeNotifications Hook
 * Uses SSE (Server-Sent Events) to receive notifications in real-time via Redis Pub/Sub
 * Shows toast notifications instantly when events arrive
 */

import { useEffect, useRef } from 'react';
import { trpc } from '@/lib/trpc';
import { useToast } from '@/contexts/ToastContext';

interface NotificationEvent {
  userId: number;
  notificationId: number;
  type: 'new' | 'read' | 'delete';
  source?: 'invoice' | 'savings' | 'system';
  timestamp: number;
}

interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  source: 'invoice' | 'savings' | 'system';
  source_id?: number | null;
  is_read: number;
  created_at: Date;
}

interface UseRealtimeNotificationsOptions {
  onNotification?: (notification: Notification) => void | Promise<void>;
}

export function useRealtimeNotifications(options?: UseRealtimeNotificationsOptions) {
  const utils = trpc.useContext();
  const toast = useToast();
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Get auth token from localStorage
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('[Realtime Notifications] No auth token found, skipping SSE connection');
      return;
    }

    // Connect to SSE endpoint
    const connectSSE = () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || '';
        const sseUrl = `${apiUrl}/api/notifications/stream?token=${encodeURIComponent(token)}`;
        
        console.log('[Realtime Notifications] Connecting to SSE...');
        
        // Create EventSource with auth token in URL (EventSource doesn't support custom headers)
        const eventSource = new EventSource(sseUrl);
        eventSourceRef.current = eventSource;

        // Connection opened
        eventSource.onopen = () => {
          console.log('[Realtime Notifications] ✅ SSE connection established');
        };

        // Receive messages
        eventSource.onmessage = async (event) => {
          try {
            const data = JSON.parse(event.data);
            
            // Handle connection confirmation
            if (data.type === 'connected') {
              console.log('[Realtime Notifications] Connected to server');
              return;
            }

            // Handle notification events
            const notificationEvent = data as NotificationEvent;
            console.log('[Realtime Notifications] Event received:', notificationEvent.type);

            if (notificationEvent.type === 'new') {
              // Fetch the new notification details
              const notifications = await utils.notifications.list.fetch({ limit: 1, offset: 0 });
              
              if (notifications && notifications.length > 0) {
                const latestNotification = notifications[0];
                
                console.log('[Realtime Notifications] New notification:', latestNotification.title);
                
                // Call custom callback if provided
                if (options?.onNotification) {
                  try {
                    await options.onNotification(latestNotification);
                  } catch (callbackError: any) {
                    console.error('[Realtime Notifications] Callback error:', callbackError.message);
                  }
                } else {
                  // Default behavior: show toast
                  // Determine toast variant based on notification type
                  let variant: 'info' | 'success' | 'warning' | 'error' = 'info';
                  if (latestNotification.type === 'success') variant = 'success';
                  else if (latestNotification.type === 'warning') variant = 'warning';
                  else if (latestNotification.type === 'error') variant = 'error';
                  
                  // Show toast immediately
                  toast.showToast({
                    title: latestNotification.title,
                    description: latestNotification.message,
                    variant,
                  });
                }
              }

              // Invalidate queries to refresh UI
              utils.notifications.list.invalidate();
              utils.notifications.unreadCount.invalidate();
            }
          } catch (error: any) {
            console.error('[Realtime Notifications] Parse error:', error.message);
          }
        };

        // Handle errors
        eventSource.onerror = (error) => {
          console.error('[Realtime Notifications] SSE error:', error);
          eventSource.close();
          eventSourceRef.current = null;

          // Attempt to reconnect after 5 seconds
          console.log('[Realtime Notifications] Reconnecting in 5 seconds...');
          reconnectTimeoutRef.current = setTimeout(() => {
            connectSSE();
          }, 5000);
        };

      } catch (error: any) {
        console.error('[Realtime Notifications] Connection error:', error.message);
      }
    };

    // Initial connection
    connectSSE();

    // Cleanup on unmount
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
        console.log('[Realtime Notifications] SSE connection closed');
      }
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, [utils, toast]);

  return null; // This hook doesn't return anything, it just manages the SSE connection
}
