/**
 * Finances Router - BUILT FROM SCRATCH
 * 
 * PRINCIPIO FUNDAMENTAL:
 * - El sistema NO crea dinero
 * - El sistema SOLO LEE facturas pagadas
 * - Fuente única de verdad: invoices con status = 'paid'
 */

import { router, protectedProcedure } from './_core/trpc';
import { getDb } from './db';
import { z } from 'zod';
import { invoices, clients } from '../drizzle/schema';
import { eq, and, gte, lte, sql, desc } from 'drizzle-orm';

export const financesRouter = router({
  /**
   * Get financial summary
   * Returns: total income, current month, previous month, variation
   */
  getSummary: protectedProcedure
    .input(z.object({
      currency: z.string().optional(), // Filter by currency if needed
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      const userId = ctx.user.id;

      console.log(`[Finances] Getting summary for user: ${userId}`);

      try {
        // Get current date info
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;
        
        // Calculate date ranges
        const currentMonthStart = new Date(currentYear, currentMonth - 1, 1);
        const currentMonthEnd = new Date(currentYear, currentMonth, 0, 23, 59, 59);
        
        const previousMonthStart = new Date(currentYear, currentMonth - 2, 1);
        const previousMonthEnd = new Date(currentYear, currentMonth - 1, 0, 23, 59, 59);

        // Get total income (all paid invoices)
        const totalIncomeResult = await db
          .select({
            total: sql<number>`COALESCE(SUM(CAST(${invoices.total} AS DECIMAL(10,2))), 0)`,
          })
          .from(invoices)
          .where(
            and(
              eq(invoices.user_id, userId),
              eq(invoices.status, 'paid'),
              input.currency ? eq(invoices.currency, input.currency) : undefined
            )
          );

        const totalIncome = Number(totalIncomeResult[0]?.total || 0);

        // Get current month income
        const currentMonthResult = await db
          .select({
            total: sql<number>`COALESCE(SUM(CAST(${invoices.total} AS DECIMAL(10,2))), 0)`,
          })
          .from(invoices)
          .where(
            and(
              eq(invoices.user_id, userId),
              eq(invoices.status, 'paid'),
              gte(invoices.issue_date, currentMonthStart),
              lte(invoices.issue_date, currentMonthEnd),
              input.currency ? eq(invoices.currency, input.currency) : undefined
            )
          );

        const currentMonthIncome = Number(currentMonthResult[0]?.total || 0);

        // Get previous month income
        const previousMonthResult = await db
          .select({
            total: sql<number>`COALESCE(SUM(CAST(${invoices.total} AS DECIMAL(10,2))), 0)`,
          })
          .from(invoices)
          .where(
            and(
              eq(invoices.user_id, userId),
              eq(invoices.status, 'paid'),
              gte(invoices.issue_date, previousMonthStart),
              lte(invoices.issue_date, previousMonthEnd),
              input.currency ? eq(invoices.currency, input.currency) : undefined
            )
          );

        const previousMonthIncome = Number(previousMonthResult[0]?.total || 0);

        // Calculate variation percentage
        let variation = 0;
        if (previousMonthIncome > 0) {
          variation = ((currentMonthIncome - previousMonthIncome) / previousMonthIncome) * 100;
        } else if (currentMonthIncome > 0) {
          variation = 100; // If previous was 0 and current > 0, it's 100% increase
        }

        console.log(`[Finances] Summary calculated: Total=${totalIncome}, Current=${currentMonthIncome}, Previous=${previousMonthIncome}, Variation=${variation.toFixed(2)}%`);

        return {
          totalIncome,
          currentMonthIncome,
          previousMonthIncome,
          variation: Number(variation.toFixed(2)),
          currency: input.currency || 'USD',
        };
      } catch (error) {
        console.error('[Finances] Error getting summary:', error);
        throw new Error('Failed to get financial summary');
      }
    }),

  /**
   * Get income by month
   * Returns: Array of {month, year, income} for the last N months
   */
  getIncomeByMonth: protectedProcedure
    .input(z.object({
      months: z.number().min(1).max(24).default(12), // Last 12 months by default
      currency: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      const userId = ctx.user.id;

      console.log(`[Finances] Getting income by month for user: ${userId}, months: ${input.months}`);

      try {
        // Calculate start date (N months ago)
        const now = new Date();
        const startDate = new Date(now.getFullYear(), now.getMonth() - input.months + 1, 1);

        // Get invoices grouped by month
        const result = await db
          .select({
            month: sql<number>`MONTH(${invoices.issue_date})`,
            year: sql<number>`YEAR(${invoices.issue_date})`,
            income: sql<number>`COALESCE(SUM(CAST(${invoices.total} AS DECIMAL(10,2))), 0)`,
          })
          .from(invoices)
          .where(
            and(
              eq(invoices.user_id, userId),
              eq(invoices.status, 'paid'),
              gte(invoices.issue_date, startDate),
              input.currency ? eq(invoices.currency, input.currency) : undefined
            )
          )
          .groupBy(sql`YEAR(${invoices.issue_date})`, sql`MONTH(${invoices.issue_date})`)
          .orderBy(sql`YEAR(${invoices.issue_date})`, sql`MONTH(${invoices.issue_date})`);

        const incomeByMonth = result.map(row => ({
          month: row.month,
          year: row.year,
          income: Number(row.income),
        }));

        console.log(`[Finances] Income by month calculated: ${incomeByMonth.length} months with data`);

        return incomeByMonth;
      } catch (error) {
        console.error('[Finances] Error getting income by month:', error);
        throw new Error('Failed to get income by month');
      }
    }),

  /**
   * Get income by client
   * Returns: Array of {client_id, client_name, income} sorted by income desc
   */
  getIncomeByClient: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(50).default(10), // Top 10 clients by default
      currency: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      const userId = ctx.user.id;

      console.log(`[Finances] Getting income by client for user: ${userId}, limit: ${input.limit}`);

      try {
        // Get invoices grouped by client
        const result = await db
          .select({
            client_id: invoices.client_id,
            client_name: clients.name,
            income: sql<number>`COALESCE(SUM(CAST(${invoices.total} AS DECIMAL(10,2))), 0)`,
          })
          .from(invoices)
          .leftJoin(clients, eq(invoices.client_id, clients.id))
          .where(
            and(
              eq(invoices.user_id, userId),
              eq(invoices.status, 'paid'),
              input.currency ? eq(invoices.currency, input.currency) : undefined
            )
          )
          .groupBy(invoices.client_id, clients.name)
          .orderBy(desc(sql`COALESCE(SUM(CAST(${invoices.total} AS DECIMAL(10,2))), 0)`))
          .limit(input.limit);

        const incomeByClient = result.map(row => ({
          client_id: row.client_id,
          client_name: row.client_name || 'Unknown',
          income: Number(row.income),
        }));

        console.log(`[Finances] Income by client calculated: ${incomeByClient.length} clients`);

        return incomeByClient;
      } catch (error) {
        console.error('[Finances] Error getting income by client:', error);
        throw new Error('Failed to get income by client');
      }
    }),

  /**
   * Get financial history (transaction list)
   * Returns: Array of paid invoices with client info
   */
  getHistory: protectedProcedure
    .input(z.object({
      startDate: z.date().optional(),
      endDate: z.date().optional(),
      clientId: z.number().optional(),
      currency: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      const userId = ctx.user.id;

      console.log(`[Finances] Getting history for user: ${userId}`);

      try {
        // Build where conditions
        const conditions = [
          eq(invoices.user_id, userId),
          eq(invoices.status, 'paid'),
        ];

        if (input.startDate) {
          conditions.push(gte(invoices.issue_date, input.startDate));
        }
        if (input.endDate) {
          conditions.push(lte(invoices.issue_date, input.endDate));
        }
        if (input.clientId) {
          conditions.push(eq(invoices.client_id, input.clientId));
        }
        if (input.currency) {
          conditions.push(eq(invoices.currency, input.currency));
        }

        // Get paid invoices with client info
        const result = await db
          .select({
            id: invoices.id,
            invoice_number: invoices.invoice_number,
            client_id: invoices.client_id,
            client_name: clients.name,
            issue_date: invoices.issue_date,
            total: invoices.total,
            currency: invoices.currency,
            status: invoices.status,
          })
          .from(invoices)
          .leftJoin(clients, eq(invoices.client_id, clients.id))
          .where(and(...conditions))
          .orderBy(desc(invoices.issue_date));

        const history = result.map(row => ({
          id: row.id,
          invoice_number: row.invoice_number,
          client_id: row.client_id,
          client_name: row.client_name || 'Unknown',
          date: row.issue_date,
          amount: Number(row.total),
          currency: row.currency,
          status: row.status,
        }));

        console.log(`[Finances] History retrieved: ${history.length} transactions`);

        return history;
      } catch (error) {
        console.error('[Finances] Error getting history:', error);
        throw new Error('Failed to get financial history');
      }
    }),
});
