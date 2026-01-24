import { MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EventCardProps {
  title: string;
  description: string;
  category: 'green' | 'blue' | 'purple';
  date: string;
  attendees: number;
  status: string;
  onExportCalendar?: () => void;
  onSendEmail?: () => void;
}

const categoryNames = {
  green: 'Confirmado',
  blue: 'En Progreso',
  purple: 'Pendiente',
};

export default function EventCard({
  title,
  description,
  category,
  date,
  attendees,
  status,
  onExportCalendar,
  onSendEmail,
}: EventCardProps) {
  // Colores del borde lateral según categoría
  const borderColors = {
    green: '#2ECC71',
    blue: '#3498DB',
    purple: '#9B59B6',
  };

  // Colores del badge de estado
  const badgeStyles = {
    green: 'bg-green-500 text-white',
    blue: 'border border-blue-500 text-blue-500 bg-transparent',
    purple: 'border border-purple-500 text-purple-500 bg-transparent',
  };

  return (
    <div 
      className="relative overflow-hidden rounded-lg bg-card border border-border transition-all duration-200 hover:border-primary/30"
      style={{ borderLeftWidth: '4px', borderLeftColor: borderColors[category] }}
    >
      {/* Content */}
      <div className="p-5">
        {/* Header con título y menú */}
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
          <Button variant="ghost" size="icon" className="h-6 w-6 -mr-2 -mt-1 text-primary hover:text-primary/80">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </div>
        
        {/* Descripción */}
        <p className="text-sm text-muted-foreground mb-4">{description}</p>

        {/* Footer con fecha, asistentes y badge */}
        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground space-y-0.5">
            <p>{date}</p>
            <p>{attendees} asistentes</p>
          </div>
          <span className={`text-xs font-medium px-3 py-1 rounded-md ${badgeStyles[category]}`}>
            {categoryNames[category]}
          </span>
        </div>
      </div>
    </div>
  );
}
