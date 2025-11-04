import compression from "compression";
import cors from "cors";
import express from "express";
import helmet from "helmet";

import { keycloak } from "./keycloak.js";

// ============================================
// MIDDLEWARE SETUP
// ============================================
export function setupMiddleware(app: express.Application): void {
  // ============================================
  // SECURITY & PARSING
  // ============================================
  app.use(helmet());
  app.use(cors());
  app.use(compression());
  app.use(express.json());

  // ============================================
  // KEYCLOAK
  // ============================================
  // Keycloak middleware (no session store required for bearer-only token checking)
  app.use(keycloak.middleware());
}
