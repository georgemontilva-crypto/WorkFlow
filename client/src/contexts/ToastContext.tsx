/**
 * TOAST CONTEXT - Sistema de gestión global de notificaciones
 * 
 * Proporciona un hook useToast() para mostrar notificaciones desde cualquier componente
 */

import * as React from "react";
import { Toast, ToastProps, ToastVariant } from "../components/ui/toast";

interface ToastContextValue {
  showToast: (options: Omit<ToastProps, "id" | "onClose">) => void;
  success: (description: string, title?: string) => void;
  error: (description: string, title?: string) => void;
  warning: (description: string, title?: string) => void;
  info: (description: string, title?: string) => void;
}

const ToastContext = React.createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastProps[]>([]);

  const showToast = React.useCallback((options: Omit<ToastProps, "id" | "onClose">) => {
    const id = Math.random().toString(36).substring(7);
    const newToast: ToastProps = {
      ...options,
      id,
      onClose: removeToast,
    };
    setToasts((prev) => [...prev, newToast]);
  }, []);

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const success = React.useCallback((description: string, title?: string) => {
    showToast({ description, title, variant: "success" });
  }, [showToast]);

  const error = React.useCallback((description: string, title?: string) => {
    showToast({ description, title, variant: "error" });
  }, [showToast]);

  const warning = React.useCallback((description: string, title?: string) => {
    showToast({ description, title, variant: "warning" });
  }, [showToast]);

  const info = React.useCallback((description: string, title?: string) => {
    showToast({ description, title, variant: "info" });
  }, [showToast]);

  const value = React.useMemo(
    () => ({ showToast, success, error, warning, info }),
    [showToast, success, error, warning, info]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      
      {/* Toast Container - Fixed bottom-right */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <Toast {...toast} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}
