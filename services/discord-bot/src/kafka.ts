import { Kafka } from 'kafkajs';
import { conf } from './config.js';

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
  groupId: 'discord-bot-group',
  sessionTimeout: 30000,
  heartbeatInterval: 3000,
  maxWaitTimeInMs: 5000,
});

export const producer = kafka.producer({
  allowAutoTopicCreation: false,
  transactionTimeout: 30000,
});
