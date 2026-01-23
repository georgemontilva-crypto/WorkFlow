/**
 * AlertCenter - Centro de alertas persistente
 * 
 * FUENTE ÚNICA DE VERDAD: Todas las alertas se leen desde la base de datos.
 * Este panel muestra TODAS las alertas persistentes del usuario:
 * - Facturas vencidas/próximas
 * - Pagos confirmados
 * - Alertas de sistema
 * - Alertas de precio
 * - Alertas generadas por IA
 * 
 * Las alertas NO desaparecen cuando el toast se cierra.
 * Solo desaparecen cuando el usuario las borra manualmente o las marca como resueltas.
 */

import { useState } from 'react';
import { X, Info, AlertTriangle, AlertCircle, Check, Trash2, Filter, Bell, Trash } from 'lucide-react';
import { AlertAIAnalysis } from './AlertAIAnalysis';
import { trpc } from '@/lib/trpc';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';

type AlertType = 'info' | 'warning' | 'critical';

interface AlertCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

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
  'price_alert_triggered': 'Alerta de Precio Activada',
  // Proactive AI insights
  'proactive_income': 'Análisis de Ingresos',
  'proactive_clients': 'Análisis de Clientes',
  'proactive_payments': 'Análisis de Pagos',
  'proactive_activity': 'Análisis de Actividad',
  'proactive_goals': 'Progreso de Metas',
  'proactive_risk': 'Análisis de Riesgo',
};

