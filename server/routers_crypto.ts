/**
 * Crypto Projects Router
 * Handles cryptocurrency investment tracking
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { cryptoProjects, cryptoPurchases } from "../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";

export const cryptoRouter = router({
  /**
   * Get all projects for the current user
   */
  listProjects: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    const projects = await db
      .select()
      .from(cryptoProjects)
      .where(eq(cryptoProjects.user_id, ctx.user.id))
      .orderBy(desc(cryptoProjects.created_at));
    
    return projects;
  }),

  /**
   * Get a single project by ID with all purchases
   */
  getProject: protectedProcedure
    .input(z.object({
      id: z.number(),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      
      // Get project
      const project = await db
        .select()
        .from(cryptoProjects)
        .where(
          and(
            eq(cryptoProjects.id, input.id),
            eq(cryptoProjects.user_id, ctx.user.id)
          )
        )
        .limit(1);
      
      if (!project || project.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Project not found",
        });
      }
      
      // Get all purchases for this project
      const purchases = await db
        .select()
        .from(cryptoPurchases)
        .where(eq(cryptoPurchases.project_id, input.id))
        .orderBy(desc(cryptoPurchases.created_at));
      
      return {
        project: project[0],
        purchases,
      };
    }),

  /**
   * Get project by symbol (or create if doesn't exist)
   */
  getOrCreateProject: protectedProcedure
    .input(z.object({
      symbol: z.string().min(1).max(20),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      
      // Check if project already exists
      const existing = await db
        .select()
        .from(cryptoProjects)
        .where(
          and(
            eq(cryptoProjects.user_id, ctx.user.id),
            eq(cryptoProjects.symbol, input.symbol.toUpperCase())
          )
        )
        .limit(1);
      
      if (existing && existing.length > 0) {
        return existing[0];
      }
      
      // Create new project
      const result = await db.insert(cryptoProjects).values({
        user_id: ctx.user.id,
        symbol: input.symbol.toUpperCase(),
      });
      
      // Get the created project
      const newProject = await db
        .select()
        .from(cryptoProjects)
        .where(eq(cryptoProjects.id, Number(result[0].insertId)))
        .limit(1);
      
      return newProject[0];
    }),

  /**
   * Add a purchase to a project
   */
  addPurchase: protectedProcedure
    .input(z.object({
      symbol: z.string().min(1).max(20),
      quantity: z.number().positive(),
      buy_price: z.number().positive(),
      currency: z.string().length(3).default("USD"),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      
      // Get or create project
      let project = await db
        .select()
        .from(cryptoProjects)
        .where(
          and(
            eq(cryptoProjects.user_id, ctx.user.id),
            eq(cryptoProjects.symbol, input.symbol.toUpperCase())
          )
        )
        .limit(1);
      
      if (!project || project.length === 0) {
        // Create project
        const result = await db.insert(cryptoProjects).values({
          user_id: ctx.user.id,
          symbol: input.symbol.toUpperCase(),
        });
        
        project = await db
          .select()
          .from(cryptoProjects)
          .where(eq(cryptoProjects.id, Number(result[0].insertId)))
          .limit(1);
      }
      
      const projectId = project[0].id;
      
      // Add purchase
      await db.insert(cryptoPurchases).values({
        project_id: projectId,
        quantity: input.quantity.toString(),
        buy_price: input.buy_price.toString(),
        currency: input.currency.toUpperCase(),
      });
      
      return { success: true, projectId };
    }),

  /**
   * Delete a purchase
   */
  deletePurchase: protectedProcedure
    .input(z.object({
      id: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      
      // Get purchase to verify ownership
      const purchase = await db
        .select({
          id: cryptoPurchases.id,
          project_id: cryptoPurchases.project_id,
          user_id: cryptoProjects.user_id,
        })
        .from(cryptoPurchases)
        .leftJoin(cryptoProjects, eq(cryptoPurchases.project_id, cryptoProjects.id))
        .where(eq(cryptoPurchases.id, input.id))
        .limit(1);
      
      if (!purchase || purchase.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Purchase not found",
        });
      }
      
      if (purchase[0].user_id !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to delete this purchase",
        });
      }
      
      // Delete purchase
      await db.delete(cryptoPurchases).where(eq(cryptoPurchases.id, input.id));
      
      return { success: true };
    }),

  /**
   * Get project summary with calculations
   */
  getProjectSummary: protectedProcedure
    .input(z.object({
      symbol: z.string().min(1).max(20),
      currentPrice: z.number().positive(),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      
      // Get project
      const project = await db
        .select()
        .from(cryptoProjects)
        .where(
          and(
            eq(cryptoProjects.user_id, ctx.user.id),
            eq(cryptoProjects.symbol, input.symbol.toUpperCase())
          )
        )
        .limit(1);
      
      if (!project || project.length === 0) {
        return null;
      }
      
      // Get all purchases
      const purchases = await db
        .select()
        .from(cryptoPurchases)
        .where(eq(cryptoPurchases.project_id, project[0].id));
      
      if (purchases.length === 0) {
        return null;
      }
      
      // Calculate totals
      let totalQuantity = 0;
      let totalInvestment = 0;
      
      for (const purchase of purchases) {
        const quantity = parseFloat(purchase.quantity);
        const buyPrice = parseFloat(purchase.buy_price);
        
        totalQuantity += quantity;
        totalInvestment += quantity * buyPrice;
      }
      
      const averagePrice = totalInvestment / totalQuantity;
      const currentValue = totalQuantity * input.currentPrice;
      const profitLoss = currentValue - totalInvestment;
      const profitLossPercentage = (profitLoss / totalInvestment) * 100;
      
      return {
        symbol: input.symbol.toUpperCase(),
        totalQuantity,
        totalInvestment,
        averagePrice,
        currentPrice: input.currentPrice,
        currentValue,
        profitLoss,
        profitLossPercentage,
        purchaseCount: purchases.length,
      };
    }),
});
