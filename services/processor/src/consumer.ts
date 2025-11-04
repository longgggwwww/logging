import {
  consumer,
  producer,
  connectConsumer,
  subscribeToTopic,
} from "./kafka.js";
import { CONFIG } from "./config.js";
import { processLogMessage } from "./processor.js";

// ============================================
// KAFKA CONSUMER RUNNER
// ============================================
export const runConsumer = async (): Promise<void> => {
  await connectConsumer();
  await producer.connect();
  console.log("✅ Producer connected");

  // Wait for metadata to sync
  await new Promise((resolve) => setTimeout(resolve, 2000));

  await subscribeToTopic();

  // Run consumer with message handler
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
        await handleMessageError(message, error);
      }
    },
  });

  console.log("🚀 Log processor service is running...");
  console.log(
    `👂 Listening for messages on topics: ${CONFIG.topics.main}, ${CONFIG.topics.retry}`,
  );
};

// ============================================
// ERROR HANDLER WITH RETRY LOGIC
// ============================================
async function handleMessageError(message: any, error: unknown): Promise<void> {
  console.error("❌ Failed to process message:", error);
  const err = error as Error;
  console.error("Error details:", err.message);
  console.error("Error stack:", err.stack);

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
      console.log(`🔄 Sent message to retry topic (attempt ${attemptCount})`);
    } else {
      // Send to DLQ
      await producer.send({
        topic: CONFIG.topics.dlq,
        messages: [{ value: JSON.stringify(logData) }],
      });
      console.log(`🗑️ Sent message to DLQ after ${attemptCount} attempts`);
    }
  } catch (retryError) {
    console.error("❌ Failed to send to retry/DLQ:", retryError);
  }
}
