import * as dotenv from 'dotenv';
import { Config } from './types.js';

// Load environment variables
dotenv.config();

// ============================================
// CONFIGURATION
// ============================================
export const CONFIG: Config = {
  kafka: {
    clientId: 'fcm-error-logs-consumer',
    brokers: process.env.KAFKA_BROKERS?.split(',') || [
      'localhost:19092',
      'localhost:29092',
      'localhost:39092',
    ],
    connectionTimeout: 30000,
    requestTimeout: 30000,
  },
  fcm: {
    maxRetries: 3,
    retryDelay: 1000, // 1 second
    timeout: 10000,
    // List of FCM topics - send notifications to topics
    topics: process.env.FCM_TOPICS?.split(',') || [
      'all_users', // Topic for all users
      'error_alerts', // Topic for error alerts
      // 'admin_alerts',  // Topic for admin
      // Add other topics here
    ],
    // List of device tokens (optional) - if you want to send directly to device
    deviceTokens:
      process.env.FCM_DEVICE_TOKENS?.split(',').filter(Boolean) ||
      [
        // 'DEVICE_TOKEN_1',
        // 'DEVICE_TOKEN_2',
        // Add device tokens here
      ],
    // Filter settings - only send notifications for critical errors
    filter: {
      enabled: true,
      minSeverityCode: parseInt(process.env.FCM_MIN_SEVERITY_CODE || '500'),
      criticalTypes: process.env.FCM_CRITICAL_TYPES?.split(',') || ['ERROR'], // Only send for ERROR type
    },
  },
  processing: {
    maxRetries: 3,
    retryDelay: 2000,
  },
  topics: {
    // main: 'error-logs',
    main: process.env.KAFKA_MAIN_TOPIC || 'all_users',
    deadLetter: process.env.KAFKA_DLQ_TOPIC || 'error-logs-dlq',
    retry: process.env.KAFKA_RETRY_TOPIC || 'error-logs-retry',
  },
};
