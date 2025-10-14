import { PrismaClient } from '@prisma/client';
import compression from 'compression';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { createClient } from 'redis';

const app = express();
const prisma = new PrismaClient();
const port = process.env.PORT || 3000;

// Redis client setup
const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.on('error', (err) => console.error('❌ Redis Client Error', err));
redisClient.on('connect', () => console.log('✅ Redis Client Connected'));

await redisClient.connect();

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json());

// Constants
const CACHE_TTL = 300; // 5 minutes
const DEFAULT_TAKE = 50;
const MAX_TAKE = 1000;

// Helper function to generate cache key
function generateCacheKey(prefix, params) {
  const sorted = Object.keys(params)
    .sort()
    .map(key => `${key}:${params[key]}`)
    .join('|');
  return `${prefix}:${sorted}`;
}

// Helper function to parse time range
function getTimeRangeFilter(timeRange, startTime, endTime) {
  const now = new Date();
  let filter = {};

  if (timeRange) {
    let startDate;
    switch (timeRange) {
      case '15m':
        startDate = new Date(now.getTime() - 15 * 60 * 1000);
        break;
      case '30m':
        startDate = new Date(now.getTime() - 30 * 60 * 1000);
        break;
      case '1h':
        startDate = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case '3h':
        startDate = new Date(now.getTime() - 3 * 60 * 60 * 1000);
        break;
      case '6h':
        startDate = new Date(now.getTime() - 6 * 60 * 60 * 1000);
        break;
      case '12h':
        startDate = new Date(now.getTime() - 12 * 60 * 60 * 1000);
        break;
      case '24h':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000); // default 24h
    }
    filter.gte = startDate;
  } else if (startTime || endTime) {
    if (startTime) {
      filter.gte = new Date(startTime);
    }
    if (endTime) {
      filter.lte = new Date(endTime);
    }
  }

  return Object.keys(filter).length > 0 ? filter : undefined;
}

// GET /v1/logs - List logs with filters and pagination
app.get('/v1/logs', async (req, res) => {
  try {
    const {
      projectId,
      functionId,
      method,
      level, // type in database (DEBUG, SUCCESS, INFO, WARNING, ERROR)
      timeRange,
      startTime,
      endTime,
      cursorId,
      take = DEFAULT_TAKE
    } = req.query;

    // Validate and parse take
    const limit = Math.min(parseInt(take) || DEFAULT_TAKE, MAX_TAKE);

    // Build cache key
    const cacheParams = { projectId, functionId, method, level, timeRange, startTime, endTime, cursorId, take: limit };
    const cacheKey = generateCacheKey('logs:list', cacheParams);

    // Try to get from cache
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      console.log('✅ Cache hit for:', cacheKey);
      return res.json(JSON.parse(cached));
    }

    console.log('❌ Cache miss for:', cacheKey);

    // Build where clause
    const where = {};

    if (projectId) {
      where.projectId = projectId;
    }

    if (functionId) {
      where.functionId = functionId;
    }

    if (method) {
      where.method = method.toUpperCase();
    }

    if (level) {
      where.type = level.toUpperCase();
    }

    // Handle time range
    const timeFilter = getTimeRangeFilter(timeRange, startTime, endTime);
    if (timeFilter) {
      where.createdAt = timeFilter;
    }

    // Handle cursor-based pagination
    if (cursorId) {
      where.id = {
        lt: cursorId // Get logs before this cursor
      };
    }

    // Query logs
    const logs = await prisma.log.findMany({
      where,
      take: limit + 1, // Get one extra to check if there are more
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        project: {
          select: {
            id: true,
            name: true
          }
        },
        function: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // Check if there are more results
    const hasMore = logs.length > limit;
    const results = hasMore ? logs.slice(0, -1) : logs;

    // Get next cursor
    const nextCursor = hasMore ? results[results.length - 1].id : null;

    const response = {
      data: results,
      pagination: {
        nextCursor,
        hasMore,
        count: results.length
      },
      filters: {
        projectId,
        functionId,
        method,
        level,
        timeRange,
        startTime,
        endTime
      }
    };

    // Cache the response
    await redisClient.setEx(cacheKey, CACHE_TTL, JSON.stringify(response));

    res.json(response);
  } catch (error) {
    console.error('❌ Error fetching logs:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// GET /v1/logs/:log_id - Get log by ID
app.get('/v1/logs/:log_id', async (req, res) => {
  try {
    const { log_id } = req.params;

    // Build cache key
    const cacheKey = `log:${log_id}`;

    // Try to get from cache
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      console.log('✅ Cache hit for log:', log_id);
      return res.json(JSON.parse(cached));
    }

    console.log('❌ Cache miss for log:', log_id);

    // Query log
    const log = await prisma.log.findUnique({
      where: {
        id: log_id
      },
      include: {
        project: {
          select: {
            id: true,
            name: true
          }
        },
        function: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!log) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Log not found'
      });
    }

    const response = {
      data: log
    };

    // Cache the response for longer (15 minutes) since individual logs don't change
    await redisClient.setEx(cacheKey, 900, JSON.stringify(response));

    res.json(response);
  } catch (error) {
    console.error('❌ Error fetching log:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    
    // Check redis connection
    await redisClient.ping();

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'up',
        redis: 'up'
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// Statistics endpoint
app.get('/v1/stats', async (req, res) => {
  try {
    const { projectId, timeRange = '24h' } = req.query;

    const cacheKey = `stats:${projectId || 'all'}:${timeRange}`;
    
    // Try cache
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      return res.json(JSON.parse(cached));
    }

    const where = {};
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
        by: ['type'],
        where,
        _count: true
      }),
      
      // Logs by method
      prisma.log.groupBy({
        by: ['method'],
        where,
        _count: true
      }),
      
      // Logs by project (if not filtered by project)
      projectId ? Promise.resolve([]) : prisma.log.groupBy({
        by: ['projectId'],
        where,
        _count: true,
        take: 10,
        orderBy: {
          _count: {
            projectId: 'desc'
          }
        }
      })
    ]);

    const response = {
      total,
      byType: byType.reduce((acc, item) => {
        acc[item.type] = item._count;
        return acc;
      }, {}),
      byMethod: byMethod.reduce((acc, item) => {
        acc[item.method] = item._count;
        return acc;
      }, {}),
      byProject: byProject.reduce((acc, item) => {
        acc[item.projectId] = item._count;
        return acc;
      }, {}),
      timeRange
    };

    // Cache for 1 minute
    await redisClient.setEx(cacheKey, 60, JSON.stringify(response));

    res.json(response);
  } catch (error) {
    console.error('❌ Error fetching stats:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Graceful shutdown
async function shutdown() {
  console.log('⏳ Shutting down gracefully...');
  try {
    await redisClient.quit();
    await prisma.$disconnect();
    console.log('✅ Redis client disconnected');
    console.log('✅ Prisma client disconnected');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start server
app.listen(port, () => {
  console.log(`🚀 API Server listening on port ${port}`);
  console.log(`📊 Health check: http://localhost:${port}/health`);
  console.log(`📝 Logs API: http://localhost:${port}/v1/logs`);
  console.log(`📈 Stats API: http://localhost:${port}/v1/stats`);
});
