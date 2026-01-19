/**
 * Home Page - Dashboard Principal
 * Design Philosophy: Apple Minimalism - Responsive mobile-first
 */

import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { trpc } from '@/lib/trpc';
import { Users, FileText, TrendingUp, TrendingDown, Plus, AlertCircle, Bell, Target, BarChart3, Star } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { useLocation } from 'wouter';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/_core/hooks/useAuth';
import { TrialBanner } from '@/components/TrialBanner';
import { MarketWidget } from '@/components/MarketWidget';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableItem } from '@/components/SortableItem';
import { useState, useEffect } from 'react';

export default function Home() {
  // The userAuth hooks provides authentication state
  // To implement login/logout functionality, simply call logout() or redirect to getLoginUrl()
  let { user, loading, error, isAuthenticated, logout } = useAuth();

  const [, setLocation] = useLocation();
  const { t } = useLanguage();
  
  // Fetch data using tRPC
  const { data: clients } = trpc.clients.list.useQuery();
  const { data: invoices } = trpc.invoices.list.useQuery();
  const { data: transactions } = trpc.transactions.list.useQuery();
  const { data: savingsGoals } = trpc.savingsGoals.list.useQuery();
  const { data: dashboardWidgets } = trpc.markets.getDashboardWidgets.useQuery();

  // State for draggable items
  const [items, setItems] = useState(['clients', 'invoices', 'income', 'expenses']);
  
  // Load saved order from localStorage
  useEffect(() => {
    const savedOrder = localStorage.getItem('dashboardCardOrder');
    const baseItems = ['clients', 'invoices', 'income', 'expenses'];
    
    // Add widget IDs to the base items if they exist
    const widgetIds = dashboardWidgets?.map(w => `widget-${w.symbol}`) || [];
    const allCurrentItems = [...baseItems, ...widgetIds];
    
    if (savedOrder) {
      try {
        const parsed = JSON.parse(savedOrder);
        const currentSet = new Set(allCurrentItems);
        const validSaved = parsed.filter((id: string) => currentSet.has(id));
        const missing = allCurrentItems.filter(id => !validSaved.includes(id));
        setItems([...validSaved, ...missing]);
      } catch (e) {
        console.error('Error parsing saved order', e);
        setItems(allCurrentItems);
      }
    } else {
      setItems(allCurrentItems);
    }
  }, [dashboardWidgets]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before drag starts (prevents accidental clicks)
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over.id as string);
        const newOrder = arrayMove(items, oldIndex, newIndex);
        
        // Save to localStorage
        localStorage.setItem('dashboardCardOrder', JSON.stringify(newOrder));
        
        return newOrder;
      });
    }
  };

  // Calcular estadísticas
  const activeClients = clients?.filter(c => c.status === 'active').length || 0;
  const pendingInvoices = invoices?.filter(i => i.status === 'draft' || i.status === 'sent').length || 0;
  
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const monthlyIncome = transactions?.filter(t => {
    const date = new Date(t.date);
    return t.type === 'income' && 
           date.getMonth() === currentMonth && 
           date.getFullYear() === currentYear;
  }).reduce((sum, t) => sum + parseFloat(t.amount), 0) || 0;

  const monthlyExpenses = transactions?.filter(t => {
    const date = new Date(t.date);
    return t.type === 'expense' && 
           date.getMonth() === currentMonth && 
           date.getFullYear() === currentYear;
  }).reduce((sum, t) => sum + parseFloat(t.amount), 0) || 0;

  // Próximos pagos (7 días)
  const upcomingPayments = clients?.filter(client => {
    const daysUntil = differenceInDays(new Date(client.next_payment_date), new Date());
    return daysUntil >= 0 && daysUntil <= client.reminder_days && client.status === 'active';
  }).sort((a, b) => 
    new Date(a.next_payment_date).getTime() - new Date(b.next_payment_date).getTime()
  ) || [];

  // Pagos vencidos
  const overduePayments = clients?.filter(client => {
    const daysUntil = differenceInDays(new Date(client.next_payment_date), new Date());
    return daysUntil < 0 && client.status === 'active';
  }) || [];

  // Get top 3 active savings goals
  const topSavingsGoals = savingsGoals?.filter(g => g.status === 'active').slice(0, 3) || [];

  // Determine card item class based on total items
  const cardItemClass = items.length <= 4 
    ? 'min-w-[280px] sm:min-w-0 snap-start snap-always shrink-0 h-full' 
    : 'min-w-[280px] snap-start snap-always shrink-0 h-full';

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 lg:p-8">
        {/* Trial Banner */}
        <TrialBanner />
        
        {/* Header with Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 lg:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">{t.dashboard.title}</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              {t.dashboard.subtitle}
            </p>
          </div>
          
          {/* Action Buttons - Top Right */}
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <Button
              onClick={() => setLocation('/clients?new=true')}
              className="bg-primary text-primary-foreground hover:opacity-90 flex-1 sm:flex-none"
            >
              <Plus className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">{t.clients.newClient}</span>
              <span className="sm:hidden">{t.clients.title}</span>
            </Button>
            <Button
              onClick={() => setLocation('/invoices?new=true')}
              variant="outline"
              className="flex-1 sm:flex-none"
            >
              <Plus className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">{t.invoices.newInvoice}</span>
              <span className="sm:hidden">{t.invoices.title}</span>
            </Button>
          </div>
        </div>

        {/* Stats Grid - Draggable */}
        <DndContext 
          sensors={sensors} 
          collisionDetection={closestCenter} 
          onDragEnd={handleDragEnd}
        >
          <SortableContext 
            items={items} 
            strategy={horizontalListSortingStrategy}
          >
            <div className={`flex gap-4 lg:gap-6 mb-6 lg:mb-8 overflow-x-auto pb-2 snap-x snap-mandatory ${items.length <= 4 ? 'sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:overflow-x-visible sm:snap-none' : ''}`} style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {items.map((id) => {
                if (id === 'clients') {
                  return (
                    <SortableItem key={id} id={id} className={cardItemClass}>
                      <Card className="bg-card border-border hover:bg-accent/5 transition-colors cursor-pointer h-full" onClick={() => setLocation('/clients')}>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                          <CardTitle className="text-sm font-medium text-muted-foreground">
                            {t.dashboard.activeClients}
                          </CardTitle>
                          <Users className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl sm:text-3xl font-bold text-foreground">{activeClients}</div>
                        </CardContent>
                      </Card>
                    </SortableItem>
                  );
                }
                if (id === 'invoices') {
                  return (
                    <SortableItem key={id} id={id} className={cardItemClass}>
                      <Card className="bg-card border-border hover:bg-accent/5 transition-colors cursor-pointer h-full" onClick={() => setLocation('/invoices')}>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                          <CardTitle className="text-sm font-medium text-muted-foreground">
                            {t.dashboard.pendingInvoices}
                          </CardTitle>
                          <FileText className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl sm:text-3xl font-bold text-foreground">{pendingInvoices}</div>
                        </CardContent>
                      </Card>
                    </SortableItem>
                  );
                }
                if (id === 'income') {
                  return (
                    <SortableItem key={id} id={id} className={cardItemClass}>
                      <Card className="bg-card border-border hover:bg-accent/5 transition-colors cursor-pointer h-full" onClick={() => setLocation('/finances')}>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                          <CardTitle className="text-sm font-medium text-muted-foreground">
                            {t.dashboard.monthlyIncome}
                          </CardTitle>
                          <TrendingUp className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl sm:text-3xl font-bold text-foreground font-mono">
                            ${monthlyIncome.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                          </div>
                        </CardContent>
                      </Card>
                    </SortableItem>
                  );
                }
                if (id === 'expenses') {
                  return (
                    <SortableItem key={id} id={id} className={cardItemClass}>
                      <Card className="bg-card border-border hover:bg-accent/5 transition-colors cursor-pointer h-full" onClick={() => setLocation('/finances')}>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                          <CardTitle className="text-sm font-medium text-muted-foreground">
                            {t.dashboard.monthlyExpenses}
                          </CardTitle>
                          <TrendingDown className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl sm:text-3xl font-bold text-foreground font-mono">
                            ${monthlyExpenses.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                          </div>
                        </CardContent>
                      </Card>
                    </SortableItem>
                  );
                }
                if (id.startsWith('widget-') && dashboardWidgets) {
                  const symbol = id.replace('widget-', '');
                  const widget = dashboardWidgets.find(w => w.symbol === symbol);
                  if (widget) {
                    return (
                      <SortableItem key={id} id={id} className={cardItemClass}>
                        <MarketWidget symbol={widget.symbol} type={widget.type} />
                      </SortableItem>
                    );
                  }
                }
                return null;
              })}
            </div>
          </SortableContext>
        </DndContext>

        {/* Alerts Section */}
        {(overduePayments.length > 0 || upcomingPayments.length > 0) && (
          <div className="mb-6 lg:mb-8 space-y-4">
            {overduePayments.length > 0 && (
              <Card className="bg-destructive/10 border-destructive/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2 text-destructive">
                    <AlertCircle className="w-5 h-5" />
                    {t.dashboard.overduePayments} ({overduePayments.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {overduePayments.slice(0, 3).map((client) => (
                      <div 
                        key={client.id} 
                        className="flex items-center justify-between p-3 bg-background/50 rounded-lg cursor-pointer hover:bg-background/80 transition-colors"
                        onClick={() => setLocation(`/clients?id=${client.id}`)}
                      >
                        <div>
                          <p className="font-medium text-foreground">{client.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Vencido hace {Math.abs(differenceInDays(new Date(client.next_payment_date), new Date()))} días
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-mono font-bold text-destructive">${parseFloat(client.amount).toLocaleString('es-ES', { minimumFractionDigits: 2 })}</p>
                          <p className="text-xs text-muted-foreground">{format(new Date(client.next_payment_date), 'dd MMM yyyy', { locale: es })}</p>
                        </div>
                      </div>
                    ))}
                    {overduePayments.length > 3 && (
                      <Button 
                        variant="ghost" 
                        className="w-full mt-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => setLocation('/clients')}
                      >
                        Ver todos ({overduePayments.length})
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {upcomingPayments.length > 0 && (
              <Card className="bg-yellow-500/10 border-yellow-500/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2 text-yellow-600 dark:text-yellow-500">
                    <Bell className="w-5 h-5" />
                    {t.dashboard.upcomingPayments} ({upcomingPayments.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {upcomingPayments.slice(0, 3).map((client) => (
                      <div 
                        key={client.id} 
                        className="flex items-center justify-between p-3 bg-background/50 rounded-lg cursor-pointer hover:bg-background/80 transition-colors"
                        onClick={() => setLocation(`/clients?id=${client.id}`)}
                      >
                        <div>
                          <p className="font-medium text-foreground">{client.name}</p>
                          <p className="text-sm text-muted-foreground">
                            En {differenceInDays(new Date(client.next_payment_date), new Date())} días
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-mono font-bold text-yellow-600 dark:text-yellow-500">${parseFloat(client.amount).toLocaleString('es-ES', { minimumFractionDigits: 2 })}</p>
                          <p className="text-xs text-muted-foreground">{format(new Date(client.next_payment_date), 'dd MMM yyyy', { locale: es })}</p>
                        </div>
                      </div>
                    ))}
                    {upcomingPayments.length > 3 && (
                      <Button 
                        variant="ghost" 
                        className="w-full mt-2 text-yellow-600 dark:text-yellow-500 hover:text-yellow-600 dark:hover:text-yellow-500 hover:bg-yellow-500/10"
                        onClick={() => setLocation('/clients')}
                      >
                        Ver todos ({upcomingPayments.length})
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Savings Goals Section */}
        {topSavingsGoals.length > 0 && (
          <div className="mb-6 lg:mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                {t.goals.title}
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation('/savings')}
                className="text-primary hover:text-primary hover:bg-primary/10"
              >
                Ver todas
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {topSavingsGoals.map((goal) => {
                const progress = (parseFloat(goal.current_amount) / parseFloat(goal.target_amount)) * 100;
                return (
                  <Card 
                    key={goal.id} 
                    className="bg-card border-border hover:border-primary/50 hover:shadow-lg transition-all cursor-pointer"
                    onClick={() => setLocation('/savings')}
                  >
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center justify-between">
                        <span className="truncate">{goal.name}</span>
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 shrink-0" />
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-baseline justify-between">
                          <span className="text-2xl font-bold font-mono text-foreground">
                            ${parseFloat(goal.current_amount).toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            de ${parseFloat(goal.target_amount).toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>Progreso</span>
                            <span className="font-medium">{progress.toFixed(0)}%</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary transition-all duration-300"
                              style={{ width: `${Math.min(progress, 100)}%` }}
                            />
                          </div>
                        </div>
                        {goal.target_date && (
                          <p className="text-xs text-muted-foreground">
                            Meta: {format(new Date(goal.target_date), 'dd MMM yyyy', { locale: es })}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Button
            variant="outline"
            className="h-auto py-4 flex flex-col items-center gap-2"
            onClick={() => setLocation('/finances')}
          >
            <BarChart3 className="w-6 h-6 text-primary" />
            <span className="text-sm">{t.finances.title}</span>
          </Button>
          <Button
            variant="outline"
            className="h-auto py-4 flex flex-col items-center gap-2"
            onClick={() => setLocation('/savings')}
          >
            <Target className="w-6 h-6 text-primary" />
            <span className="text-sm">{t.goals.title}</span>
          </Button>
          <Button
            variant="outline"
            className="h-auto py-4 flex flex-col items-center gap-2"
            onClick={() => setLocation('/markets')}
          >
            <TrendingUp className="w-6 h-6 text-primary" />
            <span className="text-sm">Mercados</span>
          </Button>
          <Button
            variant="outline"
            className="h-auto py-4 flex flex-col items-center gap-2"
            onClick={() => setLocation('/reminders')}
          >
            <Bell className="w-6 h-4 text-primary" />
            <span className="text-sm">{t.reminders.title}</span>
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
