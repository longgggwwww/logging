import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Query utilities for log-processor service
 */

// Get all projects with function count
export async function getProjectsWithStats() {
  return await prisma.project.findMany({
    include: {
      _count: {
        select: {
          functions: true,
          logs: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
}

// Get logs by project with pagination
export async function getLogsByProject(projectId, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  
  const [logs, total] = await Promise.all([
    prisma.log.findMany({
      where: { projectId },
      include: {
        project: true,
        function: true
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    }),
    prisma.log.count({ where: { projectId } })
  ]);

  return {
    data: logs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}

// Get error logs (recent)
export async function getRecentErrors(limit = 50) {
  return await prisma.log.findMany({
    where: { type: 'ERROR' },
    include: {
      project: true,
      function: true
    },
    orderBy: { createdAt: 'desc' },
    take: limit
  });
}

// Get logs by function
export async function getLogsByFunction(functionId, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  
  const [logs, total] = await Promise.all([
    prisma.log.findMany({
      where: { functionId },
      include: {
        project: true,
        function: true
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    }),
    prisma.log.count({ where: { functionId } })
  ]);

  return {
    data: logs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}

// Get statistics by type
export async function getLogStatsByType(projectId = null) {
  const where = projectId ? { projectId } : {};
  
  return await prisma.log.groupBy({
    by: ['type'],
    where,
    _count: true,
    orderBy: {
      _count: {
        type: 'desc'
      }
    }
  });
}

// Get statistics by project
export async function getLogStatsByProject(startDate = null, endDate = null) {
  const where = {};
  
  if (startDate && endDate) {
    where.createdAt = {
      gte: new Date(startDate),
      lte: new Date(endDate)
    };
  }
  
  return await prisma.log.groupBy({
    by: ['projectId', 'type'],
    where,
    _count: true,
    _avg: {
      latency: true
    },
    orderBy: {
      _count: {
        projectId: 'desc'
      }
    }
  });
}

// Get functions with log count
export async function getFunctionsWithStats(projectId) {
  return await prisma.function.findMany({
    where: { projectId },
    include: {
      _count: {
        select: {
          logs: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
}

// Search logs by user
export async function getLogsByUser(userId, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  
  const [logs, total] = await Promise.all([
    prisma.log.findMany({
      where: { createdById: userId },
      include: {
        project: true,
        function: true
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    }),
    prisma.log.count({ where: { createdById: userId } })
  ]);

  return {
    data: logs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}

// Get logs by HTTP status code
export async function getLogsByStatusCode(code, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  
  const [logs, total] = await Promise.all([
    prisma.log.findMany({
      where: { responseCode: code },
      include: {
        project: true,
        function: true
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    }),
    prisma.log.count({ where: { responseCode: code } })
  ]);

  return {
    data: logs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}

// Get logs within date range
export async function getLogsByDateRange(startDate, endDate, filters = {}) {
  const where = {
    createdAt: {
      gte: new Date(startDate),
      lte: new Date(endDate)
    },
    ...filters
  };

  return await prisma.log.findMany({
    where,
    include: {
      project: true,
      function: true
    },
    orderBy: { createdAt: 'desc' }
  });
}

// Delete old logs (cleanup)
export async function deleteOldLogs(daysToKeep = 90) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

  const result = await prisma.log.deleteMany({
    where: {
      createdAt: {
        lt: cutoffDate
      }
    }
  });

  return result;
}

// Get average latency by project and function
export async function getAverageLatency(projectId = null, functionId = null) {
  const where = {};
  if (projectId) where.projectId = projectId;
  if (functionId) where.functionId = functionId;

  return await prisma.log.aggregate({
    where,
    _avg: {
      latency: true
    },
    _min: {
      latency: true
    },
    _max: {
      latency: true
    }
  });
}

export default prisma;
