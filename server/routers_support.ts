/**
 * Support Chat Router
 * REST API endpoints for support chat system
 * Real-time updates handled by Socket.IO
 */

import { router, protectedProcedure, superAdminProcedure } from './_core/trpc';
import { getDb } from './db';
import { z } from 'zod';
import { supportConversations, supportMessages } from '../drizzle/schema_support';
import { users } from '../drizzle/schema';
import { eq, and, desc, sql, or } from 'drizzle-orm';

export const supportRouter = router({
  /**
   * Get user's active conversation
   */
  getMyConversation: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      const userId = ctx.user.id;

      // Get active or most recent conversation
      const [conversation] = await db
        .select()
        .from(supportConversations)
        .where(
          and(
            eq(supportConversations.userId, userId),
            or(
              eq(supportConversations.status, 'bot'),
              eq(supportConversations.status, 'waiting_agent'),
              eq(supportConversations.status, 'active')
            )
          )
        )
        .orderBy(desc(supportConversations.lastMessageAt))
        .limit(1);

      if (!conversation) {
        return null;
      }

      // Get messages
      const messages = await db
        .select()
        .from(supportMessages)
        .where(eq(supportMessages.conversationId, conversation.id))
        .orderBy(supportMessages.createdAt);

      // Count unread messages from agent/bot
      const [unreadResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(supportMessages)
        .where(
          and(
            eq(supportMessages.conversationId, conversation.id),
            eq(supportMessages.readByUser, false),
            or(
              eq(supportMessages.senderType, 'agent'),
              eq(supportMessages.senderType, 'bot')
            )
          )
        );

      return {
        conversation,
        messages,
        unreadCount: Number(unreadResult?.count || 0),
      };
    }),

  /**
   * Create new conversation (with bot welcome message)
   */
  startConversation: protectedProcedure
    .mutation(async ({ ctx }) => {
      const db = await getDb();
      const userId = ctx.user.id;

      // Check if user already has an active conversation
      const [existing] = await db
        .select()
        .from(supportConversations)
        .where(
          and(
            eq(supportConversations.userId, userId),
            or(
              eq(supportConversations.status, 'bot'),
              eq(supportConversations.status, 'waiting_agent'),
              eq(supportConversations.status, 'active')
            )
          )
        )
        .limit(1);

      if (existing) {
        return { conversationId: existing.id };
      }

      // Create new conversation
      const [convResult] = await db
        .insert(supportConversations)
        .values({
          userId,
          status: 'bot',
          lastMessageAt: new Date(),
        });

      const conversationId = Number(convResult.insertId);

      // Insert bot welcome message
      await db
        .insert(supportMessages)
        .values({
          conversationId,
          senderType: 'bot',
          senderId: null,
          message: 'Hola 👋 Soy el asistente de Finwrk. ¿En qué puedo ayudarte hoy?',
          readByUser: false,
          readByAgent: true,
        });

      return { conversationId };
    }),

  /**
   * Request human agent (escalate from bot)
   */
  requestAgent: protectedProcedure
    .input(z.object({
      conversationId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      const userId = ctx.user.id;

      // Verify conversation belongs to user
      const [conversation] = await db
        .select()
        .from(supportConversations)
        .where(
          and(
            eq(supportConversations.id, input.conversationId),
            eq(supportConversations.userId, userId)
          )
        )
        .limit(1);

      if (!conversation) {
        throw new Error('Conversation not found');
      }

      // Update status to waiting_agent
      await db
        .update(supportConversations)
        .set({
          status: 'waiting_agent',
          updatedAt: new Date(),
        })
        .where(eq(supportConversations.id, input.conversationId));

      // Add system message
      await db
        .insert(supportMessages)
        .values({
          conversationId: input.conversationId,
          senderType: 'bot',
          senderId: null,
          message: 'Te estoy conectando con un agente. Por favor espera un momento...',
          readByUser: false,
          readByAgent: false,
        });

      return { success: true };
    }),

  /**
   * Admin: Get all conversations
   */
  admin: router({
    getConversations: superAdminProcedure
      .input(z.object({
        status: z.enum(['bot', 'waiting_agent', 'active', 'closed']).optional(),
      }).optional())
      .query(async ({ input }) => {
        const db = await getDb();

        let query = db
          .select({
            id: supportConversations.id,
            userId: supportConversations.userId,
            userName: users.name,
            userEmail: users.email,
            status: supportConversations.status,
            assignedAgentId: supportConversations.assignedAgentId,
            lastMessageAt: supportConversations.lastMessageAt,
            createdAt: supportConversations.createdAt,
          })
          .from(supportConversations)
          .leftJoin(users, eq(supportConversations.userId, users.id));

        if (input?.status) {
          query = query.where(eq(supportConversations.status, input.status)) as any;
        }

        const conversations = await query.orderBy(desc(supportConversations.lastMessageAt));

        // Get unread count for each conversation
        const conversationsWithUnread = await Promise.all(
          conversations.map(async (conv) => {
            const [unreadResult] = await db
              .select({ count: sql<number>`count(*)` })
              .from(supportMessages)
              .where(
                and(
                  eq(supportMessages.conversationId, conv.id),
                  eq(supportMessages.senderType, 'user'),
                  eq(supportMessages.readByAgent, false)
                )
              );

            // Get last message
            const [lastMessage] = await db
              .select()
              .from(supportMessages)
              .where(eq(supportMessages.conversationId, conv.id))
              .orderBy(desc(supportMessages.createdAt))
              .limit(1);

            return {
              ...conv,
              unreadCount: Number(unreadResult?.count || 0),
              lastMessage: lastMessage || null,
            };
          })
        );

        return conversationsWithUnread;
      }),

    getConversation: superAdminProcedure
      .input(z.object({
        id: z.number(),
      }))
      .query(async ({ input }) => {
        const db = await getDb();

        // Get conversation with user info
        const [conversation] = await db
          .select({
            id: supportConversations.id,
            userId: supportConversations.userId,
            userName: users.name,
            userEmail: users.email,
            status: supportConversations.status,
            assignedAgentId: supportConversations.assignedAgentId,
            lastMessageAt: supportConversations.lastMessageAt,
            createdAt: supportConversations.createdAt,
          })
          .from(supportConversations)
          .leftJoin(users, eq(supportConversations.userId, users.id))
          .where(eq(supportConversations.id, input.id))
          .limit(1);

        if (!conversation) {
          throw new Error('Conversation not found');
        }

        // Get all messages
        const messages = await db
          .select()
          .from(supportMessages)
          .where(eq(supportMessages.conversationId, input.id))
          .orderBy(supportMessages.createdAt);

        // Mark user messages as read by agent
        await db
          .update(supportMessages)
          .set({ readByAgent: true })
          .where(
            and(
              eq(supportMessages.conversationId, input.id),
              eq(supportMessages.senderType, 'user'),
              eq(supportMessages.readByAgent, false)
            )
          );

        return {
          conversation,
          messages,
        };
      }),
  }),
});
