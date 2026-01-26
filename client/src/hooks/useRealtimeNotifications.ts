/**
 * useRealtimeNotifications Hook
 * Connects to SSE endpoint for instant notification updates
 */

import { useEffect, useRef } from 'react';
import { trpc } from '@/lib/trpc';

interface NotificationEvent {
  userId: number;
  notificationId: number;
  type: 'new' | 'read' | 'delete';
  source?: 'invoice' | 'savings' | 'system';
  timestamp: number;
}

export function useRealtimeNotifications() {
  const utils = trpc.useContext();
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Get auth token from localStorage
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('[Realtime Notifications] No auth token, skipping connection');
      return;
    }

    const connect = () => {
      try {
        // Create EventSource connection with auth header (via URL param since EventSource doesn't support headers)
        const apiUrl = import.meta.env.VITE_API_URL || '';
        const url = `${apiUrl}/api/notifications/stream`;
        
        // EventSource doesn't support custom headers, so we need to use a different approach
        // We'll use a custom fetch-based SSE implementation
        const connectSSE = async () => {
          try {
            const response = await fetch(url, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'text/event-stream',
              },
            });

            if (!response.ok) {
              throw new Error(`SSE connection failed: ${response.status}`);
            }

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();

            if (!reader) {
              throw new Error('No reader available');
            }

            console.log('[Realtime Notifications] Connected to SSE stream');

            // Read stream
            const readStream = async () => {
              try {
                while (true) {
                  const { done, value } = await reader.read();
                  
                  if (done) {
                    console.log('[Realtime Notifications] Stream ended');
                    break;
                  }

                  const chunk = decoder.decode(value, { stream: true });
                  const lines = chunk.split('\n');

                  for (const line of lines) {
                    if (line.startsWith('data: ')) {
                      const data = line.slice(6);
                      try {
                        const event: NotificationEvent = JSON.parse(data);
                        
                        // Handle different event types
                        if (event.type === 'new') {
                          console.log('[Realtime Notifications] New notification received:', event.notificationId);
                          
                          // Invalidate notifications queries
                          utils.notifications.unreadCount.invalidate();
                          utils.notifications.list.invalidate();
                          
                          // If it's an invoice notification, also invalidate invoices
                          if (event.source === 'invoice') {
                            console.log('[Realtime Notifications] Invoice notification - refreshing invoices');
                            utils.invoices.list.invalidate();
                          }
                        }
                      } catch (parseError) {
                        // Ignore parse errors (heartbeat messages, etc.)
                      }
                    }
                  }
                }
              } catch (readError: any) {
                console.error('[Realtime Notifications] Stream read error:', readError.message);
              } finally {
                // Reconnect after 5 seconds
                console.log('[Realtime Notifications] Reconnecting in 5 seconds...');
                reconnectTimeoutRef.current = setTimeout(() => {
                  connectSSE();
                }, 5000);
              }
            };

            readStream();
          } catch (fetchError: any) {
            console.error('[Realtime Notifications] Connection error:', fetchError.message);
            
            // Reconnect after 10 seconds on error
            reconnectTimeoutRef.current = setTimeout(() => {
              connectSSE();
            }, 10000);
          }
        };

        connectSSE();
      } catch (error: any) {
        console.error('[Realtime Notifications] Setup error:', error.message);
      }
    };

    // Initial connection
    connect();

    // Cleanup on unmount
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, [utils]);

  return null; // This hook doesn't return anything, it just manages the connection
}
