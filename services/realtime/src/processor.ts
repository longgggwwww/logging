import { EachMessagePayload } from 'kafkajs';
import { broadcastLog } from './app.js';

export const processMsg = async ({ message }: EachMessagePayload) => {
  try {
    if (!message.value) {
      console.warn('⚠️  Received message with no value');
      return;
    }

    const log = JSON.parse(message.value.toString());
    broadcastLog(log);
  } catch (err) {
    console.error('❌ Error processing message:', err);
  }
};
