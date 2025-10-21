import { Config } from './types.js';

export const CONFIG: Config = {
  kafka: {
    clientId: 'error-logs-consumer',
    brokers: (
      process.env.KAFKA_BROKERS ||
      'localhost:19092,localhost:29092,localhost:39092'
    ).split(','),
    connectionTimeout: 30000,
    requestTimeout: 30000,
  },
  discord: {
    webhookUrl:
      process.env.DISCORD_WEBHOOK_URL ||
      'https://discord.com/api/webhooks/1425882193229643818/8nmQfxFdkFYsvcDuyAw0RtU6OSVbqJrITmxLJscQeo5Fxq9DS2TVaFscb3FLy64yZAhP',
    maxRetries: 3,
    retryDelay: 1000, // 1 second
    timeout: 5000,
  },
  processing: {
    maxRetries: 3,
    retryDelay: 2000,
  },
  topics: {
    main: 'error-logs',
    deadLetter: 'error-logs-dlq',
    retry: 'error-logs-retry',
  },
};
