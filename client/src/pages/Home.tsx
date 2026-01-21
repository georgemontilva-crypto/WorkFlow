/**
 * Home Page - Dashboard Principal con Widgets Personalizables
 * Design Philosophy: Apple Minimalism - Responsive mobile-first
 */

import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { trpc } from '@/lib/trpc';
import { Users, FileText, TrendingUp, TrendingDown, Plus, AlertCircle, Bell, Target, BarChart3, X, Sparkles } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { useLocation } from 'wouter';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/_core/hooks/useAuth';

import { MarketWidget } from '@/components/MarketWidget';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  TouchSensor,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { formatCurrency, Currency } from '@/lib/currency';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Home() {
  let { user } = useAuth();
  const [, setLocation] = useLocation();
  const { t } = useLanguage();
  
  // Fetch data using tRPC
  const { data: clients } = trpc.clients.list.useQuery();
  const { data: invoices } = trpc.invoices.list.useQuery();
  const { data: transactions } = trpc.transactions.list.useQuery();
  const { data: savingsGoals } = trpc.savingsGoals.list.useQuery();
  const { data: dashboardWidgets, refetch: refetchWidgets } = trpc.dashboardWidgets.list.useQuery();
  const { data: marketWidgets } = trpc.markets.getDashboardWidgets.useQuery();

  // Mutations
  const addWidgetMutation = trpc.dashboardWidgets.add.useMutation({
    onSuccess: () => {
      refetchWidgets();
      toast.success('Widget añadido');
    },
    onError: () => toast.error('Error al añadir widget'),
  });

  const removeWidgetMutation = trpc.dashboardWidgets.remove.useMutation({
    onSuccess: () => {
      refetchWidgets();
      toast.success('Widget eliminado');
    },
    onError: () => toast.error('Error al eliminar widget'),
  });

  const updateOrderMutation = trpc.dashboardWidgets.updateOrder.useMutation({
    onSuccess: () => {
      refetchWidgets();
    },
    onError: () => toast.error('Error al reordenar widgets'),
  });

  // DnD sensors configuration
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px de movimiento antes de activar drag
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250, // 250ms de presión antes de activar drag en móvil
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Local state for widget order
  const [localWidgets, setLocalWidgets] = useState<any[]>([]);
  const [cryptoWidgets, setCryptoWidgets] = useState<any[]>([]);
  const [normalWidgets, setNormalWidgets] = useState<any[]>([]);
  
  useEffect(() => {
    const cryptos: any[] = [];
    const normals: any[] = [];
    
    // Añadir market widgets (criptos) - estos van arriba con drag & drop
    if (marketWidgets) {
      marketWidgets.forEach(market => {
        cryptos.push({
          ...market,
          dragId: `market-${market.id}`,
          widget_type: 'market',
          symbol: market.symbol,
          marketType: market.type,
          widgetSource: 'market'
        });
      });
    }
    
    // Añadir dashboard widgets (normales) - estos van abajo sin drag & drop
    if (dashboardWidgets) {
      dashboardWidgets.forEach(widget => {
        normals.push({
          ...widget,
          dragId: `widget-${widget.id}`,
          widgetSource: 'dashboard'
        });
      });
    }
    
    // Ordenar criptos por position
    cryptos.sort((a, b) => (a.position || 0) - (b.position || 0));
    
    // Ordenar widgets normales por position
    normals.sort((a, b) => (a.position || 0) - (b.position || 0));
    
    setCryptoWidgets(cryptos);
    setNormalWidgets(normals);
    setLocalWidgets(cryptos); // Solo las criptos tienen drag & drop
  }, [dashboardWidgets, marketWidgets]);

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

  // Get reminders
  const today = new Date();
  const overduePayments = clients?.filter(c => {
    if (!c.next_payment_date || c.status !== 'active') return false;
    return new Date(c.next_payment_date) < today;
  }) || [];

  const upcomingPayments = clients?.filter(c => {
    if (!c.next_payment_date || c.status !== 'active') return false;
    const daysUntil = differenceInDays(new Date(c.next_payment_date), today);
    return daysUntil >= 0 && daysUntil <= (c.reminder_days || 3);
  }) || [];

  // Get top 3 active savings goals
  const topSavingsGoals = savingsGoals?.filter(g => g.status === 'active').slice(0, 3) || [];

  // Handle widget addition
  const handleAddWidget = (widgetType: string) => {
    addWidgetMutation.mutate({ widget_type: widgetType });
  };

  // Handle widget removal
  const handleRemoveWidget = (widget: any) => {
    // Si es un widget normal (dashboard), usar el id original
    if (widget.widgetSource === 'dashboard') {
      removeWidgetMutation.mutate({ id: widget.id });
    }
    // Si es un market widget, no se puede eliminar desde aquí (se elimina desde Markets)
  };

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    setLocalWidgets((items) => {
      const oldIndex = items.findIndex((item) => item.dragId === active.id);
      const newIndex = items.findIndex((item) => item.dragId === over.id);

      const newOrder = arrayMove(items, oldIndex, newIndex);
      
      // Update positions in database - send array of dragIds
      const widgetIds = newOrder.map(widget => widget.dragId);
      console.log('Nuevo orden de widgets:', widgetIds);
      updateOrderMutation.mutate({ widgetIds });
      
      return newOrder;
    });
  };

  // Check if widget type exists
  const hasWidget = (type: string) => {
    return dashboardWidgets?.some(w => w.widget_type === type);
  };

  // Render widget based on type
  const renderWidget = (widget: any) => {
    const widgetType = widget.widget_type;

    // Remove button component
    const RemoveButton = () => (
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => {
          e.stopPropagation();
          handleRemoveWidget(widget);
        }}
      >
        <X className="h-4 w-4" />
      </Button>
    );

    switch (widgetType) {
      case 'clients':
        return (
          <Card key={widget.id} className="bg-card border-border hover:bg-accent/5 transition-colors cursor-pointer h-full group relative" onClick={() => setLocation('/clients')}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t.dashboard.activeClients}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
                <RemoveButton />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold text-foreground">{activeClients}</div>
            </CardContent>
          </Card>
        );

      case 'invoices':
        return (
          <Card key={widget.id} className="bg-card border-border hover:bg-accent/5 transition-colors cursor-pointer h-full group relative" onClick={() => setLocation('/invoices')}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t.dashboard.pendingInvoices}
              </CardTitle>
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
                <RemoveButton />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold text-foreground">{pendingInvoices}</div>
            </CardContent>
          </Card>
        );

      case 'income':
        return (
          <Card key={widget.id} className="bg-card border-border hover:bg-accent/5 transition-colors cursor-pointer h-full group relative" onClick={() => setLocation('/finances')}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t.dashboard.monthlyIncome}
              </CardTitle>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
                <RemoveButton />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold text-foreground font-mono">
                {formatCurrency(monthlyIncome, 'USD')}
              </div>
            </CardContent>
          </Card>
        );

      case 'expenses':
        return (
          <Card key={widget.id} className="bg-card border-border hover:bg-accent/5 transition-colors cursor-pointer h-full group relative" onClick={() => setLocation('/finances')}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t.dashboard.monthlyExpenses}
              </CardTitle>
              <div className="flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
                <RemoveButton />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold text-foreground font-mono">
                {formatCurrency(monthlyExpenses, 'USD')}
              </div>
            </CardContent>
          </Card>
        );

      case 'savings':
        return (
          <Card key={widget.id} className="bg-card border-border hover:bg-accent/5 transition-colors cursor-pointer h-full group relative" onClick={() => setLocation('/savings')}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t.goals.title}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
                <RemoveButton />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold text-foreground">
                {savingsGoals?.filter(g => g.status === 'active').length || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Metas activas</p>
            </CardContent>
          </Card>
        );

      case 'reminders':
        return (
          <Card key={widget.id} className="bg-card border-border hover:bg-accent/5 transition-colors cursor-pointer h-full group relative" onClick={() => setLocation('/reminders')}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t.reminders.title}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
                <RemoveButton />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold text-foreground">
                {overduePayments.length + upcomingPayments.length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Recordatorios activos</p>
            </CardContent>
          </Card>
        );

      case 'market':
        // Renderizar market widget con botón de remover
        return (
          <div key={widget.id} className="h-full">
            <MarketWidget symbol={widget.symbol} type={widget.marketType} />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 lg:p-8">

        
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
            {/* Add Widget Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex-1 sm:flex-none">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Añadir Widget
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Widgets Disponibles</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => handleAddWidget('clients')}
                  disabled={hasWidget('clients')}
                >
                  <Users className="w-4 h-4 mr-2" />
                  Clientes Activos
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => handleAddWidget('invoices')}
                  disabled={hasWidget('invoices')}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Facturas Pendientes
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => handleAddWidget('income')}
                  disabled={hasWidget('income')}
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Ingresos del Mes
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => handleAddWidget('expenses')}
                  disabled={hasWidget('expenses')}
                >
                  <TrendingDown className="w-4 h-4 mr-2" />
                  Gastos del Mes
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => handleAddWidget('savings')}
                  disabled={hasWidget('savings')}
                >
                  <Target className="w-4 h-4 mr-2" />
                  Metas de Ahorro
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => handleAddWidget('reminders')}
                  disabled={hasWidget('reminders')}
                >
                  <Bell className="w-4 h-4 mr-2" />
                  Recordatorios
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setLocation('/markets')}>
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Ver Mercados
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

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

        {/* Crypto Widgets Grid (Sortable) */}
        {cryptoWidgets.length > 0 && (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={cryptoWidgets.map(w => w.dragId)}
              strategy={rectSortingStrategy}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8">
                {cryptoWidgets.map(widget => (
                  <SortableWidget key={widget.dragId} widget={widget}>
                    {renderWidget(widget)}
                  </SortableWidget>
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}

        {/* Empty State */}
        {(!dashboardWidgets || dashboardWidgets.length === 0) && (!marketWidgets || marketWidgets.length === 0) && (
          <Card className="border-dashed border-2 mb-6 lg:mb-8">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Sparkles className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Personaliza tu Dashboard</h3>
              <p className="text-sm text-muted-foreground text-center mb-4">
                Añade widgets para ver la información que más te importa
              </p>
              <Button onClick={() => handleAddWidget('clients')}>
                <Plus className="w-4 h-4 mr-2" />
                Añadir Primer Widget
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Alerts Section */}
        {(overduePayments.length > 0 || upcomingPayments.length > 0) && (
          <div className="mb-6 lg:mb-8 space-y-4">
            {overduePayments.length > 0 && (
              <Card className="bg-destructive/10 border-destructive/20">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-destructive" />
                    <CardTitle className="text-base font-semibold text-destructive">
                      {t.notifications.overduePayments}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    {t.notifications.overdueMessage.replace('{count}', overduePayments.length.toString())}
                  </p>
                  <Button 
                    size="sm" 
                    variant="destructive"
                    onClick={() => setLocation('/reminders')}
                  >
                    {t.notifications.viewReminders}
                  </Button>
                </CardContent>
              </Card>
            )}

            {upcomingPayments.length > 0 && (
              <Card className="bg-primary/10 border-primary/20">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Bell className="w-5 h-5 text-primary" />
                    <CardTitle className="text-base font-semibold text-primary">
                      {t.notifications.upcomingPayments}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    {t.notifications.upcomingMessage.replace('{count}', upcomingPayments.length.toString())}
                  </p>
                  <Button 
                    size="sm" 
                    onClick={() => setLocation('/reminders')}
                  >
                    {t.notifications.viewReminders}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Widgets & Savings Goals Section */}
        {(normalWidgets.length > 0 || topSavingsGoals.length > 0) && (
          <div className="mb-6 lg:mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                Resumen
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Normal Widgets (sin drag & drop) */}
              {normalWidgets.map(widget => (
                <div key={widget.id}>
                  {renderWidget(widget)}
                </div>
              ))}
              
              {/* Savings Goals */}
              {topSavingsGoals.map((goal) => {
                const progress = (parseFloat(goal.current_amount.toString()) / parseFloat(goal.target_amount.toString())) * 100;
                return (
                  <Card key={goal.id} className="bg-card border-border hover:bg-accent/5 transition-colors cursor-pointer" onClick={() => setLocation('/savings')}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base font-medium">{goal.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Progreso</span>
                        <span className="font-semibold">{progress.toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          {formatCurrency(parseFloat(goal.current_amount.toString()), (goal as any).currency || 'USD')}
                        </span>
                        <span className="font-semibold">
                          {formatCurrency(parseFloat(goal.target_amount.toString()), (goal as any).currency || 'USD')}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
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
            <Bell className="w-6 h-6 text-primary" />
            <span className="text-sm">{t.reminders.title}</span>
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}

// Sortable Widget Wrapper Component
function SortableWidget({ widget, children }: { widget: any; children: React.ReactNode }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    setActivatorNodeRef,
  } = useSortable({ id: widget.dragId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className="group relative"
    >
      {/* Drag Handle - Bottom right corner */}
      <button
        ref={setActivatorNodeRef}
        {...listeners}
        className="absolute bottom-3 right-3 z-20 cursor-grab active:cursor-grabbing bg-background/90 hover:bg-background rounded-md p-2 backdrop-blur-sm border border-border shadow-sm transition-all hover:scale-110"
        style={{ touchAction: 'none' }}
        onClick={(e) => e.stopPropagation()}
        aria-label="Arrastrar para reordenar"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-muted-foreground"
        >
          <circle cx="9" cy="12" r="1.5" fill="currentColor" />
          <circle cx="9" cy="5" r="1.5" fill="currentColor" />
          <circle cx="9" cy="19" r="1.5" fill="currentColor" />
          <circle cx="15" cy="12" r="1.5" fill="currentColor" />
          <circle cx="15" cy="5" r="1.5" fill="currentColor" />
          <circle cx="15" cy="19" r="1.5" fill="currentColor" />
        </svg>
      </button>
      {children}
    </div>
  );
}
