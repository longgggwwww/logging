import { PrismaClient } from "@prisma/client";
import { LogMessage } from "./types.js";

const prisma = new PrismaClient();

// ============================================
// MESSAGE PROCESSOR
// ============================================
export const processLogMessage = async (message: any): Promise<void> => {
  try {
    const log: LogMessage = JSON.parse(message.value.toString());

    // Validate required fields
    if (
      !log.project ||
      !log.function ||
      !log.method ||
      !log.type ||
      !log.createdAt
    ) {
      console.error("❌ Invalid log message - missing required fields:", log);
      return;
    }

    // Find or create project
    let project = await prisma.project.findUnique({
      where: { name: log.project },
    });

    if (!project) {
      project = await prisma.project.create({
        data: { name: log.project },
      });
      console.log(`✅ Created new project: ${log.project}`);
    }

    // Find or create function
    let func = await prisma.function.findUnique({
      where: {
        projectId_name: {
          projectId: project.id,
          name: log.function,
        },
      },
    });

    if (!func) {
      func = await prisma.function.create({
        data: {
          name: log.function,
          projectId: project.id,
        },
      });
      console.log(
        `✅ Created new function: ${log.function} for project: ${log.project}`,
      );
    }

    // Create log entry
    await prisma.log.create({
      data: {
        projectId: project.id,
        functionId: func.id,
        method: log.method,
        type: log.type,

        // Request data
        requestHeaders: log.request.headers,
        requestUserAgent: log.request.userAgent,
        requestUrl: log.request.url,
        requestParams: log.request.params,
        requestBody: log.request.body || null,

        // Response data
        responseCode: log.response.code,
        responseSuccess: log.response.success,
        responseMessage: log.response.message,
        responseData: log.response.data,

        // Additional data
        consoleLog: log.consoleLog,
        additionalData: log.additionalData,
        latency: log.latency,

        // User data
        createdById: log.createdBy?.id || null,
        createdByFullname: log.createdBy?.fullname || null,
        createdByEmplCode: log.createdBy?.emplCode || null,

        // Timestamps
        createdAt: new Date(log.createdAt),
      },
    });

    console.log(
      `✅ Processed log: ${log.type} - ${log.project}/${log.function} - ${log.method}`,
    );
  } catch (error) {
    console.error("❌ Error processing message:", error);
    throw error;
  }
};

// ============================================
// DATABASE OPERATIONS
// ============================================
export const connectDatabase = async (): Promise<void> => {
  await prisma.$connect();
  console.log("✅ Connected to PostgreSQL");
};

export const disconnectDatabase = async (): Promise<void> => {
  await prisma.$disconnect();
  console.log("✅ Prisma client disconnected");
};
