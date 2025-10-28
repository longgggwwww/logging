import { Config } from "./types.js";

// ============================================
// CONFIGURATION
// ============================================
export const CONFIG: Config = {
  kafka: {
    clientId: "log-processor",
    brokers: (
      process.env.KAFKA_BROKERS ||
      "localhost:19092,localhost:29092,localhost:39092"
    ).split(","),
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
    main: process.env.KAFKA_MAIN_TOPIC || "error-logs",
    deadLetter: process.env.KAFKA_DLQ_TOPIC || "error-logs-dlq",
    retry: process.env.KAFKA_RETRY_TOPIC || "error-logs-retry",
  },
  maxRetries: 3,
};
