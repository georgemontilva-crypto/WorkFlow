/**
 * PaymentNotifications - Sistema de notificaciones de pagos
 * Muestra popups en la esquina inferior derecha para pagos cercanos y vencidos
 */

import { useEffect, useState } from 'react';
import { X, AlertCircle, Clock } from 'lucide-react';
import { differenceInDays } from 'date-fns';
import { trpc } from '@/lib/trpc';
import { useLocation } from 'wouter';
import { useLanguage } from '@/contexts/LanguageContext';

type NotificationType = 'overdue' | 'upcoming' | null;

export function PaymentNotifications() {
  const [, setLocation] = useLocation();
  const { t } = useLanguage();
  const [showNotification, setShowNotification] = useState<NotificationType>(null);
  const [overdueCount, setOverdueCount] = useState(0);
  const [upcomingCount, setUpcomingCount] = useState(0);

  // Fetch clients
  const { data: allClients } = trpc.clients.list.useQuery();
  const clients = allClients?.filter(c => c.status === 'active') || [];

  useEffect(() => {
    if (!clients || clients.length === 0) return;

    // Check localStorage for dismissed notifications
    const dismissedOverdue = localStorage.getItem('dismissedOverdueNotification');
    const dismissedUpcoming = localStorage.getItem('dismissedUpcomingNotification');
    const lastCheck = localStorage.getItem('lastPaymentNotificationCheck');
    const now = new Date().getTime();

    // Reset dismissals every 24 hours
    if (lastCheck && now - parseInt(lastCheck) > 24 * 60 * 60 * 1000) {
      localStorage.removeItem('dismissedOverdueNotification');
      localStorage.removeItem('dismissedUpcomingNotification');
      localStorage.setItem('lastPaymentNotificationCheck', now.toString());
    }

    // Count overdue payments
    const overdue = clients.filter(c => {
      const daysUntil = differenceInDays(new Date(c.next_payment_date), new Date());
      return daysUntil < 0;
    });

    // Count upcoming payments (within reminder_days)
    const upcoming = clients.filter(c => {
      const daysUntil = differenceInDays(new Date(c.next_payment_date), new Date());
      return daysUntil >= 0 && daysUntil <= c.reminder_days;
    });

    setOverdueCount(overdue.length);
    setUpcomingCount(upcoming.length);

    // Show overdue notification first (priority)
    if (overdue.length > 0 && !dismissedOverdue) {
      setTimeout(() => setShowNotification('overdue'), 2000);
    }
    // Show upcoming notification if no overdue
    else if (upcoming.length > 0 && !dismissedUpcoming) {
      setTimeout(() => setShowNotification('upcoming'), 2000);
    }
  }, [clients]);

  const handleDismiss = () => {
    if (showNotification === 'overdue') {
      localStorage.setItem('dismissedOverdueNotification', 'true');
    } else if (showNotification === 'upcoming') {
      localStorage.setItem('dismissedUpcomingNotification', 'true');
    }
    setShowNotification(null);
  };

  const handleViewReminders = () => {
    setLocation('/reminders');
    handleDismiss();
  };

  if (!showNotification) return null;

  const isOverdue = showNotification === 'overdue';
  const count = isOverdue ? overdueCount : upcomingCount;
  const borderColor = isOverdue ? 'border-red-500' : 'border-yellow-500';
  const bgColor = isOverdue ? 'bg-red-500/10' : 'bg-yellow-500/10';
  const textColor = isOverdue ? 'text-red-600 dark:text-red-400' : 'text-yellow-600 dark:text-yellow-400';
  const Icon = isOverdue ? AlertCircle : Clock;
  const title = isOverdue 
    ? (t.notifications?.overduePayments || 'Pagos Vencidos')
    : (t.notifications?.upcomingPayments || 'Pagos Próximos');
  const message = isOverdue
    ? (t.notifications?.overdueMessage || `Tienes ${count} cliente${count > 1 ? 's' : ''} con pagos vencidos`)
    : (t.notifications?.upcomingMessage || `Tienes ${count} cliente${count > 1 ? 's' : ''} con pagos próximos`);

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 duration-500">
      <div 
        className={`
          ${bgColor} ${borderColor} border rounded-lg shadow-2xl 
          max-w-sm w-full sm:w-96 p-4
          backdrop-blur-sm
        `}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`${bgColor} p-2 rounded-full`}>
              <Icon className={`w-5 h-5 ${textColor}`} />
            </div>
            <div>
              <h3 className={`font-bold text-base ${textColor}`}>
                {title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {message}
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={handleViewReminders}
            className={`
              flex-1 px-4 py-2 rounded-lg font-medium text-sm
              ${isOverdue 
                ? 'bg-red-500 hover:bg-red-600 text-white' 
                : 'bg-yellow-500 hover:bg-yellow-600 text-white'
              }
              transition-colors
            `}
          >
            {t.notifications?.viewReminders || 'Ver Recordatorios'}
          </button>
          <button
            onClick={handleDismiss}
            className="px-4 py-2 rounded-lg font-medium text-sm border border-border hover:bg-accent transition-colors"
          >
            {t.common?.dismiss || 'Descartar'}
          </button>
        </div>
      </div>
    </div>
  );
}
