import {
  consumer,
  producer,
  connectConsumer,
  subscribeToTopic,
  disconnectConsumer,
} from "./kafka.js";
import { CONFIG } from "./config.js";
import { processLogMessage } from "./processor.js";
import { connectDatabase, disconnectDatabase } from "./db.js";
import { connectRedis, disconnectRedis } from "./redis.js";

// ============================================
// GRACEFUL SHUTDOWN
// ============================================
export const shutdown = async (): Promise<void> => {
  console.log("⏳ Shutting down gracefully...");
  try {
    await disconnectConsumer();
    await producer.disconnect();
    await disconnectDatabase();
    await disconnectRedis();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error during shutdown:", error);
    process.exit(1);
  }
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

// ============================================
// MAIN CONSUMER
// ============================================
export const run = async (): Promise<void> => {
  try {
    // Connect to database first
    await connectDatabase();

    // Connect to Redis
    await connectRedis();

    // Connect to Kafka
    await connectConsumer();
    await producer.connect();
    console.log("✅ Producer connected");

    // Wait a bit for metadata to sync
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Subscribe to topic
    await subscribeToTopic();

    // Run consumer
    await consumer.run({
      autoCommit: true,
      autoCommitInterval: 5000,
      eachMessage: async ({ topic, partition, message }) => {
        console.log(
          `\n📨 Received message from ${topic} [${partition}] at offset ${message.offset}`,
        );
        console.log(
          `📋 Message value: ${message.value ? message.value.toString().substring(0, 100) : "null"}...`,
        );
        try {
          await processLogMessage(message);
        } catch (error) {
          console.error("❌ Failed to process message:", error);
          const err = error as Error;
          console.error("Error details:", err.message);
          console.error("Error stack:", err.stack);

          // Implement retry logic
          try {
            if (!message.value) {
              console.error("❌ Message value is null");
              return;
            }
            const rawMessage = message.value.toString();
            const logData = JSON.parse(rawMessage);
            let attemptCount = logData._retry?.attemptCount || 0;

            attemptCount += 1;

            if (attemptCount <= CONFIG.maxRetries) {
              // Send to retry topic
              logData._retry = { attemptCount };
              await producer.send({
                topic: CONFIG.topics.retry,
                messages: [{ value: JSON.stringify(logData) }],
              });
              console.log(
                `🔄 Sent message to retry topic (attempt ${attemptCount})`,
              );
            } else {
              // Send to DLQ
              await producer.send({
                topic: CONFIG.topics.dlq,
                messages: [{ value: JSON.stringify(logData) }],
              });
              console.log(
                `🗑️ Sent message to DLQ after ${attemptCount} attempts`,
              );
            }
          } catch (retryError) {
            console.error("❌ Failed to send to retry/DLQ:", retryError);
          }
        }
      },
    });

    console.log("🚀 Log processor service is running...");
    console.log(
      `👂 Listening for messages on topics: ${CONFIG.topics.main}, ${CONFIG.topics.retry}`,
    );
  } catch (error: any) {
    console.error("❌ Error starting consumer:", error);
    console.error("Error details:", error.message);

    if (error.type === "UNKNOWN_TOPIC_OR_PARTITION") {
      console.error(
        `\n💡 Topics "${CONFIG.topics.main}", "${CONFIG.topics.retry}" might not exist or are not ready.`,
      );
      console.error("Please ensure the topics exist by running:");
      console.error(
        `docker exec kafka-1 /opt/kafka/bin/kafka-topics.sh \\`,
      );
      console.error(`  --bootstrap-server localhost:9092 \\`);
      console.error(`  --create --if-not-exists \\`);
      console.error(`  --topic ${CONFIG.topics.main} \\`);
      console.error(`  --partitions 3 \\`);
      console.error(`  --replication-factor 3`);
      console.error(
        `  && docker exec kafka-1 /opt/kafka/bin/kafka-topics.sh \\`,
      );
      console.error(`  --bootstrap-server localhost:9092 \\`);
      console.error(`  --create --if-not-exists \\`);
      console.error(`  --topic ${CONFIG.topics.retry} \\`);
      console.error(`  --partitions 3 \\`);
      console.error(`  --replication-factor 3`);
    }

    console.error("\n⏳ Retrying in 10 seconds...");
    setTimeout(() => {
      run();
    }, 10000);
  }
};
