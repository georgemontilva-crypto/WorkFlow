/**
 * Home Page - Dashboard Principal
 * Con EventCard adaptado y sistema de criptomonedas añadir/eliminar
 */

import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import EventCard from '@/components/EventCard';
import CryptoCard from '@/components/CryptoCard';
import { trpc } from '@/lib/trpc';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Wallet, 
  PiggyBank,
  Settings,
  Plus,
  Calendar,
  Users,
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { useLocation } from 'wouter';
import { formatCurrency } from '@/lib/currency';

// Available cryptocurrencies
const AVAILABLE_CRYPTOS = [
  { symbol: 'BTC', name: 'Bitcoin', price: 89818.03, change: -1.37 },
  { symbol: 'ETH', name: 'Ethereum', price: 2988.00, change: -4.65 },
  { symbol: 'XRP', name: 'Ripple', price: 1.92, change: -1.72 },
  { symbol: 'SOL', name: 'Solana', price: 142.50, change: 3.25 },
  { symbol: 'ADA', name: 'Cardano', price: 0.58, change: 2.10 },
  { symbol: 'DOT', name: 'Polkadot', price: 7.32, change: -0.85 },
  { symbol: 'MATIC', name: 'Polygon', price: 1.15, change: 1.45 },
  { symbol: 'LINK', name: 'Chainlink', price: 18.92, change: 4.20 },
];

