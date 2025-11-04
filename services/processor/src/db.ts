import mongoose from "mongoose";
import { conf } from "./config.js";

export const connectDatabase = async (): Promise<void> => {
  await mongoose.connect(conf.database.url);
  console.log("✅ Connected to MongoDB via Mongoose");
};

export const disconnectDatabase = async (): Promise<void> => {
  await mongoose.disconnect();
  console.log("✅ Mongoose disconnected");
};
