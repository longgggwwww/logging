import express, { Request, Response } from "express";

import { LogModel } from "../models/index.js";
import { redisClient } from "../redis.js";

const router = express.Router();

// ============================================
// ROUTES: HEALTH
// ============================================

// Health check endpoint
router.get("/health", async (req: Request, res: Response) => {
  try {
    // Check database connection
    await LogModel.findOne().limit(1).exec();

    // Check redis connection
    await redisClient.ping();

    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      services: {
        database: "up",
        redis: "up",
      },
    });
  } catch (error: any) {
    res.status(503).json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      error: error.message,
    });
  }
});

export { router as healthRouter };
