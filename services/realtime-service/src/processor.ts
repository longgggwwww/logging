import { EachMessagePayload } from 'kafkajs';
import { broadcastLog } from './socket.js';

// ============================================
// MESSAGE PROCESSOR
// ============================================
export const processMsg = async ({
  partition,
  message,
}: EachMessagePayload) => {
  try {
    if (!message.value) {
      console.warn('⚠️  Received message with no value');
      return;
    }

    // Parse message
    const log = JSON.parse(message.value.toString());

    // Broadcast to connected clients
    broadcastLog(log);
  } catch (err) {
    console.error('❌ Error processing message:', err);
  }
};
