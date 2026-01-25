/**
 * Finances Page - REDESIGNED
 * Financial analytics with monthly trend and comparative charts
 * 
 * PRINCIPIO FUNDAMENTAL:
 * - El sistema NO crea dinero
 * - El sistema SOLO LEE facturas pagadas y pagos registrados
 */

import { useState } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { Download, TrendingUp, TrendingDown, DollarSign, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import { trpc } from '../lib/trpc';
import { useToast } from '../contexts/ToastContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { getCurrency, formatCurrency as formatCurrencyUtil } from '@shared/currencies';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Finances() {
  const { success, error: showError } = useToast();
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    type: 'income' as 'income' | 'expense',
    category: 'other_income' as string,
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });
  
  // Month filter state
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  
  // Get user data
  const { data: user } = trpc.auth.me.useQuery();
  const currency = user?.primary_currency || 'USD';
  
  // Queries
  const utils = trpc.useContext();
  const { data: summary, isLoading: summaryLoading } = trpc.finances.getSummary.useQuery({ currency });
  const { data: incomeByMonth = [], isLoading: monthLoading } = trpc.finances.getIncomeByMonth.useQuery({ months: 12, currency });
  const { data: expensesByMonth = [], isLoading: expensesLoading } = trpc.finances.getExpensesByMonth?.useQuery?.({ months: 12, currency }) || { data: [], isLoading: false };
  const { data: history = [], isLoading: historyLoading } = trpc.finances.getHistory.useQuery({});
  
  // Mutations
  const createTransactionMutation = trpc.transactions.create.useMutation();
  
  // Handlers
  const handleOpenModal = () => {
    setFormData({
      type: 'income',
      category: 'other_income',
      amount: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
    });
    setIsModalOpen(true);
  };
  
  const handleCloseModal = () => {
    setIsModalOpen(false);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const amount = parseFloat(formData.amount);
      
      if (isNaN(amount) || amount <= 0) {
        showError('El monto debe ser mayor a 0');
        return;
      }
      
      if (!formData.description.trim()) {
        showError('La descripción es requerida');
        return;
      }
      
      await createTransactionMutation.mutateAsync({
        type: formData.type,
        category: formData.category as any,
        amount,
        currency,
        description: formData.description,
        date: formData.date,
      });
      
      success('Transacción creada exitosamente');
      handleCloseModal();
      
      // Invalidate queries to refresh data
      utils.finances.getSummary.invalidate();
      utils.finances.getIncomeByMonth.invalidate();
      utils.finances.getHistory.invalidate();
    } catch (error: any) {
      console.error('Error al crear transacción:', error);
      showError(error.message || 'Error al crear transacción');
    }
  };
  
  const getCategories = () => {
    if (formData.type === 'income') {
      return [
        { value: 'salary', label: 'Salario' },
        { value: 'freelance', label: 'Freelance' },
        { value: 'investment', label: 'Inversión' },
        { value: 'other_income', label: 'Otro Ingreso' },
      ];
    } else {
      return [
        { value: 'rent', label: 'Alquiler' },
        { value: 'utilities', label: 'Servicios' },
        { value: 'food', label: 'Alimentación' },
        { value: 'transportation', label: 'Transporte' },
        { value: 'healthcare', label: 'Salud' },
        { value: 'entertainment', label: 'Entretenimiento' },
        { value: 'other_expense', label: 'Otro Gasto' },
      ];
    }
  };
  
  // Month navigation handlers
  const handlePreviousMonth = () => {
    setSelectedMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() - 1);
      return newDate;
    });
  };
  
  const handleNextMonth = () => {
    setSelectedMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + 1);
      return newDate;
    });
  };
  
  const handleResetMonth = () => {
    setSelectedMonth(new Date());
  };
  
  // Filter transactions by selected month
  const filteredHistory = history.filter((transaction: any) => {
    const transactionDate = new Date(transaction.date);
    return (
      transactionDate.getMonth() === selectedMonth.getMonth() &&
      transactionDate.getFullYear() === selectedMonth.getFullYear()
    );
  });

  const formatCurrency = (amount: number) => {
    return formatCurrencyUtil(amount, currency);
  };

  const formatMonth = (month: number, year: number) => {
    const date = new Date(year, month - 1, 1);
    return format(date, 'MMM', { locale: es });
  };

  // Prepare data for Tendencia Mensual (Line Chart)
  // Generate all 12 months with data, filling missing months with 0
  const generateLast12Months = () => {
    const months = [];
    const now = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const month = date.getMonth() + 1;
      const year = date.getFullYear();
      
      // Find income for this month
      const monthData = incomeByMonth.find(item => item.month === month && item.year === year);
      
      months.push({
        month: formatMonth(month, year),
        fullDate: `${year}-${month.toString().padStart(2, '0')}`,
        income: monthData?.income || 0,
        expenses: 0 // TODO: Add expenses when available
      });
    }
    
    return months;
  };

  const trendData = generateLast12Months();

  // Prepare data for Comparativa Mensual (Bar Chart) - Last 2 months
  const comparativeData = trendData.slice(-2);

  // Calculate totals
  const totalIncome = summary?.totalIncome || 0;
  const totalExpenses = summary?.totalExpenses || 0;
  const balance = totalIncome - totalExpenses;

  // Export history handler
  const handleExportHistory = () => {
    if (history.length === 0) {
      showError('No hay transacciones para exportar');
      return;
    }

    // Create CSV content
    const headers = ['Fecha', 'Cliente', 'Factura', 'Monto', 'Moneda', 'Estado'];
    const rows = history.map(t => [
      format(new Date(t.date), 'dd/MM/yyyy'),
      t.client_name,
      t.invoice_number,
      t.amount.toFixed(2),
      currency,
      'Pagado'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `historial-financiero-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  return (
    <DashboardLayout>
      <div className="max-w-[1440px] mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Finanzas</h1>
            <p className="text-[#8B92A8] mt-1">Control de ingresos y gastos</p>
          </div>
          <Button 
            onClick={handleOpenModal}
            variant="default"
          >
            + Nueva Transacción
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Total Income */}
          <div className="bg-[#121212] border border-[rgba(255,255,255,0.06)] rounded-2xl p-4 md:p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[#8B92A8] text-sm">Total Ingresos</p>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            {summaryLoading ? (
              <div className="h-8 bg-gray-700 animate-pulse rounded"></div>
            ) : (
              <p className="text-3xl font-bold text-white">
                {formatCurrency(totalIncome)}
              </p>
            )}
          </div>

          {/* Total Expenses */}
          <div className="bg-[#121212] border border-[rgba(255,255,255,0.06)] rounded-2xl p-4 md:p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[#8B92A8] text-sm">Total Gastos</p>
              <TrendingDown className="w-5 h-5 text-red-500" />
            </div>
            <p className="text-3xl font-bold text-white">
              {formatCurrency(totalExpenses)}
            </p>
          </div>

          {/* Balance */}
          <div className="bg-[#121212] border border-[rgba(255,255,255,0.06)] rounded-2xl p-4 md:p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[#8B92A8] text-sm">Balance</p>
              <DollarSign className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-3xl font-bold text-white">
              {formatCurrency(balance)}
            </p>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tendencia Mensual (Line Chart) */}
          <div className="bg-[#121212] border border-[rgba(255,255,255,0.06)] rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-6">Tendencia Mensual</h2>
            {monthLoading ? (
              <div className="h-80 bg-gray-700 animate-pulse rounded"></div>
            ) : trendData.length === 0 ? (
              <div className="h-80 flex items-center justify-center text-gray-500">
                No hay datos de tendencia
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis 
                    dataKey="month" 
                    stroke="#888" 
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis 
                    stroke="#888" 
                    style={{ fontSize: '12px' }}
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1a1a1a', 
                      border: '1px solid #333',
                      borderRadius: '8px'
                    }}
                    labelStyle={{ color: '#fff' }}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="income" 
                    stroke="#fff" 
                    strokeWidth={2}
                    dot={{ fill: '#fff', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Comparativa Mensual (Bar Chart) */}
          <div className="bg-[#121212] border border-[rgba(255,255,255,0.06)] rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-6">Comparativa Mensual</h2>
            {monthLoading ? (
              <div className="h-80 bg-gray-700 animate-pulse rounded"></div>
            ) : comparativeData.length === 0 ? (
              <div className="h-80 flex items-center justify-center text-gray-500">
                No hay datos comparativos
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={comparativeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis 
                    dataKey="month" 
                    stroke="#888" 
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis 
                    stroke="#888" 
                    style={{ fontSize: '12px' }}
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1a1a1a', 
                      border: '1px solid #333',
                      borderRadius: '8px'
                    }}
                    labelStyle={{ color: '#fff' }}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Bar dataKey="income" fill="#fff" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="expenses" fill="#6b7280" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Transacciones Recientes */}
        <div className="bg-[#121212] border border-[rgba(255,255,255,0.06)] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Transacciones Recientes</h2>
            <div className="flex items-center gap-4">
              {/* Month Navigation */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePreviousMonth}
                  className="p-2 md:p-1 text-[#8B92A8] hover:text-white transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                  title="Mes anterior"
                >
                  <ChevronLeft className="w-5 h-5 md:w-4 md:h-4" />
                </button>
                <button
                  onClick={handleResetMonth}
                  className="text-sm md:text-sm text-[#8B92A8] hover:text-white transition-colors min-w-[100px] text-center min-h-[44px] flex items-center justify-center"
                  title="Volver al mes actual"
                >
                  {format(selectedMonth, 'MMMM yyyy', { locale: es })}
                </button>
                <button
                  onClick={handleNextMonth}
                  className="p-2 md:p-1 text-[#8B92A8] hover:text-white transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                  title="Mes siguiente"
                >
                  <ChevronRight className="w-5 h-5 md:w-4 md:h-4" />
                </button>
              </div>
              <button
                onClick={handleExportHistory}
                className="text-sm text-[#8B92A8] hover:text-white transition-colors"
              >
                Exportar historial
              </button>
            </div>
          </div>
          
          {historyLoading ? (
            <div className="h-96 bg-gray-700 animate-pulse rounded"></div>
          ) : filteredHistory.length === 0 ? (
            <div className="h-96 flex items-center justify-center text-gray-500">
              No hay transacciones en {format(selectedMonth, 'MMMM yyyy', { locale: es })}
            </div>
          ) : (
            <div className="h-96 overflow-y-auto pr-2 space-y-2">
              {filteredHistory.map((transaction: any) => {
                const isExpense = transaction.type === 'manual-expense';
                const isIncome = transaction.type === 'invoice' || transaction.type === 'manual-income';
                
                return (
                  <div 
                    key={transaction.id} 
                    className="bg-[#0A0A0A] border border-[rgba(255,255,255,0.06)] rounded-lg p-4 hover:border-[rgba(255,255,255,0.06)] transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          isExpense ? 'bg-red-500/10' : 'bg-green-500/10'
                        }`}>
                          {isExpense ? (
                            <TrendingDown className="w-5 h-5 text-red-500" />
                          ) : (
                            <TrendingUp className="w-5 h-5 text-green-500" />
                          )}
                        </div>
                        <div>
                          <p className="text-white font-semibold">{transaction.client_name}</p>
                          <p className="text-[#8B92A8] text-sm">
                            {transaction.invoice_number || transaction.category || 'Transacción manual'} • {format(new Date(transaction.date), 'dd MMM yyyy', { locale: es })}
                          </p>
                        </div>
                      </div>
                      <p className={`font-bold text-lg ${
                        isExpense ? 'text-red-500' : 'text-green-500'
                      }`}>
                        {isExpense ? '-' : '+'}{formatCurrency(transaction.amount)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      
      {/* Nueva Transacción Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0A0A0A] rounded-[28px] border border-[rgba(255,255,255,0.06)] w-full max-w-md">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Nueva Transacción</h2>
                <button
                  onClick={handleCloseModal}
                  className="text-[#8B92A8] hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Tipo
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          type: 'income',
                          category: 'other_income'
                        }));
                      }}
                      className={`p-3 rounded-[9999px] border transition-colors ${
                        formData.type === 'income'
                          ? 'bg-[#C4FF3D]/10 border-[#C4FF3D]/30 text-[#C4FF3D]'
                          : 'bg-transparent border-[rgba(255,255,255,0.06)] text-[#8B92A8] hover:border-[#C4FF3D]/30'
                      }`}
                    >
                      Ingreso
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          type: 'expense',
                          category: 'other_expense'
                        }));
                      }}
                      className={`p-3 rounded-[9999px] border transition-colors ${
                        formData.type === 'expense'
                          ? 'bg-red-400/10 border-red-400/30 text-red-400'
                          : 'bg-transparent border-[rgba(255,255,255,0.06)] text-[#8B92A8] hover:border-[#C4FF3D]/30'
                      }`}
                    >
                      Gasto
                    </button>
                  </div>
                </div>
                
                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Categoría
                  </label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger className="w-full h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {getCategories().map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Monto ({currency})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                    className="w-full bg-[#121212] border border-[rgba(255,255,255,0.06)] rounded-[9999px] px-4 py-3 text-white focus:outline-none focus:border-[#C4FF3D]"
                    placeholder="0.00"
                    required
                  />
                </div>
                
                {/* Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Fecha
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full bg-[#121212] border border-[rgba(255,255,255,0.06)] rounded-[9999px] px-4 py-3 text-white focus:outline-none focus:border-[#C4FF3D]"
                    required
                  />
                </div>
                
                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Descripción
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full bg-[#121212] border border-[rgba(255,255,255,0.06)] rounded-[20px] px-4 py-3 text-white focus:outline-none focus:border-[#C4FF3D] resize-none"
                    rows={3}
                    placeholder="Descripción de la transacción..."
                    required
                  />
                </div>
                
                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="flex-1 px-4 py-2 bg-transparent border border-[rgba(255,255,255,0.06)] text-white rounded-[9999px] hover:border-[#C4FF3D]/30 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={createTransactionMutation.isLoading}
                    className="flex-1 px-4 py-2 bg-[#C4FF3D]/10 border border-[#C4FF3D]/30 text-[#C4FF3D] rounded-[9999px] hover:bg-[#C4FF3D]/20 transition-colors disabled:opacity-50"
                  >
                    {createTransactionMutation.isLoading ? 'Guardando...' : 'Guardar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
