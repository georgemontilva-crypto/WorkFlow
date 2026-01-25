/**
 * Proactive AI Job
 * 
 * Ejecuta análisis proactivo de IA para usuarios activos.
 * Solo genera alertas cuando hay insights relevantes.
 * 
 * PRINCIPIO: El silencio es un resultado válido.
 * NO se ejecuta por calendario fijo, sino cuando hay cambios en los datos.
 */

import { getDb } from '../db';
import { users, invoices, clients, alerts, company_profiles } from '../../drizzle/schema';
import { eq, and, gte, lte, count, sum, desc, sql } from 'drizzle-orm';
import { proactiveAIService, type UserFinancialData, type ProactiveInsight } from '../services/proactiveAIService';

/**
 * Gather financial data for a user
 */
async function gatherUserFinancialData(userId: number): Promise<UserFinancialData | null> {
  try {
    const db = await getDb();
    if (!db) return null;
    
    // Get user profile
    const [profile] = await db
      .select()
      .from(company_profiles)
      .where(eq(company_profiles.user_id, userId))
      .limit(1);
    
    if (!profile) {
      console.log(`[ProactiveAI Job] User ${userId}: No profile found, skipping`);
      return null;
    }
    
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);
    
    // Get current month income (paid invoices)
    const currentMonthIncome = await db
      .select({ total: sum(invoices.total) })
      .from(invoices)
      .where(and(
        eq(invoices.user_id, userId),
        eq(invoices.status, 'paid'),
        gte(invoices.paid_at, startOfMonth)
      ));
    
    // Get previous month income
    const prevMonthIncome = await db
      .select({ total: sum(invoices.total) })
      .from(invoices)
      .where(and(
        eq(invoices.user_id, userId),
        eq(invoices.status, 'paid'),
        gte(invoices.paid_at, startOfPrevMonth),
        lte(invoices.paid_at, endOfPrevMonth)
      ));
    
    // Get 3-month average income
    const threeMonthIncome = await db
      .select({ total: sum(invoices.total) })
      .from(invoices)
      .where(and(
        eq(invoices.user_id, userId),
        eq(invoices.status, 'paid'),
        gte(invoices.paid_at, threeMonthsAgo)
      ));
    
    // Get 6-month average income
    const sixMonthIncome = await db
      .select({ total: sum(invoices.total) })
      .from(invoices)
      .where(and(
        eq(invoices.user_id, userId),
        eq(invoices.status, 'paid'),
        gte(invoices.paid_at, sixMonthsAgo)
      ));
    
    // Get invoice counts
    const totalInvoicesCount = await db
      .select({ count: count() })
      .from(invoices)
      .where(eq(invoices.user_id, userId));
    
    const pendingInvoicesCount = await db
      .select({ count: count() })
      .from(invoices)
      .where(and(
        eq(invoices.user_id, userId),
        sql`${invoices.status} IN ('sent', 'payment_sent')`
      ));
    
    const overdueInvoicesCount = await db
      .select({ count: count() })
      .from(invoices)
      .where(and(
        eq(invoices.user_id, userId),
        eq(invoices.status, 'overdue')
      ));
    
    const paidThisMonthCount = await db
      .select({ count: count() })
      .from(invoices)
      .where(and(
        eq(invoices.user_id, userId),
        eq(invoices.status, 'paid'),
        gte(invoices.paid_at, startOfMonth)
      ));
    
    // Get client data
    const totalClientsCount = await db
      .select({ count: count() })
      .from(clients)
      .where(eq(clients.user_id, userId));
    
    const activeClientsCount = await db
      .select({ count: count() })
      .from(clients)
      .where(and(
        eq(clients.user_id, userId),
        eq(clients.status, 'active')
      ));
    
    // Get top client revenue
    const clientRevenues = await db
      .select({
        clientId: invoices.client_id,
        total: sum(invoices.total),
      })
      .from(invoices)
      .where(and(
        eq(invoices.user_id, userId),
        eq(invoices.status, 'paid')
      ))
      .groupBy(invoices.client_id)
      .orderBy(desc(sum(invoices.total)))
      .limit(1);
    
    const totalRevenue = await db
      .select({ total: sum(invoices.total) })
      .from(invoices)
      .where(and(
        eq(invoices.user_id, userId),
        eq(invoices.status, 'paid')
      ));
    
    const topClientRevenue = parseFloat(clientRevenues[0]?.total?.toString() || '0');
    const totalRevenueValue = parseFloat(totalRevenue[0]?.total?.toString() || '0');
    const topClientPercentage = totalRevenueValue > 0 ? (topClientRevenue / totalRevenueValue) * 100 : 0;
    
    // Get last invoice date
    const lastInvoice = await db
      .select({ created_at: invoices.created_at })
      .from(invoices)
      .where(eq(invoices.user_id, userId))
      .orderBy(desc(invoices.created_at))
      .limit(1);
    
    const daysSinceLastInvoice = lastInvoice[0]
      ? Math.floor((now.getTime() - new Date(lastInvoice[0].created_at).getTime()) / (1000 * 60 * 60 * 24))
      : 999;
    
    // Get last payment date
    const lastPayment = await db
      .select({ paid_at: invoices.paid_at })
      .from(invoices)
      .where(and(
        eq(invoices.user_id, userId),
        eq(invoices.status, 'paid')
      ))
      .orderBy(desc(invoices.paid_at))
      .limit(1);
    
    const daysSinceLastPayment = lastPayment[0]?.paid_at
      ? Math.floor((now.getTime() - new Date(lastPayment[0].paid_at).getTime()) / (1000 * 60 * 60 * 24))
      : 999;
    
    // Get unresolved alerts count
    const unresolvedAlertsCount = await db
      .select({ count: count() })
      .from(alerts)
      .where(and(
        eq(alerts.user_id, userId),
        eq(alerts.is_read, 0)
      ));
    
    // Get resolved alerts this month
    const resolvedAlertsCount = await db
      .select({ count: count() })
      .from(alerts)
      .where(and(
        eq(alerts.user_id, userId),
        eq(alerts.is_read, 1),
        gte(alerts.updated_at, startOfMonth)
      ));
    
    // Calculate average payment days and late payment rate
    // This is a simplified calculation
    const averagePaymentDays = 15; // Default, would need more complex query
    const latePaymentRate = overdueInvoicesCount[0]?.count && totalInvoicesCount[0]?.count
      ? (overdueInvoicesCount[0].count / totalInvoicesCount[0].count) * 100
      : 0;
    
    return {
      userId,
      businessType: (profile.business_type as 'freelancer' | 'empresa' | 'agencia') || 'freelancer',
      baseCurrency: profile.base_currency || 'USD',
      monthlyIncomeGoal: profile.monthly_income_goal ? parseFloat(profile.monthly_income_goal.toString()) : undefined,
      currentMonthIncome: parseFloat(currentMonthIncome[0]?.total?.toString() || '0'),
      previousMonthIncome: parseFloat(prevMonthIncome[0]?.total?.toString() || '0'),
      threeMonthAverageIncome: parseFloat(threeMonthIncome[0]?.total?.toString() || '0') / 3,
      sixMonthAverageIncome: parseFloat(sixMonthIncome[0]?.total?.toString() || '0') / 6,
      totalInvoices: totalInvoicesCount[0]?.count || 0,
      pendingInvoices: pendingInvoicesCount[0]?.count || 0,
      overdueInvoices: overdueInvoicesCount[0]?.count || 0,
      paidInvoicesThisMonth: paidThisMonthCount[0]?.count || 0,
      totalClients: totalClientsCount[0]?.count || 0,
      activeClients: activeClientsCount[0]?.count || 0,
      topClientRevenue,
      topClientPercentage,
      averagePaymentDays,
      latePaymentRate,
      daysSinceLastInvoice,
      daysSinceLastPayment,
      unresolvedAlerts: unresolvedAlertsCount[0]?.count || 0,
      resolvedAlertsThisMonth: resolvedAlertsCount[0]?.count || 0,
    };
    
  } catch (error) {
    console.error(`[ProactiveAI Job] Error gathering data for user ${userId}:`, error);
    return null;
  }
}

