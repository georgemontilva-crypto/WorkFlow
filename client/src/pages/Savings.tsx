/**
 * Savings Page - Metas de Ahorro
 * Design Philosophy: Apple Minimalism - Responsive mobile-first
 */

import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { trpc } from '@/lib/trpc';
import { Target, Plus, TrendingUp, MoreVertical, Pencil, Trash2, CheckCircle2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { useState } from 'react';
import { CurrencySelect } from '@/components/CurrencySelect';
import { formatCurrency, Currency } from '@/lib/currency';

// SavingsGoal type based on backend schema
type SavingsGoal = {
  id: number;
  user_id: number;
  name: string;
  target_amount: string;
  current_amount: string;
  currency: string;
  target_date: Date | null;
  status: 'active' | 'completed' | 'cancelled';
  created_at: Date;
  updated_at: Date;
};

export default function Savings() {
  const { t } = useLanguage();
  const utils = trpc.useUtils();
  
  // Fetch savings goals using tRPC
  const { data: savingsGoals, isLoading } = trpc.savingsGoals.list.useQuery();
  
  // Mutations
  const createGoal = trpc.savingsGoals.create.useMutation({
    onSuccess: () => {
      utils.savingsGoals.list.invalidate();
      toast.success('Meta creada exitosamente');
    },
    onError: (error) => {
      toast.error('Error al crear la meta: ' + error.message);
    },
  });
  
  const updateGoal = trpc.savingsGoals.update.useMutation({
    onSuccess: () => {
      utils.savingsGoals.list.invalidate();
      toast.success('Meta actualizada exitosamente');
    },
    onError: (error) => {
      toast.error('Error al actualizar la meta: ' + error.message);
    },
  });
  
  const deleteGoal = trpc.savingsGoals.delete.useMutation({
    onSuccess: () => {
      utils.savingsGoals.list.invalidate();
      toast.success('Meta eliminada exitosamente');
    },
    onError: (error) => {
      toast.error('Error al eliminar la meta: ' + error.message);
    },
  });
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    target_amount: '',
    current_amount: '',
    currency: 'USD',
    target_date: '',
    status: 'active' as 'active' | 'completed' | 'cancelled',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.target_amount || !formData.target_date) {
      toast.error('Por favor completa los campos requeridos');
      return;
    }

    if (editingGoal) {
      // Recalcular estado basado en el nuevo objetivo
      const newCurrentAmount = parseFloat(formData.current_amount) || 0;
      const newTargetAmount = parseFloat(formData.target_amount) || 0;
      const newStatus = newCurrentAmount >= newTargetAmount ? 'completed' : 'active';
      
      updateGoal.mutate({
        id: editingGoal.id,
        name: formData.name,
        target_amount: formData.target_amount,
        current_amount: formData.current_amount || '0',
        currency: formData.currency,
        target_date: formData.target_date,
        status: newStatus,
      });
    } else {
      createGoal.mutate({
        name: formData.name,
        target_amount: formData.target_amount,
        current_amount: formData.current_amount || '0',
        currency: formData.currency,
        target_date: formData.target_date,
        status: formData.status,
      });
    }

    setIsDialogOpen(false);
    setEditingGoal(null);
    setFormData({
      name: '',
      target_amount: '',
      current_amount: '',
      currency: 'USD',
      target_date: '',
      status: 'active',
    });
  };

  const handleEdit = (goal: SavingsGoal) => {
    setEditingGoal(goal);
    setFormData({
      name: goal.name,
      target_amount: goal.target_amount,
      current_amount: goal.current_amount,
      currency: goal.currency || 'USD',
      target_date: goal.target_date ? format(new Date(goal.target_date), 'yyyy-MM-dd') : '',
      status: goal.status,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (goalId: number) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta meta de ahorro?')) {
      deleteGoal.mutate({ id: goalId });
    }
  };

  const handleAddAmount = async (goal: SavingsGoal) => {
    const amount = prompt('¿Cuánto deseas agregar a esta meta?');
    if (!amount) return;

    const currentAmount = parseFloat(goal.current_amount) || 0;
    const newAmount = currentAmount + parseFloat(amount);
    const targetAmount = parseFloat(goal.target_amount) || 0;
    const newStatus = newAmount >= targetAmount ? 'completed' : 'active';
    
    updateGoal.mutate({
      id: goal.id,
      current_amount: newAmount.toString(),
      status: newStatus,
    });
    
    if (newStatus === 'completed') {
      toast.success('¡Felicidades! Meta completada');
    } else {
      toast.success('Monto actualizado');
    }
  };

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 lg:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Metas de Ahorro</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Define y alcanza tus objetivos financieros
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setEditingGoal(null);
              setFormData({
                name: '',
                target_amount: '',
                current_amount: '',
                target_date: '',
                status: 'active',
              });
            }
          }}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground hover:opacity-90">
                <Plus className="w-4 h-4 mr-2" />
                Nueva Meta
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-popover border-border max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-foreground text-2xl">
                  {editingGoal ? 'Editar Meta de Ahorro' : 'Nueva Meta de Ahorro'}
                </DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  {editingGoal ? 'Actualiza los detalles de tu meta' : 'Define un nuevo objetivo financiero'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-foreground font-semibold">
                    Nombre de la Meta <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="bg-background border-border text-foreground h-11"
                    placeholder="Ej: Fondo de emergencia, Vacaciones, etc."
                    required
                  />
                  <p className="text-xs text-muted-foreground">Dale un nombre descriptivo a tu objetivo</p>
                </div>

                <CurrencySelect
                  value={formData.currency as Currency}
                  onChange={(currency) => setFormData({ ...formData, currency })}
                  label="Moneda"
                  required
                />

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="target_amount" className="text-foreground font-semibold">
                      Monto Objetivo <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="target_amount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.target_amount}
                      onChange={(e) => setFormData({ ...formData, target_amount: e.target.value })}
                      className="bg-background border-border text-foreground font-mono h-11"
                      required
                    />
                    <p className="text-xs text-muted-foreground">Meta a alcanzar</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="current_amount" className="text-foreground font-semibold">
                      Monto Actual
                    </Label>
                    <Input
                      id="current_amount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.current_amount}
                      onChange={(e) => setFormData({ ...formData, current_amount: e.target.value })}
                      className="bg-background border-border text-foreground font-mono h-11"
                    />
                    <p className="text-xs text-muted-foreground">Ahorro actual</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="target_date" className="text-foreground font-semibold">
                    Fecha Límite <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="target_date"
                    type="date"
                    value={formData.target_date}
                    onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
                    className="bg-background border-border text-foreground h-11"
                    required
                  />
                  <p className="text-xs text-muted-foreground">Fecha objetivo para completar la meta</p>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-border">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    className="border-border text-foreground hover:bg-accent"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    className="bg-primary text-primary-foreground hover:opacity-90"
                    disabled={createGoal.isPending || updateGoal.isPending}
                  >
                    {editingGoal ? 'Actualizar' : 'Crear'} Meta
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Savings Goals */}
        {isLoading ? (
          <Card className="bg-card border-border">
            <CardContent className="flex items-center justify-center py-16">
              <div className="text-muted-foreground">Cargando metas...</div>
            </CardContent>
          </Card>
        ) : !savingsGoals || savingsGoals.length === 0 ? (
          <Card className="bg-card border-border">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="w-32 h-32 rounded-full bg-accent/20 flex items-center justify-center mb-6">
                <Target className="w-16 h-16 text-muted-foreground" strokeWidth={1} />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                No hay metas de ahorro aún
              </h3>
              <p className="text-muted-foreground mb-6">
                Comienza definiendo tu primera meta financiera
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {savingsGoals.map((goal) => {
              const targetAmount = parseFloat(goal.target_amount) || 0;
              const currentAmount = parseFloat(goal.current_amount) || 0;
              const progress = targetAmount > 0 ? (currentAmount / targetAmount) * 100 : 0;
              const remaining = targetAmount - currentAmount;

              return (
                <Card key={goal.id} className="bg-card border-border hover:border-accent transition-colors">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {goal.status === 'completed' ? (
                          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                          </div>
                        ) : (
                          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                            <Target className="w-5 h-5 text-muted-foreground" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <CardTitle className="text-foreground text-base sm:text-lg truncate">{goal.name}</CardTitle>
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            {goal.target_date && `Fecha límite: ${format(new Date(goal.target_date), 'dd MMM yyyy', { locale: es })}`}
                          </p>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="flex-shrink-0">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-popover border-border">
                          <DropdownMenuItem onClick={() => handleEdit(goal)} className="cursor-pointer">
                            <Pencil className="w-4 h-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-border" />
                          <DropdownMenuItem 
                            onClick={() => handleDelete(goal.id)} 
                            className="cursor-pointer text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between items-baseline mb-2">
                        <span className="text-2xl font-bold text-foreground font-mono">
                          {formatCurrency(currentAmount, goal.currency as Currency)}
                        </span>
                        <span className="text-sm text-muted-foreground font-mono">
                          de {formatCurrency(targetAmount, goal.currency as Currency)}
                        </span>
                      </div>
                      <Progress value={progress} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-2">
                        {progress.toFixed(1)}% completado
                      </p>
                    </div>

                    {goal.status !== 'completed' && remaining > 0 && (
                      <div className="flex items-center justify-between p-3 bg-accent/10 rounded-lg">
                        <div>
                          <p className="text-xs text-muted-foreground">Falta</p>
                          <p className="text-lg font-semibold text-foreground font-mono">
                            {formatCurrency(remaining, goal.currency as Currency)}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleAddAmount(goal)}
                          className="bg-primary text-primary-foreground hover:opacity-90"
                        >
                          <TrendingUp className="w-4 h-4 mr-2" />
                          Agregar
                        </Button>
                      </div>
                    )}

                    {goal.status === 'completed' && (
                      <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                        <p className="text-sm text-green-600 dark:text-green-400 font-medium text-center">
                          ¡Meta completada! 🎉
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
