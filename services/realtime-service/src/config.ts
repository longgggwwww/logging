import * as dotenv from 'dotenv';
import { Config } from './types.js';

// Load environment variables
dotenv.config();

// ============================================
// CONFIGURATION
// ============================================
export const CONFIG: Config = {
  kafka: {
    clientId: 'realtime-logs-consumer',
    brokers: process.env.KAFKA_BROKERS?.split(',') || [
      'localhost:19092',
      'localhost:29092',
      'localhost:39092',
    ],
    connectionTimeout: 30000,
    requestTimeout: 30000,
  },
  socket: {
    port: parseInt(process.env.SOCKET_PORT || '8080', 10),
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:8000',
  },
  topics: {
    main: process.env.KAFKA_MAIN_TOPIC || 'error-logs',
    dlq: process.env.KAFKA_DLQ_TOPIC || 'error-logs-dlq',
    retry: process.env.KAFKA_RETRY_TOPIC || 'error-logs-retry',
  },
};

console.log('📋 Configuration loaded:');
console.log(`  - Kafka brokers: ${CONFIG.kafka.brokers.join(', ')}`);
console.log(`  - Socket port: ${CONFIG.socket.port}`);
console.log(`  - CORS origin: ${CONFIG.socket.corsOrigin}`);
console.log(`  - Kafka main topic: ${CONFIG.topics.main}`);
console.log(`  - Kafka DLQ topic: ${CONFIG.topics.dlq}`);
console.log(`  - Kafka retry topic: ${CONFIG.topics.retry}`);
