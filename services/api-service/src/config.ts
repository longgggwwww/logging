// Configuration constants
export const CONFIG = {
  port: parseInt(process.env.PORT || "3000", 10),
  redisUrl: process.env.REDIS_URL || "redis://localhost:6379",
  cacheTtl: 300, // 5 minutes
  defaultTake: 50,
  maxTake: 1000,
} as const;
