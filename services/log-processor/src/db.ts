import mongoose from "mongoose";

export const connectDatabase = async (): Promise<void> => {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL not set");
  }

  await mongoose.connect(process.env.DATABASE_URL); // keep default options
  console.log("✅ Connected to MongoDB via Mongoose");
};

export const disconnectDatabase = async (): Promise<void> => {
  await mongoose.disconnect();
  console.log("✅ Mongoose disconnected");
};
