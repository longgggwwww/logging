import { sendFCMNotification } from './fcm.js';
import { metrics } from './metrics.js';

// ============================================
// MESSAGE PROCESSOR
// ============================================
export const processMessage = async ({
  topic: _topic,
  partition,
  message,
}: {
  topic: string;
  partition: number;
  message: { offset: string; value: Buffer | null; timestamp?: string };
}) => {
  const startTime = Date.now();

  try {
    // Check if message value exists
    if (!message.value) {
      console.warn('⚠️  Received message with null value, skipping');
      metrics.failed++;
      return;
    }

    // Parse message
    const rawMessage = message.value.toString();
    const logData = JSON.parse(rawMessage);

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

    // Send FCM notification (no retry, realtime mode)
    await sendFCMNotification(logData, fcmMetadata);

    metrics.processed++;
    console.log(
      `✅ Message processed successfully (${Date.now() - startTime}ms)`
    );
  } catch (error) {
    metrics.failed++;
    const processingTime = Date.now() - startTime;
    console.error(
      `❌ Error processing message (${processingTime}ms):`,
      (error as Error).message
    );

    // Realtime mode: Don't retry or send to DLQ, just skip failed messages
    // Message offset will be committed, preventing reprocessing
  }
};
