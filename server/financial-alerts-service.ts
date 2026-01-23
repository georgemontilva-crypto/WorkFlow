/**
 * Financial Alerts Service
 * Generates personalized alerts based on user's financial profile and goals
 */

import { db } from './db';

export interface FinancialAlert {
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  shown_as_toast: boolean;
  persistent: boolean;
}

/**
 * Calculate monthly income progress
 */
async function calculateMonthlyProgress(userId: number): Promise<{
  current: number;
  goal: number;
  percentage: number;
  currency: string;
}> {
  const profile = await db.getCompanyProfile(userId);
  
  if (!profile?.monthly_income_goal) {
    return { current: 0, goal: 0, percentage: 0, currency: 'USD' };
  }

  // Get current month's paid invoices
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const invoices = await db.getInvoicesByUserId(userId);
  
  const monthlyIncome = invoices
    .filter(inv => 
      inv.status === 'paid' && 
      new Date(inv.updated_at) >= firstDayOfMonth
    )
    .reduce((sum, inv) => sum + parseFloat(inv.total.toString()), 0);

  const goal = parseFloat(profile.monthly_income_goal.toString());
  const percentage = goal > 0 ? Math.round((monthlyIncome / goal) * 100) : 0;

  return {
    current: monthlyIncome,
    goal,
    percentage,
    currency: profile.goal_currency || profile.base_currency || 'USD',
  };
}

/**
 * Get personalized copy based on business type
 */
function getPersonalizedCopy(businessType: string | null, context: 'progress' | 'achieved' | 'exceeded' | 'missed'): {
  title: string;
  verb: string;
} {
  const copies = {
    freelancer: {
      progress: { title: 'Progreso de Facturación', verb: 'facturado' },
      achieved: { title: '¡Objetivo Alcanzado!', verb: 'facturado' },
      exceeded: { title: '¡Objetivo Superado!', verb: 'facturado' },
      missed: { title: 'Objetivo No Alcanzado', verb: 'facturado' },
    },
    empresa: {
      progress: { title: 'Progreso de Ingresos', verb: 'ingresado' },
      achieved: { title: '¡Meta Alcanzada!', verb: 'ingresado' },
      exceeded: { title: '¡Meta Superada!', verb: 'ingresado' },
      missed: { title: 'Meta No Alcanzada', verb: 'ingresado' },
    },
    agencia: {
      progress: { title: 'Progreso de Facturación', verb: 'facturado' },
      achieved: { title: '¡Objetivo Cumplido!', verb: 'facturado' },
      exceeded: { title: '¡Objetivo Excedido!', verb: 'facturado' },
      missed: { title: 'Objetivo Pendiente', verb: 'facturado' },
    },
  };

  const type = businessType as 'freelancer' | 'empresa' | 'agencia' || 'freelancer';
  return copies[type][context];
}

/**
 * Format currency amount
 */
function formatCurrency(amount: number, currency: string): string {
  const symbols: { [key: string]: string } = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    VES: 'Bs',
    COP: '$',
    MXN: '$',
    ARS: '$',
  };

  const symbol = symbols[currency] || currency;
  return `${symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Generate financial alerts for a user
 */
export async function generateFinancialAlerts(userId: number): Promise<FinancialAlert[]> {
  const alerts: FinancialAlert[] = [];
  const profile = await db.getCompanyProfile(userId);

  // If financial profile is not complete, suggest completing it
  if (!profile?.monthly_income_goal || !profile?.business_type) {
    alerts.push({
      type: 'info',
      title: 'Completa tu Perfil Financiero',
      message: 'Define tu objetivo mensual y tipo de actividad para recibir alertas personalizadas sobre tu progreso.',
      priority: 'low',
      shown_as_toast: false, // Don't show as toast, only in panel
      persistent: true,
    });
    return alerts;
  }

  // Calculate progress
  const progress = await calculateMonthlyProgress(userId);

  // Check if we're at the end of the month
  const now = new Date();
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const isEndOfMonth = now.getDate() >= lastDayOfMonth.getDate() - 3; // Last 3 days

  // Generate alerts based on progress
  const copy = getPersonalizedCopy(profile.business_type, 'progress');

  // 50% milestone
  if (progress.percentage >= 50 && progress.percentage < 75) {
    alerts.push({
      type: 'info',
      title: `${copy.title}: 50%`,
      message: `Has ${copy.verb} ${formatCurrency(progress.current, progress.currency)} de tu objetivo de ${formatCurrency(progress.goal, progress.currency)} este mes.`,
      priority: 'medium',
      shown_as_toast: true,
      persistent: false,
    });
  }

  // 75% milestone
  if (progress.percentage >= 75 && progress.percentage < 100) {
    alerts.push({
      type: 'success',
      title: `${copy.title}: 75%`,
      message: `¡Excelente! Has ${copy.verb} ${formatCurrency(progress.current, progress.currency)} de tu objetivo de ${formatCurrency(progress.goal, progress.currency)}. ¡Sigue así!`,
      priority: 'medium',
      shown_as_toast: true,
      persistent: false,
    });
  }

  // 100% milestone (achieved)
  if (progress.percentage >= 100 && progress.percentage < 110) {
    const achievedCopy = getPersonalizedCopy(profile.business_type, 'achieved');
    alerts.push({
      type: 'success',
      title: achievedCopy.title,
      message: `¡Felicitaciones! Has alcanzado tu objetivo mensual de ${formatCurrency(progress.goal, progress.currency)}. Total ${copy.verb}: ${formatCurrency(progress.current, progress.currency)}.`,
      priority: 'high',
      shown_as_toast: true,
      persistent: true,
    });
  }

  // Exceeded goal (110%+)
  if (progress.percentage >= 110) {
    const exceededCopy = getPersonalizedCopy(profile.business_type, 'exceeded');
    alerts.push({
      type: 'success',
      title: exceededCopy.title,
      message: `¡Increíble! Has superado tu objetivo en un ${progress.percentage - 100}%. Total ${copy.verb}: ${formatCurrency(progress.current, progress.currency)} de ${formatCurrency(progress.goal, progress.currency)}.`,
      priority: 'high',
      shown_as_toast: true,
      persistent: true,
    });
  }

  // End of month warning (if not achieved)
  if (isEndOfMonth && progress.percentage < 100) {
    const missedCopy = getPersonalizedCopy(profile.business_type, 'missed');
    alerts.push({
      type: 'warning',
      title: `${missedCopy.title} (${progress.percentage}%)`,
      message: `Quedan pocos días del mes. Has ${copy.verb} ${formatCurrency(progress.current, progress.currency)} de ${formatCurrency(progress.goal, progress.currency)}. Faltan ${formatCurrency(progress.goal - progress.current, progress.currency)}.`,
      priority: 'high',
      shown_as_toast: true,
      persistent: true,
    });
  }

  return alerts;
}

/**
 * Check if alerts should be generated for a user
 * (Called periodically or on specific events)
 */
export async function shouldGenerateAlerts(userId: number): Promise<boolean> {
  const profile = await db.getCompanyProfile(userId);
  
  // Only generate if financial profile is complete
  return !!(profile?.monthly_income_goal && profile?.business_type);
}
