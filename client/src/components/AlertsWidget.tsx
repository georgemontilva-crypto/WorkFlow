import { AlertCircle, Calendar } from 'lucide-react';
import { Link } from 'wouter';
import { trpc } from '@/lib/trpc';

interface Reminder {
  id: number;
  title: string;
  description: string | null;
  reminderDate: string;
  reminderTime: string | null;
  category: string;
  priority: string;
  status: string;
}

export function AlertsWidget() {
  const { data: reminders, isLoading } = trpc.reminders.list.useQuery();

  // Filter only pending reminders and take first 5
  const pendingReminders = (reminders || [])
    .filter((r: any) => r.status === 'pending')
    .slice(0, 5);

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'payment': return 'Pago pendiente';
      case 'meeting': return 'Reunión';
      case 'deadline': return 'Fecha límite';
      case 'personal': return 'Personal';
      default: return 'Recordatorio';
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', { 
      day: 'numeric', 
      month: 'short'
    });
  };

  return (
    <div className="bg-card border border-border rounded-xl p-5 h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">Alertas de Hoy</h3>
        <Link href="/reminders" className="text-sm text-primary hover:text-primary/80 transition-colors">
          Ver Todo
        </Link>
      </div>

      {/* Alerts List */}
      <div className="space-y-1">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        ) : pendingReminders.length > 0 ? (
          pendingReminders.map((reminder: any) => (
            <div key={reminder.id} className="alert-list-item">
              {/* Alert Icon - Red circle with exclamation */}
              <div className="alert-icon">
                <AlertCircle className="w-3.5 h-3.5 text-red-500" />
              </div>
              
              {/* Content */}
              <div className="alert-content">
                <p className="alert-title">
                  {reminder.title}
                </p>
                <p className="alert-subtitle">
                  {getCategoryLabel(reminder.category)}
                </p>
                <p className="alert-meta">
                  {formatDate(reminder.reminder_date)}
                  {reminder.reminder_time && ` • ${reminder.reminder_time}`}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No hay alertas pendientes</p>
          </div>
        )}
      </div>
    </div>
  );
}
