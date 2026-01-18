/**
 * ReminderAlert Component - Popup notifications for overdue and urgent reminders
 * Design Philosophy: Apple Minimalism with attention-grabbing animations
 */

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, Clock, X, Eye } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

type AlertType = 'overdue' | 'urgent';

interface ReminderAlertProps {
  type: AlertType;
  count: number;
  onView: () => void;
  onDismiss: () => void;
}

export function ReminderAlert({ type, count, onView, onDismiss }: ReminderAlertProps) {
  const { t } = useLanguage();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Animate in after mount
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(onDismiss, 300); // Wait for animation to complete
  };

  const handleView = () => {
    setIsVisible(false);
    setTimeout(onView, 300);
  };

  const config = type === 'overdue' 
    ? {
        icon: AlertCircle,
        title: t.reminders.overdueAlert,
        message: `${count} ${count === 1 ? 'factura vencida' : 'facturas vencidas'}`,
        borderColor: 'border-red-500',
        bgColor: 'bg-red-500/10',
        iconColor: 'text-red-500',
        glowClass: 'shadow-[0_0_20px_rgba(239,68,68,0.3)]'
      }
    : {
        icon: Clock,
        title: t.reminders.urgentAlert,
        message: `${count} ${count === 1 ? 'factura próxima' : 'facturas próximas'} a vencer`,
        borderColor: 'border-orange-500',
        bgColor: 'bg-orange-500/10',
        iconColor: 'text-orange-500',
        glowClass: 'shadow-[0_0_20px_rgba(249,115,22,0.3)]'
      };

  const Icon = config.icon;

  return (
    <div
      className={`fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 transition-all duration-300 ease-out ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
      }`}
      style={{ maxWidth: '400px', width: 'calc(100vw - 2rem)' }}
    >
      <Card 
        className={`
          bg-popover border-2 ${config.borderColor} ${config.glowClass}
          animate-pulse-border
        `}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {/* Icon */}
            <div className={`p-2 rounded-lg ${config.bgColor} ${config.iconColor} flex-shrink-0 animate-bounce-subtle`}>
              <Icon className="w-6 h-6" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground mb-1 text-sm sm:text-base">
                {config.title}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {config.message}
              </p>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mt-3">
                <Button
                  size="sm"
                  onClick={handleView}
                  className="bg-primary text-primary-foreground hover:opacity-90 w-full sm:w-auto"
                >
                  <Eye className="w-3 h-3 mr-1" />
                  Ver
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleDismiss}
                  className="border-border text-muted-foreground hover:bg-accent w-full sm:w-auto text-xs sm:text-sm"
                >
                  No recordar más
                </Button>
              </div>
            </div>

            {/* Close button */}
            <button
              onClick={handleDismiss}
              className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </CardContent>
      </Card>

      <style>{`
        @keyframes pulse-border {
          0%, 100% {
            border-color: ${type === 'overdue' ? 'rgb(239 68 68)' : 'rgb(249 115 22)'};
          }
          50% {
            border-color: ${type === 'overdue' ? 'rgb(239 68 68 / 0.5)' : 'rgb(249 115 22 / 0.5)'};
          }
        }

        @keyframes bounce-subtle {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-2px);
          }
        }

        .animate-pulse-border {
          animation: pulse-border 2s ease-in-out infinite;
        }

        .animate-bounce-subtle {
          animation: bounce-subtle 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
