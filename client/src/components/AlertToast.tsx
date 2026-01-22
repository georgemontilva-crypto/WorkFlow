/**
 * AlertToast - Sistema de toasts temporales con prioridades
 * Muestra alertas temporales en la esquina inferior derecha
 * Estilo visual idéntico a PaymentNotifications
 * Prioridad: Critical > Warning > Info
 * Máximo un toast a la vez
 */

import { useEffect, useState } from 'react';
import { X, Clock, AlertTriangle, AlertCircle, Info, Bell } from 'lucide-react';
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

// Mapeo de eventos a títulos legibles
const EVENT_TITLES: Record<string, string> = {
  'invoice_overdue': 'Factura Vencida',
  'pending_receipt': 'Comprobante Pendiente',
  'invoice_due_soon': 'Factura Próxima a Vencer',
  'invoice_upcoming': 'Factura Próxima',
  'income_confirmed': 'Ingreso Confirmado',
  'monthly_comparison': 'Resumen Mensual',
  'no_income_month': 'Sin Ingresos',
  'plan_limit': 'Límite de Plan',
  'plan_limit_reached': 'Límite de Plan Alcanzado',
  'feature_blocked': 'Función Bloqueada',
  'multiple_pending': 'Facturas Pendientes',
  'client_late_history': 'Historial de Cliente',
};

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
          borderColor: 'border-red-500',
          iconBg: 'bg-red-500',
          iconColor: 'text-white',
          titleColor: 'text-red-400',
          buttonBorder: 'border-red-500 text-red-400 hover:bg-red-500/20',
          Icon: AlertCircle,
        };
      case 'warning':
        return {
          borderColor: 'border-yellow-500',
          iconBg: 'bg-yellow-500',
          iconColor: 'text-black',
          titleColor: 'text-yellow-400',
          buttonBorder: 'border-yellow-500 text-yellow-400 hover:bg-yellow-500/20',
          Icon: AlertTriangle,
        };
      default:
        return {
          borderColor: 'border-blue-500',
          iconBg: 'bg-blue-500',
          iconColor: 'text-white',
          titleColor: 'text-blue-400',
          buttonBorder: 'border-blue-500 text-blue-400 hover:bg-blue-500/20',
          Icon: Info,
        };
    }
  };

  const styles = getAlertStyles(currentAlert.type);
  const { Icon } = styles;
  const title = EVENT_TITLES[currentAlert.event] || currentAlert.event;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 duration-500">
      <div 
        className={`
          bg-[#1a1a1a] ${styles.borderColor} border rounded-2xl shadow-2xl 
          max-w-sm w-full sm:w-96 p-4
          backdrop-blur-sm
        `}
      >
        {/* Header con icono circular y título */}
        <div className="flex items-start gap-3">
          {/* Icono circular */}
          <div className={`${styles.iconBg} p-2.5 rounded-full flex-shrink-0`}>
            <Icon className={`w-5 h-5 ${styles.iconColor}`} />
          </div>
          
          {/* Contenido */}
          <div className="flex-1 min-w-0">
            {/* Título con icono de reloj */}
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <h3 className={`font-semibold text-base ${styles.titleColor}`}>
                {title}
              </h3>
            </div>
            
            {/* Mensaje */}
            <p className="text-sm text-muted-foreground leading-relaxed">
              {currentAlert.message}
            </p>
            
            {/* Información adicional (si hay) */}
            {currentAlert.action_text && (
              <p className="text-xs text-muted-foreground/70 mt-1">
                {currentAlert.action_text}
              </p>
            )}
          </div>
          
          {/* Botón cerrar */}
          <button
            onClick={handleDismiss}
            className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Botones de acción */}
        <div className="flex gap-2 mt-4">
          {currentAlert.action_url && (
            <button
              onClick={handleAction}
              className={`
                flex items-center justify-center gap-2 px-4 py-2 rounded-lg 
                font-medium text-sm border transition-colors
                ${styles.buttonBorder}
              `}
            >
              <Bell className="w-4 h-4" />
              {currentAlert.action_text || 'Ver detalles'}
            </button>
          )}
          <button
            onClick={handleDismiss}
            className="px-4 py-2 rounded-lg font-medium text-sm border border-border text-muted-foreground hover:bg-accent transition-colors"
          >
            Descartar
          </button>
        </div>

        {/* Indicador de cola */}
        {queue.length > 0 && (
          <div className="mt-3 text-xs text-center text-muted-foreground/60">
            {queue.length} alerta{queue.length > 1 ? 's' : ''} más en cola
          </div>
        )}
      </div>
    </div>
  );
}