/**
 * Create alert from proactive insight
 */
async function createProactiveAlert(userId: number, insight: ProactiveInsight): Promise<void> {
  try {
    const db = await getDb();
    if (!db) return;
    
    // Map insight type to alert type
    const alertType = insight.type === 'warning' ? 'warning' 
      : insight.type === 'positive' ? 'info'
      : 'info';
    
    // Create the alert
    await db.insert(alerts).values({
      user_id: userId,
      type: alertType,
      event: `proactive_${insight.category}`,
      message: insight.message,
      persistent: 1,
      shown_as_toast: 0, // Proactive messages should NOT show as toast
      is_read: 0,
      action_url: null,
      action_text: insight.suggestion ? 'Ver sugerencia' : null,
    });
    
    console.log(`[ProactiveAI Job] Created alert for user ${userId}: ${insight.title}`);
    
  } catch (error) {
    console.error(`[ProactiveAI Job] Error creating alert for user ${userId}:`, error);
  }
}

/**
 * Process proactive AI analysis for all active users
 */
export async function processProactiveAI() {
  console.log('[ProactiveAI Job] Starting...');
  
  try {
    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }
    
    // Get users who have been active in the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const activeUsers = await db
      .select({ id: users.id })
      .from(users)
      .where(gte(users.last_signed_in, sevenDaysAgo));
    
    console.log(`[ProactiveAI Job] Found ${activeUsers.length} active users`);
    
    let insightsGenerated = 0;
    let usersSkipped = 0;
    
    for (const user of activeUsers) {
      try {
        // Gather financial data
        const financialData = await gatherUserFinancialData(user.id);
        if (!financialData) {
          usersSkipped++;
          continue;
        }
        
        // Run proactive analysis
        const result = await proactiveAIService.analyzeUserData(financialData);
        
        if (result.hasInsight && result.insight) {
          // Create alert from insight
          await createProactiveAlert(user.id, result.insight);
          insightsGenerated++;
        }
        
        // Small delay to avoid overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.error(`[ProactiveAI Job] Error processing user ${user.id}:`, error);
      }
    }
    
    console.log(`[ProactiveAI Job] Completed - ${insightsGenerated} insights generated, ${usersSkipped} users skipped`);
    
  } catch (error) {
    console.error('[ProactiveAI Job] Fatal error:', error);
    throw error;
  }
}

/**
 * Start the proactive AI job scheduler
 * Runs every 6 hours to check for insights
 */
export function startProactiveAIScheduler() {
  // Run after a delay on startup (let other services initialize first)
  setTimeout(() => {
    processProactiveAI().catch(console.error);
  }, 60000); // Wait 1 minute after startup
  
  // Schedule to run every 6 hours
  const SIX_HOURS = 6 * 60 * 60 * 1000;
  
  setInterval(() => {
    processProactiveAI().catch(console.error);
  }, SIX_HOURS);
  
  console.log('[ProactiveAI Scheduler] Started - will run every 6 hours');
}
