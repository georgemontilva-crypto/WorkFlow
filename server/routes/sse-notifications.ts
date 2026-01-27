/**
 * SSE (Server-Sent Events) endpoint for real-time notifications
 * Clients connect to /api/notifications/stream and receive instant updates via Redis Pub/Sub
 */

import { Request, Response } from 'express';
import { notificationsRealtimeService, NotificationEvent } from '../services/notificationsRealtimeService';
import { verifyToken } from '../_core/auth';

/**
 * SSE endpoint - Keeps connection open and streams notifications
 * GET /api/notifications/stream
 */
export async function handleSSENotifications(req: Request, res: Response) {
  // Extract token from cookies (since EventSource can't send custom headers)
  const token = req.cookies?.auth_token;
  
  if (!token) {
    console.error('[SSE] No auth token in cookies');
    res.status(401).json({ error: 'Unauthorized - No token' });
    return;
  }
  
  try {
    // Verify JWT token from cookie
    const decoded = await verifyToken(token);
    const userId = decoded.userId;

    console.log(`[SSE] Client connected: user ${userId}`);

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

    // Send initial connection message
    res.write(`data: ${JSON.stringify({ type: 'connected', userId })}\n\n`);

    // Subscribe to Redis channel for this user
    const unsubscribe = await notificationsRealtimeService.subscribeToUser(
      userId,
      (event: NotificationEvent) => {
        console.log(`[SSE] Sending event to user ${userId}:`, event.type);
        
        // Send event to client
        res.write(`data: ${JSON.stringify(event)}\n\n`);
      }
    );

    // Send heartbeat every 30 seconds to keep connection alive
    const heartbeatInterval = setInterval(() => {
      res.write(`: heartbeat\n\n`);
    }, 30000);

    // Handle client disconnect
    req.on('close', async () => {
      console.log(`[SSE] Client disconnected: user ${userId}`);
      clearInterval(heartbeatInterval);
      await unsubscribe();
    });

  } catch (error: any) {
    console.error('[SSE] Authentication error:', error.message);
    res.status(401).json({ error: 'Invalid token' });
  }
}
