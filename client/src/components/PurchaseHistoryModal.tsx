/**
 * Purchase History Modal Component
 * Shows all purchase records for a specific cryptocurrency
 */

import { useState } from 'react';
import { X, Calendar, TrendingUp, DollarSign, Hash, Edit2, Check, XIcon, Trash2, Plus } from 'lucide-react';
import { trpc } from '../lib/trpc';
import { useToast } from '../contexts/ToastContext';

interface PurchaseHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  symbol: string;
  name: string;
}

export default function PurchaseHistoryModal({
  isOpen,
  onClose,
  symbol,
  name,
}: PurchaseHistoryModalProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValues, setEditValues] = useState({ quantity: '', buy_price: '' });
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPurchase, setNewPurchase] = useState({ quantity: '', buy_price: '' });
  const toast = useToast();
  const utils = trpc.useUtils();
  
  // Fetch purchases for this symbol
  const { data: purchases = [], isLoading } = trpc.crypto.getPurchasesBySymbol.useQuery(
    { symbol },
    { enabled: isOpen && !!symbol }
  );
  
  // Update purchase mutation
  const updatePurchaseMutation = trpc.crypto.updatePurchase.useMutation({
    onSuccess: () => {
      toast.success('Compra actualizada exitosamente');
      utils.crypto.getPurchasesBySymbol.invalidate({ symbol });
      utils.crypto.getProjectSummaries.invalidate();
      setEditingId(null);
    },
    onError: (error) => {
      toast.error('Error al actualizar: ' + error.message);
    },
  });
  
  // Delete purchase mutation
  const deletePurchaseMutation = trpc.crypto.deletePurchase.useMutation({
    onSuccess: () => {
      toast.success('Compra eliminada exitosamente');
      utils.crypto.getPurchasesBySymbol.invalidate({ symbol });
      utils.crypto.getProjectSummaries.invalidate();
      setDeletingId(null);
    },
    onError: (error) => {
      toast.error('Error al eliminar: ' + error.message);
      setDeletingId(null);
    },
  });
  
  // Add purchase mutation
  const addPurchaseMutation = trpc.crypto.addPurchase.useMutation({
    onSuccess: () => {
      toast.success('Compra agregada exitosamente');
      utils.crypto.getPurchasesBySymbol.invalidate({ symbol });
      utils.crypto.getProjectSummaries.invalidate();
      setNewPurchase({ quantity: '', buy_price: '' });
      setShowAddForm(false);
    },
    onError: (error) => {
      toast.error('Error al agregar compra: ' + error.message);
    },
  });
  
  const handleStartEdit = (purchase: any) => {
    setEditingId(purchase.id);
    setEditValues({
      quantity: purchase.quantity,
      buy_price: purchase.buy_price,
    });
  };
  
  const handleSaveEdit = (purchaseId: number) => {
    updatePurchaseMutation.mutate({
      id: purchaseId,
      quantity: editValues.quantity,
      buy_price: editValues.buy_price,
    });
  };
  
  const handleCancelEdit = () => {
    setEditingId(null);
    setEditValues({ quantity: '', buy_price: '' });
  };
  
  const handleDelete = (purchaseId: number) => {
    setDeletingId(purchaseId);
  };
  
  const handleConfirmDelete = (purchaseId: number) => {
    deletePurchaseMutation.mutate({ id: purchaseId });
  };
  
  const handleCancelDelete = () => {
    setDeletingId(null);
  };
  
  const handleAddPurchase = () => {
    if (!newPurchase.quantity || !newPurchase.buy_price) {
      toast.warning('Por favor completa todos los campos');
      return;
    }
    
    const quantity = parseFloat(newPurchase.quantity);
    const buyPrice = parseFloat(newPurchase.buy_price);
    
    if (isNaN(quantity) || quantity <= 0) {
      toast.warning('La cantidad debe ser un número positivo');
      return;
    }
    
    if (isNaN(buyPrice) || buyPrice <= 0) {
      toast.warning('El precio debe ser un número positivo');
      return;
    }
    
    addPurchaseMutation.mutate({
      symbol: symbol.toUpperCase(),
      quantity,
      buy_price: buyPrice,
      currency: 'USD',
    });
  };

  if (!isOpen) return null;

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatNumber = (value: number | string) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 8,
    });
  };

  const calculateTotal = (quantity: string, price: string) => {
    const q = parseFloat(quantity);
    const p = parseFloat(price);
    return (q * p).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-[#121212] border border-[rgba(255,255,255,0.1)] rounded-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[rgba(255,255,255,0.06)]">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">Historial de Compras</h2>
            <p className="text-sm text-[#8B92A8]">
              {name} ({symbol})
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-2 px-4 py-2 bg-[#C4FF3D] text-black rounded-xl font-semibold hover:bg-[#b3e835] transition-all"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Agregar Compra</span>
            </button>
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-xl border border-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.05)] hover:border-[rgba(255,255,255,0.2)] transition-all"
            >
              <X className="w-5 h-5 text-[#8B92A8]" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Add Purchase Form */}
          {showAddForm && (
            <div className="bg-[#0A0A0A] border border-[#C4FF3D] rounded-xl p-5 mb-4">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Plus className="w-5 h-5 text-[#C4FF3D]" />
                Nueva Compra
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm text-[#8B92A8] mb-2">Cantidad ({symbol})</label>
                  <input
                    type="text"
                    value={newPurchase.quantity}
                    onChange={(e) => setNewPurchase({ ...newPurchase, quantity: e.target.value })}
                    placeholder="0.00"
                    className="w-full bg-[#121212] border border-[rgba(255,255,255,0.1)] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#C4FF3D] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm text-[#8B92A8] mb-2">Precio de Compra (USD)</label>
                  <input
                    type="text"
                    value={newPurchase.buy_price}
                    onChange={(e) => setNewPurchase({ ...newPurchase, buy_price: e.target.value })}
                    placeholder="0.00"
                    className="w-full bg-[#121212] border border-[rgba(255,255,255,0.1)] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#C4FF3D] transition-all"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleAddPurchase}
                  disabled={addPurchaseMutation.isLoading}
                  className="flex-1 bg-[#C4FF3D] text-black font-semibold py-3 rounded-lg hover:bg-[#b3e835] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {addPurchaseMutation.isLoading ? 'Agregando...' : 'Agregar Compra'}
                </button>
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setNewPurchase({ quantity: '', buy_price: '' });
                  }}
                  className="px-6 py-3 border border-[rgba(255,255,255,0.1)] text-white rounded-lg hover:bg-[rgba(255,255,255,0.05)] transition-all"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
          
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-[#C4FF3D] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : purchases.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 bg-[#0A0A0A] rounded-full flex items-center justify-center mb-4">
                <TrendingUp className="w-8 h-8 text-[#8B92A8]" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Sin registros</h3>
              <p className="text-sm text-[#8B92A8]">
                No hay compras registradas para {name}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {purchases.map((purchase: any, index: number) => (
                <div
                  key={purchase.id}
                  className="bg-[#0A0A0A] border border-[rgba(255,255,255,0.04)] rounded-xl p-5 hover:border-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.02)] transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#121212] rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-[#C4FF3D]">#{index + 1}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Calendar className="w-4 h-4 text-[#8B92A8]" />
                          <span className="text-sm text-white font-medium">
                            {formatDate(purchase.created_at)}
                          </span>
                        </div>
                        <p className="text-xs text-[#8B92A8]">Fecha de compra</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {deletingId === purchase.id ? (
                        <>
                          <button
                            onClick={() => handleConfirmDelete(purchase.id)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-all"
                            title="Confirmar eliminación"
                          >
                            <Check className="w-4 h-4 text-red-500" />
                          </button>
                          <button
                            onClick={handleCancelDelete}
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.1)] transition-all"
                            title="Cancelar"
                          >
                            <XIcon className="w-4 h-4 text-[#8B92A8]" />
                          </button>
                        </>
                      ) : editingId === purchase.id ? (
                        <>
                          <button
                            onClick={() => handleSaveEdit(purchase.id)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-green-500/10 border border-green-500/20 hover:bg-green-500/20 transition-all"
                          >
                            <Check className="w-4 h-4 text-green-500" />
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-all"
                          >
                            <XIcon className="w-4 h-4 text-red-500" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleStartEdit(purchase)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg border border-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.05)] hover:border-[rgba(255,255,255,0.2)] transition-all"
                            title="Editar"
                          >
                            <Edit2 className="w-4 h-4 text-[#8B92A8]" />
                          </button>
                          <button
                            onClick={() => handleDelete(purchase.id)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg border border-[rgba(255,255,255,0.1)] hover:bg-red-500/10 hover:border-red-500/20 transition-all group"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4 text-[#8B92A8] group-hover:text-red-500" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Quantity */}
                    <div className="bg-[#121212] rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Hash className="w-4 h-4 text-[#C4FF3D]" />
                        <p className="text-xs text-[#8B92A8]">Cantidad</p>
                      </div>
                      {editingId === purchase.id ? (
                        <input
                          type="text"
                          value={editValues.quantity}
                          onChange={(e) => setEditValues({ ...editValues, quantity: e.target.value })}
                          className="w-full bg-[#0A0A0A] border border-[rgba(255,255,255,0.1)] rounded-lg px-3 py-2 text-lg font-bold text-white focus:outline-none focus:border-[#C4FF3D]"
                        />
                      ) : (
                        <p className="text-lg font-bold text-white">
                          {formatNumber(purchase.quantity)} {symbol}
                        </p>
                      )}
                    </div>

                    {/* Price */}
                    <div className="bg-[#121212] rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="w-4 h-4 text-[#C4FF3D]" />
                        <p className="text-xs text-[#8B92A8]">Precio de compra</p>
                      </div>
                      {editingId === purchase.id ? (
                        <input
                          type="text"
                          value={editValues.buy_price}
                          onChange={(e) => setEditValues({ ...editValues, buy_price: e.target.value })}
                          className="w-full bg-[#0A0A0A] border border-[rgba(255,255,255,0.1)] rounded-lg px-3 py-2 text-lg font-bold text-white focus:outline-none focus:border-[#C4FF3D]"
                        />
                      ) : (
                        <>
                          <p className="text-lg font-bold text-white">
                            ${formatNumber(purchase.buy_price)}
                          </p>
                          <p className="text-xs text-[#8B92A8] mt-1">{purchase.currency}</p>
                        </>
                      )}
                    </div>

                    {/* Total */}
                    <div className="bg-[#121212] rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-4 h-4 text-[#C4FF3D]" />
                        <p className="text-xs text-[#8B92A8]">Total invertido</p>
                      </div>
                      <p className="text-lg font-bold text-white">
                        ${calculateTotal(purchase.quantity, purchase.buy_price)}
                      </p>
                      <p className="text-xs text-[#8B92A8] mt-1">{purchase.currency}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {!isLoading && purchases.length > 0 && (
          <div className="p-6 border-t border-[rgba(255,255,255,0.06)] bg-[#0A0A0A]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#8B92A8] mb-1">Total de registros</p>
                <p className="text-2xl font-bold text-white">{purchases.length}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-[#8B92A8] mb-1">Total invertido</p>
                <p className="text-2xl font-bold text-[#C4FF3D]">
                  $
                  {purchases
                    .reduce((acc: number, p: any) => {
                      return acc + parseFloat(p.quantity) * parseFloat(p.buy_price);
                    }, 0)
                    .toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
