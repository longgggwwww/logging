import { producer } from './kafka.js';
import { CONFIG } from './config.js';
import { metrics } from './metrics.js';
import { MessageMetadata } from './types.js';

// ============================================
// DEAD LETTER QUEUE (DLQ)
// ============================================
export const sendToDLQ = async (
  originalMessage: string,
  error: Error,
  metadata: MessageMetadata
): Promise<boolean> => {
  try {
    const dlqMessage = {
      originalTopic: metadata.topic,
      originalPartition: metadata.partition,
      originalOffset: metadata.offset,
      error: {
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
      },
      originalData: originalMessage,
      attemptCount: metadata.attemptCount || 0,
      lastAttemptTime: new Date().toISOString(),
    };

    await producer.send({
      topic: CONFIG.topics.deadLetter,
      messages: [
        {
          key: `dlq-${metadata.offset}`,
          value: JSON.stringify(dlqMessage),
          headers: {
            'original-topic': metadata.topic,
            'error-type': error.name,
            'failed-at': new Date().toISOString(),
          },
        },
      ],
    });

    metrics.sentToDLQ++;
    console.log(`⚰️  Message sent to DLQ: ${CONFIG.topics.deadLetter}`);
    return true;
  } catch (dlqError) {
    console.error(
      '❌ CRITICAL: Failed to send to DLQ:',
      (dlqError as Error).message
    );
    return false;
  }
};
