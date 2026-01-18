/**
 * Finances Page - Control Financiero
 * Design Philosophy: Apple Minimalism
 */

import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Transaction } from '@/lib/db';
import { Plus, TrendingUp, TrendingDown } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, parseISO, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';

export default function Finances() {
  const { t } = useLanguage();
  const transactions = useLiveQuery(() => db.transactions.orderBy('date').reverse().toArray());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Transaction>>({
    type: 'income',
    category: '',
    amount: 0,
    description: '',
    date: new Date().toISOString().split('T')[0],
  });

  // Calcular totales
  const totalIncome = transactions?.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0) || 0;
  const totalExpenses = transactions?.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0) || 0;
  const balance = totalIncome - totalExpenses;

  // Datos para gráfico mensual (últimos 6 meses)
  const last6Months = eachMonthOfInterval({
    start: subMonths(new Date(), 5),
    end: new Date()
  });

  const monthlyData = last6Months.map(month => {
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);

    const income = transactions?.filter(t => {
      const tDate = parseISO(t.date);
      return t.type === 'income' && tDate >= monthStart && tDate <= monthEnd;
    }).reduce((sum, t) => sum + t.amount, 0) || 0;

    const expenses = transactions?.filter(t => {
      const tDate = parseISO(t.date);
      return t.type === 'expense' && tDate >= monthStart && tDate <= monthEnd;
    }).reduce((sum, t) => sum + t.amount, 0) || 0;

    return {
      month: format(month, 'MMM', { locale: es }),
      ingresos: income,
      gastos: expenses,
    };
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.category || !formData.amount || !formData.description) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    await db.transactions.add({
      ...formData as Transaction,
      createdAt: new Date().toISOString(),
    });

    toast.success('Transacción registrada exitosamente');
    setIsDialogOpen(false);
    setFormData({
      type: 'income',
      category: '',
      amount: 0,
      description: '',
      date: new Date().toISOString().split('T')[0],
    });
  };

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6 space-y-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Finanzas</h1>
            <p className="text-sm md:text-base text-muted-foreground mt-1">
              Control de ingresos y gastos
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto bg-primary text-primary-foreground hover:opacity-90">
                <Plus className="w-4 h-4 mr-2" />
                Nueva Transacción
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-popover border-border">
              <DialogHeader>
                <DialogTitle className="text-foreground">Registrar Transacción</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="type" className="text-foreground">Tipo</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: any) => setFormData({ ...formData, type: value })}
                  >
                    <SelectTrigger className="bg-background border-border text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      <SelectItem value="income">Ingreso</SelectItem>
                      <SelectItem value="expense">Gasto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category" className="text-foreground">Categoría</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="bg-background border-border text-foreground"
                    placeholder="Ej: Servicios, Ventas, Gastos Operativos"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount" className="text-foreground">Monto</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                    className="bg-background border-border text-foreground font-mono"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date" className="text-foreground">Fecha</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="bg-background border-border text-foreground"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-foreground">Descripción</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="bg-background border-border text-foreground"
                    required
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    className="border-border text-foreground hover:bg-accent"
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" className="bg-primary text-primary-foreground hover:opacity-90">
                    Guardar
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Ingresos
              </CardTitle>
              <TrendingUp className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground font-mono">
                ${totalIncome.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Gastos
              </CardTitle>
              <TrendingDown className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground font-mono">
                ${totalExpenses.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold font-mono ${balance >= 0 ? 'text-foreground' : 'text-destructive'}`}>
                ${balance.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Tendencia Mensual</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#3a3a3a" />
                  <XAxis dataKey="month" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1a1a1a', 
                      border: '1px solid #3a3a3a',
                      borderRadius: '8px',
                      color: '#ffffff'
                    }}
                  />
                  <Line type="monotone" dataKey="ingresos" stroke="#ffffff" strokeWidth={2} />
                  <Line type="monotone" dataKey="gastos" stroke="#6b7280" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Comparativa Mensual</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#3a3a3a" />
                  <XAxis dataKey="month" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1a1a1a', 
                      border: '1px solid #3a3a3a',
                      borderRadius: '8px',
                      color: '#ffffff'
                    }}
                  />
                  <Bar dataKey="ingresos" fill="#ffffff" />
                  <Bar dataKey="gastos" fill="#6b7280" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Recent Transactions */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Transacciones Recientes</CardTitle>
          </CardHeader>
          <CardContent>
            {!transactions || transactions.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-32 h-32 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-16 h-16 text-muted-foreground" strokeWidth={1} />
                </div>
                <p className="text-muted-foreground">No hay transacciones registradas</p>
              </div>
            ) : (
              <div className="space-y-3">
                {transactions.slice(0, 10).map((transaction) => (
                  <div 
                    key={transaction.id} 
                    className="p-3 sm:p-4 rounded-lg bg-accent/30 border border-border"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={`w-10 h-10 flex-shrink-0 rounded-lg flex items-center justify-center ${
                          transaction.type === 'income' ? 'bg-accent' : 'bg-muted'
                        }`}>
                          {transaction.type === 'income' ? (
                            <TrendingUp className="w-5 h-5 text-accent-foreground" strokeWidth={1.5} />
                          ) : (
                            <TrendingDown className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground break-words">{transaction.description}</p>
                          <p className="text-sm text-muted-foreground break-words">
                            {transaction.category} • {format(parseISO(transaction.date), 'dd MMM yyyy', { locale: es })}
                          </p>
                        </div>
                      </div>
                      <p className={`text-lg sm:text-xl font-bold font-mono self-end sm:self-center ${
                        transaction.type === 'income' ? 'text-foreground' : 'text-muted-foreground'
                      }`}>
                        {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
