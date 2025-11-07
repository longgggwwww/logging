import { Config } from './types.js';

const env = {
  kafkaBrokers:
    process.env.KAFKA_BROKERS || 'kafka-1:9092,kafka-2:9092,kafka-3:9092',
  kafkaTopics: process.env.KAFKA_TOPICS || 'logs',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  port: process.env.PORT || '3000',
};

export const conf: Config = {
  kafka: {
    clientId: 'realtime-logs-consumer',
    brokers: env.kafkaBrokers.split(','),
    connectionTimeout: 30000,
    requestTimeout: 30000,
    topics: env.kafkaTopics.split(','),
  },
  socket: {
    port: parseInt(env.port, 10),
    corsOrigin: env.corsOrigin,
  },
};

console.log('📋 Configuration loaded:');
console.log(`  - Kafka brokers: ${conf.kafka.brokers.join(', ')}`);
console.log(`  - Kafka topics: ${conf.kafka.topics.join(', ')}`);
console.log(`  - Socket port: ${conf.socket.port}`);
console.log(`  - CORS origin: ${conf.socket.corsOrigin}`);
