import { Kafka, logLevel } from 'kafkajs';
import { CONFIG } from './config.js';

export const kafka = new Kafka({
  clientId: CONFIG.kafka.clientId,
  brokers: CONFIG.kafka.brokers,
  connectionTimeout: CONFIG.kafka.connectionTimeout,
  requestTimeout: CONFIG.kafka.requestTimeout,
  retry: {
    initialRetryTime: 300,
    retries: 8,
  },
  logCreator: // Beautify logs
    () =>
    ({ level, log }) => {
      if (level === logLevel.INFO || level === logLevel.ERROR) {
        console.log(JSON.stringify(log, null, 2));
      }
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
