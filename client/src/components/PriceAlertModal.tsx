/**
 * Price Alert Modal Component
 * Allows users to create and manage price alerts for cryptocurrencies
 */

import { useState, useEffect } from 'react';
import { X, Bell, TrendingUp, TrendingDown, Mail, Smartphone } from 'lucide-react';
import { trpc } from '../lib/trpc';
import { useToast } from '../contexts/ToastContext';

interface PriceAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  crypto: {
    symbol: string;
    name: string;
    current_price: number;
    image: string;
  };
}

export default function PriceAlertModal({ isOpen, onClose, crypto }: PriceAlertModalProps) {
  const toast = useToast();
  const utils = trpc.useContext();

  const [formData, setFormData] = useState({
    targetPrice: '',
    condition: 'above' as 'above' | 'below',
    notifyEmail: true,
    notifyApp: true,
  });

  // Get existing alerts for this crypto
  const { data: existingAlerts, refetch: refetchAlerts } = trpc.priceAlerts.getBySymbol.useQuery(
    { symbol: crypto.symbol.toUpperCase() },
    { enabled: isOpen }
  );

  const createAlertMutation = trpc.priceAlerts.create.useMutation({
    onSuccess: () => {
      toast.success('Alerta creada correctamente');
      setFormData({
        targetPrice: '',
        condition: 'above',
        notifyEmail: true,
        notifyApp: true,
      });
      refetchAlerts();
      utils.priceAlerts.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || 'Error al crear alerta');
    },
  });

  const deleteAlertMutation = trpc.priceAlerts.delete.useMutation({
    onSuccess: () => {
      toast.success('Alerta eliminada');
      refetchAlerts();
      utils.priceAlerts.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || 'Error al eliminar alerta');
    },
  });

  const toggleAlertMutation = trpc.priceAlerts.toggleStatus.useMutation({
    onSuccess: () => {
      refetchAlerts();
      utils.priceAlerts.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || 'Error al actualizar alerta');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.targetPrice || parseFloat(formData.targetPrice) <= 0) {
      toast.warning('Ingresa un precio objetivo válido');
      return;
    }

    createAlertMutation.mutate({
      symbol: crypto.symbol.toUpperCase(),
      type: 'crypto',
      target_price: formData.targetPrice,
      condition: formData.condition,
      notify_email: formData.notifyEmail,
      notify_app: formData.notifyApp,
    });
  };

  const handleDelete = (alertId: number) => {
    if (confirm('¿Eliminar esta alerta?')) {
      deleteAlertMutation.mutate({ alertId });
    }
  };

  const handleToggle = (alertId: number, isActive: boolean) => {
    toggleAlertMutation.mutate({ alertId, isActive: !isActive });
  };

  if (!isOpen) return null;

  const activeAlerts = existingAlerts?.filter(a => a.is_active === 1) || [];
  const triggeredAlerts = existingAlerts?.filter(a => a.triggered_at) || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}>
      <div className="bg-[#0A0A0A] border border-[rgba(255,255,255,0.06)] rounded-[20px] w-full max-w-2xl max-h-[70vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-[#121212] border-b border-[rgba(255,255,255,0.06)] p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={crypto.image} alt={crypto.name} className="w-10 h-10 rounded-full" />
            <div>
              <h2 className="text-xl font-semibold text-white">{crypto.name}</h2>
              <p className="text-sm text-[#8B92A8]">
                Precio actual: ${crypto.current_price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 8 })}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[rgba(255,255,255,0.05)] rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-[#8B92A8]" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Create Alert Form */}
          <div className="bg-[#0A0A0A] border border-[rgba(255,255,255,0.06)] rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Bell className="w-5 h-5 text-[#C4FF3D]" />
              Crear Nueva Alerta
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Target Price */}
              <div>
                <label className="block text-sm font-medium text-[#8B92A8] mb-2">
                  Precio Objetivo (USD)
                </label>
                <input
                  type="number"
                  step="any"
                  value={formData.targetPrice}
                  onChange={(e) => setFormData({ ...formData, targetPrice: e.target.value })}
                  placeholder="Ej: 50000"
                  className="w-full bg-[#121212] border border-[rgba(255,255,255,0.06)] rounded-lg px-4 py-3 text-white placeholder-[#8B92A8] focus:outline-none focus:border-[#C4FF3D] transition-colors"
                />
              </div>

              {/* Condition */}
              <div>
                <label className="block text-sm font-medium text-[#8B92A8] mb-2">
                  Condición
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, condition: 'above' })}
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                      formData.condition === 'above'
                        ? 'bg-[#C4FF3D]/10 border-[#C4FF3D] text-[#C4FF3D]'
                        : 'bg-[#121212] border-[rgba(255,255,255,0.06)] text-[#8B92A8] hover:border-[rgba(255,255,255,0.1)]'
                    }`}
                  >
                    <TrendingUp className="w-5 h-5" />
                    <span className="font-medium">Mayor o igual</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, condition: 'below' })}
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                      formData.condition === 'below'
                        ? 'bg-[#C4FF3D]/10 border-[#C4FF3D] text-[#C4FF3D]'
                        : 'bg-[#121212] border-[rgba(255,255,255,0.06)] text-[#8B92A8] hover:border-[rgba(255,255,255,0.1)]'
                    }`}
                  >
                    <TrendingDown className="w-5 h-5" />
                    <span className="font-medium">Menor o igual</span>
                  </button>
                </div>
              </div>

              {/* Notification Options */}
              <div>
                <label className="block text-sm font-medium text-[#8B92A8] mb-3">
                  Notificaciones
                </label>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={formData.notifyApp}
                      onChange={(e) => setFormData({ ...formData, notifyApp: e.target.checked })}
                      className="w-5 h-5 rounded border-[rgba(255,255,255,0.06)] bg-[#121212] text-[#C4FF3D] focus:ring-[#C4FF3D] focus:ring-offset-0"
                    />
                    <Smartphone className="w-5 h-5 text-[#8B92A8] group-hover:text-white transition-colors" />
                    <span className="text-white group-hover:text-[#C4FF3D] transition-colors">
                      Notificación en la app
                    </span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={formData.notifyEmail}
                      onChange={(e) => setFormData({ ...formData, notifyEmail: e.target.checked })}
                      className="w-5 h-5 rounded border-[rgba(255,255,255,0.06)] bg-[#121212] text-[#C4FF3D] focus:ring-[#C4FF3D] focus:ring-offset-0"
                    />
                    <Mail className="w-5 h-5 text-[#8B92A8] group-hover:text-white transition-colors" />
                    <span className="text-white group-hover:text-[#C4FF3D] transition-colors">
                      Notificación por email
                    </span>
                  </label>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={createAlertMutation.isLoading}
                className="w-full bg-transparent border-2 border-[#C4FF3D] text-[#C4FF3D] py-3 rounded-lg font-semibold hover:bg-[#C4FF3D] hover:text-black transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createAlertMutation.isLoading ? 'Creando...' : 'Crear Alerta'}
              </button>
            </form>
          </div>

          {/* Active Alerts */}
          {activeAlerts.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Alertas Activas</h3>
              <div className="space-y-2">
                {activeAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="bg-[#0A0A0A] border border-[rgba(255,255,255,0.06)] rounded-lg p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      {alert.condition === 'above' ? (
                        <TrendingUp className="w-5 h-5 text-[#C4FF3D]" />
                      ) : (
                        <TrendingDown className="w-5 h-5 text-[#C4FF3D]" />
                      )}
                      <div>
                        <p className="text-white font-medium">
                          {alert.condition === 'above' ? '≥' : '≤'} $
                          {parseFloat(alert.target_price).toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 8,
                          })}
                        </p>
                        <p className="text-xs text-[#8B92A8]">
                          {new Date(alert.created_at).toLocaleDateString('es-ES')}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(alert.id)}
                      className="p-2 hover:bg-[rgba(255,255,255,0.05)] rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4 text-[#8B92A8]" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Triggered Alerts History */}
          {triggeredAlerts.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Historial de Alertas</h3>
              <div className="space-y-2">
                {triggeredAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="bg-[#0A0A0A] border border-[rgba(255,255,255,0.06)] rounded-lg p-4 opacity-60"
                  >
                    <div className="flex items-center gap-3">
                      {alert.condition === 'above' ? (
                        <TrendingUp className="w-5 h-5 text-[#8B92A8]" />
                      ) : (
                        <TrendingDown className="w-5 h-5 text-[#8B92A8]" />
                      )}
                      <div>
                        <p className="text-white font-medium">
                          {alert.condition === 'above' ? '≥' : '≤'} $
                          {parseFloat(alert.target_price).toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 8,
                          })}
                        </p>
                        <p className="text-xs text-[#8B92A8]">
                          Disparada: {new Date(alert.triggered_at!).toLocaleString('es-ES')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {activeAlerts.length === 0 && triggeredAlerts.length === 0 && (
            <div className="text-center py-8">
              <Bell className="w-12 h-12 text-[#8B92A8] mx-auto mb-3" />
              <p className="text-[#8B92A8]">No tienes alertas para {crypto.symbol}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
