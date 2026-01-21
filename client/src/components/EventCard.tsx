

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
  const borderColors = {
    green: 'border-l-green-500',
    blue: 'border-l-blue-500',
    purple: 'border-l-purple-500',
  };

  return (
    <div className={`relative overflow-hidden rounded-2xl bg-[#2A2A2A] border-l-4 ${borderColors[category]} p-6 hover:bg-[#303030] transition-all duration-300`}>
      {/* Content */}
      <div className="space-y-3">
        <div>
          <h3 className="text-lg font-bold text-white">{title}</h3>
          <p className="text-sm text-gray-400 mt-1">{description}</p>
        </div>

        {/* Meta Info */}
        <div className="flex items-center justify-between pt-2">
          <div className="text-xs text-gray-400 space-y-1">
            <p>{date}</p>
            <p>{attendees} asistentes</p>
          </div>
          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
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
