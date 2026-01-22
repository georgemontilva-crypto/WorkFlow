/**
 * AlertToast - Sistema de toasts temporales con prioridades
 * Muestra alertas temporales en la esquina inferior derecha
 * Prioridad: Critical > Warning > Info
 * Máximo un toast a la vez
 */

import { useEffect, useState } from 'react';
import { X, Info, AlertTriangle, AlertCircle } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useLocation } from 'wouter';

type AlertType = 'info' | 'warning' | 'critical';

interface Alert {
  id: number;
  type: AlertType;
  event: string;
  message: string;
  action_url?: string | null;
  action_text?: string | null;
}

const TOAST_DURATION = 5000; // 5 seconds
const PRIORITY_ORDER: AlertType[] = ['critical', 'warning', 'info'];

export function AlertToast() {
  const [, setLocation] = useLocation();
  const [currentAlert, setCurrentAlert] = useState<Alert | null>(null);
  const [queue, setQueue] = useState<Alert[]>([]);

  // Fetch unread alerts that should be shown as toast
  const { data: alerts, refetch } = trpc.alerts.list.useQuery({
    unreadOnly: true,
  }, {
    refetchInterval: 10000, // Check every 10 seconds
  });

  const markAsReadMutation = trpc.alerts.markAsRead.useMutation({
    onSuccess: () => refetch(),
  });

  // Process alerts and build queue based on priority
  useEffect(() => {
    if (!alerts || alerts.length === 0) {
      setQueue([]);
      return;
    }

    // Filter alerts that haven't been shown as toast yet
    const pendingToasts = alerts.filter(a => a.shown_as_toast === 0);

    if (pendingToasts.length === 0) return;

    // Sort by priority (critical > warning > info) and then by date (newest first)
    const sortedAlerts = [...pendingToasts].sort((a, b) => {
      const priorityA = PRIORITY_ORDER.indexOf(a.type as AlertType);
      const priorityB = PRIORITY_ORDER.indexOf(b.type as AlertType);
      
      if (priorityA !== priorityB) {
        return priorityA - priorityB; // Lower index = higher priority
      }
      
      // Same priority, sort by date (newest first)
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    setQueue(sortedAlerts as Alert[]);
  }, [alerts]);

  // Show next alert from queue
  useEffect(() => {
    if (currentAlert || queue.length === 0) return;

    const nextAlert = queue[0];
    setCurrentAlert(nextAlert);
    setQueue(prev => prev.slice(1));

    // Auto-dismiss after duration
    const timer = setTimeout(() => {
      handleDismiss();
    }, TOAST_DURATION);

    return () => clearTimeout(timer);
  }, [currentAlert, queue]);

  const handleDismiss = async () => {
    if (currentAlert) {
      // Mark as read
      await markAsReadMutation.mutateAsync({ id: currentAlert.id });
      setCurrentAlert(null);
    }
  };

  const handleAction = () => {
    if (currentAlert?.action_url) {
      setLocation(currentAlert.action_url);
      handleDismiss();
    }
  };

  if (!currentAlert) return null;

  const getAlertStyles = (type: AlertType) => {
    switch (type) {
      case 'critical':
        return {
          bgColor: 'bg-red-500/10',
          borderColor: 'border-red-500',
          textColor: 'text-red-600 dark:text-red-400',
          buttonBg: 'bg-red-500 hover:bg-red-600',
          Icon: AlertCircle,
        };
      case 'warning':
        return {
          bgColor: 'bg-yellow-500/10',
          borderColor: 'border-yellow-500',
          textColor: 'text-yellow-600 dark:text-yellow-400',
          buttonBg: 'bg-yellow-500 hover:bg-yellow-600',
          Icon: AlertTriangle,
        };
      default:
        return {
          bgColor: 'bg-blue-500/10',
          borderColor: 'border-blue-500',
          textColor: 'text-blue-600 dark:text-blue-400',
          buttonBg: 'bg-blue-500 hover:bg-blue-600',
          Icon: Info,
        };
    }
  };

  const styles = getAlertStyles(currentAlert.type);
  const { Icon } = styles;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 duration-500">
      <div 
        className={`
          ${styles.bgColor} ${styles.borderColor} border rounded-lg shadow-2xl 
          max-w-sm w-full sm:w-96 p-4
          backdrop-blur-sm
        `}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`${styles.bgColor} p-2 rounded-full`}>
              <Icon className={`w-5 h-5 ${styles.textColor}`} />
            </div>
            <div>
              <h3 className={`font-bold text-base ${styles.textColor}`}>
                {currentAlert.event}
              </h3>
              <p className="text-sm text-muted-foreground">
                {currentAlert.message}
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-4">
          {currentAlert.action_url && (
            <button
              onClick={handleAction}
              className={`
                flex-1 px-4 py-2 rounded-lg font-medium text-sm text-white
                ${styles.buttonBg}
                transition-colors
              `}
            >
              {currentAlert.action_text || 'Ver detalles'}
            </button>
          )}
          <button
            onClick={handleDismiss}
            className="px-4 py-2 rounded-lg font-medium text-sm border border-border hover:bg-accent transition-colors"
          >
            Descartar
          </button>
        </div>

        {/* Queue indicator */}
        {queue.length > 0 && (
          <div className="mt-3 text-xs text-center text-muted-foreground">
            {queue.length} alerta{queue.length > 1 ? 's' : ''} más
          </div>
        )}
      </div>
    </div>
  );
}
