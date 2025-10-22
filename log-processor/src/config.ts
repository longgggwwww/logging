import * as dotenv from "dotenv";
import { Config } from "./types.js";

// Load environment variables
dotenv.config();

// ============================================
// CONFIGURATION
// ============================================
export const CONFIG: Config = {
  kafka: {
    clientId: process.env.KAFKA_CLIENT_ID || "log-processor",
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
    groupId: process.env.KAFKA_GROUP_ID || "log-processor-group",
    sessionTimeout: 30000,
    heartbeatInterval: 3000,
    maxWaitTimeInMs: 5000,
  },
  topic: process.env.KAFKA_TOPIC || "error-logs",
};
