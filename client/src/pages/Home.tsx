/**
 * Home Page - Dashboard Principal
 * Design Philosophy: Apple Minimalism - Responsive mobile-first
 */

import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { trpc } from '@/lib/trpc';
import { Users, FileText, TrendingUp, TrendingDown, Plus, AlertCircle, Bell, Target } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
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
  
  // Fetch data using tRPC
  const { data: clients } = trpc.clients.list.useQuery();
  const { data: invoices } = trpc.invoices.list.useQuery();
  const { data: transactions } = trpc.transactions.list.useQuery();
  const { data: savingsGoals } = trpc.savingsGoals.list.useQuery();

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
              <FileText className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">{t.invoices.newInvoice}</span>
              <span className="sm:hidden">{t.invoices.title}</span>
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8">
          <Card className="bg-card border-border hover:bg-accent/5 transition-colors cursor-pointer" onClick={() => setLocation('/clients')}>
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

          <Card className="bg-card border-border hover:bg-accent/5 transition-colors cursor-pointer" onClick={() => setLocation('/invoices')}>
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

          <Card className="bg-card border-border hover:bg-accent/5 transition-colors cursor-pointer" onClick={() => setLocation('/finances')}>
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

          <Card className="bg-card border-border hover:bg-accent/5 transition-colors cursor-pointer" onClick={() => setLocation('/finances')}>
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
        </div>

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
                    {overduePayments.slice(0, 3).map(client => (
                      <div key={client.id} className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
                        <div>
                          <p className="font-medium text-foreground">{client.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {t.dashboard.dueDate}: {format(new Date(client.next_payment_date), 'dd MMM yyyy', { locale: es })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-foreground font-mono">
                            ${parseFloat(client.amount).toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                          </p>
                          <p className="text-xs text-destructive">
                            {Math.abs(differenceInDays(new Date(client.next_payment_date), new Date()))} días vencido
                          </p>
                        </div>
                      </div>
                    ))}
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
                    {upcomingPayments.slice(0, 3).map(client => (
                      <div key={client.id} className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
                        <div>
                          <p className="font-medium text-foreground">{client.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {t.dashboard.dueDate}: {format(new Date(client.next_payment_date), 'dd MMM yyyy', { locale: es })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-foreground font-mono">
                            ${parseFloat(client.amount).toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                          </p>
                          <p className="text-xs text-yellow-600 dark:text-yellow-500">
                            En {differenceInDays(new Date(client.next_payment_date), new Date())} días
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Savings Goals Section */}
        {topSavingsGoals.length > 0 && (
          <Card className="bg-card border-border mb-6 lg:mb-8">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="w-5 h-5" />
                {t.savings?.title || 'Metas de Ahorro'}
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation('/savings')}
                className="text-muted-foreground hover:text-foreground"
              >
                Ver todas
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topSavingsGoals.map(goal => {
                  const progress = (parseFloat(goal.current_amount) / parseFloat(goal.target_amount)) * 100;
                  return (
                    <div key={goal.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-foreground">{goal.name}</p>
                        <p className="text-sm text-muted-foreground">
                          ${parseFloat(goal.current_amount).toLocaleString('es-ES')} / ${parseFloat(goal.target_amount).toLocaleString('es-ES')}
                        </p>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {progress.toFixed(1)}% completado
                      </p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Transactions */}
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">{t.dashboard.recentTransactions || 'Transacciones Recientes'}</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation('/finances')}
              className="text-muted-foreground hover:text-foreground"
            >
              Ver todas
            </Button>
          </CardHeader>
          <CardContent>
            {!transactions || transactions.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                {t.dashboard.noTransactions || 'No hay transacciones recientes'}
              </p>
            ) : (
              <div className="space-y-3">
                {transactions.slice(0, 5).map(transaction => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-3 bg-background rounded-lg border border-border"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${
                        transaction.type === 'income' 
                          ? 'bg-green-500/10' 
                          : 'bg-red-500/10'
                      }`}>
                        {transaction.type === 'income' ? (
                          <TrendingUp className="w-4 h-4 text-green-500" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-red-500" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-foreground text-sm">{transaction.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(transaction.date), 'dd MMM yyyy', { locale: es })}
                        </p>
                      </div>
                    </div>
                    <div className={`text-base font-bold font-mono ${
                      transaction.type === 'income' 
                        ? 'text-green-500' 
                        : 'text-red-500'
                    }`}>
                      {transaction.type === 'income' ? '+' : '-'}${parseFloat(transaction.amount).toLocaleString('es-ES', { minimumFractionDigits: 2 })}
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
