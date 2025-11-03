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
    main: process.env.KAFKA_TOPIC || 'error-logs',
  },
};

console.log('📋 Configuration loaded:');
console.log(`  - Kafka brokers: ${CONFIG.kafka.brokers.join(', ')}`);
console.log(`  - Socket port: ${CONFIG.socket.port}`);
console.log(`  - CORS origin: ${CONFIG.socket.corsOrigin}`);
console.log(`  - Kafka topic: ${CONFIG.topics.main}`);
