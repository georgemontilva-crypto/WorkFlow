import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import { startRecurringInvoicesScheduler } from "./_core/recurring-invoices-job.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const server = createServer(app);

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

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
    
    // Start recurring invoices scheduler
    startRecurringInvoicesScheduler();
    
    // Initialize Bull Queue worker for reminders
    // This starts processing jobs from the queue
    import("./workers/reminder-worker.js").then(() => {
      console.log('[Server] Reminder worker initialized');
    }).catch((err) => {
      console.error('[Server] Failed to initialize reminder worker:', err);
    });
  });
}

startServer().catch(console.error);
