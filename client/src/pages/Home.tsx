/**
 * Home Page - Dashboard Principal
 * Design Philosophy: Apple Minimalism - Responsive mobile-first
 */

import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { Users, FileText, TrendingUp, TrendingDown, Plus, AlertCircle, Bell, Target } from 'lucide-react';
import { format, parseISO, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { useLocation } from 'wouter';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/_core/hooks/useAuth';

export default function Home() {
  // The userAuth hooks provides authentication state
  // To implement login/logout functionality, simply call logout() or redirect to getLoginUrl()
  let { user, loading, error, isAuthenticated, logout } = useAuth();

  const [, setLocation] = useLocation();
  const { t } = useLanguage();
  const clients = useLiveQuery(() => db.clients.toArray());
  const invoices = useLiveQuery(() => db.invoices.toArray());
  const transactions = useLiveQuery(() => 
    db.transactions
      .orderBy('date')
      .reverse()
      .toArray()
  );
  const savingsGoals = useLiveQuery(() => 
    db.savingsGoals
      .orderBy('createdAt')
      .reverse()
      .limit(3)
      .toArray()
  );

  // Calcular estadísticas
  const activeClients = clients?.filter(c => c.status === 'active').length || 0;
  const pendingInvoices = invoices?.filter(i => i.status === 'pending').length || 0;
  
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const monthlyIncome = transactions?.filter(t => {
    const date = new Date(t.date);
    return t.type === 'income' && 
           date.getMonth() === currentMonth && 
           date.getFullYear() === currentYear;
  }).reduce((sum, t) => sum + t.amount, 0) || 0;

  const monthlyExpenses = transactions?.filter(t => {
    const date = new Date(t.date);
    return t.type === 'expense' && 
           date.getMonth() === currentMonth && 
           date.getFullYear() === currentYear;
  }).reduce((sum, t) => sum + t.amount, 0) || 0;

  // Próximos pagos (7 días)
  const upcomingPayments = clients?.filter(client => {
    const daysUntil = differenceInDays(parseISO(client.nextPaymentDate), new Date());
    return daysUntil >= 0 && daysUntil <= client.reminderDays && client.status === 'active';
  }).sort((a, b) => 
    new Date(a.nextPaymentDate).getTime() - new Date(b.nextPaymentDate).getTime()
  ) || [];

  // Pagos vencidos
  const overduePayments = clients?.filter(client => {
    const daysUntil = differenceInDays(parseISO(client.nextPaymentDate), new Date());
    return daysUntil < 0 && client.status === 'active';
  }) || [];

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
            <Button
              onClick={() => setLocation('/clients')}
              className="bg-primary text-primary-foreground hover:opacity-90 flex-1 sm:flex-none"
            >
              <Plus className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">{t.clients.newClient}</span>
              <span className="sm:hidden">{t.clients.title}</span>
            </Button>
            <Button
              onClick={() => setLocation('/invoices')}
              variant="outline"
              className="border-border text-foreground hover:bg-accent flex-1 sm:flex-none"
            >
              <Plus className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">{t.invoices.newInvoice}</span>
              <span className="sm:hidden">{t.invoices.title}</span>
            </Button>
          </div>
        </div>

        {/* Hero Section */}
        <div className="mb-4 lg:mb-6 rounded-xl h-24 sm:h-32 lg:h-36 bg-gradient-to-br from-card via-accent/20 to-card border border-border flex items-center justify-center px-4">
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 text-center sm:text-left">
            <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-2xl bg-accent/30 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-foreground" strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg lg:text-xl font-bold text-foreground">{t.dashboard.totalControl}</h2>
              <p className="text-sm sm:text-base text-muted-foreground">{t.dashboard.totalControlSubtitle}</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-4 mb-4 lg:mb-6">
          <Card className="bg-card border-border">
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="text-xs sm:text-sm text-muted-foreground font-medium flex items-center gap-2">
                <Users className="w-3 h-3 sm:w-4 sm:h-4" strokeWidth={1.5} />
                <span className="hidden sm:inline">{t.dashboard.activeClients}</span>
                <span className="sm:hidden">{t.clients.title}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground">{activeClients}</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="text-xs sm:text-sm text-muted-foreground font-medium flex items-center gap-2">
                <FileText className="w-3 h-3 sm:w-4 sm:h-4" strokeWidth={1.5} />
                <span className="hidden sm:inline">{t.dashboard.pendingInvoices}</span>
                <span className="sm:hidden">{t.invoices.title}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground">{pendingInvoices}</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="text-xs sm:text-sm text-muted-foreground font-medium flex items-center gap-2">
                <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" strokeWidth={1.5} />
                <span className="hidden sm:inline">{t.dashboard.monthlyIncome}</span>
                <span className="sm:hidden">{t.finances.income}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold font-mono text-foreground">
                ${monthlyIncome.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="text-xs sm:text-sm text-muted-foreground font-medium flex items-center gap-2">
                <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4" strokeWidth={1.5} />
                <span className="hidden sm:inline">{t.dashboard.monthlyExpenses}</span>
                <span className="sm:hidden">{t.finances.expense}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold font-mono text-foreground">
                ${monthlyExpenses.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Alerts, Upcoming Payments and Savings Goals */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
          {/* Overdue Payments Alert */}
          {overduePayments.length > 0 && (
            <Card className="bg-destructive/10 border-destructive/30">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2 text-base sm:text-lg">
                  <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-destructive" />
                  Pagos Vencidos ({overduePayments.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-32 sm:max-h-40 overflow-y-auto">
                  {overduePayments.map((client) => (
                    <div key={client.id} className="flex items-center justify-between p-2 sm:p-3 bg-background/50 rounded-lg">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-foreground text-sm sm:text-base truncate">{client.name}</p>
                        <p className="text-xs sm:text-sm text-destructive">
                          Vencido: {format(parseISO(client.nextPaymentDate), 'dd/MM/yyyy')}
                        </p>
                      </div>
                      <p className="text-sm sm:text-base font-bold font-mono text-foreground ml-2">
                        ${client.amount.toLocaleString('es-ES')}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Upcoming Payments */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2 text-base sm:text-lg">
                <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                {t.dashboard.upcomingPayments}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingPayments.length === 0 ? (
                <p className="text-sm sm:text-base text-muted-foreground text-center py-4 sm:py-8">
                  {t.dashboard.noUpcomingPayments}
                </p>
              ) : (
                <div className="space-y-2 max-h-32 sm:max-h-40 overflow-y-auto">
                  {upcomingPayments.map((client) => {
                    const daysUntil = differenceInDays(parseISO(client.nextPaymentDate), new Date());
                    return (
                      <div key={client.id} className="flex items-center justify-between p-2 sm:p-3 bg-accent/10 rounded-lg">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-foreground text-sm sm:text-base truncate">{client.name}</p>
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            {format(parseISO(client.nextPaymentDate), 'dd/MM/yyyy', { locale: es })} ({daysUntil} días)
                          </p>
                        </div>
                        <p className="text-sm sm:text-base font-bold font-mono text-foreground ml-2">
                          ${client.amount.toLocaleString('es-ES')}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Savings Goals Summary */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2 text-base sm:text-lg">
                <Target className="w-4 h-4 sm:w-5 sm:h-5" />
                {t.dashboard.savingsGoals}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!savingsGoals || savingsGoals.length === 0 ? (
                <div className="text-center py-4 sm:py-8">
                  <p className="text-sm sm:text-base text-muted-foreground mb-3">
                    {t.dashboard.noSavingsGoals}
                  </p>
                  <Button
                    onClick={() => setLocation('/savings')}
                    variant="outline"
                    size="sm"
                    className="border-border text-foreground hover:bg-accent"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {t.goals.newGoal}
                  </Button>
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4 max-h-48 sm:max-h-64 overflow-y-auto">
                  {savingsGoals.map((goal) => {
                    const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
                    const isCompleted = progress >= 100;
                    return (
                      <div key={goal.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-foreground text-sm sm:text-base truncate flex-1">
                            {goal.name}
                          </p>
                          <p className="text-xs sm:text-sm text-muted-foreground ml-2">
                            {Math.min(progress, 100).toFixed(0)}%
                          </p>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-300 ${
                              isCompleted ? 'bg-green-500' : 'bg-primary'
                            }`}
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-xs sm:text-sm">
                          <span className="text-muted-foreground">
                            ${goal.currentAmount.toLocaleString('es-ES')}
                          </span>
                          <span className="font-medium text-foreground">
                            ${goal.targetAmount.toLocaleString('es-ES')}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  {savingsGoals.length >= 3 && (
                    <Button
                      onClick={() => setLocation('/savings')}
                      variant="ghost"
                      size="sm"
                      className="w-full text-muted-foreground hover:text-foreground hover:bg-accent mt-2"
                    >
                      {t.dashboard.viewAll} →
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
