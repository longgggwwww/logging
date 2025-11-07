import express, { Request, Response } from "express";
import mongoose from "mongoose";

import { conf } from "../config.js";
import { LogModel } from "../models/index.js";
import type { CacheParams, LogQueryParams } from "../config.js";
import { generateCacheKey, getTimeRangeFilter } from "../utils.js";
import { redisClient } from "../redis.js";

const router = express.Router();
// ============================================
// ROUTES: LOGS
// ============================================

// GET /v1/logs - List logs with filters and pagination
router.get("/v1/logs", async (req: Request, res: Response) => {
  try {
    const {
      projectIds,
      functionIds,
      method,
      type, // type in database (DEBUG, SUCCESS, INFO, WARNING, ERROR)
      timeRange,
      startTime,
      endTime,
      cursorId,
      page = "1",
      take = conf.defaultTake.toString(),
      paginationType = "cursor", // 'cursor' or 'offset'
    } = req.query as LogQueryParams & Record<string, string>;

    // Parse and validate projectIds
    let projectIdArray: string[] = [];
    if (projectIds) {
      projectIdArray = Array.isArray(projectIds)
        ? projectIds
        : projectIds.split(",").map((id) => id.trim());
      if (projectIdArray.length > 10) {
        return res.status(400).json({
          error: "Bad request",
          message: "Maximum 10 project IDs allowed",
        });
      }
    }

    // Parse and validate functionIds
    let functionIdArray: string[] = [];
    if (functionIds) {
      functionIdArray = Array.isArray(functionIds)
        ? functionIds
        : functionIds.split(",").map((id) => id.trim());
      if (functionIdArray.length > 10) {
        return res.status(400).json({
          error: "Bad request",
          message: "Maximum 10 function IDs allowed",
        });
      }
    }

    // Validate pagination type
    const validPaginationTypes = ["cursor", "offset"];
    const selectedPaginationType = validPaginationTypes.includes(paginationType)
      ? paginationType
      : "cursor";

    // Validate and parse take
    const limit = Math.min(parseInt(take) || conf.defaultTake, conf.maxTake);

    // Validate and parse page for offset pagination
    const pageNumber = Math.max(parseInt(page) || 1, 1);
    const skip = (pageNumber - 1) * limit;

    // Build cache key
    const cacheParams: CacheParams = {
      projectIds: projectIdArray.join(","),
      functionIds: functionIdArray.join(","),
      method,
      level: type,
      timeRange,
      startTime,
      endTime,
      cursorId,
      page: pageNumber,
      take: limit,
      paginationType: selectedPaginationType,
    };
    const cacheKey = generateCacheKey("logs:list", cacheParams);

    // Try to get from cache
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      console.log("✅ Cache hit for:", cacheKey);
      return res.json(JSON.parse(cached));
    }

    console.log("❌ Cache miss for:", cacheKey);

    // Build where clause
    const where: any = {};

    if (projectIdArray.length > 0) {
      where.project =
        projectIdArray.length === 1
          ? projectIdArray[0]
          : { $in: projectIdArray };
    }

    if (functionIdArray.length > 0) {
      where.function =
        functionIdArray.length === 1
          ? functionIdArray[0]
          : { $in: functionIdArray };
    }

    if (method) {
      where.method = method.toUpperCase();
    }

    if (type) {
      where.type = type.toUpperCase();
    }

    // Handle time range
    const timeFilter = getTimeRangeFilter(timeRange, startTime, endTime);
    if (timeFilter) {
      where.createdAt = timeFilter;
    }

    // Build query options for Mongoose
    const queryOptions: any = {
      sort: { createdAt: -1 },
    };

    let response: any;

    if (selectedPaginationType === "offset") {
      // Offset-based pagination
      queryOptions.skip = skip;
      queryOptions.limit = limit;

      // Get total count for offset pagination
      const [logs, totalCount] = await Promise.all([
        LogModel.find(where)
          .populate("project", "name")
          .populate("function", "name")
          .sort(queryOptions.sort)
          .skip(queryOptions.skip)
          .limit(queryOptions.limit)
          .exec(),
        LogModel.countDocuments(where),
      ]);

      const totalPages = Math.ceil(totalCount / limit);
      const hasMore = pageNumber < totalPages;

      response = {
        data: logs,
        pagination: {
          type: "offset",
          page: pageNumber,
          pageSize: limit,
          total: totalCount,
          totalPages,
          hasMore,
          hasPrevious: pageNumber > 1,
          count: logs.length,
        },
        filters: {
          projectIds: projectIdArray.length > 0 ? projectIdArray : undefined,
          functionIds: functionIdArray.length > 0 ? functionIdArray : undefined,
          method,
          level: type,
          timeRange,
          startTime,
          endTime,
        },
      };
    } else {
      // Cursor-based pagination
      // Handle cursor
      if (cursorId) {
        queryOptions.where.id = {
          lt: cursorId, // Get logs before this cursor
        };
      }

      queryOptions.limit = limit + 1; // Get one extra to check if there are more

      let query = LogModel.find(where)
        .populate("project", "name")
        .populate("function", "name")
        .sort(queryOptions.sort);

      if (cursorId) {
        query = query.where({
          _id: { $gt: new mongoose.Types.ObjectId(cursorId) },
        });
      }

      const logs = await query.limit(queryOptions.limit).exec();

      // Check if there are more results
      const hasMore = logs.length > limit;
      const results = hasMore ? logs.slice(0, -1) : logs;

      // Get next cursor
      const nextCursor = hasMore
        ? results[results.length - 1]._id.toString()
        : null;

      response = {
        data: results,
        pagination: {
          type: "cursor",
          nextCursor,
          hasMore,
          count: results.length,
        },
        filters: {
          projectIds: projectIdArray.length > 0 ? projectIdArray : undefined,
          functionIds: functionIdArray.length > 0 ? functionIdArray : undefined,
          method,
          level: type,
          timeRange,
          startTime,
          endTime,
        },
      };
    }

    // Cache the response
    await redisClient.setEx(cacheKey, conf.cacheTtl, JSON.stringify(response));

    res.json(response);
  } catch (error: any) {
    console.error("❌ Error fetching logs:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
});

// GET /v1/logs/:log_id - Get log by ID
router.get("/v1/logs/:log_id", async (req: Request, res: Response) => {
  try {
    const { log_id } = req.params;

    // Build cache key
    const cacheKey = `log:${log_id}`;

    // Try to get from cache
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      console.log("✅ Cache hit for log:", log_id);
      return res.json(JSON.parse(cached));
    }

    console.log("❌ Cache miss for log:", log_id);

    // Query log
    const log = await LogModel.findById(log_id)
      .populate("project", "name")
      .populate("function", "name")
      .exec();

    if (!log) {
      return res.status(404).json({
        error: "Not found",
        message: "Log not found",
      });
    }

    const response = {
      data: log,
    };

    // Cache the response for longer (15 minutes) since individual logs don't change
    await redisClient.setEx(cacheKey, 900, JSON.stringify(response));

    res.json(response);
  } catch (error: any) {
    console.error("❌ Error fetching log:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
});

export { router as logsRouter };
