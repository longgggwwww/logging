import express, { Request, Response } from "express";

import { FunctionModel } from "../models/index.js";
import { redisClient } from "../redis.js";

const router = express.Router();

// GET /v1/functions - List all functions
router.get("/v1/functions", async (req: Request, res: Response) => {
  try {
    const cacheKey = "functions:list";

    // Try cache
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      console.log("✅ Cache hit for functions list");
      return res.json(JSON.parse(cached));
    }

    console.log("❌ Cache miss for functions list");

    const functions = await FunctionModel.find()
      .populate("project", "name")
      .sort({ name: 1 })
      .exec();

    const response = {
      data: functions,
      total: functions.length,
    };

    // Cache for 5 minutes
    await redisClient.setEx(cacheKey, 300, JSON.stringify(response));

    res.json(response);
  } catch (error: any) {
    console.error("❌ Error fetching functions:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
});

// GET /v1/functions/:function_id - Get function by ID
router.get(
  "/v1/functions/:function_id",
  async (req: Request, res: Response) => {
    try {
      const { function_id } = req.params;
      const cacheKey = `function:${function_id}`;

      // Try cache
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        console.log("✅ Cache hit for function:", function_id);
        return res.json(JSON.parse(cached));
      }

      console.log("❌ Cache miss for function:", function_id);

      const func = await FunctionModel.findById(function_id)
        .populate("project", "name")
        .exec();

      if (!func) {
        return res.status(404).json({
          error: "Not found",
          message: "Function not found",
        });
      }

      const response = {
        data: func,
      };

      // Cache for 5 minutes
      await redisClient.setEx(cacheKey, 300, JSON.stringify(response));

      res.json(response);
    } catch (error: any) {
      console.error("❌ Error fetching function:", error);
      res.status(500).json({
        error: "Internal server error",
        message: error.message,
      });
    }
  },
);

export { router as functionsRouter };
