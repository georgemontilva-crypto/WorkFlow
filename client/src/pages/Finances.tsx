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
import { Download, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { Button } from '../components/ui/button';
import { trpc } from '../lib/trpc';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { getCurrency, formatCurrency as formatCurrencyUtil } from '@shared/currencies';
import { Badge } from '../components/ui/badge';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Finances() {
  // Get user data
  const { data: user } = trpc.auth.me.useQuery();
  const currency = user?.primary_currency || 'USD';
  
  // Queries
  const { data: summary, isLoading: summaryLoading } = trpc.finances.getSummary.useQuery({ currency });
  const { data: incomeByMonth = [], isLoading: monthLoading } = trpc.finances.getIncomeByMonth.useQuery({ months: 12, currency });
  const { data: expensesByMonth = [], isLoading: expensesLoading } = trpc.finances.getExpensesByMonth?.useQuery?.({ months: 12, currency }) || { data: [], isLoading: false };
  const { data: history = [], isLoading: historyLoading } = trpc.finances.getHistory.useQuery({});

  const formatCurrency = (amount: number) => {
    return formatCurrencyUtil(amount, currency);
  };

  const formatMonth = (month: number, year: number) => {
    const date = new Date(year, month - 1, 1);
    return format(date, 'MMM', { locale: es });
  };

  // Prepare data for Tendencia Mensual (Line Chart)
  const trendData = incomeByMonth.map(item => ({
    month: formatMonth(item.month, item.year),
    income: item.income,
    expenses: 0 // TODO: Add expenses when available
  }));

  // Prepare data for Comparativa Mensual (Bar Chart)
  const comparativeData = incomeByMonth.slice(-2).map(item => ({
    month: formatMonth(item.month, item.year),
    income: item.income,
    expenses: 0 // TODO: Add expenses when available
  }));

  // Calculate totals
  const totalIncome = summary?.totalIncome || 0;
  const totalExpenses = 0; // TODO: Add expenses when available
  const balance = totalIncome - totalExpenses;

  // Export history handler
  const handleExportHistory = () => {
    if (history.length === 0) {
      alert('No hay transacciones para exportar');
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
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Finanzas</h1>
            <p className="text-gray-400 mt-1">Control de ingresos y gastos</p>
          </div>
          <Button 
            onClick={() => {/* TODO: Implement global export */}}
            className="bg-[#EBFF57] hover:bg-[#EBFF57]/90 text-black"
          >
            + Nueva Transacción
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Total Income */}
          <div className="bg-[#222222] border border-gray-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-400 text-sm">Total Ingresos</p>
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
          <div className="bg-[#222222] border border-gray-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-400 text-sm">Total Gastos</p>
              <TrendingDown className="w-5 h-5 text-red-500" />
            </div>
            <p className="text-3xl font-bold text-white">
              {formatCurrency(totalExpenses)}
            </p>
          </div>

          {/* Balance */}
          <div className="bg-[#222222] border border-gray-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-400 text-sm">Balance</p>
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
          <div className="bg-[#222222] border border-gray-800 rounded-2xl p-6">
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
          <div className="bg-[#222222] border border-gray-800 rounded-2xl p-6">
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
        <div className="bg-[#222222] border border-gray-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Transacciones Recientes</h2>
            <button
              onClick={handleExportHistory}
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              Exportar historial
            </button>
          </div>
          
          {historyLoading ? (
            <div className="h-96 bg-gray-700 animate-pulse rounded"></div>
          ) : history.length === 0 ? (
            <div className="h-96 flex items-center justify-center text-gray-500">
              No hay transacciones registradas
            </div>
          ) : (
            <div className="h-96 overflow-y-auto pr-2 space-y-2">
              {history.map((transaction) => (
                <div 
                  key={transaction.id} 
                  className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-4 hover:border-gray-700 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-green-500" />
                      </div>
                      <div>
                        <p className="text-white font-semibold">{transaction.client_name}</p>
                        <p className="text-gray-400 text-sm">
                          {transaction.invoice_number} • {format(new Date(transaction.date), 'dd MMM yyyy', { locale: es })}
                        </p>
                      </div>
                    </div>
                    <p className="text-green-500 font-bold text-lg">
                      +{formatCurrency(transaction.amount)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
