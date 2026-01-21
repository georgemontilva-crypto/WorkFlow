import { MoreVertical } from 'lucide-react';

interface EventCardProps {
  title: string;
  description: string;
  category: 'green' | 'blue' | 'purple';
  date: string;
  attendees: number;
  status: string;
}

const categoryColors = {
  green: 'category-green',
  blue: 'category-blue',
  purple: 'category-purple',
};

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
}: EventCardProps) {
  return (
    <div className="card-event group">
      {/* Category Badge */}
      <div className="absolute top-4 right-4">
        <button className="p-2 hover:bg-muted rounded-lg opacity-0 group-hover:opacity-100 transition-all">
          <MoreVertical size={18} />
        </button>
      </div>

      {/* Category Color Indicator - Left border */}
      <div className={`absolute top-0 left-0 w-1 h-12 ${categoryColors[category]}`} />

      {/* Content */}
      <div className="pl-4 space-y-3">
        <div>
          <h3 className="text-lg font-bold text-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        </div>

        {/* Meta Info */}
        <div className="flex items-center justify-between pt-2 border-t border-border/30">
          <div className="text-xs text-muted-foreground">
            <p>{date}</p>
            <p>{attendees} asistentes</p>
          </div>
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
            category === 'green' ? 'bg-green-500/20 text-green-400' :
            category === 'blue' ? 'bg-blue-500/20 text-blue-400' :
            'bg-purple-500/20 text-purple-400'
          }`}>
            {categoryNames[category]}
          </span>
        </div>
      </div>
    </div>
  );
}
