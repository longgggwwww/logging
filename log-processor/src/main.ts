import {
  consumer,
  connectConsumer,
  subscribeToTopic,
  disconnectConsumer,
} from "./kafka.js";
import { CONFIG } from "./config.js";
import { processLogMessage } from "./processor.js";
import { connectDatabase, disconnectDatabase } from "./db.js";

// ============================================
// GRACEFUL SHUTDOWN
// ============================================
export const shutdown = async (): Promise<void> => {
  console.log("⏳ Shutting down gracefully...");
  try {
    await disconnectConsumer();
    await disconnectDatabase();
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

    // Connect to Kafka
    await connectConsumer();

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
          // Could implement retry logic or send to another DLQ here
        }
      },
    });

    console.log("🚀 Log processor service is running...");
    console.log(`👂 Listening for messages on topic: ${CONFIG.topic}`);
  } catch (error: any) {
    console.error("❌ Error starting consumer:", error);
    console.error("Error details:", error.message);

    if (error.type === "UNKNOWN_TOPIC_OR_PARTITION") {
      console.error(
        `\n💡 Topic "${CONFIG.topic}" might not exist or is not ready.`,
      );
      console.error("Please ensure the topic exists by running:");
      console.error(
        `docker exec kafka-controller-1 /opt/kafka/bin/kafka-topics.sh \\`,
      );
      console.error(`  --bootstrap-server localhost:9092 \\`);
      console.error(`  --create --if-not-exists \\`);
      console.error(`  --topic ${CONFIG.topic} \\`);
      console.error(`  --partitions 3 \\`);
      console.error(`  --replication-factor 3`);
    }

    console.error("\n⏳ Retrying in 10 seconds...");
    setTimeout(() => {
      run();
    }, 10000);
  }
};
