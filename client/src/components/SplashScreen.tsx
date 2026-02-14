/**
 * SplashScreen - Pantalla de carga inicial
 * Se muestra mientras la aplicación está cargando
 */

import { useEffect, useState } from 'react';

interface SplashScreenProps {
  onComplete?: () => void;
  minDuration?: number;
}

export function SplashScreen({ onComplete, minDuration = 2000 }: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onComplete?.();
    }, minDuration);

    return () => clearTimeout(timer);
  }, [minDuration, onComplete]);

  if (!isVisible) return null;

  return (
    <div 
      className="fixed inset-0 z-[9999]"
      style={{
        backgroundColor: '#0a0a0a',
      }}
    >
      <img 
        src="/splash-screen.jpg" 
        alt="Finwrk" 
        className="w-full h-full object-cover"
      />
    </div>
  );
}
