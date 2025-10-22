import { Kafka } from "kafkajs";
import { CONFIG } from "./config.js";

const kafka = new Kafka(CONFIG.kafka);

export const producer = kafka.producer();
