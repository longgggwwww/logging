import { Kafka, logLevel } from "kafkajs";
import { CONFIG } from "./config.js";

// ============================================
// KAFKA SETUP
// ============================================
export const kafka = new Kafka({
  clientId: CONFIG.kafka.clientId,
  brokers: CONFIG.kafka.brokers,
  connectionTimeout: CONFIG.kafka.connectionTimeout,
  requestTimeout: CONFIG.kafka.requestTimeout,
  retry: CONFIG.kafka.retry,
  logCreator:
    () =>
    ({ level, log }) => {
      if (level === logLevel.INFO || level === logLevel.ERROR) {
        console.log(JSON.stringify(log, null, 2)); // Pretty-print JSON
      }
    },
});

export const consumer = kafka.consumer({
  groupId: CONFIG.consumer.groupId,
  sessionTimeout: CONFIG.consumer.sessionTimeout,
  heartbeatInterval: CONFIG.consumer.heartbeatInterval,
  maxWaitTimeInMs: CONFIG.consumer.maxWaitTimeInMs,
});

// ============================================
// KAFKA OPERATIONS
// ============================================
export const connectConsumer = async (): Promise<void> => {
  console.log("🔌 Connecting to Kafka...");
  await consumer.connect();
  console.log("✅ Connected to Kafka");
};

export const subscribeToTopic = async (): Promise<void> => {
  console.log(`📝 Subscribing to topic: ${CONFIG.topic}...`);
  await consumer.subscribe({
    topic: CONFIG.topic,
    fromBeginning: true,
  });
  console.log(`✅ Subscribed to topic: ${CONFIG.topic}`);
  console.log(`🔍 Topic value confirmed: ${CONFIG.topic}`);
};

export const disconnectConsumer = async (): Promise<void> => {
  await consumer.disconnect();
  console.log("✅ Kafka consumer disconnected");
};
