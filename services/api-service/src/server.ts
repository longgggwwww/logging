import express from "express";

import { connectDatabase, disconnectDatabase } from "./db.js";
import { setupMiddleware } from "./middleware.js";
import { healthRouter } from "./routes/health.js";
import { functionsRouter } from "./routes/functions.js";
import { logsRouter } from "./routes/logs.js";
import { projectsRouter } from "./routes/projects.js";
import { statsRouter } from "./routes/stats.js";
import {
  connectRedis,
  disconnectRedis,
  redisSubscriber,
  redisClient,
} from "./redis.js";
import { invalidateLogsCache } from "./utils.js";
import { keycloak } from "./keycloak.js";

// ============================================
// APP INITIALIZATION
// ============================================
const app = express();

// ============================================
// MIDDLEWARE
// ============================================
setupMiddleware(app);

// Protect all /v1 routes with Keycloak (bearer-only tokens)
app.use("/v1", keycloak.protect());

// ============================================
// ROUTES
// ============================================
app.use(logsRouter);
app.use(projectsRouter);
app.use(functionsRouter);
app.use(statsRouter);
app.use(healthRouter);

// ============================================
// GRACEFUL SHUTDOWN
// ============================================
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

// ============================================
// CONNECTIONS
// ============================================
export async function initializeServer(): Promise<void> {
  await connectRedis();
  await connectDatabase();

  // Setup cache invalidation subscriber
  await redisSubscriber.subscribe(
    "invalidate:logs",
    async (message: string) => {
      console.log(`📨 Received cache invalidation message: ${message}`);
      try {
        const { projectId, functionId } = JSON.parse(message);
        await invalidateLogsCache(redisClient, projectId, functionId);
      } catch (error) {
        console.error("❌ Error handling cache invalidation:", error);
      }
    },
  );
  console.log("✅ Cache invalidation subscriber setup");
}

export { app };
