import { app } from "./app.js";
import { connectDatabase, disconnectDatabase } from "./db.js";
import {
  connectRedis,
  disconnectRedis,
  redisSubscriber,
  redisClient,
} from "./redis.js";
import {
  invalidateLogsCache,
  invalidateProjectsCache,
  invalidateFunctionsCache,
} from "./utils.js";

// ============================================
// SERVER INITIALIZATION
// ============================================
export async function initializeServer(): Promise<void> {
  await connectRedis();
  await connectDatabase();

  // Setup cache invalidation subscriber for logs
  await redisSubscriber.subscribe(
    "invalidate:logs",
    async (message: string) => {
      console.log(`📨 Received logs cache invalidation message: ${message}`);
      try {
        const { projectId, functionId } = JSON.parse(message);
        await invalidateLogsCache(redisClient, projectId, functionId);
      } catch (error) {
        console.error("❌ Error handling logs cache invalidation:", error);
      }
    },
  );
  console.log("✅ Logs cache invalidation subscriber setup");

  // Setup cache invalidation subscriber for projects
  await redisSubscriber.subscribe(
    "invalidate:projects",
    async (message: string) => {
      console.log(
        `📨 Received projects cache invalidation message: ${message}`,
      );
      try {
        const { projectId } = JSON.parse(message);
        await invalidateProjectsCache(redisClient, projectId);
      } catch (error) {
        console.error("❌ Error handling projects cache invalidation:", error);
      }
    },
  );
  console.log("✅ Projects cache invalidation subscriber setup");

  // Setup cache invalidation subscriber for functions
  await redisSubscriber.subscribe(
    "invalidate:functions",
    async (message: string) => {
      console.log(
        `📨 Received functions cache invalidation message: ${message}`,
      );
      try {
        const { projectId, functionId } = JSON.parse(message);
        await invalidateFunctionsCache(redisClient, projectId, functionId);
      } catch (error) {
        console.error("❌ Error handling functions cache invalidation:", error);
      }
    },
  );
  console.log("✅ Functions cache invalidation subscriber setup");
}

// ============================================
// GRACEFUL SHUTDOWN
// ============================================
export async function shutdown(): Promise<void> {
  console.log("⏳ Shutting down gracefully...");
  try {
    await disconnectRedis();
    await disconnectDatabase();
    console.log("✅ Cleanup completed");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error during shutdown:", err);
    process.exit(1);
  }
}

export { app };
