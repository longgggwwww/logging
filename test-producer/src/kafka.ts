import { Kafka, logLevel } from "kafkajs";

const kafka = new Kafka({
  clientId: "test-producer",
  brokers: (
    process.env.KAFKA_BROKERS ||
    "localhost:19092,localhost:29092,localhost:39092"
  ).split(","),
  connectionTimeout: 30000,
  requestTimeout: 30000,
  retry: {
    initialRetryTime: 300,
    retries: 8,
  },
  // Beautiful logging for kafkajs (optional)
  logCreator:
    () =>
    ({ level, log }) => {
      if (level === logLevel.INFO || level === logLevel.ERROR) {
        console.log(JSON.stringify(log, null, 2));
      }
    },
});

export const producer = kafka.producer();
