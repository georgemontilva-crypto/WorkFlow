import { getDb } from "./db";
import { eq, desc, and, or, sql } from "drizzle-orm";
import { supportTickets, supportMessages } from "../drizzle/schema";

/**
 * Create a new support ticket
 */
export async function createSupportTicket(userId: number, subject?: string) {
  const db = await getDb();
  const [ticket] = await db.insert(supportTickets).values({
    user_id: userId,
    subject: subject || "Nuevo ticket de soporte",
    status: "open",
    priority: "medium",
    has_unread_agent: 1, // New ticket has unread messages for agent
  });
  
  return ticket.insertId;
}

/**
 * Get all tickets for a user
 */
export async function getUserTickets(userId: number) {
  const db = await getDb();
  return await db
    .select()
    .from(supportTickets)
    .where(eq(supportTickets.user_id, userId))
    .orderBy(desc(supportTickets.updated_at));
}

/**
 * Get a specific ticket by ID
 */
export async function getTicketById(ticketId: number) {
  const db = await getDb();
  const [ticket] = await db
    .select()
    .from(supportTickets)
    .where(eq(supportTickets.id, ticketId));
  
  return ticket;
}

/**
 * Get all tickets (for admin panel)
 */
export async function getAllTickets(status?: string) {
  const db = await getDb();
  if (status) {
    return await db
      .select()
      .from(supportTickets)
      .where(eq(supportTickets.status, status as any))
      .orderBy(desc(supportTickets.updated_at));
  }
  
  return await db
    .select()
    .from(supportTickets)
    .orderBy(desc(supportTickets.updated_at));
}

/**
 * Update ticket status
 */
export async function updateTicketStatus(ticketId: number, status: string) {
  const db = await getDb();
  await db
    .update(supportTickets)
    .set({ 
      status: status as any,
      updated_at: new Date(),
      ...(status === "resolved" ? { resolved_at: new Date() } : {}),
      ...(status === "closed" ? { closed_at: new Date() } : {}),
    })
    .where(eq(supportTickets.id, ticketId));
}

/**
 * Assign ticket to an agent
 */
export async function assignTicket(ticketId: number, agentId: number) {
  const db = await getDb();
  await db
    .update(supportTickets)
    .set({ 
      assigned_to: agentId,
      status: "in_progress",
      updated_at: new Date(),
    })
    .where(eq(supportTickets.id, ticketId));
}

/**
 * Mark ticket as having unread messages for user or agent
 */
export async function markTicketUnread(ticketId: number, forUser: boolean) {
  const db = await getDb();
  if (forUser) {
    await db
      .update(supportTickets)
      .set({ has_unread_user: 1, updated_at: new Date() })
      .where(eq(supportTickets.id, ticketId));
  } else {
    await db
      .update(supportTickets)
      .set({ has_unread_agent: 1, updated_at: new Date() })
      .where(eq(supportTickets.id, ticketId));
  }
}

/**
 * Mark ticket as read for user or agent
 */
export async function markTicketRead(ticketId: number, forUser: boolean) {
  const db = await getDb();
  if (forUser) {
    await db
      .update(supportTickets)
      .set({ has_unread_user: 0 })
      .where(eq(supportTickets.id, ticketId));
  } else {
    await db
      .update(supportTickets)
      .set({ has_unread_agent: 0 })
      .where(eq(supportTickets.id, ticketId));
  }
}

/**
 * Add a message to a ticket
 */
export async function addChatMessage(
  ticketId: number,
  senderId: number,
  senderType: "user" | "agent" | "ai",
  message: string
) {
  const db = await getDb();
  const [result] = await db.insert(supportMessages).values({
    ticket_id: ticketId,
    sender_id: senderId,
    sender_type: senderType,
    message,
  });
  
  // Mark ticket as having unread messages for the other party
  if (senderType === "user" || senderType === "ai") {
    await markTicketUnread(ticketId, false); // Agent has unread
  } else {
    await markTicketUnread(ticketId, true); // User has unread
  }
  
  // Update ticket's updated_at
  await db
    .update(supportTickets)
    .set({ updated_at: new Date() })
    .where(eq(supportTickets.id, ticketId));
  
  return result.insertId;
}

/**
 * Get all messages for a ticket
 */
export async function getTicketMessages(ticketId: number) {
  const db = await getDb();
  return await db
    .select()
    .from(supportMessages)
    .where(eq(supportMessages.ticket_id, ticketId))
    .orderBy(supportMessages.created_at);
}

/**
 * Mark messages as read
 */
export async function markMessagesRead(ticketId: number) {
  const db = await getDb();
  await db
    .update(supportMessages)
    .set({ is_read: 1 })
    .where(eq(supportMessages.ticket_id, ticketId));
}

/**
 * Get unread message count for user
 */
export async function getUnreadCount(userId: number) {
  const db = await getDb();
  const tickets = await db
    .select()
    .from(supportTickets)
    .where(
      and(
        eq(supportTickets.user_id, userId),
        eq(supportTickets.has_unread_user, 1)
      )
    );
  
  return tickets.length;
}
