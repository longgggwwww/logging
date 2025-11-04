import express, { Request, Response } from "express";

import { LogModel } from "../models/index.js";
import type { StatsQueryParams } from "../config.js";
import { getTimeRangeFilter } from "../utils.js";
import { redisClient } from "../redis.js";

const router = express.Router();

// ============================================
// ROUTES: STATS
// ============================================

// Statistics endpoint
router.get("/v1/stats", async (req: Request, res: Response) => {
  try {
    const { projectId, timeRange = "24h" } = req.query as StatsQueryParams &
      Record<string, string>;

    const cacheKey = `stats:${projectId || "all"}:${timeRange}`;

    // Try cache
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      return res.json(JSON.parse(cached));
    }

    const where: any = {};
    if (projectId) {
      where.projectId = projectId;
    }

    const timeFilter = getTimeRangeFilter(timeRange);
    if (timeFilter) {
      where.createdAt = timeFilter;
    }

    // Get statistics
    const [total, byType, byMethod, byProject] = await Promise.all([
      // Total logs
      LogModel.countDocuments(where),

      // Logs by type
      LogModel.aggregate([
        { $match: where },
        { $group: { _id: "$type", count: { $sum: 1 } } },
      ]),

      // Logs by method
      LogModel.aggregate([
        { $match: where },
        { $group: { _id: "$method", count: { $sum: 1 } } },
      ]),

      // Logs by project (if not filtered by project)
      projectId
        ? Promise.resolve([])
        : LogModel.aggregate([
            { $match: where },
            { $group: { _id: "$projectId", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 },
          ]),
    ]);

    const response = {
      total,
      byType: byType.reduce((acc: any, item: any) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      byMethod: byMethod.reduce((acc: any, item: any) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      byProject: byProject.reduce((acc: any, item: any) => {
        acc[item._id.toString()] = item.count;
        return acc;
      }, {}),
      timeRange,
    };

    // Cache for 1 minute
    await redisClient.setEx(cacheKey, 60, JSON.stringify(response));

    res.json(response);
  } catch (error: any) {
    console.error("❌ Error fetching stats:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
});

export { router as statsRouter };
