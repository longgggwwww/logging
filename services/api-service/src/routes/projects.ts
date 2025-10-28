import express, { Request, Response } from "express";

import { ProjectModel, FunctionModel } from "../models/index.js";
import { redisClient } from "../redis.js";

const router = express.Router();

// GET /v1/projects - List all projects
// Query params: expand=functions (to include functions)
router.get("/v1/projects", async (req: Request, res: Response) => {
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

    // Build query
    let query = ProjectModel.find().sort({ name: 1 });

    // Include functions if expand=functions
    if (includeFunctions) {
      query = query.populate("functions", undefined, undefined, {
        sort: { name: 1 },
      });
    }

    const projects = await query.exec();

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
router.get("/v1/projects/:project_id", async (req: Request, res: Response) => {
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

    const project = await ProjectModel.findById(project_id).exec();

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
router.get(
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
      const project = await ProjectModel.findById(project_id).exec();

      if (!project) {
        return res.status(404).json({
          error: "Not found",
          message: "Project not found",
        });
      }

      // Get functions of the project
      const functions = await FunctionModel.find({ projectId: project_id })
        .sort({ name: 1 })
        .exec();

      const response = {
        data: functions,
        total: functions.length,
        project: {
          id: project._id.toString(),
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

export { router as projectsRouter };
