import { PrismaClient } from "@prisma/client";
import compression from "compression";
import cors from "cors";
import express, { Request, Response } from "express";
import helmet from "helmet";
import { createClient } from "redis";

import { CONFIG } from "./config.js";
import type { CacheParams, LogQueryParams, StatsQueryParams } from "./types.js";
import { generateCacheKey, getTimeRangeFilter } from "./utils.js";

const app = express();
const prisma = new PrismaClient();

// Redis client setup
const redisClient = createClient({
  url: CONFIG.redisUrl,
});

redisClient.on("error", (err: Error) =>
  console.error("❌ Redis Client Error", err),
);
redisClient.on("connect", () => console.log("✅ Redis Client Connected"));

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json());

// GET /v1/logs - List logs with filters and pagination
app.get("/v1/logs", async (req: Request, res: Response) => {
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
      take = CONFIG.defaultTake.toString(),
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
    const limit = Math.min(
      parseInt(take) || CONFIG.defaultTake,
      CONFIG.maxTake,
    );

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
      where.projectId =
        projectIdArray.length === 1
          ? projectIdArray[0]
          : { in: projectIdArray };
    }

    if (functionIdArray.length > 0) {
      where.functionId =
        functionIdArray.length === 1
          ? functionIdArray[0]
          : { in: functionIdArray };
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

    // Build query options
    const queryOptions: any = {
      where,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        function: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    };

    let response: any;

    if (selectedPaginationType === "offset") {
      // Offset-based pagination
      queryOptions.skip = skip;
      queryOptions.take = limit;

      // Get total count for offset pagination
      const [logs, totalCount] = await Promise.all([
        prisma.log.findMany(queryOptions),
        prisma.log.count({ where }),
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

      queryOptions.take = limit + 1; // Get one extra to check if there are more

      const logs = await prisma.log.findMany(queryOptions);

      // Check if there are more results
      const hasMore = logs.length > limit;
      const results = hasMore ? logs.slice(0, -1) : logs;

      // Get next cursor
      const nextCursor = hasMore ? results[results.length - 1].id : null;

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
    await redisClient.setEx(
      cacheKey,
      CONFIG.cacheTtl,
      JSON.stringify(response),
    );

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
app.get("/v1/logs/:log_id", async (req: Request, res: Response) => {
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
    const log = await prisma.log.findUnique({
      where: {
        id: log_id,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        function: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

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

// Health check endpoint
app.get("/health", async (req: Request, res: Response) => {
  try {
    // Check database connection
    await (prisma as any).$queryRaw`SELECT 1`;

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

// GET /v1/projects - List all projects
// Query params: expand=functions (to include functions)
app.get("/v1/projects", async (req: Request, res: Response) => {
  try {
    const { expand } = req.query as Record<string, string>;
    const includeFunctions = expand === "functions";
    const cacheKey = `projects:list:${
      includeFunctions ? "with-functions" : "basic"
    }`;

    // Try cache
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      console.log("✅ Cache hit for projects list");
      return res.json(JSON.parse(cached));
    }

    console.log("❌ Cache miss for projects list");

    // Build query options
    const queryOptions: any = {
      orderBy: {
        name: "asc",
      },
    };

    // Include functions if expand=functions
    if (includeFunctions) {
      queryOptions.include = {
        functions: {
          orderBy: {
            name: "asc",
          },
        },
      };
    }

    const projects = await prisma.project.findMany(queryOptions);

    const response = {
      data: projects,
      total: projects.length,
    };

    // Cache for 5 minutes
    await redisClient.setEx(cacheKey, 300, JSON.stringify(response));

    res.json(response);
  } catch (error: any) {
    console.error("❌ Error fetching projects:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
});

// GET /v1/projects/:project_id - Get project by ID
app.get("/v1/projects/:project_id", async (req: Request, res: Response) => {
  try {
    const { project_id } = req.params;
    const cacheKey = `project:${project_id}`;

    // Try cache
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      console.log("✅ Cache hit for project:", project_id);
      return res.json(JSON.parse(cached));
    }

    console.log("❌ Cache miss for project:", project_id);

    const project = await prisma.project.findUnique({
      where: {
        id: project_id,
      },
    });

    if (!project) {
      return res.status(404).json({
        error: "Not found",
        message: "Project not found",
      });
    }

    const response = {
      data: project,
    };

    // Cache for 5 minutes
    await redisClient.setEx(cacheKey, 300, JSON.stringify(response));

    res.json(response);
  } catch (error: any) {
    console.error("❌ Error fetching project:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
});

// GET /v1/projects/:project_id/functions - Get functions of a project
app.get(
  "/v1/projects/:project_id/functions",
  async (req: Request, res: Response) => {
    try {
      const { project_id } = req.params;
      const cacheKey = `project:${project_id}:functions`;

      // Try cache
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        console.log("✅ Cache hit for project functions:", project_id);
        return res.json(JSON.parse(cached));
      }

      console.log("❌ Cache miss for project functions:", project_id);

      // Check if project exists
      const project = await prisma.project.findUnique({
        where: {
          id: project_id,
        },
      });

      if (!project) {
        return res.status(404).json({
          error: "Not found",
          message: "Project not found",
        });
      }

      // Get functions of the project
      const functions = await prisma.function.findMany({
        where: {
          projectId: project_id,
        },
        orderBy: {
          name: "asc",
        },
      });

      const response = {
        data: functions,
        total: functions.length,
        project: {
          id: project.id,
          name: project.name,
        },
      };

      // Cache for 5 minutes
      await redisClient.setEx(cacheKey, 300, JSON.stringify(response));

      res.json(response);
    } catch (error: any) {
      console.error("❌ Error fetching project functions:", error);
      res.status(500).json({
        error: "Internal server error",
        message: error.message,
      });
    }
  },
);

// GET /v1/functions - List all functions
app.get("/v1/functions", async (req: Request, res: Response) => {
  try {
    const cacheKey = "functions:list";

    // Try cache
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      console.log("✅ Cache hit for functions list");
      return res.json(JSON.parse(cached));
    }

    console.log("❌ Cache miss for functions list");

    const functions = await prisma.function.findMany({
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

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
app.get("/v1/functions/:function_id", async (req: Request, res: Response) => {
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

    const func = await prisma.function.findUnique({
      where: {
        id: function_id,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

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
});

// Statistics endpoint
app.get("/v1/stats", async (req: Request, res: Response) => {
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
      prisma.log.count({ where }),

      // Logs by type
      prisma.log.groupBy({
        by: ["type"],
        where,
        _count: true,
      }),

      // Logs by method
      prisma.log.groupBy({
        by: ["method"],
        where,
        _count: true,
      }),

      // Logs by project (if not filtered by project)
      projectId
        ? Promise.resolve([])
        : prisma.log.groupBy({
            by: ["projectId"],
            where,
            _count: true,
            take: 10,
            orderBy: {
              _count: {
                projectId: "desc",
              },
            },
          }),
    ]);

    const response = {
      total,
      byType: byType.reduce((acc: any, item: any) => {
        acc[item.type] = item._count;
        return acc;
      }, {}),
      byMethod: byMethod.reduce((acc: any, item: any) => {
        acc[item.method] = item._count;
        return acc;
      }, {}),
      byProject: byProject.reduce((acc: any, item: any) => {
        acc[item.projectId] = item._count;
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

// Graceful shutdown
export async function shutdown(): Promise<void> {
  console.log("⏳ Shutting down gracefully...");
  try {
    await redisClient.quit();
    await prisma.$disconnect();
    console.log("✅ Redis client disconnected");
    console.log("✅ Prisma client disconnected");
    process.exit(0);
  } catch (error: any) {
    console.error("❌ Error during shutdown:", error);
    process.exit(1);
  }
}

// Initialize Redis connection
await redisClient.connect();

export { app };
