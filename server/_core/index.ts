import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { testRedisConnection } from "../config/redis";

async function startServer() {
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
