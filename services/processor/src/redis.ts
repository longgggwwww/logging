import { createClient } from "redis";
import { CONFIG } from "./config.js";

export const redisPublisher = createClient({
  url: CONFIG.redis.url,
});

redisPublisher.on("error", (err: Error) =>
  console.error("❌ Redis Publisher Error", err),
);
redisPublisher.on("connect", () => console.log("✅ Redis Publisher Connected"));
redisPublisher.on("ready", () => console.log("✅ Redis Publisher Ready"));
redisPublisher.on("end", () => {
  console.log("⚠️ Redis Publisher disconnected, attempting reconnect...");
  setTimeout(() => redisPublisher.connect().catch(console.error), 5000);
});

export async function connectRedis(): Promise<void> {
  await redisPublisher.connect();
}

export async function disconnectRedis(): Promise<void> {
  await redisPublisher.quit();
}

export async function publishInvalidateLogs(projectId: string, functionId: string): Promise<void> {
  const message = JSON.stringify({ projectId, functionId });
  const maxRetries = 3;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      await redisPublisher.publish("invalidate:logs", message);
      console.log(`📤 Published cache invalidation for project ${projectId}, function ${functionId}`);
      return;
    } catch (error) {
      attempt++;
      console.error(`❌ Failed to publish cache invalidation (attempt ${attempt}/${maxRetries}):`, error);
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
      }
    }
  }
  console.error(`❌ Failed to publish cache invalidation after ${maxRetries} attempts`);
}