/**
 * AlertToast - Sistema de toasts temporales con prioridades
 * 
 * IMPORTANTE: Los toasts son SOLO una representación visual temporal.
 * - NO eliminan alertas del sistema
 * - NO afectan el estado persistente en la base de datos
 * - Las alertas permanecen en el Centro de Alertas hasta que el usuario las borre
 * 
 * Flujo:
 * 1. Se consultan alertas no leídas de la DB
 * 2. Se filtran las que deben mostrarse como toast (shown_as_toast = 1)
 * 3. Se muestran una por una según prioridad (critical > warning > info)
 * 4. Al cerrar el toast, la alerta sigue en el Centro de Alertas
 * 5. Solo se muestra cada toast una vez por sesión (localStorage)
 */

import { useEffect, useState, useCallback } from 'react';
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
  shown_as_toast?: number;
  created_at?: string;
}

const TOAST_DURATION = 5000; // 5 seconds
const PRIORITY_ORDER: AlertType[] = ['critical', 'warning', 'info'];
const SHOWN_TOASTS_KEY = 'finwrk_shown_toasts';

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
  'price_alert': 'Alerta de Precio',
  'Facturas Vencidas': 'Facturas Vencidas',
  'Comprobantes Pendientes': 'Comprobantes Pendientes',
  'Facturas Próximas a Vencer': 'Facturas Próximas a Vencer',
  'Ingresos Mensuales Bajos': 'Ingresos Mensuales Bajos',
  'Ingresos Mensuales en Aumento': 'Ingresos Mensuales en Aumento',
  'Mes Sin Ingresos': 'Mes Sin Ingresos',
  'Límite de Plan Alcanzado': 'Límite de Plan Alcanzado',
  'Función Pro Bloqueada': 'Función Pro Bloqueada',
  'Múltiples Facturas Pendientes': 'Múltiples Facturas Pendientes',
  'Cliente con Pagos Tardíos': 'Cliente con Pagos Tardíos',
};

// Get shown toast IDs from localStorage (session-based tracking)
function getShownToastIds(): Set<number> {
  try {
    const stored = localStorage.getItem(SHOWN_TOASTS_KEY);
    if (!stored) return new Set();
    return new Set(JSON.parse(stored));
  } catch {
    return new Set();
  }
}

// Add toast ID to shown list (only tracks which toasts have been displayed this session)
function markToastAsShown(id: number) {
  try {
    const shown = getShownToastIds();
    shown.add(id);
    // Keep only last 100 IDs to prevent localStorage bloat
    const arr = [...shown].slice(-100);
    localStorage.setItem(SHOWN_TOASTS_KEY, JSON.stringify(arr));
  } catch (error) {
    console.error('Error saving shown toast:', error);
  }
}

export function AlertToast() {
  const [, setLocation] = useLocation();
  const [currentAlert, setCurrentAlert] = useState<Alert | null>(null);
  const [queue, setQueue] = useState<Alert[]>([]);
  const [isExiting, setIsExiting] = useState(false);

  // Fetch unread alerts - these are alerts that haven't been marked as read
  // The toast system only shows alerts with shown_as_toast = 1
  const { data: alerts } = trpc.alerts.list.useQuery({
    unreadOnly: true,
  }, {
    refetchInterval: 10000, // Check every 10 seconds for new alerts
  });

  // Process alerts and build queue based on priority
  useEffect(() => {
    if (!alerts || alerts.length === 0) {
      setQueue([]);
      return;
    }

    // Filter alerts that should be shown as toast but haven't been shown yet in this session
    const shownIds = getShownToastIds();
    const pendingToasts = alerts.filter(a => {
      // shown_as_toast === 1 means this alert SHOULD be shown as a toast
      // Check if we haven't shown it yet in this session
      return a.shown_as_toast === 1 && !shownIds.has(a.id);
    });

    if (pendingToasts.length === 0) return;

    // Sort by priority (critical > warning > info) and then by date (newest first)
    const sortedAlerts = [...pendingToasts].sort((a, b) => {
      const priorityA = PRIORITY_ORDER.indexOf(a.type as AlertType);
      const priorityB = PRIORITY_ORDER.indexOf(b.type as AlertType);
      
      if (priorityA !== priorityB) {
        return priorityA - priorityB; // Lower index = higher priority
      }
      
      // Same priority, sort by date (newest first)
      if (a.created_at && b.created_at) {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      return 0;
    });

    setQueue(sortedAlerts as Alert[]);
  }, [alerts]);

  // Show next alert from queue
  useEffect(() => {
    if (currentAlert || queue.length === 0 || isExiting) return;

    const nextAlert = queue[0];
    setCurrentAlert(nextAlert);
    setQueue(prev => prev.slice(1));

    // Mark as shown in localStorage ONLY (NOT in database)
    // This prevents showing the same toast multiple times in the same session
    // But the alert remains in the database and AlertCenter
    markToastAsShown(nextAlert.id);

  }, [currentAlert, queue, isExiting]);

  // Auto-dismiss timer
  useEffect(() => {
    if (!currentAlert) return;

    const timer = setTimeout(() => {
      handleDismiss();
    }, TOAST_DURATION);

    return () => clearTimeout(timer);
  }, [currentAlert]);

  const handleDismiss = useCallback(() => {
    // Animate out
    setIsExiting(true);
    
    setTimeout(() => {
      setCurrentAlert(null);
      setIsExiting(false);
    }, 300); // Match animation duration
  }, []);

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
          iconBg: 'border-2 border-red-500',
          iconColor: 'text-red-500',
          titleColor: 'text-red-400',
          buttonBorder: 'border-2 border-red-500 text-red-400 hover:border-red-400 hover:text-red-300',
          Icon: AlertCircle,
        };
      case 'warning':
        return {
          borderColor: 'border-yellow-500',
          iconBg: 'border-2 border-yellow-500',
          iconColor: 'text-yellow-500',
          titleColor: 'text-yellow-400',
          buttonBorder: 'border-2 border-yellow-500 text-yellow-400 hover:border-yellow-400 hover:text-yellow-300',
          Icon: AlertTriangle,
        };
      default:
        return {
          borderColor: 'border-blue-500',
          iconBg: 'border-2 border-blue-500',
          iconColor: 'text-blue-500',
          titleColor: 'text-blue-400',
          buttonBorder: 'border-2 border-blue-500 text-blue-400 hover:border-blue-400 hover:text-blue-300',
          Icon: Info,
        };
    }
  };

  const styles = getAlertStyles(currentAlert.type);
  const { Icon } = styles;
  const title = EVENT_TITLES[currentAlert.event] || currentAlert.event;

  return (
    <div 
      className={`
        fixed bottom-6 right-6 z-50 
        ${isExiting ? 'animate-out slide-out-to-bottom-5 fade-out duration-300' : 'animate-in slide-in-from-bottom-5 duration-500'}
      `}
    >
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
            className="px-4 py-2 rounded-lg font-medium text-sm border-2 border-gray-600 text-gray-400 hover:border-gray-500 hover:text-gray-300 transition-colors"
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
        
        {/* Nota informativa */}
        <div className="mt-2 text-[10px] text-center text-muted-foreground/40">
          Esta alerta permanecerá en el Centro de Alertas
        </div>
      </div>
    </div>
  );
}
