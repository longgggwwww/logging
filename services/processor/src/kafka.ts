import { Kafka } from "kafkajs";
import { conf } from "./config.js";

// ============================================
// KAFKA SETUP
// ============================================
export const kafka = new Kafka({
  clientId: conf.kafka.clientId,
  brokers: conf.kafka.brokers,
  connectionTimeout: conf.kafka.connectionTimeout,
  requestTimeout: conf.kafka.requestTimeout,
  retry: conf.kafka.retry,
});

export const consumer = kafka.consumer({
  groupId: conf.consumer.groupId,
  sessionTimeout: conf.consumer.sessionTimeout,
  heartbeatInterval: conf.consumer.heartbeatInterval,
  maxWaitTimeInMs: conf.consumer.maxWaitTimeInMs,
});

export const producer = kafka.producer({
  allowAutoTopicCreation: true,
  transactionTimeout: 30000,
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
  console.log(
    `📝 Subscribing to topics: ${conf.topics.main}, ${conf.topics.retry}...`,
  );
  await consumer.subscribe({
    topics: [conf.topics.main, conf.topics.retry],
    fromBeginning: false,
  });
  console.log(
    `✅ Subscribed to topics: ${conf.topics.main}, ${conf.topics.retry}`,
  );
};

export const disconnectConsumer = async (): Promise<void> => {
  await consumer.disconnect();
  console.log("✅ Kafka consumer disconnected");
};
