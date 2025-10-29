import { createClient } from "redis";

import { CONFIG } from "./config.js";

export const redisClient = createClient({
  url: CONFIG.redisUrl,
});

redisClient.on("error", (err: Error) =>
  console.error("❌ Redis Client Error", err),
);
redisClient.on("connect", () => console.log("✅ Redis Client Connected"));
redisClient.on("ready", () => console.log("✅ Redis Client Ready"));
redisClient.on("end", () => {
  console.log("⚠️ Redis Client disconnected, attempting reconnect...");
  setTimeout(() => redisClient.connect().catch(console.error), 5000);
});

export const redisSubscriber = createClient({
  url: CONFIG.redisUrl,
});

redisSubscriber.on("error", (err: Error) =>
  console.error("❌ Redis Subscriber Error", err),
);
redisSubscriber.on("connect", () => console.log("✅ Redis Subscriber Connected"));
redisSubscriber.on("ready", () => console.log("✅ Redis Subscriber Ready"));
redisSubscriber.on("end", () => {
  console.log("⚠️ Redis Subscriber disconnected, attempting reconnect...");
  setTimeout(() => redisSubscriber.connect().catch(console.error), 5000);
});

export async function connectRedis(): Promise<void> {
  await redisClient.connect();
  await redisSubscriber.connect();
}

export async function disconnectRedis(): Promise<void> {
  await redisClient.quit();
  await redisSubscriber.quit();
}
