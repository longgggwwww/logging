import { sendFCMNotification } from './fcm.js';
import { metrics } from './metrics.js';
import { sendToRetryQueue } from './retry-queue.js';
import { sendToDLQ } from './dlq.js';
import { sleep } from './retry.js';
import { CONFIG } from './config.js';

// ============================================
// MESSAGE PROCESSOR
// ============================================
export const processMessage = async ({
  topic,
  partition,
  message,
}: {
  topic: string;
  partition: number;
  message: { offset: string; value: Buffer | null; timestamp?: string };
}) => {
  const metadata = {
    topic,
    partition,
    offset: message.offset,
    timestamp: message.timestamp,
  };

  let logData;
  let attemptCount = 0;

  try {
    // Check if message value exists
    if (!message.value) {
      console.warn('⚠️  Received message with null value, skipping');
      return;
    }

    // Parse message
    const rawMessage = message.value.toString();
    logData = JSON.parse(rawMessage);

    // Check if this is a retry message
    if (logData._retry) {
      attemptCount = logData._retry.attemptCount || 0;
      console.log(`🔄 Processing retry message (attempt ${attemptCount})`);

      // Check if we should delay processing
      if (
        logData._retry.nextRetryAfter &&
        Date.now() < logData._retry.nextRetryAfter
      ) {
        const delay = logData._retry.nextRetryAfter - Date.now();
        console.log(`⏸️  Delaying retry for ${delay}ms`);
        await sleep(delay);
      }
    }

    // Validate message structure according to new structure
    if (!logData.projectName) {
      console.warn('⚠️  Warning: Message missing "projectName" field');
      logData.projectName = 'Unknown';
    }
    if (!logData.function) {
      console.warn('⚠️  Warning: Message missing "function" field');
    }
    if (!logData.type) {
      console.warn(
        '⚠️  Warning: Message missing "type" field, defaulting to ERROR'
      );
      logData.type = 'ERROR';
    }
    if (!logData.method) {
      console.warn('⚠️  Warning: Message missing "method" field');
    }
    if (!logData.createdAt) {
      console.warn('⚠️  Warning: Message missing "createdAt" field');
      logData.createdAt = new Date().toISOString();
    }

    // Metadata for tracking
    const fcmMetadata = {
      partition,
      offset: message.offset,
    };

    // Send FCM notification with retry
    await sendFCMNotification(logData, fcmMetadata);

    metrics.processed++;
    if (attemptCount > 0) {
      metrics.retriedSuccessfully++;
    }
  } catch (error) {
    metrics.failed++;
    console.error(
      `❌ Error processing message (attempt ${attemptCount + 1}):`,
      (error as Error).message
    );

    // Decide what to do based on error type and retry count
    if (attemptCount < CONFIG.processing.maxRetries) {
      // Send to retry queue
      const retrySent = await sendToRetryQueue(
        logData || {},
        metadata,
        attemptCount
      );
      if (!retrySent) {
        // If retry queue fails, send to DLQ
        await sendToDLQ(message.value!.toString(), error as Error, {
          ...metadata,
          attemptCount,
        });
      }
    } else {
      // Max retries reached, send to DLQ
      console.error(
        `❌ Max retries (${CONFIG.processing.maxRetries}) reached for message`
      );
      await sendToDLQ(message.value!.toString(), error as Error, {
        ...metadata,
        attemptCount,
      });
    }

    // Don't throw error to prevent consumer from crashing
    // Message offset will be committed, preventing reprocessing
  }
};
