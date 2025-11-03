import { Kafka, logLevel } from 'kafkajs';
import { conf } from './config.js';

// ============================================
// KAFKA SETUP
// ============================================
export const kafka = new Kafka({
  clientId: conf.kafka.clientId,
  brokers: conf.kafka.brokers,
  connectionTimeout: conf.kafka.connectionTimeout,
  requestTimeout: conf.kafka.requestTimeout,
  retry: {
    initialRetryTime: 300,
    retries: 8,
  },
});

export const consumer = kafka.consumer({
  groupId: 'realtime-group',
  sessionTimeout: 30000,
  heartbeatInterval: 3000,
  maxWaitTimeInMs: 5000,
});
