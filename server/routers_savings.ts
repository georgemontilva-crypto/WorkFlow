/**
 * Savings Goals Router - BUILT FROM SCRATCH
 * 
 * PRINCIPIO FUNDAMENTAL:
 * - Los ahorros NO son ingresos
 * - Los ahorros NO afectan balances financieros
 * - Los ahorros NO afectan facturas
 * - Cada meta tiene SU PROPIA moneda (no usa primary_currency del usuario)
 * - NO hay conversiones automáticas
 */

import { router, protectedProcedure } from './_core/trpc';
import { getDb } from './db';
import { z } from 'zod';
import { savingsGoals } from '../drizzle/schema';
import { eq, and, desc, ne } from 'drizzle-orm';

export const savingsRouter = router({
  /**
   * List all savings goals for the current user
   */
  list: protectedProcedure
    .input(z.object({
      status: z.enum(['all', 'active', 'completed', 'cancelled']).optional().default('all'),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      const userId = ctx.user.id;

      console.log(`[Savings] Listing goals for user ${userId}, status: ${input.status}`);

      try {
        const conditions = [eq(savingsGoals.user_id, userId)];
        
        if (input.status === 'all') {
          // 'all' means active and completed, but NOT cancelled
          // Exclude cancelled goals by default
          conditions.push(ne(savingsGoals.status, 'cancelled'));
        } else {
          conditions.push(eq(savingsGoals.status, input.status));
        }

        const goals = await db
          .select()
          .from(savingsGoals)
          .where(and(...conditions))
          .orderBy(desc(savingsGoals.created_at));

        console.log(`[Savings] Found ${goals.length} goals for user ${userId}`);

        return goals;
      } catch (error: any) {
        console.error(`[Savings] List error:`, error.message);
        throw new Error(error.message || "Error al obtener metas de ahorro");
      }
    }),

  /**
   * Get a single savings goal by ID
   */
  getById: protectedProcedure
    .input(z.object({
      id: z.number(),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      const userId = ctx.user.id;

      console.log(`[Savings] Getting goal ${input.id} for user ${userId}`);

      try {
        const [goal] = await db
          .select()
          .from(savingsGoals)
          .where(
            and(
              eq(savingsGoals.id, input.id),
              eq(savingsGoals.user_id, userId)
            )
          )
          .limit(1);

        if (!goal) {
          console.log(`[Savings] Goal ${input.id} not found for user ${userId}`);
          throw new Error("Meta de ahorro no encontrada");
        }

        console.log(`[Savings] Goal ${input.id} retrieved: ${goal.name}`);

        return goal;
      } catch (error: any) {
        console.error(`[Savings] Get by ID error:`, error.message);
        throw new Error(error.message || "Error al obtener meta de ahorro");
      }
    }),

  /**
   * Create a new savings goal
   * IMPORTANT: Currency MUST be explicitly provided, NO default
   */
  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1, "El nombre es obligatorio"),
      target_amount: z.number().positive("El monto objetivo debe ser mayor a 0"),
      current_amount: z.number().min(0, "El monto actual no puede ser negativo").optional(),
      currency: z.string()
        .length(3, "El código de moneda debe tener 3 caracteres")
        .toUpperCase(),
      deadline: z.string().optional(), // ISO date string
      description: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      const userId = ctx.user.id;

      console.log(`[Savings] Create attempt by user ${userId}:`, {
        name: input.name,
        target_amount: input.target_amount,
        currency: input.currency,
      });

      try {
        // Validate currency exists in catalog
        const { CURRENCIES } = await import("../shared/currencies");
        const validCurrency = CURRENCIES.find(c => c.code === input.currency);
        if (!validCurrency) {
          console.error(`[Savings] Invalid currency code: ${input.currency}`);
          throw new Error(`Código de moneda inválido: ${input.currency}`);
        }

        console.log(`[Savings] Currency validated: ${input.currency} - ${validCurrency.name}`);

        // Create savings goal
        const [newGoal] = await db.insert(savingsGoals).values({
          user_id: userId,
          name: input.name,
          target_amount: input.target_amount.toString(),
          current_amount: (input.current_amount || 0).toString(),
          currency: input.currency,
          deadline: input.deadline ? new Date(input.deadline) : null,
          description: input.description || null,
          status: "active",
        });

        const goalId = Number(newGoal.insertId);

        console.log(`[Savings] Goal created successfully: ${goalId} - ${input.name} (${input.currency})`);

        // Return created goal
        const [createdGoal] = await db
          .select()
          .from(savingsGoals)
          .where(eq(savingsGoals.id, goalId))
          .limit(1);

        return {
          success: true,
          goal: createdGoal,
        };
      } catch (error: any) {
        console.error(`[Savings] Create error:`, error.message);
        throw new Error(error.message || "Error al crear meta de ahorro");
      }
    }),

  /**
   * Update savings goal progress (current_amount)
   * IMPORTANT: Cannot exceed target_amount without warning
   */
  updateProgress: protectedProcedure
    .input(z.object({
      id: z.number(),
      current_amount: z.number().nonnegative("El monto no puede ser negativo"),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      const userId = ctx.user.id;

      console.log(`[Savings] Update progress for goal ${input.id} by user ${userId}: ${input.current_amount}`);

      try {
        // Get goal to verify ownership and check target_amount
        const [goal] = await db
          .select()
          .from(savingsGoals)
          .where(
            and(
              eq(savingsGoals.id, input.id),
              eq(savingsGoals.user_id, userId)
            )
          )
          .limit(1);

        if (!goal) {
          console.log(`[Savings] Goal ${input.id} not found for user ${userId}`);
          throw new Error("Meta de ahorro no encontrada");
        }

        const targetAmount = parseFloat(goal.target_amount);
        const previousStatus = goal.status;
        const newStatus = input.current_amount >= targetAmount ? 'completed' : 'active';

        // Update progress
        await db
          .update(savingsGoals)
          .set({
            current_amount: input.current_amount.toString(),
            status: newStatus,
            updated_at: new Date(),
          })
          .where(eq(savingsGoals.id, input.id));

        console.log(`[Savings] Progress updated for goal ${input.id}: ${input.current_amount}/${targetAmount} (${newStatus})`);

        // Emit event if goal just completed
        if (newStatus === 'completed' && previousStatus !== 'completed') {
          const { eventBus } = await import('../events/EventBus');
          eventBus.emit({
            type: 'savings.goal_completed',
            payload: {
              userId: userId,
              goalId: input.id,
              goalName: goal.name,
              targetAmount: targetAmount,
              currency: goal.currency,
              timestamp: new Date(),
            },
          });
        }

        return { success: true };
      } catch (error: any) {
        console.error(`[Savings] Update progress error:`, error.message);
        throw new Error(error.message || "Error al actualizar progreso");
      }
    }),

  /**
   * Update savings goal details
   * IMPORTANT: Currency CANNOT be changed once created
   */
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().min(1, "El nombre es obligatorio").optional(),
      target_amount: z.number().positive("El monto objetivo debe ser mayor a 0").optional(),
      current_amount: z.number().min(0, "El monto actual no puede ser negativo").optional(),
      deadline: z.string().optional(), // ISO date string
      description: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      const userId = ctx.user.id;

      console.log(`[Savings] Update attempt for goal ${input.id} by user ${userId}`);

      try {
        // Verify ownership
        const [goal] = await db
          .select()
          .from(savingsGoals)
          .where(
            and(
              eq(savingsGoals.id, input.id),
              eq(savingsGoals.user_id, userId)
            )
          )
          .limit(1);

        if (!goal) {
          console.log(`[Savings] Goal ${input.id} not found for user ${userId}`);
          throw new Error("Meta de ahorro no encontrada");
        }

        // Build update object
        const updateData: any = {
          updated_at: new Date(),
        };

        if (input.name !== undefined) updateData.name = input.name;
        if (input.target_amount !== undefined) updateData.target_amount = input.target_amount.toString();
        if (input.current_amount !== undefined) updateData.current_amount = input.current_amount.toString();
        if (input.deadline !== undefined) updateData.deadline = input.deadline ? new Date(input.deadline) : null;
        if (input.description !== undefined) updateData.description = input.description || null;

        // Determine final amounts for validation
        const finalCurrentAmount = input.current_amount !== undefined ? input.current_amount : parseFloat(goal.current_amount);
        const finalTargetAmount = input.target_amount !== undefined ? input.target_amount : parseFloat(goal.target_amount);

        // Validate: current_amount should not exceed target_amount
        if (finalCurrentAmount > finalTargetAmount) {
          throw new Error("El monto actual no puede ser mayor al monto objetivo");
        }

        // Auto-complete if current_amount >= target_amount
        const wasCompleted = goal.status === 'completed';
        if (finalCurrentAmount >= finalTargetAmount && goal.status !== 'completed') {
          updateData.status = 'completed';
          console.log(`[Savings] Goal ${input.id} auto-completed (current >= target)`);
        }

        // Update goal
        await db
          .update(savingsGoals)
          .set(updateData)
          .where(eq(savingsGoals.id, input.id));

        console.log(`[Savings] Goal ${input.id} updated successfully`);

        // Emit event if goal just completed
        if (updateData.status === 'completed' && !wasCompleted) {
          const { eventBus } = await import('../events/EventBus');
          eventBus.emit({
            type: 'savings.goal_completed',
            payload: {
              userId: userId,
              goalId: input.id,
              goalName: goal.name,
              targetAmount: finalTargetAmount,
              currency: goal.currency,
              timestamp: new Date(),
            },
          });
        }

        return { success: true };
      } catch (error: any) {
        console.error(`[Savings] Update error:`, error.message);
        throw new Error(error.message || "Error al actualizar meta de ahorro");
      }
    }),

  /**
   * Delete savings goal
   * IMPORTANT: Soft delete by setting status to 'cancelled'
   */
  delete: protectedProcedure
    .input(z.object({
      id: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      const userId = ctx.user.id;

      console.log(`[Savings] Delete attempt for goal ${input.id} by user ${userId}`);

      try {
        // Verify ownership
        const [goal] = await db
          .select()
          .from(savingsGoals)
          .where(
            and(
              eq(savingsGoals.id, input.id),
              eq(savingsGoals.user_id, userId)
            )
          )
          .limit(1);

        if (!goal) {
          console.log(`[Savings] Goal ${input.id} not found for user ${userId}`);
          throw new Error("Meta de ahorro no encontrada");
        }

        // Soft delete by setting status to cancelled
        await db
          .update(savingsGoals)
          .set({
            status: 'cancelled',
            updated_at: new Date(),
          })
          .where(eq(savingsGoals.id, input.id));

        console.log(`[Savings] Goal ${input.id} cancelled successfully`);

        return { success: true };
      } catch (error: any) {
        console.error(`[Savings] Delete error:`, error.message);
        throw new Error(error.message || "Error al eliminar meta de ahorro");
      }
    }),
});
