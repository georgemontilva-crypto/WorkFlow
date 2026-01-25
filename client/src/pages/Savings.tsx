/**
 * Savings Page - Metas de Ahorro
 * Design Philosophy: Modern Fintech - Clean cards with orange progress bars
 */

import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
// import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { useState, useEffect } from 'react';
import { CurrencySelect } from '@/components/CurrencySelect';
import { formatCurrency, getCurrencySymbol } from '@shared/currencies';
import { useCurrency } from '@/hooks/useCurrency';

// SavingsGoal type based on backend schema
type SavingsGoal = {
  id: number;
  user_id: number;
  name: string;
  target_amount: string;
  current_amount: string;
  currency: string;
  deadline: Date | null; // Renamed from target_date
  description: string | null; // New field
  status: 'active' | 'completed' | 'cancelled';
  created_at: Date;
  updated_at: Date;
};

export default function Savings() {
  const { t } = useLanguage();
  const utils = trpc.useUtils();
  const { primaryCurrency } = useCurrency();
  
  // Fetch savings goals using tRPC
  // Note: 'all' now excludes cancelled goals by default (backend logic)
  const { data: savingsGoals, isLoading, error } = trpc.savings.list.useQuery(
    { status: 'all' }, // Shows active and completed, excludes cancelled
    {
      retry: 1,
      retryDelay: 1000,
      staleTime: 30000, // 30 seconds
    }
  );
  
  // Mutations
  const createGoal = trpc.savings.create.useMutation({
    onSuccess: () => {
      utils.savings.list.invalidate();
      // toast.success('Meta creada exitosamente');
    },
    onError: (error) => {
      // toast.error('Error al crear la meta: ' + error.message);
    },
  });
  
  const updateGoal = trpc.savings.update.useMutation({
    onSuccess: () => {
      utils.savings.list.invalidate();
      // toast.success('Meta actualizada exitosamente');
    },
    onError: (error) => {
      // toast.error('Error al actualizar la meta: ' + error.message);
    },
  });
  
  const updateProgress = trpc.savings.updateProgress.useMutation({
    onSuccess: () => {
      utils.savings.list.invalidate();
      // toast.success('Progreso actualizado exitosamente');
    },
    onError: (error) => {
      // toast.error('Error al actualizar progreso: ' + error.message);
    },
  });
  
  const deleteGoal = trpc.savings.delete.useMutation({
    onSuccess: () => {
      utils.savings.list.invalidate();
      // toast.success('Meta eliminada exitosamente');
    },
    onError: (error) => {
      // toast.error('Error al eliminar la meta: ' + error.message);
    },
  });
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    target_amount: '',
    current_amount: '',
    currency: '', // NO default - must be explicitly selected
    deadline: '', // Renamed from target_date
    description: '', // New field
    status: 'active' as 'active' | 'completed' | 'cancelled',
  });

  // NO auto-assign currency - user MUST explicitly select it

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.name || !formData.target_amount) {
      // toast.error('Por favor completa los campos requeridos');
      return;
    }

    // Validate currency is selected
    if (!formData.currency) {
      // toast.error('Debe seleccionar una moneda');
      return;
    }

    // Normalize decimal values (replace comma with dot for parseFloat)
    const normalizeDecimal = (value: string) => value.replace(',', '.');
    
    if (editingGoal) {
      // Update existing goal (cannot change currency)
      updateGoal.mutate({
        id: editingGoal.id,
        name: formData.name,
        target_amount: parseFloat(normalizeDecimal(formData.target_amount)),
        current_amount: parseFloat(normalizeDecimal(formData.current_amount)),
        deadline: formData.deadline || undefined,
        description: formData.description || undefined,
      });
    } else {
      // Create new goal
      createGoal.mutate({
        name: formData.name,
        target_amount: parseFloat(normalizeDecimal(formData.target_amount)),
        current_amount: parseFloat(normalizeDecimal(formData.current_amount)) || 0,
        currency: formData.currency,
        deadline: formData.deadline || undefined,
        description: formData.description || undefined,
      });
    }

    setIsDialogOpen(false);
    setEditingGoal(null);
    setFormData({
      name: '',
      target_amount: '',
      current_amount: '',
      currency: '',
      deadline: '',
      description: '',
      status: 'active',
    });
  };

  const handleEdit = (goal: SavingsGoal) => {
    setEditingGoal(goal);
    setFormData({
      name: goal.name,
      target_amount: goal.target_amount,
      current_amount: goal.current_amount,
      currency: goal.currency, // Cannot be changed
      deadline: goal.deadline ? format(new Date(goal.deadline), 'yyyy-MM-dd') : '',
      description: goal.description || '',
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
    
    updateProgress.mutate({
      id: goal.id,
      current_amount: newAmount,
    });
  };

  return (
    <DashboardLayout>
      <div className="max-w-[1440px] mx-auto p-6 space-y-6">
        {/* Header Card - Isla 1 */}
        <Card>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Metas de Ahorro</h1>
              <p className="text-sm sm:text-base text-[#8B92A8]">
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
                currency: '',
                deadline: '',
                description: '',
                status: 'active',
              });
            }
          }}>
            <DialogTrigger asChild>
              <Button variant="default">
                <Plus className="w-4 h-4 mr-2" />
                Nueva Meta
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#0a0a0a] border-white/10 max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-white text-2xl">
                  {editingGoal ? 'Editar Meta de Ahorro' : 'Nueva Meta de Ahorro'}
                </DialogTitle>
                <DialogDescription className="text-[#8B92A8]">
                  {editingGoal ? 'Actualiza los detalles de tu meta' : 'Define un nuevo objetivo financiero'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-white font-semibold">
                    Nombre de la Meta <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="bg-[#121212] border-white/10 text-white h-11"
                    placeholder="Ej: Fondo de emergencia, Vacaciones, etc."
                    required
                  />
                  <p className="text-xs text-[#8B92A8]">Dale un nombre descriptivo a tu objetivo</p>
                </div>

                <CurrencySelect
                  value={formData.currency}
                  onChange={(currency) => setFormData({ ...formData, currency })}
                  label="Moneda"
                  required
                  disabled={!!editingGoal}
                />
                {editingGoal ? (
                  <p className="text-xs text-amber-400">La moneda NO se puede cambiar después de crear la meta</p>
                ) : (
                  <p className="text-xs text-[#8B92A8]">Esta moneda solo afectará a esta meta de ahorro</p>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="target_amount" className="text-white font-semibold">
                      Monto Objetivo <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="target_amount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.target_amount}
                      onChange={(e) => setFormData({ ...formData, target_amount: e.target.value })}
                      className="bg-[#121212] border-white/10 text-white font-mono h-11"
                      required
                    />
                    <p className="text-xs text-[#8B92A8]">Meta a alcanzar</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="current_amount" className="text-white font-semibold">
                      Monto Actual
                    </Label>
                    <Input
                      id="current_amount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.current_amount}
                      onChange={(e) => setFormData({ ...formData, current_amount: e.target.value })}
                      className="bg-[#121212] border-white/10 text-white font-mono h-11"
                    />
                    <p className="text-xs text-[#8B92A8]">Ahorro actual</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deadline" className="text-white font-semibold">
                    Fecha Límite (Opcional)
                  </Label>
                  <Input
                    id="deadline"
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                    className="bg-[#121212] border-white/10 text-white h-11"
                  />
                  <p className="text-xs text-[#8B92A8]">Fecha objetivo para completar la meta</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-white font-semibold">
                    Descripción (Opcional)
                  </Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="bg-[#121212] border-white/10 text-white h-11"
                    placeholder="Describe tu meta de ahorro..."
                  />
                  <p className="text-xs text-[#8B92A8]">Información adicional sobre tu meta</p>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    className="border-white/10 text-white hover:bg-white/5"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    variant="default"
                    disabled={createGoal.isPending || updateGoal.isPending}
                  >
                    {editingGoal ? 'Actualizar' : 'Crear'} Meta
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          </div>
        </Card>

        {/* Savings Goals Card - Isla 2 */}
        <Card className="py-4">
          {/* Contador */}
          <div className="mb-4 px-6">
            <p className="text-[#8B92A8] text-sm">{savingsGoals?.length || 0} meta{(savingsGoals?.length || 0) !== 1 ? 's' : ''}</p>
          </div>

          {error ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="text-red-500">Error al cargar metas</div>
            <div className="text-[#8B92A8] text-sm">{error.message}</div>
            <Button
              onClick={() => utils.savings.list.invalidate()}
              variant="outline"
              size="sm"
            >
              Reintentar
            </Button>
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-[#8B92A8]">Cargando metas...</div>
          </div>
        ) : !savingsGoals || savingsGoals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-32 h-32 rounded-full bg-white/5 flex items-center justify-center mb-6">
              <Target className="w-16 h-16 text-[#C4FF3D]" strokeWidth={1} />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              No hay metas de ahorro aún
            </h3>
            <p className="text-[#8B92A8] mb-6">
              Comienza definiendo tu primera meta financiera
            </p>
          </div>
        ) : (
          <div className="space-y-4 px-6">
            {savingsGoals.map((goal) => {
              const targetAmount = parseFloat(goal.target_amount) || 0;
              const currentAmount = parseFloat(goal.current_amount) || 0;
              const progress = targetAmount > 0 ? (currentAmount / targetAmount) * 100 : 0;
              const remaining = targetAmount - currentAmount;

              return (
                <div 
                  key={goal.id} 
                  className="bg-[#121212] rounded-[28px] border border-[#C4FF3D]/20 p-4 md:p-6 bg-[#C4FF3D]/5 transition-colors-smooth"
                >
                  <div className="flex items-center justify-between gap-6">
                    {/* Información Principal - Izquierda */}
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      {goal.status === 'completed' ? (
                        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[#C4FF3D]/20 flex items-center justify-center">
                          <CheckCircle2 className="w-6 h-6 text-[#C4FF3D]" />
                        </div>
                      ) : (
                        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[#C4FF3D]/20 flex items-center justify-center">
                          <Target className="w-6 h-6 text-[#C4FF3D]" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <h3 className="text-white text-lg font-medium mb-1">{goal.name}</h3>
                        <p className="text-[#8B92A8] text-sm">
                          {goal.deadline ? `Vencimiento: ${format(new Date(goal.deadline), 'dd MMM yyyy', { locale: es })}` : 'Sin fecha límite'}
                        </p>
                      </div>
                    </div>

                    {/* Progreso y Monto - Centro */}
                    <div className="hidden md:flex flex-col items-end gap-2 flex-1">
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-semibold text-white">
                          {formatCurrency(currentAmount, goal.currency)}
                        </span>
                        <span className="text-[#8B92A8] text-base">
                          / {formatCurrency(targetAmount, goal.currency)}
                        </span>
                      </div>
                      <div className="w-full max-w-xs h-2 bg-[#121212] rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-[#C4FF3D] transition-all duration-300" 
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                      </div>
                      <p className="text-sm text-[#8B92A8]">
                        {progress.toFixed(1)}% completado
                      </p>
                    </div>

                    {/* Acciones - Derecha */}
                    <div className="flex items-center gap-2">
                      {goal.status !== 'completed' && remaining > 0 && (
                        <Button
                          onClick={() => handleAddAmount(goal)}
                          variant="default"
                          size="sm"
                          className="min-h-[44px]"
                        >
                          <TrendingUp className="w-4 h-4 mr-2" />
                          Agregar
                        </Button>
                      )}
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-[#8B92A8] hover:text-white min-h-[44px] min-w-[44px]">
                            <MoreVertical className="w-5 h-5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-[#0E0F12] border-[#C4FF3D]/30">
                          <DropdownMenuItem onClick={() => handleEdit(goal)} className="cursor-pointer text-white hover:bg-[#C4FF3D]/10">
                            <Pencil className="w-4 h-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-[rgba(255,255,255,0.06)]" />
                          <DropdownMenuItem 
                            onClick={() => handleDelete(goal.id)} 
                            className="cursor-pointer text-[#EF4444] hover:bg-[#EF4444]/10"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Progreso Mobile - Debajo */}
                  <div className="md:hidden mt-4 pt-4 border-t border-[rgba(255,255,255,0.06)] space-y-3">
                    <div className="flex justify-between items-baseline">
                      <span className="text-xl font-semibold text-white">
                        {formatCurrency(currentAmount, goal.currency)}
                      </span>
                      <span className="text-[#8B92A8] text-sm">
                        de {formatCurrency(targetAmount, goal.currency)}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-[#121212] rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#C4FF3D] transition-all duration-300" 
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                    <p className="text-sm text-[#8B92A8]">
                      {progress.toFixed(1)}% completado
                    </p>
                    {goal.status !== 'completed' && remaining > 0 && (
                      <div className="flex items-center justify-between pt-2">
                        <div>
                          <p className="text-xs text-[#8B92A8]">Falta</p>
                          <p className="text-lg font-semibold text-white">
                            {formatCurrency(remaining, goal.currency)}
                          </p>
                        </div>
                        <Button
                          onClick={() => handleAddAmount(goal)}
                          variant="default"
                          size="sm"
                        >
                          <TrendingUp className="w-4 h-4 mr-2" />
                          Agregar
                        </Button>
                      </div>
                    )}
                  </div>

                  {goal.status === 'completed' && (
                    <div className="mt-4 p-3 bg-[#C4FF3D]/10 rounded-[28px] border border-[#C4FF3D]/20">
                      <p className="text-sm text-[#C4FF3D] font-medium text-center">
                        ¡Meta completada!
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
