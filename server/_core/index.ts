import "dotenv/config";
import express from "express";
import path from "path";
import { createServer } from "http";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { testRedisConnection } from "../config/redis";
import { runMigrations } from "../migrate";

async function startServer() {
  // Run database migrations first
  try {
    await runMigrations();
  } catch (error) {
    console.error('[Server] Failed to run migrations, continuing anyway...');
  }
  
  const app = express();
  const server = createServer(app);
  
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  
  // Force HTTPS in production (Railway)
  if (process.env.NODE_ENV === "production") {
    app.use((req, res, next) => {
      // Railway uses x-forwarded-proto header to indicate the original protocol
      if (req.header('x-forwarded-proto') !== 'https') {
        return res.redirect(301, `https://${req.header('host')}${req.url}`);
      }
      next();
    });
  }
  
  // OAuth callback under /api/oauth/callback (disabled - using JWT auth instead)
  // registerOAuthRoutes(app);
  
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  
  // Serve uploaded files (payment receipts, etc.)
  const uploadsPath = path.join(process.cwd(), 'uploads');
  app.use('/uploads', express.static(uploadsPath));
  console.log('[Server] Serving uploads from:', uploadsPath);
  
  // SSE endpoint for real-time notifications
  app.get("/api/notifications/stream", async (req, res) => {
    // Verify authentication (read token from cookie since it's HTTP-only)
    const token = req.cookies?.auth_token;
    if (!token) {
      console.log('[SSE] No auth token found in cookies');
      return res.status(401).json({ error: 'Unauthorized - No auth token' });
    }
    
    try {
      // Verify JWT token
      const { verifyToken } = await import('./auth');
      const payload = await verifyToken(token);
      const userId = payload.userId;
      
      console.log(`[SSE] Token verified for user: ${userId}`);
      
      // Set SSE headers
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering
      
      // Send initial connection message
      res.write(`data: ${JSON.stringify({ type: 'connected', timestamp: Date.now() })}\n\n`);
      
      // Subscribe to user's notifications via Redis
      const { notificationsRealtimeService } = await import('../services/notificationsRealtimeService');
      const unsubscribe = await notificationsRealtimeService.subscribeToUser(userId, (event) => {
        // Send notification event to client
        res.write(`data: ${JSON.stringify(event)}\n\n`);
      });
      
      console.log(`[SSE] Client connected: user ${userId}`);
      
      // Send heartbeat every 30 seconds to keep connection alive
      const heartbeat = setInterval(() => {
        res.write(`:heartbeat\n\n`);
      }, 30000);
      
      // Clean up on disconnect
      req.on('close', () => {
        clearInterval(heartbeat);
        unsubscribe();
        console.log(`[SSE] Client disconnected: user ${userId}`);
      });
    } catch (error: any) {
      console.error('[SSE] Authentication error:', error.message);
      return res.status(401).json({ error: 'Invalid token' });
    }
  });
  
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Railway provides PORT environment variable
  // In production (Railway), use the provided PORT
  // In development, default to 3000
  const port = parseInt(process.env.PORT || "3000");
  
  // Listen on 0.0.0.0 to accept connections from Railway's proxy
  server.listen(port, "0.0.0.0", () => {
    console.log(`Server running on port ${port}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
    console.log('[Server] ✅ Simplified mode: Only auth and clients modules active');
    
    // Test Redis connection (for auth password reset)
    testRedisConnection().then((connected) => {
      if (connected) {
        console.log('[Server] ✅ Redis connected (for auth)');
      } else {
        console.error('[Server] ⚠️  WARNING: Redis connection failed!');
        console.error('[Server] ⚠️  Password reset will NOT work without Redis.');
      }
    }).catch((err) => {
      console.error('[Server] ❌ Failed to test Redis connection:', err);
    });
  });
}

startServer().catch(console.error);
