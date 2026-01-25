/**
 * Finances Page - BUILT FROM SCRATCH
 * Read-only financial analytics based on paid invoices
 * 
 * PRINCIPIO FUNDAMENTAL:
 * - El sistema NO crea dinero
 * - El sistema SOLO LEE facturas pagadas
 */

import { useState } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { Download, TrendingUp, TrendingDown, DollarSign, Calendar } from 'lucide-react';
import { Button } from '../components/ui/button';
import { trpc } from '../lib/trpc';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { getCurrency, formatCurrency as formatCurrencyUtil } from '@shared/currencies';
import { Badge } from '../components/ui/badge';

export default function Finances() {
  // Get user data
  const { data: user } = trpc.auth.me.useQuery();
  const currency = user?.primary_currency || 'USD';
  
  // Queries
  const { data: summary, isLoading: summaryLoading } = trpc.finances.getSummary.useQuery({ currency });
  const { data: incomeByMonth = [], isLoading: monthLoading } = trpc.finances.getIncomeByMonth.useQuery({ months: 12, currency });
  const { data: incomeByClient = [], isLoading: clientLoading } = trpc.finances.getIncomeByClient.useQuery({ limit: 10, currency });
  const { data: history = [], isLoading: historyLoading } = trpc.finances.getHistory.useQuery({});

  const formatCurrency = (amount: number) => {
    return formatCurrencyUtil(amount, currency);
  };

  const formatMonth = (month: number, year: number) => {
    const date = new Date(year, month - 1, 1);
    return format(date, 'MMM yyyy', { locale: es });
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-white">Finanzas</h1>
              <Badge className="bg-[#EBFF57]/10 text-[#EBFF57] border border-[#EBFF57]/30">
                {getCurrency(currency)?.symbol} {currency}
              </Badge>
            </div>
            <p className="text-gray-400 mt-1">Vista general de tus ingresos desde facturas pagadas</p>
          </div>
          <Button 
            variant="outline" 
            className="border-[#EBFF57] text-[#EBFF57] hover:bg-[#EBFF57]/10"
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Total Income */}
          <div className="bg-[#222222] border border-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-400 text-sm">Ingresos Totales</p>
              <DollarSign className="w-5 h-5 text-[#EBFF57]" />
            </div>
            {summaryLoading ? (
              <div className="h-8 bg-gray-700 animate-pulse rounded"></div>
            ) : (
              <p className="text-3xl font-bold text-white">
                {formatCurrency(summary?.totalIncome || 0)}
              </p>
            )}
            <p className="text-gray-500 text-xs mt-1">Todas las facturas pagadas</p>
          </div>

          {/* Current Month */}
          <div className="bg-[#222222] border border-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-400 text-sm">Mes Actual</p>
              <Calendar className="w-5 h-5 text-[#EBFF57]" />
            </div>
            {summaryLoading ? (
              <div className="h-8 bg-gray-700 animate-pulse rounded"></div>
            ) : (
              <p className="text-3xl font-bold text-white">
                {formatCurrency(summary?.currentMonthIncome || 0)}
              </p>
            )}
            <p className="text-gray-500 text-xs mt-1">{format(new Date(), 'MMMM yyyy', { locale: es })}</p>
          </div>

          {/* Variation */}
          <div className="bg-[#222222] border border-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-400 text-sm">Variación</p>
              {(summary?.variation || 0) >= 0 ? (
                <TrendingUp className="w-5 h-5 text-green-500" />
              ) : (
                <TrendingDown className="w-5 h-5 text-red-500" />
              )}
            </div>
            {summaryLoading ? (
              <div className="h-8 bg-gray-700 animate-pulse rounded"></div>
            ) : (
              <p className={`text-3xl font-bold ${(summary?.variation || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {(summary?.variation || 0) >= 0 ? '+' : ''}{summary?.variation.toFixed(2)}%
              </p>
            )}
            <p className="text-gray-500 text-xs mt-1">vs mes anterior</p>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Income by Month Chart */}
          <div className="bg-[#222222] border border-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">Ingresos por Mes</h2>
            {monthLoading ? (
              <div className="h-64 bg-gray-700 animate-pulse rounded"></div>
            ) : incomeByMonth.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-gray-500">
                No hay datos de ingresos
              </div>
            ) : (
              <div className="space-y-3">
                {incomeByMonth.map((item, index) => {
                  const maxIncome = Math.max(...incomeByMonth.map(i => i.income));
                  const percentage = maxIncome > 0 ? (item.income / maxIncome) * 100 : 0;
                  
                  return (
                    <div key={index} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">{formatMonth(item.month, item.year)}</span>
                        <span className="text-white font-semibold">{formatCurrency(item.income)}</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-[#EBFF57] h-2 rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Income by Client Chart */}
          <div className="bg-[#222222] border border-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">Top Clientes</h2>
            {clientLoading ? (
              <div className="h-64 bg-gray-700 animate-pulse rounded"></div>
            ) : incomeByClient.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-gray-500">
                No hay datos de clientes
              </div>
            ) : (
              <div className="space-y-3">
                {incomeByClient.map((item, index) => {
                  const maxIncome = Math.max(...incomeByClient.map(i => i.income));
                  const percentage = maxIncome > 0 ? (item.income / maxIncome) * 100 : 0;
                  
                  return (
                    <div key={index} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400 truncate max-w-[200px]">{item.client_name}</span>
                        <span className="text-white font-semibold">{formatCurrency(item.income)}</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-[#EBFF57] h-2 rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Financial History Table */}
        <div className="bg-[#222222] border border-gray-800 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">Historial Financiero</h2>
          {historyLoading ? (
            <div className="h-64 bg-gray-700 animate-pulse rounded"></div>
          ) : history.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-gray-500">
              No hay transacciones registradas
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Fecha</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Cliente</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Factura</th>
                    <th className="text-right py-3 px-4 text-gray-400 font-medium">Monto</th>
                    <th className="text-center py-3 px-4 text-gray-400 font-medium">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((transaction) => (
                    <tr key={transaction.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                      <td className="py-3 px-4 text-white">
                        {format(new Date(transaction.date), 'dd MMM yyyy', { locale: es })}
                      </td>
                      <td className="py-3 px-4 text-white">{transaction.client_name}</td>
                      <td className="py-3 px-4 text-gray-400">{transaction.invoice_number}</td>
                      <td className="py-3 px-4 text-right text-white font-semibold">
                        {formatCurrency(transaction.amount)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-500">
                          Pagado
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
