import { z } from "zod";
import { router, protectedProcedure } from "./trpc";
import * as chatDb from "./chat_db";
import { generateAIResponse, shouldTriggerAI, generateWelcomeMessage } from "./ai_service";

export const chatRouter = router({
  // Create a new support ticket
  createTicket: protectedProcedure
    .input(z.object({
      subject: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const ticketId = await chatDb.createSupportTicket(ctx.user.id, input.subject);
      return { ticketId };
    }),

  // Get user's tickets
  getUserTickets: protectedProcedure
    .query(async ({ ctx }) => {
      return await chatDb.getUserTickets(ctx.user.id);
    }),

  // Get a specific ticket
  getTicket: protectedProcedure
    .input(z.object({
      ticketId: z.number(),
    }))
    .query(async ({ ctx, input }) => {
      const ticket = await chatDb.getTicketById(input.ticketId);
      
      // Verify user owns this ticket or is admin
      if (ticket.user_id !== ctx.user.id && ctx.user.role !== "admin") {
        throw new Error("No autorizado");
      }
      
      return ticket;
    }),

  // Get all tickets (admin only)
  getAllTickets: protectedProcedure
    .input(z.object({
      status: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new Error("No autorizado");
      }
      
      return await chatDb.getAllTickets(input.status);
    }),

  // Update ticket status
  updateTicketStatus: protectedProcedure
    .input(z.object({
      ticketId: z.number(),
      status: z.enum(["open", "in_progress", "waiting_user", "waiting_agent", "resolved", "closed"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const ticket = await chatDb.getTicketById(input.ticketId);
      
      // Verify user owns this ticket or is admin
      if (ticket.user_id !== ctx.user.id && ctx.user.role !== "admin") {
        throw new Error("No autorizado");
      }
      
      await chatDb.updateTicketStatus(input.ticketId, input.status);
      return { success: true };
    }),

  // Assign ticket to agent (admin only)
  assignTicket: protectedProcedure
    .input(z.object({
      ticketId: z.number(),
      agentId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new Error("No autorizado");
      }
      
      await chatDb.assignTicket(input.ticketId, input.agentId);
      return { success: true };
    }),

  // Send a message
  sendMessage: protectedProcedure
    .input(z.object({
      ticketId: z.number(),
      message: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const ticket = await chatDb.getTicketById(input.ticketId);
      
      // Verify user owns this ticket or is admin
      if (ticket.user_id !== ctx.user.id && ctx.user.role !== "admin") {
        throw new Error("No autorizado");
      }
      
      const senderType = ctx.user.role === "admin" ? "agent" : "user";
      const messageId = await chatDb.addChatMessage(
        input.ticketId,
        ctx.user.id,
        senderType,
        input.message
      );
      
      // Trigger AI response if user sent message and ticket status allows it
      if (senderType === "user" && shouldTriggerAI(ticket.status)) {
        // Generate AI response asynchronously (don't wait)
        setTimeout(() => {
          generateAIResponse(input.ticketId, input.message, ctx.user.id).catch(err => {
            console.error("Error generating AI response:", err);
          });
        }, 1000);
      }
      
      return { messageId };
    }),

  // Send welcome message
  sendWelcomeMessage: protectedProcedure
    .input(z.object({
      ticketId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const ticket = await chatDb.getTicketById(input.ticketId);
      
      // Verify user owns this ticket
      if (ticket.user_id !== ctx.user.id) {
        throw new Error("No autorizado");
      }
      
      const welcomeMessage = await generateWelcomeMessage(ctx.user.id);
      const messageId = await chatDb.addChatMessage(
        input.ticketId,
        ctx.user.id,
        "ai",
        welcomeMessage
      );
      
      return { messageId };
    }),

  // Get messages for a ticket
  getMessages: protectedProcedure
    .input(z.object({
      ticketId: z.number(),
    }))
    .query(async ({ ctx, input }) => {
      const ticket = await chatDb.getTicketById(input.ticketId);
      
      // Verify user owns this ticket or is admin
      if (ticket.user_id !== ctx.user.id && ctx.user.role !== "admin") {
        throw new Error("No autorizado");
      }
      
      const messages = await chatDb.getTicketMessages(input.ticketId);
      
      // Mark as read for the current user
      const isUser = ctx.user.role !== "admin";
      await chatDb.markTicketRead(input.ticketId, isUser);
      
      return messages;
    }),

  // Get unread count
  getUnreadCount: protectedProcedure
    .query(async ({ ctx }) => {
      return await chatDb.getUnreadCount(ctx.user.id);
    }),

  // Request human agent
  requestAgent: protectedProcedure
    .input(z.object({
      ticketId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const ticket = await chatDb.getTicketById(input.ticketId);
      
      // Verify user owns this ticket
      if (ticket.user_id !== ctx.user.id) {
        throw new Error("No autorizado");
      }
      
      // Update status to waiting_agent
      await chatDb.updateTicketStatus(input.ticketId, "waiting_agent");
      
      // Add a system message
      await chatDb.addChatMessage(
        input.ticketId,
        ctx.user.id,
        "user",
        "🤝 Usuario solicitó hablar con un asistente humano"
      );
      
      return { success: true };
    }),
});
