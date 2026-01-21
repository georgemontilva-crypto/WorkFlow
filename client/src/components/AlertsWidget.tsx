import { AlertCircle, Calendar, MoreVertical } from 'lucide-react';
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

  // Filter only pending reminders and take first 4
  const pendingReminders = (reminders || [])
    .filter((r: any) => r.status === 'pending')
    .slice(0, 4);

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'payment': return 'Pago';
      case 'meeting': return 'Reunión';
      case 'deadline': return 'Fecha límite';
      case 'personal': return 'Personal';
      default: return 'Otro';
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', { 
      day: 'numeric', 
      month: 'short',
      year: 'numeric'
    });
  };

  const getBorderColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#EF4444'; // Rojo
      case 'medium': return '#EAB308'; // Amarillo
      case 'low': return '#10B981'; // Verde
      default: return '#3B82F6'; // Azul
    }
  };

  const getStatusBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <span className="px-2 py-1 rounded-md text-xs font-medium bg-red-500/20 text-red-300">Alta</span>;
      case 'medium':
        return <span className="px-2 py-1 rounded-md text-xs font-medium bg-yellow-500/20 text-yellow-300">Media</span>;
      case 'low':
        return <span className="px-2 py-1 rounded-md text-xs font-medium bg-green-500/20 text-green-300">Baja</span>;
      default:
        return <span className="px-2 py-1 rounded-md text-xs font-medium bg-blue-500/20 text-blue-300">Normal</span>;
    }
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

      {/* Alerts List - Vertical Stack */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        ) : pendingReminders.length > 0 ? (
          pendingReminders.map((reminder: any) => (
            <div 
              key={reminder.id} 
              className="relative bg-[#1C1C1C] rounded-lg p-4 border border-border/50 hover:border-primary/30 transition-all"
              style={{ borderLeftWidth: '4px', borderLeftColor: getBorderColor(reminder.priority) }}
            >
              {/* Content */}
              <div className="space-y-2">
                {/* Title */}
                <h4 className="text-base font-semibold text-white leading-tight">
                  {reminder.title}
                </h4>
                
                {/* Category/Description */}
                <p className="text-sm text-muted-foreground">
                  {reminder.description || getCategoryLabel(reminder.category)}
                </p>
                
                {/* Divider */}
                <div className="border-t border-border/30 my-2"></div>
                
                {/* Footer: Date and Badge */}
                <div className="flex items-center justify-between">
                  <div className="text-xs text-muted-foreground">
                    {formatDate(reminder.reminder_date)}
                    {reminder.reminder_time && (
                      <span className="ml-2">
                        {reminder.reminder_time}
                      </span>
                    )}
                  </div>
                  {getStatusBadge(reminder.priority)}
                </div>
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
