import { createClient } from "redis";

import { CONFIG } from "./config.js";

export const redisClient = createClient({
  url: CONFIG.redisUrl,
});

redisClient.on("error", (err: Error) =>
  console.error("❌ Redis Client Error", err),
);
redisClient.on("connect", () => console.log("✅ Redis Client Connected"));

export async function connectRedis(): Promise<void> {
  await redisClient.connect();
}

export async function disconnectRedis(): Promise<void> {
  await redisClient.quit();
}
