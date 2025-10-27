import compression from "compression";
import cors from "cors";
import express from "express";
import helmet from "helmet";

export function setupMiddleware(app: express.Application): void {
  // Middleware
  app.use(helmet());
  app.use(cors());
  app.use(compression());
  app.use(express.json());
}
