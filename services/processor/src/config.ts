import { Config } from "./types.js";

// ============================================
// CONFIGURATION
// ============================================
export const CONFIG: Config = {
  kafka: {
    clientId: "log-processor",
    brokers: (process.env.KAFKA_BROKERS || "kafka-1,kafka-2,kafka-3").split(","),
    connectionTimeout: 30000,
    requestTimeout: 30000,
    retry: {
      initialRetryTime: 300,
      retries: 8,
    },
  },
  consumer: {
    groupId: "log-processor-group",
    sessionTimeout: 30000,
    heartbeatInterval: 3000,
    maxWaitTimeInMs: 5000,
  },
  topics: {
    main: "logs",
    dlq: "logs-dlq",
    retry: "logs-retry",
  },
  maxRetries: 3,
  database: {
    url: process.env.MONGO_URL || "mongodb://admin:123456@mongodb:27017/logs?authSource=admin",
  },
  redis: {
    url: process.env.REDIS_URL || "redis://redis:6379",
  },
};
