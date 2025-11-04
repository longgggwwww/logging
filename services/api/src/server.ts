import { app } from "./app.js";
import { connectDatabase, disconnectDatabase } from "./db.js";
import {
  connectRedis,
  disconnectRedis,
  redisSubscriber,
  redisClient,
} from "./redis.js";
import { invalidateLogsCache } from "./utils.js";

// ============================================
// SERVER INITIALIZATION
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
