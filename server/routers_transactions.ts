/**
 * Transactions Router
 * Manual income and expense transactions
 */

import { router, protectedProcedure } from './_core/trpc';
import { getDb } from './db';
import { z } from 'zod';
import { transactions } from '../drizzle/schema';
import { eq, and, desc } from 'drizzle-orm';

export const transactionsRouter = router({
  /**
   * Create a new manual transaction
   */
  create: protectedProcedure
    .input(z.object({
      type: z.enum(['income', 'expense']),
      category: z.enum([
        'salary',
        'freelance',
        'investment',
        'other_income',
        'rent',
        'utilities',
        'food',
        'transportation',
        'healthcare',
        'entertainment',
        'other_expense'
      ]),
      amount: z.number().positive(),
      currency: z.string().length(3).default('USD'),
      description: z.string().min(1),
      date: z.string(), // ISO date string
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      const userId = ctx.user.id;

      console.log(`[Transactions] Creating transaction for user: ${userId}`, input);

      try {
        const result = await db.insert(transactions).values({
          user_id: userId,
          type: input.type,
          category: input.category,
          amount: input.amount.toString(),
          currency: input.currency,
          description: input.description,
          date: new Date(input.date),
          status: 'active',
        });

        console.log(`[Transactions] Transaction created with ID: ${result.insertId}`);

        return {
          id: Number(result.insertId),
          message: 'Transacción creada exitosamente',
        };
      } catch (error) {
        console.error('[Transactions] Error creating transaction:', error);
        throw new Error('Failed to create transaction');
      }
    }),

  /**
   * List all transactions for the current user
   */
  list: protectedProcedure
    .input(z.object({
      type: z.enum(['income', 'expense', 'all']).default('all'),
      status: z.enum(['active', 'voided', 'all']).default('active'),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      const userId = ctx.user.id;

      console.log(`[Transactions] Listing transactions for user: ${userId}`, input);

      try {
        const conditions = [eq(transactions.user_id, userId)];

        if (input.type !== 'all') {
          conditions.push(eq(transactions.type, input.type));
        }

        if (input.status !== 'all') {
          conditions.push(eq(transactions.status, input.status));
        }

        const result = await db
          .select()
          .from(transactions)
          .where(and(...conditions))
          .orderBy(desc(transactions.date));

        console.log(`[Transactions] Found ${result.length} transactions`);

        return result.map(t => ({
          ...t,
          amount: Number(t.amount),
        }));
      } catch (error) {
        console.error('[Transactions] Error listing transactions:', error);
        throw new Error('Failed to list transactions');
      }
    }),

  /**
   * Void a transaction (soft delete)
   */
  void: protectedProcedure
    .input(z.object({
      id: z.number(),
      reason: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      const userId = ctx.user.id;

      console.log(`[Transactions] Voiding transaction: ${input.id}`);

      try {
        // Verify ownership
        const transaction = await db
          .select()
          .from(transactions)
          .where(and(
            eq(transactions.id, input.id),
            eq(transactions.user_id, userId)
          ))
          .limit(1);

        if (transaction.length === 0) {
          throw new Error('Transaction not found');
        }

        // Void the transaction
        await db
          .update(transactions)
          .set({
            status: 'voided',
            voided_at: new Date(),
            void_reason: input.reason || 'Anulada por el usuario',
          })
          .where(eq(transactions.id, input.id));

        console.log(`[Transactions] Transaction ${input.id} voided successfully`);

        return {
          message: 'Transacción anulada exitosamente',
        };
      } catch (error) {
        console.error('[Transactions] Error voiding transaction:', error);
        throw new Error(error instanceof Error ? error.message : 'Failed to void transaction');
      }
    }),
});
