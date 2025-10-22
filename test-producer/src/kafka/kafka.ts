import { Kafka } from "kafkajs";
import { CONFIG } from "../config/config.js";

const kafka = new Kafka(CONFIG.kafka);

export const producer = kafka.producer();
