import express from "express";

import { connectDatabase, disconnectDatabase } from "./db.js";
import { setupMiddleware } from "./middleware.js";
import { healthRouter } from "./routes/health.js";
import { functionsRouter } from "./routes/functions.js";
import { logsRouter } from "./routes/logs.js";
import { projectsRouter } from "./routes/projects.js";
import { statsRouter } from "./routes/stats.js";
import { connectRedis, disconnectRedis } from "./redis.js";

const app = express();

// Setup middleware
setupMiddleware(app);

// Setup routes
app.use(logsRouter);
app.use(projectsRouter);
app.use(functionsRouter);
app.use(statsRouter);
app.use(healthRouter);

// Graceful shutdown
export async function shutdown(): Promise<void> {
  console.log("⏳ Shutting down gracefully...");
  try {
    await disconnectRedis();
    await disconnectDatabase();
    console.log("✅ Redis client disconnected");
    console.log("✅ Mongoose disconnected");
    process.exit(0);
  } catch (error: any) {
    console.error("❌ Error during shutdown:", error);
    process.exit(1);
  }
}

// Initialize connections
export async function initializeServer(): Promise<void> {
  await connectRedis();
  await connectDatabase();
}

export { app };
