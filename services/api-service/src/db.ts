import mongoose from "mongoose";

// ============================================
// DATABASE CONNECTIONS
// ============================================
export const connectDatabase = async (): Promise<void> => {
  const url = process.env.MONGO_URL;
  if (!url) throw new Error("MONGO_URL not set");

  await mongoose.connect(url);
  console.log("✅ Connected to MongoDB via Mongoose");
};

export const disconnectDatabase = async (): Promise<void> => {
  await mongoose.disconnect();
  console.log("✅ Mongoose disconnected");
};
