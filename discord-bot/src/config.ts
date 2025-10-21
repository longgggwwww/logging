import * as dotenv from 'dotenv';
import { Config } from './types.js';

// Load environment variables
dotenv.config();

export const CONFIG: Config = {
  kafka: {
    clientId: 'discord-bot-consumer',
    brokers: (
      process.env.KAFKA_BROKERS ||
      'localhost:19092,localhost:29092,localhost:39092'
    ).split(','),
    connectionTimeout: 30000,
    requestTimeout: 30000,
  },
  discord: {
    guildId: process.env.DISCORD_GUILD_ID || '',
    maxRetries: 3,
    retryDelay: 1000, // 1 second
    timeout: 5000,
    filter: {
      enabled: true,
      minSeverityCode: parseInt(process.env.DISCORD_MIN_SEVERITY_CODE || '500'),
      criticalTypes: process.env.DISCORD_CRITICAL_TYPES?.split(',') || [
        'ERROR',
      ],
    },
  },
  processing: {
    maxRetries: 3,
    retryDelay: 2000,
  },
  topics: {
    main: process.env.KAFKA_MAIN_TOPIC || 'error-logs',
    deadLetter: process.env.KAFKA_DLQ_TOPIC || 'error-logs-dlq',
    retry: process.env.KAFKA_RETRY_TOPIC || 'error-logs-retry',
  },
};
