import { useEffect, useRef, useState } from 'react';

export function useNotification() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    // Initialize audio
    audioRef.current = new Audio('/notification.mp3');
    audioRef.current.volume = 0.5;

    // Request notification permission
    if ('Notification' in window) {
      setPermission(Notification.permission);
      
      if (Notification.permission === 'default') {
        Notification.requestPermission().then(perm => {
          setPermission(perm);
        });
      }
    }
  }, []);

  const playSound = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(err => {
        console.error('Error playing notification sound:', err);
      });
    }
  };

  const vibrate = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([200, 100, 200]);
    }
  };

  const showNotification = (title: string, options?: NotificationOptions) => {
    if (permission === 'granted' && 'Notification' in window) {
      new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...options,
      });
    }
  };

  const notify = (title: string, body?: string, options?: {
    sound?: boolean;
    vibrate?: boolean;
    desktop?: boolean;
  }) => {
    const {
      sound = true,
      vibrate: shouldVibrate = true,
      desktop = true,
    } = options || {};

    // Play sound
    if (sound) {
      playSound();
    }

    // Vibrate
    if (shouldVibrate) {
      vibrate();
    }

    // Show desktop notification
    if (desktop && document.hidden) {
      showNotification(title, { body });
    }
  };

  return {
    notify,
    playSound,
    vibrate,
    showNotification,
    permission,
  };
}
