import * as dotenv from 'dotenv';
import { Config } from '../types/types.js';

// Load environment variables
dotenv.config();

const logLevel = {
  INFO: 'INFO',
  ERROR: 'ERROR'
};

export const CONFIG: Config = {
  kafka: {
    clientId: "test-producer",
    brokers: (
      process.env.KAFKA_BROKERS ||
      'localhost:19092,localhost:29092,localhost:39092'
    ).split(','),
    connectionTimeout: 30000,
    requestTimeout: 30000,
  },
  topics: {
    main: process.env.KAFKA_MAIN_TOPIC || 'error-logs',
    allUsers: process.env.KAFKA_ALL_USERS_TOPIC || 'all_users',
  },
  logCreator:
    () =>
    ({ level, log }: { level: string; log: any }) => {
      if (level === logLevel.INFO || level === logLevel.ERROR) {
        console.log(JSON.stringify(log, null, 2)); // Pretty-print JSON
      }
    },
};
