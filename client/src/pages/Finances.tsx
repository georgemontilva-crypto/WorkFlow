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
import { trpc } from '@/lib/trpc';
import { Plus, TrendingUp, TrendingDown, MoreVertical, Ban, FileDown } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, parseISO, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import * as XLSX from 'xlsx';

type Transaction = {
  id: number;
  user_id: number;
  type: 'income' | 'expense';
  category: string;
  amount: string;
  description: string;
  date: Date;
  created_at: Date;
  status?: 'active' | 'voided';
  invoice_id?: number | null;
  voided_at?: Date | null;
  void_reason?: string | null;
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
      toast.success('Transacción anulada exitosamente');
      setVoidDialogOpen(false);
      setSelectedTransaction(null);
    },
    onError: (error) => {
      toast.error('Error al anular la transacción: ' + error.message);
    },
  });
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [voidDialogOpen, setVoidDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [formData, setFormData] = useState({
    type: 'income' as 'income' | 'expense',
    category: '',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });

  // Filtrar transacciones activas para cálculos
  const activeTransactions = transactions?.filter(t => t.status !== 'voided') || [];

  // Calcular totales (solo transacciones activas)
  const totalIncome = activeTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + parseFloat(t.amount), 0);
  const totalExpenses = activeTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + parseFloat(t.amount), 0);
  const balance = totalIncome - totalExpenses;

  // Datos para gráfico mensual (últimos 6 meses, solo transacciones activas)
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
    }).reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const expenses = activeTransactions.filter(t => {
      const tDate = new Date(t.date);
      return t.type === 'expense' && tDate >= monthStart && tDate <= monthEnd;
    }).reduce((sum, t) => sum + parseFloat(t.amount), 0);

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

  const handleVoidTransaction = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setVoidDialogOpen(true);
  };

  const confirmVoidTransaction = () => {
    if (selectedTransaction) {
      voidTransaction.mutate({
        id: selectedTransaction.id,
        reason: 'Anulada por el usuario',
      });
    }
  };

  const exportToExcel = () => {
    if (!transactions || transactions.length === 0) {
      toast.error('No hay transacciones para exportar');
      return;
    }

    // Preparar datos para Excel
    const excelData = transactions.map(transaction => ({
      'Fecha': format(new Date(transaction.date), 'dd/MM/yyyy', { locale: es }),
      'Tipo': transaction.type === 'income' ? 'Ingreso' : 'Gasto',
      'Categoría': transaction.category,
      'Descripción': transaction.description,
      'Monto': parseFloat(transaction.amount),
      'Estado': transaction.status === 'voided' ? 'Anulada' : 'Vigente',
      'ID Referencia': transaction.invoice_id ? `INV-${transaction.invoice_id}` : '-',
    }));

    // Crear libro de trabajo
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Transacciones');

    // Ajustar ancho de columnas
    const maxWidth = 30;
    worksheet['!cols'] = [
      { wch: 12 }, // Fecha
      { wch: 10 }, // Tipo
      { wch: 20 }, // Categoría
      { wch: maxWidth }, // Descripción
      { wch: 15 }, // Monto
      { wch: 10 }, // Estado
      { wch: 20 }, // ID Referencia
    ];

    // Generar archivo
    const fileName = `transacciones_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
    XLSX.writeFile(workbook, fileName);
    
    toast.success('Historial exportado exitosamente');
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
            <div className="flex items-center justify-between">
              <CardTitle className="text-foreground">Transacciones Recientes</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={exportToExcel}
                className="text-muted-foreground hover:text-foreground"
              >
                <FileDown className="w-4 h-4 mr-2" />
                Exportar
              </Button>
            </div>
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
                {transactions.map((transaction) => {
                  const isVoided = transaction.status === 'voided';
                  const isReversal = transaction.description.startsWith('[ANULACIÓN]');
                  
                  return (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-4 bg-background rounded-lg border border-border"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-full ${
                          transaction.type === 'income' 
                            ? 'bg-green-500/10' 
                            : 'bg-red-500/10'
                        }`}>
                          {transaction.type === 'income' ? (
                            <TrendingUp className="w-5 h-5 text-green-500" />
                          ) : (
                            <TrendingDown className="w-5 h-5 text-red-500" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{transaction.description}</p>
                          <p className="text-sm text-muted-foreground">
                            {transaction.category} • {format(new Date(transaction.date), 'dd MMM yyyy', { locale: es })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className={`text-lg font-bold font-mono ${
                          transaction.type === 'income' 
                            ? 'text-green-500' 
                            : 'text-red-500'
                        }`}>
                          {transaction.type === 'income' ? '+' : '-'}${parseFloat(transaction.amount).toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                        </div>
                        {!isVoided && !isReversal && (
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
                  );
                })}
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
      <AlertDialog open={voidDialogOpen} onOpenChange={setVoidDialogOpen}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">¿Anular esta transacción?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              {selectedTransaction && (
                <div className="mt-2 p-3 bg-background rounded-lg border border-border">
                  <p className="font-medium text-foreground">{selectedTransaction.description}</p>
                  <p className="text-sm">
                    {selectedTransaction.type === 'income' ? '+' : '-'}${parseFloat(selectedTransaction.amount).toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              )}
              <p className="mt-3">
                Esta acción creará una transacción de reversión y anulará la transacción original. 
                Si está vinculada a una factura, la factura también será cancelada.
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
