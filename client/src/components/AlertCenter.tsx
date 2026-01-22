/**
 * AlertCenter - Centro de alertas persistente
 * Muestra todas las alertas del usuario con filtros y acciones
 * Design Philosophy: Apple Minimalism - Clean, functional, informative
 */

import { useState } from 'react';
import { X, Info, AlertTriangle, AlertCircle, Check, Trash2, Filter } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { useLocation } from 'wouter';

type AlertType = 'info' | 'warning' | 'critical';

interface AlertCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AlertCenter({ isOpen, onClose }: AlertCenterProps) {
  const [, setLocation] = useLocation();
  const [filterType, setFilterType] = useState<AlertType | 'all'>('all');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  // Fetch alerts
  const { data: alerts, refetch } = trpc.alerts.list.useQuery({
    unreadOnly: showUnreadOnly,
    type: filterType !== 'all' ? filterType : undefined,
  }, {
    enabled: isOpen,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Mutations
  const markAsReadMutation = trpc.alerts.markAsRead.useMutation({
    onSuccess: () => refetch(),
  });

  const markAllAsReadMutation = trpc.alerts.markAllAsRead.useMutation({
    onSuccess: () => refetch(),
  });

  const deleteMutation = trpc.alerts.delete.useMutation({
    onSuccess: () => refetch(),
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

  const handleAction = (alert: any) => {
    if (alert.action_url) {
      setLocation(alert.action_url);
      onClose();
    }
  };

  const getAlertIcon = (type: AlertType) => {
    switch (type) {
      case 'critical':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getAlertBadge = (type: AlertType) => {
    switch (type) {
      case 'critical':
        return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">Crítico</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Advertencia</Badge>;
      default:
        return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">Info</Badge>;
    }
  };

  if (!isOpen) return null;

  const unreadCount = alerts?.filter(a => a.is_read === 0).length || 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="fixed right-0 top-0 bottom-0 w-full sm:w-[480px] bg-background border-l border-border shadow-2xl animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold">Centro de Alertas</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {unreadCount > 0 ? `${unreadCount} sin leer` : 'Todo al día'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-accent rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
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

          {/* Filter by type */}
          <div className="flex gap-2 mt-3">
            {(['all', 'critical', 'warning', 'info'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`
                  px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                  ${filterType === type
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-accent hover:bg-accent/80'
                  }
                `}
              >
                {type === 'all' ? 'Todas' : type === 'critical' ? 'Críticas' : type === 'warning' ? 'Advertencias' : 'Info'}
              </button>
            ))}
          </div>
        </div>

        {/* Alerts List */}
        <div className="overflow-y-auto h-[calc(100vh-240px)]">
          {!alerts || alerts.length === 0 ? (
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
              {alerts.map((alert) => (
                <Card
                  key={alert.id}
                  className={`
                    p-4 transition-all cursor-pointer
                    ${alert.is_read === 0
                      ? 'bg-accent/50 border-l-4 border-l-primary'
                      : 'bg-card hover:bg-accent/30'
                    }
                  `}
                  onClick={() => alert.is_read === 0 && handleMarkAsRead(alert.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      {getAlertIcon(alert.type as AlertType)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {getAlertBadge(alert.type as AlertType)}
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(alert.created_at), "d 'de' MMM, HH:mm", { locale: es })}
                        </span>
                      </div>
                      <p className="text-sm font-medium mb-1">{alert.event}</p>
                      <p className="text-sm text-muted-foreground">{alert.message}</p>

                      {alert.required_plan && (
                        <Badge variant="outline" className="mt-2 text-xs">
                          Requiere plan {alert.required_plan.toUpperCase()}
                        </Badge>
                      )}

                      {alert.action_url && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAction(alert);
                          }}
                          className="mt-3 w-full"
                        >
                          {alert.action_text || 'Ver detalles'}
                        </Button>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(alert.id);
                      }}
                      className="p-1.5 hover:bg-destructive/10 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
