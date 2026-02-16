import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import { startRecurringInvoicesScheduler } from "./_core/recurring-invoices-job.js";
import { startOverdueInvoicesScheduler } from "./_core/overdue-invoices-job.js";
import { startProactiveAIScheduler } from "./_core/proactive-ai-job.js";
import { testRedisConnection } from "./config/redis.js";
import { initializeSocketIO } from "./services/socketService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Serve uploaded files (payment receipts, etc.)
  const uploadsPath = path.resolve(process.cwd(), "uploads");
  app.use("/uploads", express.static(uploadsPath));
  console.log(`[Server] Serving uploads from: ${uploadsPath}`);

  // Serve static files from dist/public in production
  const staticPath =
    process.env.NODE_ENV === "production"
      ? path.resolve(__dirname, "public")
      : path.resolve(__dirname, "..", "dist", "public");

  app.use(express.static(staticPath));

  // Handle client-side routing - serve index.html for all routes
  app.get("*", (_req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });

  const port = process.env.PORT || 3000;

  // Initialize Socket.IO for real-time support chat
  initializeSocketIO(server);
  console.log('[Server] Socket.IO initialized for support chat');

  server.listen(port, async () => {
    console.log(`Server running on http://localhost:${port}/`);
    
    // Test Redis connection
    console.log('[Server] Testing Redis connection...');
    const redisConnected = await testRedisConnection();
    
    if (!redisConnected) {
      console.error('[Server] ⚠️  WARNING: Redis connection failed!');
      console.error('[Server] ⚠️  Reminders will NOT work without Redis.');
      console.error('[Server] 💡 Please configure REDIS_URL in Railway environment variables.');
    }
    
    // Start recurring invoices scheduler
    startRecurringInvoicesScheduler();
    
    // Start overdue invoices scheduler
    startOverdueInvoicesScheduler();
    
    // Initialize Bull Queue workers
    // This starts processing jobs from the queues
    if (redisConnected) {
      // Reminder worker
      import("./workers/reminder-worker.js").then(() => {
        console.log('[Server] ✅ Reminder worker initialized');
      }).catch((err) => {
        console.error('[Server] ❌ Failed to initialize reminder worker:', err);
      });
      
      // Price alerts worker and scheduler
      Promise.all([
        import("./workers/priceAlertsWorker.js"),
        import("./queues/price-alerts-queue.js")
      ]).then(([worker, queue]) => {
        worker.initializePriceAlertsWorker();
        queue.initializePriceAlertsScheduler();
        console.log('[Server] ✅ Price alerts worker and scheduler initialized');
      }).catch((err) => {
        console.error('[Server] ❌ Failed to initialize price alerts worker:', err);
      });
      
      // Alerts processor worker (processes events from Redis queue)
      import("./workers/alertsProcessorWorker.js").then((worker) => {
        worker.initializeAlertsProcessorWorker();
        console.log('[Server] ✅ Alerts processor worker initialized');
      }).catch((err) => {
        console.error('[Server] ❌ Failed to initialize alerts processor worker:', err);
      });
      
      // Proactive AI scheduler (generates insights based on financial data)
      startProactiveAIScheduler();
      console.log('[Server] ✅ Proactive AI scheduler initialized');
    } else {
      console.log('[Server] ⏭️  Skipping workers initialization (Redis not available)');
    }
  });
}

startServer().catch(console.error);
