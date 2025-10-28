import { ProjectModel, FunctionModel, LogModel } from "./models/index.js";
import { LogMessage } from "./types.js";

// ============================================
// MESSAGE PROCESSOR (Mongoose implementation)
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
    let project = await ProjectModel.findOne({ name: log.project }).exec();
    if (!project) {
      project = await ProjectModel.create({ name: log.project });
      console.log(`✅ Created new project: ${log.project}`);
    }

    // Find or create function
    let func = await FunctionModel.findOne({
      project: project._id,
      name: log.function,
    }).exec();
    if (!func) {
      func = await FunctionModel.create({
        name: log.function,
        project: project._id,
      });
      console.log(
        `✅ Created new function: ${log.function} for project: ${log.project}`,
      );
    }

    // Create log entry
    await LogModel.create({
      project: project._id,
      function: func._id,
      method: log.method,
      type: log.type,
      request: log.request,
      response: log.response,
      consoleLog: log.consoleLog,
      additionalData: log.additionalData,
      latency: Math.floor(log.latency),
      createdBy: log.createdBy,
      createdAt: new Date(log.createdAt),
    });

    console.log(
      `✅ Processed log: ${log.type} - ${log.project}/${log.function} - ${log.method}`,
    );
  } catch (error) {
    console.error("❌ Error processing message:", error);
    throw error;
  }
};
