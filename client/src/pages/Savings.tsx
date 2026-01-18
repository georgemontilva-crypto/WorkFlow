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
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type SavingsGoal } from '@/lib/db';
import { Target, Plus, TrendingUp, MoreVertical, Pencil, Trash2, CheckCircle2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { useState } from 'react';

export default function Savings() {
  const savingsGoals = useLiveQuery(() => db.savingsGoals.orderBy('createdAt').reverse().toArray());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [formData, setFormData] = useState<Partial<SavingsGoal>>({
    name: '',
    targetAmount: 0,
    currentAmount: 0,
    deadline: '',
    status: 'active',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.targetAmount || !formData.deadline) {
      toast.error('Por favor completa los campos requeridos');
      return;
    }

    const now = new Date().toISOString();

    if (editingGoal) {
      await db.savingsGoals.update(editingGoal.id!, {
        ...formData as SavingsGoal,
        updatedAt: now,
      });
      toast.success('Meta actualizada exitosamente');
    } else {
      await db.savingsGoals.add({
        ...formData as SavingsGoal,
        createdAt: now,
        updatedAt: now,
      });
      toast.success('Meta creada exitosamente');
    }

    setIsDialogOpen(false);
    setEditingGoal(null);
    setFormData({
      name: '',
      targetAmount: 0,
      currentAmount: 0,
      deadline: '',
      status: 'active',
    });
  };

  const handleEdit = (goal: SavingsGoal) => {
    setEditingGoal(goal);
    setFormData({
      name: goal.name,
      targetAmount: goal.targetAmount,
      currentAmount: goal.currentAmount,
      deadline: goal.deadline.split('T')[0],
      status: goal.status,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (goalId: number) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta meta de ahorro?')) {
      await db.savingsGoals.delete(goalId);
      toast.success('Meta eliminada exitosamente');
    }
  };

  const handleAddAmount = async (goalId: number, currentAmount: number) => {
    const amount = prompt('¿Cuánto deseas agregar a esta meta?');
    if (!amount) return;

    const newAmount = currentAmount + parseFloat(amount);
    const goal = await db.savingsGoals.get(goalId);
    
    if (goal) {
      const newStatus = newAmount >= goal.targetAmount ? 'completed' : 'active';
      await db.savingsGoals.update(goalId, {
        currentAmount: newAmount,
        status: newStatus,
        updatedAt: new Date().toISOString(),
      });
      
      if (newStatus === 'completed') {
        toast.success('¡Felicidades! Meta completada');
      } else {
        toast.success('Monto actualizado');
      }
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
                targetAmount: 0,
                currentAmount: 0,
                deadline: '',
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

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="targetAmount" className="text-foreground font-semibold">
                      Monto Objetivo <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="targetAmount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.targetAmount}
                      onChange={(e) => setFormData({ ...formData, targetAmount: parseFloat(e.target.value) || 0 })}
                      className="bg-background border-border text-foreground font-mono h-11"
                      required
                    />
                    <p className="text-xs text-muted-foreground">Meta a alcanzar</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currentAmount" className="text-foreground font-semibold">
                      Monto Actual
                    </Label>
                    <Input
                      id="currentAmount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.currentAmount}
                      onChange={(e) => setFormData({ ...formData, currentAmount: parseFloat(e.target.value) || 0 })}
                      className="bg-background border-border text-foreground font-mono h-11"
                    />
                    <p className="text-xs text-muted-foreground">Ahorro actual</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deadline" className="text-foreground font-semibold">
                    Fecha Límite <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="deadline"
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
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
                  <Button type="submit" className="bg-primary text-primary-foreground hover:opacity-90">
                    {editingGoal ? 'Actualizar' : 'Crear'} Meta
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Savings Goals */}
        {!savingsGoals || savingsGoals.length === 0 ? (
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
              const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
              const remaining = goal.targetAmount - goal.currentAmount;

              return (
                <Card key={goal.id} className="bg-card border-border hover:border-accent transition-colors">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-accent/20 flex items-center justify-center flex-shrink-0">
                          {goal.status === 'completed' ? (
                            <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-green-400" strokeWidth={1.5} />
                          ) : (
                            <Target className="w-5 h-5 sm:w-6 sm:h-6 text-accent-foreground" strokeWidth={1.5} />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <CardTitle className="text-foreground text-base sm:text-lg truncate">{goal.name}</CardTitle>
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            Fecha límite: {format(parseISO(goal.deadline), 'dd MMM yyyy', { locale: es })}
                          </p>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground flex-shrink-0">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-popover border-border" align="end">
                          <DropdownMenuItem 
                            onClick={() => handleEdit(goal)}
                            className="text-foreground hover:bg-accent cursor-pointer"
                          >
                            <Pencil className="w-4 h-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          {goal.status !== 'completed' && (
                            <DropdownMenuItem 
                              onClick={() => handleAddAmount(goal.id!, goal.currentAmount)}
                              className="text-foreground hover:bg-accent cursor-pointer"
                            >
                              <TrendingUp className="w-4 h-4 mr-2" />
                              Agregar Monto
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator className="bg-border" />
                          <DropdownMenuItem 
                            onClick={() => handleDelete(goal.id!)}
                            className="text-destructive hover:bg-destructive/10 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {goal.status === 'completed' && (
                      <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                        <p className="text-sm font-medium text-green-400 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4" />
                          Completada
                        </p>
                      </div>
                    )}
                    
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Progreso</span>
                        <span className="text-sm font-bold text-foreground">
                          {Math.min(progress, 100).toFixed(1)}%
                        </span>
                      </div>
                      <Progress value={Math.min(progress, 100)} className="h-2" />
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-3 border-t border-border">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Actual</p>
                        <p className="text-lg sm:text-xl font-bold font-mono text-foreground">
                          ${goal.currentAmount.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Objetivo</p>
                        <p className="text-lg sm:text-xl font-bold font-mono text-foreground">
                          ${goal.targetAmount.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>

                    {goal.status !== 'completed' && remaining > 0 && (
                      <div className="pt-3 border-t border-border">
                        <p className="text-xs text-muted-foreground mb-1">Falta</p>
                        <p className="text-base sm:text-lg font-bold font-mono text-foreground">
                          ${remaining.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
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
