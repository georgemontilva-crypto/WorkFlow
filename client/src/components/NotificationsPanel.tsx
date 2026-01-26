/**
 * NotificationsPanel - PERSISTENT NOTIFICATIONS SYSTEM
 * Side panel only, clean, reliable
 * 
 * PRINCIPLES:
 * - NO auto-popups
 * - NO toasts
 * - NO empty cards
 * - SAFE render (title.length > 0, message.length > 0)
 */

import { useState } from 'react';
import { Bell, Check, CheckCheck, X, Info, CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface Notification {
  id: number;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  source: 'invoice' | 'savings' | 'system';
  source_id: number | null;
  is_read: number;
  created_at: Date;
}

export function NotificationsPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const utils = trpc.useContext();

  // Get notifications
  const { data: notifications = [] } = trpc.notifications.list.useQuery({
    unreadOnly: false,
    limit: 50,
  }, {
    enabled: isOpen,
    // No polling needed - using SSE for real-time updates
  });

  // Get unread count
  const { data: unreadData } = trpc.notifications.unreadCount.useQuery();
  // No polling needed - SSE invalidates queries automatically
  const unreadCount = unreadData?.count || 0;

  // Mark as read mutation
  const markAsReadMutation = trpc.notifications.markAsRead.useMutation({
    onSuccess: () => {
      utils.notifications.list.invalidate();
      utils.notifications.unreadCount.invalidate();
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = trpc.notifications.markAllAsRead.useMutation({
    onSuccess: () => {
      utils.notifications.list.invalidate();
      utils.notifications.unreadCount.invalidate();
    },
  });

  const handleMarkAsRead = (id: number) => {
    markAsReadMutation.mutate({ id });
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  // Get icon for notification type
  const getTypeIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Info className="w-5 h-5 text-gray-400" />;
    }
  };

  // Format date
  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Ahora';
    if (minutes < 60) return `Hace ${minutes}m`;
    if (hours < 24) return `Hace ${hours}h`;
    if (days < 7) return `Hace ${days}d`;
    return new Date(date).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
  };

  // SAFE RENDER: Validate before rendering
  const safeNotifications = notifications.filter((n: Notification) => {
    if (!n.title || n.title.trim().length === 0) {
      console.error(`[NotificationsPanel] RENDER ERROR: Empty title for notification ${n.id}`);
      return false;
    }
    if (!n.message || n.message.trim().length === 0) {
      console.error(`[NotificationsPanel] RENDER ERROR: Empty message for notification ${n.id}`);
      return false;
    }
    return true;
  });

  return (
    <>
      {/* Bell icon with badge */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-gray-800 transition-colors"
      >
        <Bell className="w-5 h-5 text-gray-400" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Side panel */}
      {isOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Panel */}
          <div className="fixed right-0 top-0 bottom-0 w-full sm:w-96 bg-[#000000] border-l border-gray-800 z-50 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-gray-400" />
                <h2 className="text-lg font-semibold text-white">Notificaciones</h2>
                {unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg hover:bg-gray-800 transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Actions */}
            {unreadCount > 0 && (
              <div className="p-3 border-b border-gray-800">
                <Button
                  onClick={handleMarkAllAsRead}
                  variant="ghost"
                  size="sm"
                  className="w-full text-gray-400 hover:text-white hover:bg-gray-800"
                  disabled={markAllAsReadMutation.isLoading}
                >
                  <CheckCheck className="w-4 h-4 mr-2" />
                  Marcar todas como leídas
                </Button>
              </div>
            )}

            {/* Notifications list */}
            <div className="flex-1 overflow-y-auto">
              {safeNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                  <Bell className="w-12 h-12 text-gray-600 mb-3" />
                  <p className="text-gray-400 text-sm">No tienes notificaciones</p>
                </div>
              ) : (
                <div className="p-3 space-y-2">
                  {safeNotifications.map((notification: Notification) => (
                    <div
                      key={notification.id}
                      className={cn(
                        'p-4 rounded-lg border transition-colors',
                        notification.is_read === 0
                          ? 'bg-[#222222] border-gray-700'
                          : 'bg-[#1a1a1a] border-gray-800'
                      )}
                    >
                      <div className="flex items-start gap-3">
                        {/* Icon */}
                        <div className="flex-shrink-0 mt-0.5">
                          {getTypeIcon(notification.type)}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h3 className="text-sm font-medium text-white">
                              {notification.title}
                            </h3>
                            {notification.is_read === 0 && (
                              <button
                                onClick={() => handleMarkAsRead(notification.id)}
                                className="flex-shrink-0 p-1 rounded hover:bg-gray-700 transition-colors"
                                title="Marcar como leída"
                              >
                                <Check className="w-4 h-4 text-gray-400" />
                              </button>
                            )}
                          </div>
                          <p className="text-sm text-gray-400 mb-2">
                            {notification.message}
                          </p>
                          <span className="text-xs text-gray-500">
                            {formatDate(notification.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
