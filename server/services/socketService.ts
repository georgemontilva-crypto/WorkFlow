/**
 * Socket.IO Service
 * Real-time WebSocket communication for support chat
 */

import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';
import { getDb } from '../db';
import { supportConversations, supportMessages } from '../../drizzle/schema_support';
import { eq, and, desc } from 'drizzle-orm';

interface SocketUser {
  userId: number;
  userRole: string;
}

let io: SocketIOServer | null = null;
let pubClient: Redis | null = null;
let subClient: Redis | null = null;

/**
 * Initialize Socket.IO server with Redis adapter
 */
export function initializeSocketIO(httpServer: HTTPServer) {
  console.log('[Socket.IO] Initializing...');

  // Create Socket.IO server
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // Initialize Redis clients for pub/sub
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  
  try {
    pubClient = new Redis(redisUrl);
    subClient = pubClient.duplicate();

    // Set up Redis adapter for horizontal scaling
    io.adapter(createAdapter(pubClient, subClient));
    console.log('[Socket.IO] Redis adapter initialized');
  } catch (error) {
    console.error('[Socket.IO] Redis connection failed, running without adapter:', error);
  }

  // Authentication middleware
  io.use(async (socket: Socket, next) => {
    try {
      const userId = socket.handshake.auth.userId;
      const userRole = socket.handshake.auth.userRole;

      if (!userId) {
        return next(new Error('Authentication required'));
      }

      // Attach user info to socket
      (socket as any).user = {
        userId: Number(userId),
        userRole: userRole || 'user',
      } as SocketUser;

      next();
    } catch (error) {
      next(new Error('Authentication failed'));
    }
  });

  // Connection handler
  io.on('connection', (socket: Socket) => {
    const user = (socket as any).user as SocketUser;
    console.log(`[Socket.IO] User connected: ${user.userId}`);

    // Join user's personal room
    socket.join(`user:${user.userId}`);

    // If admin/agent, join agent room
    if (user.userRole === 'super_admin' || user.userRole === 'admin') {
      socket.join('agents');
      console.log(`[Socket.IO] Agent joined: ${user.userId}`);
    }

    // Handle user sending message
    socket.on('send_message', async (data: { conversationId: number; message: string }) => {
      try {
        await handleUserMessage(socket, data);
      } catch (error) {
        console.error('[Socket.IO] Error handling user message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle agent taking conversation
    socket.on('take_conversation', async (data: { conversationId: number }) => {
      try {
        await handleTakeConversation(socket, data);
      } catch (error) {
        console.error('[Socket.IO] Error taking conversation:', error);
        socket.emit('error', { message: 'Failed to take conversation' });
      }
    });

    // Handle agent sending message
    socket.on('agent_reply', async (data: { conversationId: number; message: string }) => {
      try {
        await handleAgentReply(socket, data);
      } catch (error) {
        console.error('[Socket.IO] Error sending agent reply:', error);
        socket.emit('error', { message: 'Failed to send reply' });
      }
    });

    // Handle closing conversation
    socket.on('close_conversation', async (data: { conversationId: number }) => {
      try {
        await handleCloseConversation(socket, data);
      } catch (error) {
        console.error('[Socket.IO] Error closing conversation:', error);
        socket.emit('error', { message: 'Failed to close conversation' });
      }
    });

    // Handle marking messages as read
    socket.on('mark_read', async (data: { conversationId: number }) => {
      try {
        await handleMarkRead(socket, data);
      } catch (error) {
        console.error('[Socket.IO] Error marking as read:', error);
      }
    });

    // Disconnection
    socket.on('disconnect', () => {
      console.log(`[Socket.IO] User disconnected: ${user.userId}`);
    });
  });

  console.log('[Socket.IO] Server initialized successfully');
  return io;
}

/**
 * Handle user sending a message
 */
async function handleUserMessage(socket: Socket, data: { conversationId: number; message: string }) {
  const user = (socket as any).user as SocketUser;
  const db = await getDb();

  // Validate message
  if (!data.message || data.message.trim().length === 0) {
    socket.emit('error', { message: 'Message cannot be empty' });
    return;
  }

  if (data.message.length > 2000) {
    socket.emit('error', { message: 'Message too long (max 2000 characters)' });
    return;
  }

  // Get or create conversation
  let conversation;
  if (data.conversationId) {
    const [conv] = await db
      .select()
      .from(supportConversations)
      .where(
        and(
          eq(supportConversations.id, data.conversationId),
          eq(supportConversations.userId, user.userId)
        )
      )
      .limit(1);
    conversation = conv;
  }

  if (!conversation) {
    // Create new conversation
    const [newConv] = await db
      .insert(supportConversations)
      .values({
        userId: user.userId,
        status: 'bot',
        lastMessageAt: new Date(),
      });
    
    conversation = {
      id: Number(newConv.insertId),
      userId: user.userId,
      status: 'bot' as const,
      assignedAgentId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastMessageAt: new Date(),
    };
  }

  // Insert user message
  const [messageResult] = await db
    .insert(supportMessages)
    .values({
      conversationId: conversation.id,
      senderType: 'user',
      senderId: user.userId,
      message: data.message.trim(),
      readByUser: true,
      readByAgent: false,
    });

  const newMessage = {
    id: Number(messageResult.insertId),
    conversationId: conversation.id,
    senderType: 'user' as const,
    senderId: user.userId,
    message: data.message.trim(),
    readByUser: true,
    readByAgent: false,
    createdAt: new Date(),
  };

  // Update conversation last_message_at
  await db
    .update(supportConversations)
    .set({ lastMessageAt: new Date() })
    .where(eq(supportConversations.id, conversation.id));

  // Emit to user
  socket.emit('message_sent', { message: newMessage, conversation });

  // If conversation has assigned agent, notify them
  if (conversation.assignedAgentId) {
    io?.to(`user:${conversation.assignedAgentId}`).emit('new_message', {
      message: newMessage,
      conversation,
    });
  }

  // Notify all agents about new message in queue
  io?.to('agents').emit('conversation_updated', {
    conversationId: conversation.id,
    hasUnread: true,
  });
}

/**
 * Handle agent taking a conversation
 */
async function handleTakeConversation(socket: Socket, data: { conversationId: number }) {
  const user = (socket as any).user as SocketUser;
  
  if (user.userRole !== 'super_admin' && user.userRole !== 'admin') {
    socket.emit('error', { message: 'Unauthorized' });
    return;
  }

  const db = await getDb();

  // Update conversation
  await db
    .update(supportConversations)
    .set({
      status: 'active',
      assignedAgentId: user.userId,
      updatedAt: new Date(),
    })
    .where(eq(supportConversations.id, data.conversationId));

  // Get updated conversation
  const [conversation] = await db
    .select()
    .from(supportConversations)
    .where(eq(supportConversations.id, data.conversationId))
    .limit(1);

  // Notify user that agent has joined
  io?.to(`user:${conversation.userId}`).emit('agent_joined', {
    conversationId: data.conversationId,
    agentId: user.userId,
  });

  // Notify all agents
  io?.to('agents').emit('conversation_updated', {
    conversationId: data.conversationId,
    status: 'active',
    assignedAgentId: user.userId,
  });

  socket.emit('conversation_taken', { conversation });
}

/**
 * Handle agent replying to user
 */
async function handleAgentReply(socket: Socket, data: { conversationId: number; message: string }) {
  const user = (socket as any).user as SocketUser;
  
  if (user.userRole !== 'super_admin' && user.userRole !== 'admin') {
    socket.emit('error', { message: 'Unauthorized' });
    return;
  }

  const db = await getDb();

  // Validate message
  if (!data.message || data.message.trim().length === 0) {
    socket.emit('error', { message: 'Message cannot be empty' });
    return;
  }

  // Get conversation
  const [conversation] = await db
    .select()
    .from(supportConversations)
    .where(eq(supportConversations.id, data.conversationId))
    .limit(1);

  if (!conversation) {
    socket.emit('error', { message: 'Conversation not found' });
    return;
  }

  // Insert agent message
  const [messageResult] = await db
    .insert(supportMessages)
    .values({
      conversationId: data.conversationId,
      senderType: 'agent',
      senderId: user.userId,
      message: data.message.trim(),
      readByUser: false,
      readByAgent: true,
    });

  const newMessage = {
    id: Number(messageResult.insertId),
    conversationId: data.conversationId,
    senderType: 'agent' as const,
    senderId: user.userId,
    message: data.message.trim(),
    readByUser: false,
    readByAgent: true,
    createdAt: new Date(),
  };

  // Update conversation
  await db
    .update(supportConversations)
    .set({ lastMessageAt: new Date() })
    .where(eq(supportConversations.id, data.conversationId));

  // Notify user
  io?.to(`user:${conversation.userId}`).emit('new_message', {
    message: newMessage,
    conversation,
  });

  // Confirm to agent
  socket.emit('message_sent', { message: newMessage });
}

/**
 * Handle closing a conversation
 */
async function handleCloseConversation(socket: Socket, data: { conversationId: number }) {
  const user = (socket as any).user as SocketUser;
  const db = await getDb();

  // Update conversation status
  await db
    .update(supportConversations)
    .set({
      status: 'closed',
      updatedAt: new Date(),
    })
    .where(eq(supportConversations.id, data.conversationId));

  // Get conversation to notify user
  const [conversation] = await db
    .select()
    .from(supportConversations)
    .where(eq(supportConversations.id, data.conversationId))
    .limit(1);

  if (conversation) {
    // Notify user
    io?.to(`user:${conversation.userId}`).emit('conversation_closed', {
      conversationId: data.conversationId,
    });
  }

  // Notify agents
  io?.to('agents').emit('conversation_updated', {
    conversationId: data.conversationId,
    status: 'closed',
  });

  socket.emit('conversation_closed', { conversationId: data.conversationId });
}

/**
 * Handle marking messages as read
 */
async function handleMarkRead(socket: Socket, data: { conversationId: number }) {
  const user = (socket as any).user as SocketUser;
  const db = await getDb();

  if (user.userRole === 'super_admin' || user.userRole === 'admin') {
    // Mark user messages as read by agent
    await db
      .update(supportMessages)
      .set({ readByAgent: true })
      .where(
        and(
          eq(supportMessages.conversationId, data.conversationId),
          eq(supportMessages.senderType, 'user')
        )
      );
  } else {
    // Mark agent/bot messages as read by user
    await db
      .update(supportMessages)
      .set({ readByUser: true })
      .where(
        and(
          eq(supportMessages.conversationId, data.conversationId),
          eq(supportMessages.readByUser, false)
        )
      );
  }
}

/**
 * Get Socket.IO instance
 */
export function getIO(): SocketIOServer | null {
  return io;
}

/**
 * Cleanup on server shutdown
 */
export async function cleanupSocketIO() {
  if (pubClient) await pubClient.quit();
  if (subClient) await subClient.quit();
  if (io) io.close();
  console.log('[Socket.IO] Cleaned up');
}
