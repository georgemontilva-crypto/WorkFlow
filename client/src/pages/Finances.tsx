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
import { trpc } from '@/lib/trpc';
import { Plus, TrendingUp, TrendingDown, Ban, MoreVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useState } from 'react';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, parseISO, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';

type Transaction = {
  id: number;
  user_id: number;
  type: 'income' | 'expense';
  category: string;
  amount: string;
  description: string;
  date: Date;
  status?: 'active' | 'voided';
  invoice_id?: number | null;
  voided_at?: Date | null;
  void_reason?: string | null;
  created_at: Date;
};

export default function Finances() {
  const { t } = useLanguage();
  const utils = trpc.useUtils();
  
  // Fetch transactions using tRPC
  const { data: transactions, isLoading } = trpc.transactions.list.useQuery();
  
  // Create transaction mutation
  const createTransaction = trpc.transactions.create.useMutation({
    onSuccess: () => {
      utils.transactions.list.invalidate();
      toast.success('Transacción registrada exitosamente');
      setIsDialogOpen(false);
      setFormData({
        type: 'income',
        category: '',
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
      });
    },
    onError: (error) => {
      toast.error('Error al registrar la transacción: ' + error.message);
    },
  });
  
  // Void transaction mutation
  const voidTransaction = trpc.transactions.void.useMutation({
    onSuccess: () => {
      utils.transactions.list.invalidate();
      utils.invoices.list.invalidate();
      toast.success('Transacción anulada exitosamente');
      setShowVoidDialog(false);
      setTransactionToVoid(null);
    },
    onError: (error) => {
      toast.error('Error al anular la transacción: ' + error.message);
    },
  });
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showVoidDialog, setShowVoidDialog] = useState(false);
  const [transactionToVoid, setTransactionToVoid] = useState<Transaction | null>(null);
  const [formData, setFormData] = useState({
    type: 'income' as 'income' | 'expense',
    category: '',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });
  
  const handleVoidTransaction = (transaction: Transaction) => {
    setTransactionToVoid(transaction);
    setShowVoidDialog(true);
  };
  
  const confirmVoidTransaction = () => {
    if (transactionToVoid) {
      voidTransaction.mutate({ id: transactionToVoid.id });
    }
  };

  // Calcular totales (excluyendo transacciones anuladas)
  const activeTransactions = transactions?.filter(t => t.status !== 'voided') || [];
  const totalIncome = activeTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + parseFloat(t.amount), 0) || 0;
  const totalExpenses = activeTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + parseFloat(t.amount), 0) || 0;
  const balance = totalIncome - totalExpenses;

  // Datos para gráfico mensual (últimos 6 meses)
  const last6Months = eachMonthOfInterval({
    start: subMonths(new Date(), 5),
    end: new Date()
  });

  const monthlyData = last6Months.map(month => {
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);

    const income = activeTransactions.filter(t => {
      const tDate = new Date(t.date);
      return t.type === 'income' && tDate >= monthStart && tDate <= monthEnd;
    }).reduce((sum, t) => sum + parseFloat(t.amount), 0) || 0;

    const expenses = activeTransactions.filter(t => {
      const tDate = new Date(t.date);
      return t.type === 'expense' && tDate >= monthStart && tDate <= monthEnd;
    }).reduce((sum, t) => sum + parseFloat(t.amount), 0) || 0;

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

    createTransaction.mutate({
      type: formData.type,
      category: formData.category,
      amount: formData.amount,
      description: formData.description,
      date: formData.date,
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
              <Button className="w-full sm:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                Nueva Transacción
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-popover border-border max-w-md">
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
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger className="bg-background border-border text-foreground">
                      <SelectValue placeholder="Selecciona una categoría" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      {formData.type === 'income' ? (
                        <>
                          <SelectItem value="salary">Salario</SelectItem>
                          <SelectItem value="freelance">Freelance</SelectItem>
                          <SelectItem value="investment">Inversión</SelectItem>
                          <SelectItem value="other_income">Otro Ingreso</SelectItem>
                        </>
                      ) : (
                        <>
                          <SelectItem value="rent">Alquiler</SelectItem>
                          <SelectItem value="utilities">Servicios</SelectItem>
                          <SelectItem value="food">Comida</SelectItem>
                          <SelectItem value="transportation">Transporte</SelectItem>
                          <SelectItem value="healthcare">Salud</SelectItem>
                          <SelectItem value="entertainment">Entretenimiento</SelectItem>
                          <SelectItem value="other_expense">Otro Gasto</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount" className="text-foreground">Monto</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
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
                  <Button type="submit">
                    Guardar
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Summary Cards - Horizontal Scroll on Mobile, Grid on Desktop */}
        <div className="flex md:grid md:grid-cols-3 gap-4 md:gap-6 mb-8 overflow-x-auto pb-4 md:pb-0 snap-x snap-mandatory -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <Card className="bg-card border-border min-w-[85vw] md:min-w-0 snap-center">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Ingresos
              </CardTitle>
              <TrendingUp className="w-4 h-4 text-green-500" strokeWidth={1.5} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground font-mono">
                ${totalIncome.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border min-w-[85vw] md:min-w-0 snap-center">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Gastos
              </CardTitle>
              <TrendingDown className="w-4 h-4 text-red-500" strokeWidth={1.5} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground font-mono">
                ${totalExpenses.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border min-w-[85vw] md:min-w-0 snap-center">
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
            {isLoading ? (
              <p className="text-muted-foreground text-center py-8">Cargando transacciones...</p>
            ) : !transactions || transactions.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No hay transacciones registradas
              </p>
            ) : (
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                {transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className={`flex items-center justify-between p-4 bg-background rounded-lg border border-border ${transaction.status === 'voided' ? 'opacity-50' : ''}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-full ${
                        transaction.status === 'voided'
                          ? 'bg-gray-500/10'
                          : transaction.type === 'income' 
                            ? 'bg-green-500/10' 
                            : 'bg-red-500/10'
                      }`}>
                        {transaction.status === 'voided' ? (
                          <Ban className="w-5 h-5 text-gray-500" />
                        ) : transaction.type === 'income' ? (
                          <TrendingUp className="w-5 h-5 text-green-500" />
                        ) : (
                          <TrendingDown className="w-5 h-5 text-red-500" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className={`font-medium ${transaction.status === 'voided' ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                            {transaction.description}
                          </p>
                          {transaction.status === 'voided' && (
                            <span className="text-xs px-2 py-0.5 bg-gray-500/20 text-gray-400 rounded-full">Anulada</span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {transaction.category} • {format(new Date(transaction.date), 'dd MMM yyyy', { locale: es })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className={`text-lg font-bold font-mono ${
                        transaction.status === 'voided'
                          ? 'text-gray-500 line-through'
                          : transaction.type === 'income' 
                            ? 'text-green-500' 
                            : 'text-red-500'
                      }`}>
                        {transaction.type === 'income' ? '+' : '-'}${parseFloat(transaction.amount).toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                      </div>
                      {transaction.status !== 'voided' && !transaction.description.startsWith('[ANULACIÓN]') && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-card border-border">
                            <DropdownMenuItem
                              onClick={() => handleVoidTransaction(transaction)}
                              className="text-red-500 focus:text-red-500 focus:bg-red-500/10"
                            >
                              <Ban className="w-4 h-4 mr-2" />
                              Anular Transacción
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                ))}
                {transactions.length > 5 && (
                  <p className="text-sm text-muted-foreground text-center pt-2">
                    Desliza para ver más transacciones
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Void Transaction Confirmation Dialog */}
      <AlertDialog open={showVoidDialog} onOpenChange={setShowVoidDialog}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground flex items-center gap-2">
              <Ban className="w-5 h-5 text-red-500" />
              Anular Transacción
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              ¿Estás seguro de que deseas anular esta transacción?
              <div className="mt-3 p-3 bg-background rounded-lg border border-border">
                <p className="font-medium text-foreground">{transactionToVoid?.description}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Monto: <span className={transactionToVoid?.type === 'income' ? 'text-green-500' : 'text-red-500'}>
                    {transactionToVoid?.type === 'income' ? '+' : '-'}${parseFloat(transactionToVoid?.amount || '0').toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                  </span>
                </p>
              </div>
              <p className="mt-3 text-sm text-orange-400">
                Esta acción creará una transacción de reversión y marcará la original como anulada.
                {transactionToVoid?.invoice_id && ' La factura asociada también será cancelada.'}
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border text-foreground hover:bg-accent">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmVoidTransaction}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Anular Transacción
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
