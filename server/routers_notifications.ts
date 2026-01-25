/**
 * Notifications Router - PERSISTENT NOTIFICATIONS SYSTEM
 * Built from scratch - Clean, reliable, side panel only
 * 
 * PRINCIPLES:
 * - ONLY persistent notifications
 * - ONLY side panel UI
 * - NO auto-popups
 * - NO toasts (except for user actions)
 * - NO AI (yet)
 * 
 * Notifications are informative and reliable.
 */

import { router, protectedProcedure } from './_core/trpc';
import { getDb } from './db';
import { z } from 'zod';
import { notifications } from '../drizzle/schema';
import { eq, and, desc, sql } from 'drizzle-orm';

export const notificationsRouter = router({
  /**
   * List all notifications for the current user
   * Ordered by created_at DESC
   */
  list: protectedProcedure
    .input(z.object({
      unreadOnly: z.boolean().optional().default(false),
      limit: z.number().optional().default(50),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      const userId = ctx.user.id;

      console.log(`[Notifications] List request from user ${userId}, unreadOnly: ${input.unreadOnly}`);

      try {
        const conditions = [eq(notifications.user_id, userId)];
        
        if (input.unreadOnly) {
          conditions.push(eq(notifications.is_read, 0));
        }

        const result = await db
          .select()
          .from(notifications)
          .where(and(...conditions))
          .orderBy(desc(notifications.created_at))
          .limit(input.limit);

        console.log(`[Notifications] Found ${result.length} notifications for user ${userId}`);

        return result;
      } catch (error: any) {
        console.error(`[Notifications] List error:`, error.message);
        throw new Error(error.message || "Error al obtener notificaciones");
      }
    }),

  /**
   * Get unread count for the current user
   */
  unreadCount: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      const userId = ctx.user.id;

      try {
        const [result] = await db
          .select({ count: sql<number>`count(*)` })
          .from(notifications)
          .where(
            and(
              eq(notifications.user_id, userId),
              eq(notifications.is_read, 0)
            )
          );

        const count = Number(result?.count || 0);
        console.log(`[Notifications] Unread count for user ${userId}: ${count}`);

        return { count };
      } catch (error: any) {
        console.error(`[Notifications] Unread count error:`, error.message);
        throw new Error(error.message || "Error al contar notificaciones");
      }
    }),

  /**
   * Mark a notification as read
   */
  markAsRead: protectedProcedure
    .input(z.object({
      id: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      const userId = ctx.user.id;

      console.log(`[Notifications] Mark as read: ${input.id} by user ${userId}`);

      try {
        // Verify ownership
        const [notification] = await db
          .select()
          .from(notifications)
          .where(
            and(
              eq(notifications.id, input.id),
              eq(notifications.user_id, userId)
            )
          )
          .limit(1);

        if (!notification) {
          console.log(`[Notifications] Notification ${input.id} not found for user ${userId}`);
          throw new Error("Notificación no encontrada");
        }

        // Mark as read
        await db
          .update(notifications)
          .set({ is_read: 1 })
          .where(eq(notifications.id, input.id));

        console.log(`[Notifications] Notification ${input.id} marked as read`);

        return { success: true };
      } catch (error: any) {
        console.error(`[Notifications] Mark as read error:`, error.message);
        throw new Error(error.message || "Error al marcar notificación como leída");
      }
    }),

  /**
   * Mark all notifications as read for the current user
   */
  markAllAsRead: protectedProcedure
    .mutation(async ({ ctx }) => {
      const db = await getDb();
      const userId = ctx.user.id;

      console.log(`[Notifications] Mark all as read for user ${userId}`);

      try {
        await db
          .update(notifications)
          .set({ is_read: 1 })
          .where(
            and(
              eq(notifications.user_id, userId),
              eq(notifications.is_read, 0)
            )
          );

        console.log(`[Notifications] All notifications marked as read for user ${userId}`);

        return { success: true };
      } catch (error: any) {
        console.error(`[Notifications] Mark all as read error:`, error.message);
        throw new Error(error.message || "Error al marcar todas como leídas");
      }
    }),

  /**
   * Create a notification (internal use)
   * IMPORTANT: Validates title and message are not empty
   * Prevents duplicates based on source + source_id + type
   */
  create: protectedProcedure
    .input(z.object({
      type: z.enum(["info", "success", "warning", "error"]),
      title: z.string().min(1, "Title is required"),
      message: z.string().min(1, "Message is required"),
      source: z.enum(["invoice", "savings", "system"]),
      source_id: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      const userId = ctx.user.id;

      console.log(`[Notifications] Create attempt by user ${userId}:`, {
        type: input.type,
        title: input.title,
        source: input.source,
        source_id: input.source_id,
      });

      try {
        // Validate title and message
        if (!input.title || input.title.trim().length === 0) {
          console.error(`[Notifications] DISCARDED: Empty title`);
          throw new Error("Title cannot be empty");
        }

        if (!input.message || input.message.trim().length === 0) {
          console.error(`[Notifications] DISCARDED: Empty message`);
          throw new Error("Message cannot be empty");
        }

        // Check for duplicates (same source + source_id + type)
        if (input.source_id) {
          const conditions = [
            eq(notifications.user_id, userId),
            eq(notifications.source, input.source),
            eq(notifications.source_id, input.source_id),
            eq(notifications.type, input.type),
          ];

          const [existing] = await db
            .select()
            .from(notifications)
            .where(and(...conditions))
            .limit(1);

          if (existing) {
            console.log(`[Notifications] DISCARDED: Duplicate notification for source ${input.source} id ${input.source_id}`);
            return { success: false, reason: "duplicate" };
          }
        }

        // Create notification
        const [newNotification] = await db.insert(notifications).values({
          user_id: userId,
          type: input.type,
          title: input.title.trim(),
          message: input.message.trim(),
          source: input.source,
          source_id: input.source_id || null,
          is_read: 0,
        });

        const notificationId = Number(newNotification.insertId);

        console.log(`[Notifications] Created successfully: ${notificationId} - ${input.title}`);

        return {
          success: true,
          notificationId,
        };
      } catch (error: any) {
        console.error(`[Notifications] Create error:`, error.message);
        throw new Error(error.message || "Error al crear notificación");
      }
    }),
});
