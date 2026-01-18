/**
 * Savings Page - Metas de Ahorro
 * Design Philosophy: Apple Minimalism
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type SavingsGoal } from '@/lib/db';
import { Plus, Target, TrendingUp } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

export default function Savings() {
  const savingsGoals = useLiveQuery(() => db.savingsGoals.orderBy('createdAt').reverse().toArray());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
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
      toast.error('Por favor completa todos los campos requeridos');
      return;
    }

    const now = new Date().toISOString();

    await db.savingsGoals.add({
      ...formData as SavingsGoal,
      createdAt: now,
      updatedAt: now,
    });

    toast.success('Meta de ahorro creada exitosamente');
    setIsDialogOpen(false);
    setFormData({
      name: '',
      targetAmount: 0,
      currentAmount: 0,
      deadline: '',
      status: 'active',
    });
  };

  const updateProgress = async (goalId: number, amount: number) => {
    const goal = await db.savingsGoals.get(goalId);
    if (!goal) return;

    const newAmount = goal.currentAmount + amount;
    const status = newAmount >= goal.targetAmount ? 'completed' : 'active';

    await db.savingsGoals.update(goalId, {
      currentAmount: newAmount,
      status,
      updatedAt: new Date().toISOString(),
    });

    toast.success('Progreso actualizado');
  };

  return (
    <DashboardLayout>
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Metas de Ahorro</h1>
            <p className="text-muted-foreground">
              Define y alcanza tus objetivos financieros
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground hover:opacity-90">
                <Plus className="w-4 h-4 mr-2" />
                Nueva Meta
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-popover border-border">
              <DialogHeader>
                <DialogTitle className="text-foreground">Crear Meta de Ahorro</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-foreground">Nombre de la Meta *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="bg-background border-border text-foreground"
                    placeholder="Ej: Fondo de Emergencia, Vacaciones"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="targetAmount" className="text-foreground">Monto Objetivo *</Label>
                  <Input
                    id="targetAmount"
                    type="number"
                    step="0.01"
                    value={formData.targetAmount}
                    onChange={(e) => setFormData({ ...formData, targetAmount: parseFloat(e.target.value) })}
                    className="bg-background border-border text-foreground font-mono"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currentAmount" className="text-foreground">Monto Actual</Label>
                  <Input
                    id="currentAmount"
                    type="number"
                    step="0.01"
                    value={formData.currentAmount}
                    onChange={(e) => setFormData({ ...formData, currentAmount: parseFloat(e.target.value) })}
                    className="bg-background border-border text-foreground font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deadline" className="text-foreground">Fecha Límite *</Label>
                  <Input
                    id="deadline"
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
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
                    Crear Meta
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
              <img 
                src="/images/financial-growth.png" 
                alt="No hay metas" 
                className="w-64 h-64 object-contain opacity-50 mb-6"
              />
              <h3 className="text-xl font-semibold text-foreground mb-2">
                No hay metas de ahorro aún
              </h3>
              <p className="text-muted-foreground mb-6">
                Comienza definiendo tu primera meta financiera
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {savingsGoals.map((goal) => {
              const progress = (goal.currentAmount / goal.targetAmount) * 100;
              const remaining = goal.targetAmount - goal.currentAmount;

              return (
                <Card key={goal.id} className="bg-card border-border">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-accent flex items-center justify-center">
                          <Target className="w-6 h-6 text-accent-foreground" strokeWidth={1.5} />
                        </div>
                        <div>
                          <CardTitle className="text-foreground">{goal.name}</CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">
                            Fecha límite: {format(parseISO(goal.deadline), 'dd MMM yyyy', { locale: es })}
                          </p>
                        </div>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        goal.status === 'completed' 
                          ? 'bg-accent text-accent-foreground' 
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {goal.status === 'completed' ? 'Completada' : 'Activa'}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Progreso</span>
                        <span className="text-sm font-medium text-foreground">
                          {progress.toFixed(1)}%
                        </span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Actual</p>
                        <p className="text-lg font-bold font-mono text-foreground">
                          ${goal.currentAmount.toLocaleString('es-ES')}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Objetivo</p>
                        <p className="text-lg font-bold font-mono text-foreground">
                          ${goal.targetAmount.toLocaleString('es-ES')}
                        </p>
                      </div>
                    </div>

                    {goal.status !== 'completed' && (
                      <div className="pt-2">
                        <p className="text-sm text-muted-foreground mb-2">
                          Faltan: ${remaining.toLocaleString('es-ES')}
                        </p>
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="Monto"
                            className="bg-background border-border text-foreground font-mono"
                            id={`amount-${goal.id}`}
                          />
                          <Button
                            onClick={() => {
                              const input = document.getElementById(`amount-${goal.id}`) as HTMLInputElement;
                              const amount = parseFloat(input.value);
                              if (amount > 0) {
                                updateProgress(goal.id!, amount);
                                input.value = '';
                              }
                            }}
                            className="bg-primary text-primary-foreground hover:opacity-90"
                          >
                            <TrendingUp className="w-4 h-4" />
                          </Button>
                        </div>
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
