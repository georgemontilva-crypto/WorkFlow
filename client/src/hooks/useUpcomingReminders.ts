/**
 * useUpcomingReminders Hook
 * Verifica recordatorios que están a 5 minutos de su hora programada
 * y muestra notificaciones flotantes
 */

import { useEffect, useRef, useState } from 'react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { Bell } from 'lucide-react';

interface UpcomingReminder {
  id: number;
  title: string;
  description: string | null;
  reminder_date: string;
  reminder_time: string | null;
  category: string;
  priority: string;
}

export function useUpcomingReminders() {
  const { data: reminders } = trpc.reminders.list.useQuery();
  const [notifiedReminders, setNotifiedReminders] = useState<Set<number>>(new Set());
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Crear el elemento de audio para la notificación
    if (!audioRef.current) {
      audioRef.current = new Audio('/notification.mp3');
      audioRef.current.volume = 0.5;
    }
  }, []);

  useEffect(() => {
    if (!reminders || reminders.length === 0) return;

    // Verificar cada minuto si hay recordatorios próximos
    const checkInterval = setInterval(() => {
      const now = new Date();
      const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);
      const sixMinutesFromNow = new Date(now.getTime() + 6 * 60 * 1000);

      reminders.forEach((reminder: any) => {
        // Solo procesar recordatorios pendientes
        if (reminder.status !== 'pending') return;

        // Si ya se notificó este recordatorio, saltar
        if (notifiedReminders.has(reminder.id)) return;

        // Construir la fecha/hora del recordatorio
        const reminderDateTime = new Date(reminder.reminder_date);
        
        if (reminder.reminder_time) {
          const [hours, minutes] = reminder.reminder_time.split(':');
          reminderDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        } else {
          // Si no hay hora específica, usar 9:00 AM
          reminderDateTime.setHours(9, 0, 0, 0);
        }

        // Verificar si el recordatorio está entre 5 y 6 minutos en el futuro
        // (ventana de 1 minuto para asegurar que se capture)
        if (reminderDateTime >= fiveMinutesFromNow && reminderDateTime <= sixMinutesFromNow) {
          showReminderNotification(reminder);
          setNotifiedReminders(prev => new Set(prev).add(reminder.id));
        }
      });
    }, 60000); // Verificar cada minuto

    // También verificar inmediatamente al montar
    const now = new Date();
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);
    const sixMinutesFromNow = new Date(now.getTime() + 6 * 60 * 1000);

    reminders.forEach((reminder: any) => {
      if (reminder.status !== 'pending') return;
      if (notifiedReminders.has(reminder.id)) return;

      const reminderDateTime = new Date(reminder.reminder_date);
      
      if (reminder.reminder_time) {
        const [hours, minutes] = reminder.reminder_time.split(':');
        reminderDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      } else {
        reminderDateTime.setHours(9, 0, 0, 0);
      }

      if (reminderDateTime >= fiveMinutesFromNow && reminderDateTime <= sixMinutesFromNow) {
        showReminderNotification(reminder);
        setNotifiedReminders(prev => new Set(prev).add(reminder.id));
      }
    });

    return () => clearInterval(checkInterval);
  }, [reminders, notifiedReminders]);

  const showReminderNotification = (reminder: UpcomingReminder) => {
    // Reproducir sonido
    if (audioRef.current) {
      audioRef.current.play().catch(err => {
        console.log('No se pudo reproducir el sonido de notificación:', err);
      });
    }

    // Mostrar notificación del navegador si está permitido
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('🔔 Recordatorio en 5 minutos', {
        body: reminder.title,
        icon: '/hiwork-icon.png',
        tag: `reminder-${reminder.id}`,
      });
    }

    // Mostrar toast con diseño personalizado
    const priorityEmoji = {
      high: '🔴',
      medium: '🟡',
      low: '🟢',
    }[reminder.priority] || '🟡';

    const categoryEmoji = {
      meeting: '👥',
      payment: '💰',
      deadline: '⏰',
      follow_up: '📞',
      personal: '👤',
      other: '📌',
    }[reminder.category] || '📌';

    toast(
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 p-2 bg-orange-500/20 rounded-lg">
          <Bell className="w-5 h-5 text-orange-500" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-base font-semibold">
              {priorityEmoji} {categoryEmoji} {reminder.title}
            </span>
          </div>
          {reminder.description && (
            <p className="text-sm text-muted-foreground mb-2">
              {reminder.description}
            </p>
          )}
          <p className="text-xs text-orange-600 font-medium">
            ⏰ En 5 minutos
          </p>
        </div>
      </div>,
      {
        duration: 10000, // 10 segundos
        position: 'bottom-right',
        className: 'border-2 border-orange-500 shadow-lg',
      }
    );
  };

  // Solicitar permiso para notificaciones del navegador
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  return {
    notifiedReminders,
  };
}
