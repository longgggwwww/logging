import { Config } from './types.js';

// ============================================
// CONFIGURATION
// ============================================
export const conf: Config = {
  kafka: {
    clientId: 'realtime-logs-consumer',
    brokers: process.env.KAFKA_BROKERS?.split(',') || [
      'localhost:19092',
      'localhost:29092',
      'localhost:39092',
    ],
    connectionTimeout: 30000,
    requestTimeout: 30000,
    topics: process.env.KAFKA_TOPICS?.split(',') || ['logs'],
  },
  socket: {
    corsOrigin: process.env.CORS_ORIGIN || '*',
  },
};

console.log('📋 Configuration loaded:');
console.log(`  - Kafka brokers: ${conf.kafka.brokers.join(', ')}`);
console.log(`  - CORS origin: ${conf.socket.corsOrigin}`);
console.log(`  - Kafka topics: ${conf.kafka.topics.join(', ')}`);
