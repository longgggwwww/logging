import { CONFIG } from './config.js';
import { LogData, MessageMetadata } from './types.js';
import { metrics } from './metrics.js';
import { sendToDiscord, sleep } from './discord.js';
import { sendToDLQ } from './dlq.js';
import { sendToRetryQueue } from './retry.js';

export const processMessage = async ({
  topic,
  partition,
  message,
}: {
  topic: string;
  partition: number;
  message: any;
}): Promise<void> => {
  const metadata: MessageMetadata = {
    topic,
    partition,
    offset: message.offset,
    timestamp: message.timestamp,
  };

  let logData: LogData = {};
  let attemptCount = 0;

  try {
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

    // Validate message structure theo cấu trúc mới
    if (!logData.projectName) {
      console.warn('⚠️  Warning: Message missing "projectName" field');
      logData.projectName = 'Unknown';
    }
    if (!logData.function) {
      console.warn('⚠️  Warning: Message missing "function" field');
      logData.function = 'Unknown';
    }
    if (!logData.method) {
      console.warn('⚠️  Warning: Message missing "method" field');
      logData.method = 'UNKNOWN';
    }
    if (!logData.type) {
      console.warn(
        '⚠️  Warning: Message missing "type" field, defaulting to ERROR'
      );
      logData.type = 'ERROR';
    }
    if (!logData.createdAt) {
      console.warn('⚠️  Warning: Message missing "createdAt" field');
      logData.createdAt = new Date().toISOString();
    }
    if (logData.latency === undefined) {
      console.warn('⚠️  Warning: Message missing "latency" field');
      logData.latency = 0;
    }

    // Metadata cho tracking
    const discordMetadata = {
      partition,
      offset: message.offset,
    };

    // Send to Discord with retry
    await sendToDiscord(logData, discordMetadata);

    metrics.processed++;
    if (attemptCount > 0) {
      metrics.retriedSuccessfully++;
    }
  } catch (error: any) {
    metrics.failed++;
    console.error(
      `❌ Error processing message (attempt ${attemptCount + 1}):`,
      error.message
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
        await sendToDLQ(message.value.toString(), error, {
          ...metadata,
          attemptCount,
        });
      }
    } else {
      // Max retries reached, send to DLQ
      console.error(
        `❌ Max retries (${CONFIG.processing.maxRetries}) reached for message`
      );
      await sendToDLQ(message.value.toString(), error, {
        ...metadata,
        attemptCount,
      });
    }

    // Don't throw error to prevent consumer from crashing
    // Message offset will be committed, preventing reprocessing
  }
};