export function AlertCenter({ isOpen, onClose }: AlertCenterProps) {
  const [, setLocation] = useLocation();
  const [filterType, setFilterType] = useState<AlertType | 'all'>('all');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const utils = trpc.useUtils();

  // Fetch alerts from database - this is the single source of truth
  const { data: alerts, refetch, isLoading } = trpc.alerts.list.useQuery({
    unreadOnly: showUnreadOnly,
    type: filterType !== 'all' ? filterType : undefined,
  }, {
    enabled: isOpen,
    refetchInterval: 10000, // Refetch every 10 seconds to stay in sync
  });

  // Mutations
  const markAsReadMutation = trpc.alerts.markAsRead.useMutation({
    onSuccess: () => {
      refetch();
      utils.alerts.unreadCount.invalidate(); // Update badge immediately
    },
  });

  const markAllAsReadMutation = trpc.alerts.markAllAsRead.useMutation({
    onSuccess: () => {
      refetch();
      utils.alerts.unreadCount.invalidate(); // Update badge immediately
    },
  });

  const deleteMutation = trpc.alerts.delete.useMutation({
    onSuccess: () => {
      refetch();
      utils.alerts.unreadCount.invalidate(); // Update badge immediately
    },
  });

  const deleteAllMutation = trpc.alerts.deleteAll.useMutation({
    onSuccess: () => {
      refetch();
      utils.alerts.unreadCount.invalidate(); // Update badge immediately
      setIsDeleting(false);
    },
    onError: () => {
      setIsDeleting(false);
    },
  });

  const handleMarkAsRead = async (id: number) => {
    await markAsReadMutation.mutateAsync({ id });
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsReadMutation.mutateAsync();
  };

  const handleDelete = async (id: number) => {
    if (confirm('¿Estás seguro de que quieres eliminar esta alerta?')) {
      await deleteMutation.mutateAsync({ id });
    }
  };

  const handleDeleteAll = async () => {
    if (confirm('¿Estás seguro de que quieres eliminar TODAS las alertas? Esta acción no se puede deshacer.')) {
      setIsDeleting(true);
      await deleteAllMutation.mutateAsync();
    }
  };

  const handleAction = (alert: any) => {
    if (alert.action_url) {
      setLocation(alert.action_url);
      onClose();
    }
  };

  const getAlertStyles = (type: AlertType) => {
    switch (type) {
      case 'critical':
        return {
          borderColor: 'border-red-500',
          iconBorder: 'border-2 border-red-500',
          iconColor: 'text-red-500',
          titleColor: 'text-red-400',
          buttonBorder: 'border-2 border-red-500 text-red-400 hover:border-red-400 hover:text-red-300',
          Icon: AlertCircle,
        };
      case 'warning':
        return {
          borderColor: 'border-yellow-500',
          iconBorder: 'border-2 border-yellow-500',
          iconColor: 'text-yellow-500',
          titleColor: 'text-yellow-400',
          buttonBorder: 'border-2 border-yellow-500 text-yellow-400 hover:border-yellow-400 hover:text-yellow-300',
          Icon: AlertTriangle,
        };
      default:
        return {
          borderColor: 'border-blue-500',
          iconBorder: 'border-2 border-blue-500',
          iconColor: 'text-blue-500',
          titleColor: 'text-blue-400',
          buttonBorder: 'border-2 border-blue-500 text-blue-400 hover:border-blue-400 hover:text-blue-300',
          Icon: Info,
        };
    }
  };

  if (!isOpen) return null;

  const unreadCount = alerts?.filter(a => a.is_read === 0).length || 0;
  const totalCount = alerts?.length || 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="fixed right-0 top-0 bottom-0 w-full sm:w-[480px] bg-background border-l border-border shadow-2xl animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold">Centro de Alertas</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {totalCount === 0 
                  ? 'Todo al día' 
                  : unreadCount > 0 
                    ? `${unreadCount} sin leer de ${totalCount} total`
                    : `${totalCount} alertas`
                }
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-accent rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Actions Row 1 */}
          <div className="flex gap-2 w-full">
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllAsRead}
              disabled={unreadCount === 0}
              className="flex-1"
            >
              <Check className="w-4 h-4 mr-2" />
              Marcar todas como leídas
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowUnreadOnly(!showUnreadOnly)}
              className={showUnreadOnly ? 'bg-accent' : ''}
            >
              <Filter className="w-4 h-4" />
            </Button>
          </div>

          {/* Actions Row 2 - Delete All */}
          <div className="mt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDeleteAll}
              disabled={totalCount === 0 || isDeleting}
              className="w-full border-destructive/50 text-destructive hover:bg-destructive/10 hover:border-destructive"
            >
              <Trash className="w-4 h-4 mr-2" />
              {isDeleting ? 'Eliminando...' : 'Borrar todas las alertas'}
            </Button>
          </div>

          {/* Filter by type */}
          <div className="flex gap-2 mt-3 w-full">
            {(['all', 'critical', 'warning', 'info'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`
                  flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                  border-2
                  ${filterType === type
                    ? type === 'critical' 
                      ? 'border-red-500 text-red-400'
                      : type === 'warning'
                      ? 'border-yellow-500 text-yellow-400'
                      : type === 'info'
                      ? 'border-blue-500 text-blue-400'
                      : 'border-primary text-primary'
                    : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
                  }
                `}
              >
                {type === 'all' ? 'Todas' : type === 'critical' ? 'Críticas' : type === 'warning' ? 'Advertencias' : 'Info'}
              </button>
            ))}
          </div>
        </div>

        {/* Alerts List */}
        <div className="overflow-y-auto h-[calc(100vh-280px)]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-sm text-muted-foreground">Cargando alertas...</p>
            </div>
          ) : !alerts || alerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <Info className="w-16 h-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hay alertas</h3>
              <p className="text-sm text-muted-foreground">
                {showUnreadOnly
                  ? 'No tienes alertas sin leer'
                  : 'Cuando recibas alertas, aparecerán aquí'}
              </p>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {alerts.map((alert) => {
                const styles = getAlertStyles(alert.type as AlertType);
                const { Icon } = styles;
                const title = EVENT_TITLES[alert.event] || alert.event;

                return (
                  <div
                    key={alert.id}
                    className={`
                      bg-[#1a1a1a] ${styles.borderColor} border rounded-2xl p-4
                      transition-all cursor-pointer
                      ${alert.is_read === 0 ? 'border-l-4' : 'opacity-75'}
                    `}
                    onClick={() => alert.is_read === 0 && handleMarkAsRead(alert.id)}
                  >
                    <div className="flex items-start gap-3">
                      {/* Icono circular con solo borde */}
                      <div className={`${styles.iconBorder} p-2.5 rounded-full flex-shrink-0`}>
                        <Icon className={`w-5 h-5 ${styles.iconColor}`} />
                      </div>
                      
                      {/* Contenido */}
                      <div className="flex-1 min-w-0">
                        {/* Título con indicador de no leído */}
                        <div className="flex items-center gap-2">
                          <h3 className={`font-semibold text-base ${styles.titleColor}`}>
                            {title}
                          </h3>
                          {alert.is_read === 0 && (
                            <span className="w-2 h-2 bg-primary rounded-full" />
                          )}
                        </div>
                        
                        {/* Fecha */}
                        <p className="text-xs text-muted-foreground mb-2">
                          {format(new Date(alert.created_at), "d 'de' MMM, HH:mm", { locale: es })}
                        </p>
                        
                        {/* Mensaje */}
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {alert.message}
                        </p>

                        {/* Botón de acción - Ancho completo */}
                        {alert.action_url && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAction(alert);
                            }}
                            className={`
                              w-full mt-3 flex items-center justify-center gap-2 px-4 py-2 rounded-lg 
                              font-medium text-sm border transition-colors
                              ${styles.buttonBorder}
                            `}
                          >
                            <Bell className="w-4 h-4" />
                            Ver
                          </button>
                        )}

                        {/* AI Analysis - Solo para alertas critical y warning */}
                        {(alert.type === 'critical' || alert.type === 'warning') && (
                          <div onClick={(e) => e.stopPropagation()}>
                            <AlertAIAnalysis 
                              alertId={alert.id} 
                              alertType={alert.type as 'critical' | 'warning'}
                              onActionClick={(action) => {
                                // Handle AI suggested actions
                                if (action === 'view_invoice' && alert.action_url) {
                                  handleAction(alert);
                                } else if (action === 'send_reminder') {
                                  // Could trigger a reminder action
                                  handleAction(alert);
                                } else if (action === 'mark_resolved') {
                                  handleMarkAsRead(alert.id);
                                }
                              }}
                            />
                          </div>
                        )}
                      </div>
                      
                      {/* Botón eliminar */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(alert.id);
                        }}
                        className="p-1.5 hover:bg-destructive/10 rounded-lg transition-colors flex-shrink-0"
                      >
                        <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border bg-background">
          <p className="text-xs text-center text-muted-foreground">
            Las alertas se sincronizan automáticamente cada 10 segundos
          </p>
        </div>
      </div>
    </div>
  );
}
