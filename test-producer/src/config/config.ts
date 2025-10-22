import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export const CONFIG = {
  kafka: {
    clientId: "test-producer",
    brokers: (
      process.env.KAFKA_BROKERS ||
      'localhost:19092,localhost:29092,localhost:39092'
    ).split(','),
  },
};
