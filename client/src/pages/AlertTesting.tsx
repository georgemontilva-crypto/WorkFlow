import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { client } from "@/lib/trpc";
import { Bell, Trash2, CheckCircle2, AlertCircle, Info } from "lucide-react";

export default function AlertTesting() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const { data: alerts, refetch } = client.alerts.list.useQuery({});
  const { data: unreadCount } = client.alerts.unreadCount.useQuery();

  const generateTestAlerts = client.alerts.generateTestAlerts.useMutation({
    onSuccess: (data) => {
      setMessage(`✅ ${data.message}`);
      refetch();
      setTimeout(() => setMessage(""), 5000);
    },
    onError: (error) => {
      setMessage(`❌ Error: ${error.message}`);
      setTimeout(() => setMessage(""), 5000);
    },
  });

  const markAllAsRead = client.alerts.markAllAsRead.useMutation({
    onSuccess: () => {
      setMessage("✅ Todas las alertas marcadas como leídas");
      refetch();
      setTimeout(() => setMessage(""), 3000);
    },
  });

  const deleteAlert = client.alerts.delete.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const handleGenerateAlerts = async () => {
    setLoading(true);
    await generateTestAlerts.mutateAsync();
    setLoading(false);
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead.mutateAsync();
  };

  const handleDeleteAlert = async (id: number) => {
    if (confirm("¿Eliminar esta alerta?")) {
      await deleteAlert.mutateAsync({ id });
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "critical":
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case "warning":
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case "info":
        return <Info className="w-5 h-5 text-blue-500" />;
      default:
        return <Bell className="w-5 h-5" />;
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Sistema de Alertas - Testing</h1>
        <p className="text-muted-foreground">
          Herramienta de prueba para el sistema de alertas robusto
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Bell className="w-8 h-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Total Alertas</p>
              <p className="text-2xl font-bold">{alerts?.length || 0}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-8 h-8 text-yellow-500" />
            <div>
              <p className="text-sm text-muted-foreground">No Leídas</p>
              <p className="text-2xl font-bold">{unreadCount || 0}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-8 h-8 text-green-500" />
            <div>
              <p className="text-sm text-muted-foreground">Leídas</p>
              <p className="text-2xl font-bold">
                {(alerts?.length || 0) - (unreadCount || 0)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Actions */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Acciones de Prueba</h2>
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={handleGenerateAlerts}
            disabled={loading}
            className="gap-2"
          >
            <Bell className="w-4 h-4" />
            Generar Alertas de Prueba
          </Button>

          <Button
            variant="outline"
            onClick={handleMarkAllAsRead}
            disabled={!unreadCount}
            className="gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            Marcar Todas como Leídas
          </Button>
        </div>

        {message && (
          <div className="mt-4 p-3 bg-accent rounded-lg text-sm">
            {message}
          </div>
        )}
      </Card>

      {/* Alerts List */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">
          Alertas Actuales ({alerts?.length || 0})
        </h2>

        {!alerts || alerts.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No hay alertas. Genera algunas para probar el sistema.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert: any) => (
              <div
                key={alert.id}
                className={`
                  p-4 rounded-lg border transition-all
                  ${
                    alert.is_read === 0
                      ? "bg-accent/50 border-l-4 border-l-primary"
                      : "bg-card"
                  }
                `}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-1">{getAlertIcon(alert.type)}</div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div>
                        <span
                          className={`
                            inline-block px-2 py-0.5 rounded text-xs font-medium
                            ${
                              alert.type === "critical"
                                ? "bg-red-500/20 text-red-500"
                                : alert.type === "warning"
                                ? "bg-yellow-500/20 text-yellow-500"
                                : "bg-blue-500/20 text-blue-500"
                            }
                          `}
                        >
                          {alert.type.toUpperCase()}
                        </span>
                        <span className="ml-2 text-xs text-muted-foreground">
                          {alert.event}
                        </span>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteAlert(alert.id)}
                        className="h-8 w-8 p-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    <p className="text-sm mb-2">{alert.message}</p>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>
                        {new Date(alert.created_at).toLocaleString("es-ES")}
                      </span>
                      {alert.is_read === 0 && (
                        <span className="text-primary font-medium">
                          No leída
                        </span>
                      )}
                      {alert.shown_as_toast === 1 && (
                        <span>Mostrada como toast</span>
                      )}
                      {alert.required_plan && (
                        <span>Plan: {alert.required_plan}</span>
                      )}
                    </div>

                    {alert.action_url && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() => window.open(alert.action_url, "_self")}
                      >
                        {alert.action_text || "Ver"}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Instructions */}
      <Card className="p-6 bg-accent/30">
        <h2 className="text-xl font-semibold mb-3">Cómo Probar</h2>
        <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
          <li>Haz clic en "Generar Alertas de Prueba" para crear 6 alertas de ejemplo</li>
          <li>Observa el contador de alertas no leídas en el header (icono de campana)</li>
          <li>Abre el Centro de Alertas haciendo clic en la campana</li>
          <li>Las alertas marcadas como "toast" aparecerán temporalmente en la esquina inferior derecha</li>
          <li>Haz clic en una alerta no leída para marcarla como leída</li>
          <li>Usa "Marcar Todas como Leídas" para limpiar el contador</li>
          <li>Elimina alertas individuales con el botón de basura</li>
        </ol>
      </Card>
    </div>
  );
}
