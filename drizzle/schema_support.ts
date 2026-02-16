/**
 * Support Chat System Schema
 * Real-time support chat with bot and human agents
 */

import { mysqlTable, bigint, varchar, text, timestamp, boolean, mysqlEnum, index } from 'drizzle-orm/mysql-core';

/**
 * Support Conversations
 * Tracks chat conversations between users and support (bot/agent)
 */
export const supportConversations = mysqlTable('support_conversations', {
  id: bigint('id', { mode: 'number', unsigned: true }).primaryKey().autoincrement(),
  userId: bigint('user_id', { mode: 'number', unsigned: true }).notNull(),
  status: mysqlEnum('status', ['bot', 'waiting_agent', 'active', 'closed']).notNull().default('bot'),
  assignedAgentId: bigint('assigned_agent_id', { mode: 'number', unsigned: true }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
  lastMessageAt: timestamp('last_message_at').defaultNow(),
}, (table) => ({
  userIdIdx: index('idx_user_id').on(table.userId),
  statusIdx: index('idx_status').on(table.status),
  assignedAgentIdx: index('idx_assigned_agent').on(table.assignedAgentId),
  lastMessageIdx: index('idx_last_message').on(table.lastMessageAt),
}));

/**
 * Support Messages
 * Individual messages in support conversations
 */
export const supportMessages = mysqlTable('support_messages', {
  id: bigint('id', { mode: 'number', unsigned: true }).primaryKey().autoincrement(),
  conversationId: bigint('conversation_id', { mode: 'number', unsigned: true }).notNull(),
  senderType: mysqlEnum('sender_type', ['user', 'bot', 'agent']).notNull(),
  senderId: bigint('sender_id', { mode: 'number', unsigned: true }),
  message: text('message').notNull(),
  readByUser: boolean('read_by_user').default(false),
  readByAgent: boolean('read_by_agent').default(false),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  conversationIdx: index('idx_conversation').on(table.conversationId),
  senderTypeIdx: index('idx_sender_type').on(table.senderType),
  createdAtIdx: index('idx_created_at').on(table.createdAt),
  readStatusIdx: index('idx_read_status').on(table.readByUser, table.readByAgent),
}));
