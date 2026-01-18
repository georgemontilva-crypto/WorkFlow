import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
    accessStatus: protectedProcedure.query(async ({ ctx }) => {
      const { getUserAccessStatus } = await import("./access");
      return getUserAccessStatus(ctx.user);
    }),
  }),

  /**
   * Clients router - CRUD operations for clients
   */
  clients: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getClientsByUserId(ctx.user.id);
    }),
    
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        return await db.getClientById(input.id, ctx.user.id);
      }),
    
    create: protectedProcedure
      .input(z.object({
        name: z.string(),
        email: z.string().email(),
        phone: z.string(),
        company: z.string().optional(),
        billingCycle: z.enum(["monthly", "quarterly", "yearly", "custom"]),
        customCycleDays: z.number().optional(),
        amount: z.string(),
        nextPaymentDate: z.string(),
        reminderDays: z.number().default(7),
        status: z.enum(["active", "inactive", "overdue"]).default("active"),
        archived: z.number().default(0),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.createClient({
          ...input,
          nextPaymentDate: new Date(input.nextPaymentDate),
          userId: ctx.user.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        return { success: true };
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        company: z.string().optional(),
        billingCycle: z.enum(["monthly", "quarterly", "yearly", "custom"]).optional(),
        customCycleDays: z.number().optional(),
        amount: z.string().optional(),
        nextPaymentDate: z.string().optional(),
        reminderDays: z.number().optional(),
        status: z.enum(["active", "inactive", "overdue"]).optional(),
        archived: z.number().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        const updateData: any = { ...data, updatedAt: new Date() };
        if (data.nextPaymentDate) {
          updateData.nextPaymentDate = new Date(data.nextPaymentDate);
        }
        await db.updateClient(id, ctx.user.id, updateData);
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteClient(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  /**
   * Invoices router - CRUD operations for invoices
   */
  invoices: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getInvoicesByUserId(ctx.user.id);
    }),
    
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        return await db.getInvoiceById(input.id, ctx.user.id);
      }),
    
    create: protectedProcedure
      .input(z.object({
        clientId: z.number(),
        invoiceNumber: z.string(),
        issueDate: z.string(),
        dueDate: z.string(),
        amount: z.string(),
        paidAmount: z.string().optional(),
        status: z.enum(["pending", "paid", "overdue", "cancelled", "archived"]).default("pending"),
        items: z.array(z.object({
          description: z.string(),
          quantity: z.number(),
          unitPrice: z.number(),
          total: z.number(),
        })),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.createInvoice({
          ...input,
          issueDate: new Date(input.issueDate),
          dueDate: new Date(input.dueDate),
          userId: ctx.user.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        return { success: true };
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        clientId: z.number().optional(),
        invoiceNumber: z.string().optional(),
        issueDate: z.string().optional(),
        dueDate: z.string().optional(),
        amount: z.string().optional(),
        paidAmount: z.string().optional(),
        status: z.enum(["pending", "paid", "overdue", "cancelled", "archived"]).optional(),
        items: z.array(z.object({
          description: z.string(),
          quantity: z.number(),
          unitPrice: z.number(),
          total: z.number(),
        })).optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        const updateData: any = { ...data, updatedAt: new Date() };
        if (data.issueDate) {
          updateData.issueDate = new Date(data.issueDate);
        }
        if (data.dueDate) {
          updateData.dueDate = new Date(data.dueDate);
        }
        await db.updateInvoice(id, ctx.user.id, updateData);
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteInvoice(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  /**
   * Transactions router - CRUD operations for transactions
   */
  transactions: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getTransactionsByUserId(ctx.user.id);
    }),
    
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        return await db.getTransactionById(input.id, ctx.user.id);
      }),
    
    create: protectedProcedure
      .input(z.object({
        type: z.enum(["income", "expense"]),
        category: z.string(),
        amount: z.string(),
        description: z.string(),
        date: z.string(),
        clientId: z.number().optional(),
        invoiceId: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.createTransaction({
          ...input,
          date: new Date(input.date),
          userId: ctx.user.id,
          createdAt: new Date(),
        });
        return { success: true };
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        type: z.enum(["income", "expense"]).optional(),
        category: z.string().optional(),
        amount: z.string().optional(),
        description: z.string().optional(),
        date: z.string().optional(),
        clientId: z.number().optional(),
        invoiceId: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        const updateData: any = { ...data, updatedAt: new Date() };
        if (data.date) {
          updateData.date = new Date(data.date);
        }
        await db.updateTransaction(id, ctx.user.id, updateData);
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteTransaction(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  /**
   * Savings Goals router - CRUD operations for savings goals
   */
  savingsGoals: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getSavingsGoalsByUserId(ctx.user.id);
    }),
    
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        return await db.getSavingsGoalById(input.id, ctx.user.id);
      }),
    
    create: protectedProcedure
      .input(z.object({
        name: z.string(),
        targetAmount: z.string(),
        currentAmount: z.string().optional(),
        deadline: z.string(),
        status: z.enum(["active", "completed", "cancelled"]).default("active"),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.createSavingsGoal({
          ...input,
          deadline: new Date(input.deadline),
          userId: ctx.user.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        return { success: true };
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        targetAmount: z.string().optional(),
        currentAmount: z.string().optional(),
        deadline: z.string().optional(),
        status: z.enum(["active", "completed", "cancelled"]).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        const updateData: any = { ...data, updatedAt: new Date() };
        if (data.deadline) {
          updateData.deadline = new Date(data.deadline);
        }
        await db.updateSavingsGoal(id, ctx.user.id, updateData);
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteSavingsGoal(input.id, ctx.user.id);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
