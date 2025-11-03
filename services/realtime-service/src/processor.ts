import { EachMessagePayload } from 'kafkajs';
import { LogMessage } from './types.js';
import { broadcastLog } from './socket.js';
import { metrics } from './socket.js';

// ============================================
// MESSAGE PROCESSOR
// ============================================
export const processMessage = async ({
  topic,
  partition,
  message,
}: EachMessagePayload) => {
  try {
    if (!message.value) {
      console.warn('⚠️  Received message with no value');
      return;
    }

    // Parse message
    const logMessage: LogMessage = JSON.parse(message.value.toString());

    // Update metrics
    metrics.messagesReceived++;

    // Log processing (optional, can be removed for production)
    if (metrics.messagesReceived % 100 === 0) {
      console.log(
        `📊 Processed ${metrics.messagesReceived} messages, broadcast ${metrics.messagesBroadcast}`
      );
    }

    // Broadcast to connected clients
    broadcastLog({
      ...logMessage,
      _meta: {
        topic,
        partition,
        offset: message.offset,
        timestamp: message.timestamp,
      },
    });
  } catch (error) {
    metrics.errors++;
    console.error('❌ Error processing message:', error);
    console.error('Message:', message.value?.toString());
  }
};
