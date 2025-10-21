import { producer } from './kafka.js';
import { CONFIG } from './config.js';
import { LogData, MessageMetadata } from './types.js';

export const sendToRetryQueue = async (
  originalMessage: LogData,
  metadata: MessageMetadata,
  attemptCount: number
): Promise<boolean> => {
  try {
    const retryMessage: LogData = {
      ...originalMessage,
      _retry: {
        attemptCount: attemptCount + 1,
        lastAttempt: new Date().toISOString(),
        nextRetryAfter:
          Date.now() + CONFIG.processing.retryDelay * attemptCount,
      },
    };

    await producer.send({
      topic: CONFIG.topics.retry,
      messages: [
        {
          key: `retry-${metadata.offset}`,
          value: JSON.stringify(retryMessage),
          headers: {
            'retry-count': String(attemptCount + 1),
            'original-topic': metadata.topic,
          },
        },
      ],
    });

    console.log(
      `🔄 Message sent to retry queue (attempt ${
        attemptCount + 1
      }/${CONFIG.processing.maxRetries})`
    );
    return true;
  } catch (retryError: any) {
    console.error('❌ Failed to send to retry queue:', retryError.message);
    return false;
  }
};
