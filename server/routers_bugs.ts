/**
 * Bug Conversations Router - CHAT-BASED BUG REPORTING SYSTEM
 * Built from scratch - Clean, persistent, WhatsApp-like interface
 * 
 * FEATURES:
 * - User-initiated bug conversations
 * - Real-time chat interface
 * - Admin panel for managing reports
 * - Automatic welcome messages
 * - File attachments support
 * - Status and priority management
 * - Integrated notifications
 */

import { router, protectedProcedure, superAdminProcedure } from './_core/trpc';
import { getDb } from './db';
import { z } from 'zod';
import { bugConversations, bugMessages, users, notifications } from '../drizzle/schema';
import { eq, and, desc, sql } from 'drizzle-orm';

export const bugsRouter = router({
  /**
   * Get user's bug conversations
   */
  getConversations: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      const userId = ctx.user.id;

      console.log(`[Bugs] Get conversations for user ${userId}`);

      try {
        const conversations = await db
          .select()
          .from(bugConversations)
          .where(eq(bugConversations.user_id, userId))
          .orderBy(desc(bugConversations.last_message_at));

        // Get last message for each conversation
        const conversationsWithLastMessage = await Promise.all(
          conversations.map(async (conv) => {
            const lastMessage = await db
              .select()
              .from(bugMessages)
              .where(eq(bugMessages.conversation_id, conv.id))
              .orderBy(desc(bugMessages.created_at))
              .limit(1);

            // Count unread admin messages
            const [unreadResult] = await db
              .select({ count: sql<number>`count(*)` })
              .from(bugMessages)
              .where(
                and(
                  eq(bugMessages.conversation_id, conv.id),
                  eq(bugMessages.sender_type, "admin"),
                  eq(bugMessages.is_read, 0)
                )
              );

            return {
              ...conv,
              lastMessage: lastMessage[0] || null,
              unreadCount: Number(unreadResult?.count || 0),
            };
          })
        );

        console.log(`[Bugs] Found ${conversations.length} conversations for user ${userId}`);
        return conversationsWithLastMessage;
      } catch (error: any) {
        console.error(`[Bugs] Get conversations error:`, error.message);
        throw new Error(error.message || "Error al obtener conversaciones");
      }
    }),

  /**
   * Get a specific conversation with all messages
   */
  getConversation: protectedProcedure
    .input(z.object({
      id: z.number(),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      const userId = ctx.user.id;

      console.log(`[Bugs] Get conversation ${input.id} for user ${userId}`);

      try {
        // Verify conversation belongs to user
        const conversation = await db
          .select()
          .from(bugConversations)
          .where(
            and(
              eq(bugConversations.id, input.id),
              eq(bugConversations.user_id, userId)
            )
          )
          .limit(1);

        if (conversation.length === 0) {
          throw new Error("Conversación no encontrada");
        }

        // Get all messages
        const messages = await db
          .select()
          .from(bugMessages)
          .where(eq(bugMessages.conversation_id, input.id))
          .orderBy(bugMessages.created_at);

        // Mark admin messages as read
        await db
          .update(bugMessages)
          .set({ is_read: 1 })
          .where(
            and(
              eq(bugMessages.conversation_id, input.id),
              eq(bugMessages.sender_type, "admin"),
              eq(bugMessages.is_read, 0)
            )
          );

        console.log(`[Bugs] Found ${messages.length} messages in conversation ${input.id}`);

        return {
          conversation: conversation[0],
          messages,
        };
      } catch (error: any) {
        console.error(`[Bugs] Get conversation error:`, error.message);
        throw new Error(error.message || "Error al obtener conversación");
      }
    }),

  /**
   * Create a new bug conversation or send message to existing one
   */
  sendMessage: protectedProcedure
    .input(z.object({
      message: z.string().min(1, "El mensaje no puede estar vacío").max(2000, "El mensaje no puede exceder 2000 caracteres"),
      attachmentUrl: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      const userId = ctx.user.id;

      console.log(`[Bugs] Send message from user ${userId}`);

      try {
        // Check if user has an open conversation
        const existingConversation = await db
          .select()
          .from(bugConversations)
          .where(
            and(
              eq(bugConversations.user_id, userId),
              eq(bugConversations.status, "open")
            )
          )
          .limit(1);

        let conversationId: number;
        let isNewConversation = false;

        if (existingConversation.length > 0) {
          // Use existing conversation
          conversationId = existingConversation[0].id;
          
          // Update last_message_at
          await db
            .update(bugConversations)
            .set({ last_message_at: new Date() })
            .where(eq(bugConversations.id, conversationId));
        } else {
          // Create new conversation
          const result = await db.insert(bugConversations).values({
            user_id: userId,
            status: "open",
            priority: "medium",
            last_message_at: new Date(),
          });

          conversationId = Number(result.insertId);
          isNewConversation = true;

          // Send automatic welcome message
          await db.insert(bugMessages).values({
            conversation_id: conversationId,
            sender_type: "system",
            message: "Gracias por tu reporte. Nuestro equipo revisará el problema lo antes posible.",
            is_read: 1, // System messages are auto-read
          });

          console.log(`[Bugs] Created new conversation ${conversationId} for user ${userId}`);
        }

        // Insert user message
        await db.insert(bugMessages).values({
          conversation_id: conversationId,
          sender_type: "user",
          message: input.message.trim(),
          attachment_url: input.attachmentUrl || null,
          is_read: 0,
        });

        // Create notification for admin (only for new messages, not new conversations)
        if (!isNewConversation) {
          // Find all super admins
          const admins = await db
            .select()
            .from(users)
            .where(eq(users.role, "super_admin"));

          // Create notification for each admin
          for (const admin of admins) {
            await db.insert(notifications).values({
              user_id: admin.id,
              type: "info",
              title: "Nuevo mensaje de bug",
              message: `${ctx.user.name} ha enviado un nuevo mensaje en su reporte de bug`,
              source: "system",
              source_id: conversationId,
              is_read: 0,
              is_urgent: 0,
            });
          }
        }

        console.log(`[Bugs] Message sent successfully to conversation ${conversationId}`);

        return {
          conversationId,
          message: "Mensaje enviado correctamente",
        };
      } catch (error: any) {
        console.error(`[Bugs] Send message error:`, error.message);
        throw new Error(error.message || "Error al enviar mensaje");
      }
    }),

  /**
   * ADMIN ROUTES
   */

  /**
   * Get all bug conversations (admin only)
   */
  admin: router({
    getConversations: superAdminProcedure
      .query(async ({ ctx }) => {
        const db = await getDb();

        console.log(`[Bugs Admin] Get all conversations`);

        try {
          // Get all conversations with user info
          const conversations = await db
            .select({
              id: bugConversations.id,
              userId: bugConversations.user_id,
              userName: users.name,
              userEmail: users.email,
              status: bugConversations.status,
              priority: bugConversations.priority,
              lastMessageAt: bugConversations.last_message_at,
              createdAt: bugConversations.created_at,
            })
            .from(bugConversations)
            .leftJoin(users, eq(bugConversations.user_id, users.id))
            .orderBy(desc(bugConversations.last_message_at));

          // Get unread count and last message for each conversation
          const conversationsWithDetails = await Promise.all(
            conversations.map(async (conv) => {
              const [unreadResult] = await db
                .select({ count: sql<number>`count(*)` })
                .from(bugMessages)
                .where(
                  and(
                    eq(bugMessages.conversation_id, conv.id),
                    eq(bugMessages.sender_type, "user"),
                    eq(bugMessages.is_read, 0)
                  )
                );

              const lastMessage = await db
                .select()
                .from(bugMessages)
                .where(eq(bugMessages.conversation_id, conv.id))
                .orderBy(desc(bugMessages.created_at))
                .limit(1);

              return {
                ...conv,
                unreadCount: Number(unreadResult?.count || 0),
                lastMessage: lastMessage[0] || null,
              };
            })
          );

          console.log(`[Bugs Admin] Found ${conversations.length} conversations`);
          return conversationsWithDetails;
        } catch (error: any) {
          console.error(`[Bugs Admin] Get conversations error:`, error.message);
          throw new Error(error.message || "Error al obtener conversaciones");
        }
      }),

    /**
     * Get conversation details (admin only)
     */
    getConversation: superAdminProcedure
      .input(z.object({
        id: z.number(),
      }))
      .query(async ({ ctx, input }) => {
        const db = await getDb();

        console.log(`[Bugs Admin] Get conversation ${input.id}`);

        try {
          // Get conversation with user info
          const conversation = await db
            .select({
              id: bugConversations.id,
              userId: bugConversations.user_id,
              userName: users.name,
              userEmail: users.email,
              status: bugConversations.status,
              priority: bugConversations.priority,
              lastMessageAt: bugConversations.last_message_at,
              createdAt: bugConversations.created_at,
            })
            .from(bugConversations)
            .leftJoin(users, eq(bugConversations.user_id, users.id))
            .where(eq(bugConversations.id, input.id))
            .limit(1);

          if (conversation.length === 0) {
            throw new Error("Conversación no encontrada");
          }

          // Get all messages
          const messages = await db
            .select()
            .from(bugMessages)
            .where(eq(bugMessages.conversation_id, input.id))
            .orderBy(bugMessages.created_at);

          // Mark user messages as read
          await db
            .update(bugMessages)
            .set({ is_read: 1 })
            .where(
              and(
                eq(bugMessages.conversation_id, input.id),
                eq(bugMessages.sender_type, "user"),
                eq(bugMessages.is_read, 0)
              )
            );

          console.log(`[Bugs Admin] Found conversation ${input.id} with ${messages.length} messages`);

          return {
            conversation: conversation[0],
            messages,
          };
        } catch (error: any) {
          console.error(`[Bugs Admin] Get conversation error:`, error.message);
          throw new Error(error.message || "Error al obtener conversación");
        }
      }),

    /**
     * Reply to a bug conversation (admin only)
     */
    reply: superAdminProcedure
      .input(z.object({
        conversationId: z.number(),
        message: z.string().min(1, "El mensaje no puede estar vacío").max(2000, "El mensaje no puede exceder 2000 caracteres"),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();

        console.log(`[Bugs Admin] Reply to conversation ${input.conversationId}`);

        try {
          // Verify conversation exists
          const conversation = await db
            .select()
            .from(bugConversations)
            .where(eq(bugConversations.id, input.conversationId))
            .limit(1);

          if (conversation.length === 0) {
            throw new Error("Conversación no encontrada");
          }

          // Insert admin message
          await db.insert(bugMessages).values({
            conversation_id: input.conversationId,
            sender_type: "admin",
            message: input.message.trim(),
            is_read: 0,
          });

          // Update conversation
          await db
            .update(bugConversations)
            .set({
              last_message_at: new Date(),
              status: "pending",
            })
            .where(eq(bugConversations.id, input.conversationId));

          // Create notification for user
          await db.insert(notifications).values({
            user_id: conversation[0].user_id,
            type: "info",
            title: "Respuesta de soporte",
            message: "El equipo de soporte ha respondido a tu reporte de bug",
            source: "system",
            source_id: input.conversationId,
            is_read: 0,
            is_urgent: 0,
          });

          console.log(`[Bugs Admin] Reply sent successfully to conversation ${input.conversationId}`);

          return { message: "Respuesta enviada correctamente" };
        } catch (error: any) {
          console.error(`[Bugs Admin] Reply error:`, error.message);
          throw new Error(error.message || "Error al enviar respuesta");
        }
      }),

    /**
     * Update conversation status (admin only)
     */
    updateStatus: superAdminProcedure
      .input(z.object({
        conversationId: z.number(),
        status: z.enum(["open", "pending", "closed"]),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();

        console.log(`[Bugs Admin] Update status of conversation ${input.conversationId} to ${input.status}`);

        try {
          // Update status
          await db
            .update(bugConversations)
            .set({ status: input.status, updated_at: new Date() })
            .where(eq(bugConversations.id, input.conversationId));

          // If closing, notify user
          if (input.status === "closed") {
            const conversation = await db
              .select()
              .from(bugConversations)
              .where(eq(bugConversations.id, input.conversationId))
              .limit(1);

            if (conversation.length > 0) {
              await db.insert(notifications).values({
                user_id: conversation[0].user_id,
                type: "success",
                title: "Bug resuelto",
                message: "Tu reporte de bug ha sido marcado como resuelto",
                source: "system",
                source_id: input.conversationId,
                is_read: 0,
                is_urgent: 0,
              });
            }
          }

          console.log(`[Bugs Admin] Status updated successfully`);

          return { message: "Estado actualizado correctamente" };
        } catch (error: any) {
          console.error(`[Bugs Admin] Update status error:`, error.message);
          throw new Error(error.message || "Error al actualizar estado");
        }
      }),

    /**
     * Update conversation priority (admin only)
     */
    updatePriority: superAdminProcedure
      .input(z.object({
        conversationId: z.number(),
        priority: z.enum(["low", "medium", "high"]),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();

        console.log(`[Bugs Admin] Update priority of conversation ${input.conversationId} to ${input.priority}`);

        try {
          // Update priority
          await db
            .update(bugConversations)
            .set({ priority: input.priority, updated_at: new Date() })
            .where(eq(bugConversations.id, input.conversationId));

          console.log(`[Bugs Admin] Priority updated successfully`);

          return { message: "Prioridad actualizada correctamente" };
        } catch (error: any) {
          console.error(`[Bugs Admin] Update priority error:`, error.message);
          throw new Error(error.message || "Error al actualizar prioridad");
        }
      }),
  }),
});
