import { producer, disconnectConsumer } from "./kafka.js";
import { CONFIG } from "./config.js";
import { runConsumer } from "./consumer.js";
import { connectDatabase, disconnectDatabase } from "./db.js";
import { connectRedis, disconnectRedis } from "./redis.js";

// ============================================
// GRACEFUL SHUTDOWN
// ============================================
const shutdown = async (): Promise<void> => {
  console.log("⏳ Shutting down gracefully...");
  try {
    await disconnectConsumer();
    await producer.disconnect();
    await disconnectDatabase();
    await disconnectRedis();
    console.log("✅ Cleanup completed");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error during shutdown:", error);
    process.exit(1);
  }
};

// ============================================
// MAIN FUNCTION
// ============================================
const start = async (): Promise<void> => {
  try {
    await connectDatabase();
    await connectRedis();
    await runConsumer();
  } catch (error: any) {
    console.error("❌ Error starting consumer:", error);
    console.error("Error details:", error.message);

    if (error.type === "UNKNOWN_TOPIC_OR_PARTITION") {
      console.error(
        `\n💡 Topics "${CONFIG.topics.main}", "${CONFIG.topics.retry}" might not exist or are not ready.`,
      );
      console.error("Please ensure the topics exist by running:");
      console.error(`docker exec kafka-1 /opt/kafka/bin/kafka-topics.sh \\`);
      console.error(`  --bootstrap-server localhost:9092 \\`);
      console.error(`  --create --if-not-exists \\`);
      console.error(`  --topic ${CONFIG.topics.main} \\`);
      console.error(`  --partitions 3 \\`);
      console.error(`  --replication-factor 3`);
    }

    console.error("\n⏳ Retrying in 10 seconds...");
    setTimeout(() => start(), 10000);
  }
};

// ============================================
// SIGNAL HANDLERS
// ============================================
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

start();
