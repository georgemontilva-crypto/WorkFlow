/**
 * TOAST COMPONENT - Sistema de notificaciones personalizado Finwrk
 * 
 * CARACTERÍSTICAS:
 * - Aparece en esquina inferior derecha
 * - Estilos consistentes con el diseño de Finwrk
 * - Variantes: success, error, warning, info
 * - Auto-dismiss después de 5 segundos
 * - Animación suave de entrada/salida
 */

import * as React from "react";
import { X, CheckCircle2, AlertCircle, AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastVariant = "success" | "error" | "warning" | "info";

export interface ToastProps {
  id: string;
  title?: string;
  description: string;
  variant?: ToastVariant;
  duration?: number;
  onClose: (id: string) => void;
}

const variantStyles: Record<ToastVariant, { icon: React.ComponentType<any>; colors: string }> = {
  success: {
    icon: CheckCircle2,
    colors: "shadow-[inset_0_0_0_0.5px_#4ADE80] bg-[#4ADE80]/5 text-[#4ADE80]",
  },
  error: {
    icon: AlertCircle,
    colors: "shadow-[inset_0_0_0_0.5px_#EF4444] bg-[#EF4444]/5 text-[#EF4444]",
  },
  warning: {
    icon: AlertTriangle,
    colors: "shadow-[inset_0_0_0_0.5px_#F59E0B] bg-[#F59E0B]/5 text-[#F59E0B]",
  },
  info: {
    icon: Info,
    colors: "shadow-[inset_0_0_0_0.5px_#8B92A8] bg-[#8B92A8]/5 text-[#8B92A8]",
  },
};

export function Toast({
  id,
  title,
  description,
  variant = "info",
  duration = 5000,
  onClose,
}: ToastProps) {
  const [isExiting, setIsExiting] = React.useState(false);
  const { icon: Icon, colors } = variantStyles[variant];

  React.useEffect(() => {
    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose(id);
    }, 300); // Duración de la animación de salida
  };

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-4 rounded-[28px] bg-[#0A0A0A] min-w-[320px] max-w-[420px]",
        "transition-all duration-300 ease-out",
        colors,
        isExiting
          ? "opacity-0 translate-x-full"
          : "opacity-100 translate-x-0 animate-slide-in-right"
      )}
    >
      {/* Icon */}
      <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />

      {/* Content */}
      <div className="flex-1 min-w-0">
        {title && (
          <h4 className="text-sm font-semibold text-white mb-1">{title}</h4>
        )}
        <p className="text-sm text-[#E0E0E0]">{description}</p>
      </div>

      {/* Close Button */}
      <button
        onClick={handleClose}
        className="flex-shrink-0 text-[#8B92A8] hover:text-white transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
