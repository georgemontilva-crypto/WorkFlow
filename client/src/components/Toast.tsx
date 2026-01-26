/**
 * Toast - Notificación emergente temporal
 * Diseño minimalista consistente con Finwrk
 */

import { useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  onClose: () => void;
}

export default function Toast({ message, type = 'info', duration = 3000, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-[#C4FF3D]" />,
    error: <XCircle className="w-5 h-5 text-red-500" />,
    warning: <AlertTriangle className="w-5 h-5 text-yellow-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />,
  };

  const borderColors = {
    success: '#C4FF3D',
    error: '#ef4444',
    warning: '#eab308',
    info: '#3b82f6',
  };

  return (
    <div 
      className="fixed top-6 right-6 z-50 bg-[#121212] rounded-[20px] p-4 shadow-2xl backdrop-blur-sm animate-slide-in-right"
      style={{ 
        boxShadow: `inset 0 0 0 1px ${borderColors[type]}, 0 10px 40px rgba(0,0,0,0.5)`,
        minWidth: '320px',
        maxWidth: '480px'
      }}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {icons[type]}
        </div>
        <p className="text-white text-sm flex-1 leading-relaxed">
          {message}
        </p>
        <button
          onClick={onClose}
          className="flex-shrink-0 text-[#8B92A8] hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
