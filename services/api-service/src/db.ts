import mongoose from "mongoose";

export const connectDatabase = async (): Promise<void> => {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL not set");

  await mongoose.connect(url, {
    // keep default options
  } as any);
  console.log("✅ Connected to MongoDB via Mongoose");
};

export const disconnectDatabase = async (): Promise<void> => {
  await mongoose.disconnect();
  console.log("✅ Mongoose disconnected");
};