export default function Home() {
  const [, setLocation] = useLocation();
  const [selectedCryptos, setSelectedCryptos] = useState<string[]>(['BTC', 'ETH', 'XRP']);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  
  // Fetch data using tRPC
  const { data: clients } = trpc.clients.list.useQuery();
  const { data: invoices } = trpc.invoices.list.useQuery();
  const { data: transactions } = trpc.transactions.list.useQuery();
  const { data: savingsGoals } = trpc.savingsGoals.list.useQuery();

  // Calculate stats
  const activeClients = clients?.filter(c => c.status === 'active').length || 0;
  const pendingInvoices = invoices?.filter(i => i.status === 'pending').length || 0;
  
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const monthlyIncome = transactions
    ?.filter(t => {
      const date = new Date(t.date);
      return t.type === 'income' && date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    })
    .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0) || 0;
  
  const monthlyExpenses = transactions
    ?.filter(t => {
      const date = new Date(t.date);
      return t.type === 'expense' && date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    })
    .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0) || 0;

  const totalBalance = monthlyIncome - monthlyExpenses;

  const totalSavings = savingsGoals
    ?.filter(g => g.status === 'active')
    .reduce((sum, g) => sum + parseFloat(g.current_amount.toString()), 0) || 0;

  // Get reminders (eventos próximos)
  const today = new Date();
  const upcomingPayments = clients?.filter(c => {
    if (!c.next_payment_date || c.status !== 'active') return false;
    const daysUntil = differenceInDays(new Date(c.next_payment_date), today);
    return daysUntil >= 0 && daysUntil <= 7;
  }).slice(0, 3) || [];

  // Convert to events format
  const events = upcomingPayments.map((client, index) => {
    const daysUntil = differenceInDays(new Date(client.next_payment_date!), today);
    const category = daysUntil === 0 ? 'green' : daysUntil <= 3 ? 'blue' : 'purple';
    const status = daysUntil === 0 ? 'Confirmado' : daysUntil <= 3 ? 'En Progreso' : 'Pendiente';
    
    return {
      title: client.name,
      description: 'Pago de facturación mensual',
      category: category as 'green' | 'blue' | 'purple',
      date: format(new Date(client.next_payment_date!), 'd MMM yyyy', { locale: es }),
      attendees: index + 1,
      status,
    };
  });

  // Crypto functions
  const addCrypto = (symbol: string) => {
    if (!selectedCryptos.includes(symbol)) {
      setSelectedCryptos([...selectedCryptos, symbol]);
    }
    setIsAddDialogOpen(false);
  };

  const removeCrypto = (symbol: string) => {
    setSelectedCryptos(selectedCryptos.filter(s => s !== symbol));
  };

  const displayedCryptos = AVAILABLE_CRYPTOS.filter(c => selectedCryptos.includes(c.symbol));
  const availableCryptos = AVAILABLE_CRYPTOS.filter(c => !selectedCryptos.includes(c.symbol));

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Gestión financiera integral y eventos</p>
        </div>

        {/* Criptomonedas Section */}
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-bold">Criptomonedas</h2>
          </div>
          
          {/* Crypto Cards - Horizontal scroll */}
          <div className="scroll-container pb-2">
            {displayedCryptos.map((crypto) => (
              <CryptoCard
                key={crypto.symbol}
                {...crypto}
                onRemove={() => removeCrypto(crypto.symbol)}
              />
            ))}
          </div>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <button style={{display: 'none'}}></button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                  <DialogTitle>Añadir Criptomoneda</DialogTitle>
                  <DialogDescription>
                    Selecciona una criptomoneda para añadir al dashboard
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-3 py-4">
                  {availableCryptos.length > 0 ? (
                    availableCryptos.map((crypto) => (
                      <Button
                        key={crypto.symbol}
                        variant="outline"
                        className="justify-start h-auto py-3"
                        onClick={() => addCrypto(crypto.symbol)}
                      >
                        <div className="flex items-center gap-3 w-full">
                          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                            <span className="text-primary font-bold">{crypto.symbol.slice(0, 2)}</span>
                          </div>
                          <div className="flex-1 text-left">
                            <div className="font-semibold">{crypto.symbol}</div>
                            <div className="text-sm text-muted-foreground">{crypto.name}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold">${crypto.price.toLocaleString()}</div>
                            <div className={`text-sm ${crypto.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                              {crypto.change >= 0 ? '+' : ''}{crypto.change}%
                            </div>
                          </div>
                        </div>
                      </Button>
                    ))
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      Todas las criptomonedas ya están añadidas
                    </p>
                  )}
                </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* 4 Tarjetas Superiores */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Balance */}
          <div className="dashboard-stat-card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Total Balance</span>
              <Wallet className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="dashboard-stat-number">{formatCurrency(totalBalance, 'USD')}</div>
            <div className="dashboard-stat-change positive">
              <TrendingUp className="w-4 h-4" />
              <span>+12.5%</span>
            </div>
          </div>

          {/* Ingresos */}
          <div className="dashboard-stat-card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Ingresos</span>
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="dashboard-stat-number">{formatCurrency(monthlyIncome, 'USD')}</div>
            <div className="dashboard-stat-change positive">
              <TrendingUp className="w-4 h-4" />
              <span>+8.2%</span>
            </div>
          </div>

          {/* Gastos */}
          <div className="dashboard-stat-card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Gastos</span>
              <TrendingDown className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="dashboard-stat-number">{formatCurrency(monthlyExpenses, 'USD')}</div>
            <div className="dashboard-stat-change negative">
              <TrendingDown className="w-4 h-4" />
              <span>-3.1%</span>
            </div>
          </div>

          {/* Ahorros */}
          <div className="dashboard-stat-card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Ahorros</span>
              <PiggyBank className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="dashboard-stat-number">{formatCurrency(totalSavings, 'USD')}</div>
            <div className="dashboard-stat-change positive">
              <TrendingUp className="w-4 h-4" />
              <span>+15.3%</span>
            </div>
          </div>
        </div>

        {/* Grid de 2 Columnas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna Izquierda - Gráficos (2/3) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Ingresos Semanales */}
            <div className="dashboard-chart-card">
              <h3 className="dashboard-chart-title">Ingresos Semanales</h3>
              <p className="dashboard-chart-subtitle">Actividad de esta semana</p>
              <div className="h-64 flex items-end justify-between gap-2">
                {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day, i) => {
                  const heights = [40, 25, 80, 60, 70, 65, 75];
                  return (
                    <div key={day} className="flex-1 flex flex-col items-center gap-2">
                      <div 
                        className="w-full bg-primary rounded-t-lg transition-all hover:bg-primary/80"
                        style={{ height: `${heights[i]}%` }}
                      />
                      <span className="text-xs text-muted-foreground">{day}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Progreso de Ahorros */}
            <div className="dashboard-chart-card">
              <h3 className="dashboard-chart-title">Progreso de Ahorros</h3>
              <p className="dashboard-chart-subtitle">Últimos 5 meses</p>
              <div className="h-64 flex items-center justify-center">
                <p className="text-muted-foreground">Gráfico de línea aquí</p>
              </div>
            </div>
          </div>

          {/* Columna Derecha - Meta y Resumen (1/3) */}
          <div className="space-y-6">
            {/* Meta de Ahorros */}
            <div className="dashboard-chart-card">
              <h3 className="dashboard-chart-title">Meta de Ahorros</h3>
              <div className="flex items-center justify-center h-48">
                <div className="relative w-32 h-32">
                  <svg className="w-full h-full -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="oklch(0.22 0 0)"
                      strokeWidth="12"
                      fill="none"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="#FF9500"
                      strokeWidth="12"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 56}`}
                      strokeDashoffset={`${2 * Math.PI * 56 * 0.55}`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold text-primary">45%</span>
                  </div>
                </div>
              </div>
              <p className="text-center text-sm text-muted-foreground mt-4">
                {formatCurrency(4500, 'USD')} de {formatCurrency(10000, 'USD')} ahorrados
              </p>
            </div>

            {/* Resumen */}
            <div className="resume-card">
              <h3 className="text-lg font-semibold mb-4">Resumen</h3>
              <div className="space-y-1">
                <div className="resume-item">
                  <span className="resume-label">Transacciones</span>
                  <span className="resume-value primary">{transactions?.length || 0}</span>
                </div>
                <div className="resume-item">
                  <span className="resume-label">Clientes Activos</span>
                  <span className="resume-value primary">{activeClients}</span>
                </div>
                <div className="resume-item">
                  <span className="resume-label">Facturas Pendientes</span>
                  <span className="resume-value danger">{pendingInvoices}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Eventos Próximos / Recordatorios */}
        <div className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold">Eventos Próximos</h2>
            <p className="text-muted-foreground mt-1">Gestión de eventos y reuniones</p>
          </div>
          
          {events.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {events.map((event, idx) => (
                <EventCard key={idx} {...event} />
              ))}
            </div>
          ) : (
            <div className="dashboard-chart-card text-center py-12">
              <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No hay eventos próximos</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
