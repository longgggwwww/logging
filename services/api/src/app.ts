import express from "express";
import compression from "compression";
import cors from "cors";
import helmet from "helmet";

import { keycloak } from "./keycloak.js";
import { healthRouter } from "./routes/health.js";
import { functionsRouter } from "./routes/functions.js";
import { logsRouter } from "./routes/logs.js";
import { projectsRouter } from "./routes/projects.js";
import { statsRouter } from "./routes/stats.js";

// ============================================
// CREATE EXPRESS APP
// ============================================
export const app = express();

// ============================================
// MIDDLEWARE
// ============================================
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json());
app.use(keycloak.middleware());

// ============================================
// ROUTES - Protected with Keycloak
// ============================================
app.use("/v1", keycloak.protect());
app.use(logsRouter);
app.use(projectsRouter);
app.use(functionsRouter);
app.use(statsRouter);
app.use(healthRouter);
