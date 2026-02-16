import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "./trpc";
import { db } from "./db";
import { bugReportsForm } from "../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";

export const bugReportsRouter = router({
  // Submit a new bug report
  submit: protectedProcedure
    .input(
      z.object({
        title: z.string().min(5, "El título debe tener al menos 5 caracteres"),
        description: z.string().min(10, "La descripción debe tener al menos 10 caracteres"),
        stepsToReproduce: z.string().optional(),
        expectedBehavior: z.string().optional(),
        actualBehavior: z.string().optional(),
        attachmentUrl: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [report] = await db.insert(bugReportsForm).values({
        user_id: ctx.user.id,
        title: input.title,
        description: input.description,
        steps_to_reproduce: input.stepsToReproduce,
        expected_behavior: input.expectedBehavior,
        actual_behavior: input.actualBehavior,
        attachment_url: input.attachmentUrl,
        status: "new",
        priority: "medium",
      });

      return { success: true, reportId: report.insertId };
    }),

  // Get user's own bug reports
  getMyReports: protectedProcedure.query(async ({ ctx }) => {
    const reports = await db
      .select()
      .from(bugReportsForm)
      .where(eq(bugReportsForm.user_id, ctx.user.id))
      .orderBy(desc(bugReportsForm.created_at));

    return reports;
  }),

  // Admin procedures
  admin: router({
    // Get all bug reports
    getAllReports: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "super_admin") {
        throw new Error("No autorizado");
      }

      const reports = await db
        .select()
        .from(bugReportsForm)
        .orderBy(desc(bugReportsForm.created_at));

      return reports;
    }),

    // Update report status
    updateStatus: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          status: z.enum(["new", "in_progress", "resolved", "closed"]),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "super_admin") {
          throw new Error("No autorizado");
        }

        await db
          .update(bugReportsForm)
          .set({ status: input.status, updated_at: new Date() })
          .where(eq(bugReportsForm.id, input.id));

        return { success: true };
      }),

    // Update report priority
    updatePriority: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          priority: z.enum(["low", "medium", "high", "critical"]),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "super_admin") {
          throw new Error("No autorizado");
        }

        await db
          .update(bugReportsForm)
          .set({ priority: input.priority, updated_at: new Date() })
          .where(eq(bugReportsForm.id, input.id));

        return { success: true };
      }),

    // Add admin notes
    addNotes: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          notes: z.string(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "super_admin") {
          throw new Error("No autorizado");
        }

        await db
          .update(bugReportsForm)
          .set({ admin_notes: input.notes, updated_at: new Date() })
          .where(eq(bugReportsForm.id, input.id));

        return { success: true };
      }),
  }),
});
