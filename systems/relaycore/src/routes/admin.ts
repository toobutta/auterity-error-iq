/**
 * RelayCore Admin Dashboard Routes
 * Serves the admin frontend interface
 */

import { Router, Request, Response } from "express";
import express from "express";
import * as path from "path";
import { logger } from "../utils/logger";

const router = Router();

// Serve static files from the built frontend
router.use(express.static(path.join(__dirname, "../../frontend/dist")));

// Serve the admin dashboard
router.get("/", (req: Request, res: Response) => {
  try {
    res.sendFile(path.join(__dirname, "../../frontend/dist/index.html"));
  } catch (error) {
    logger.error("Failed to serve admin dashboard:", error);
    res.status(500).json({
      error: "Failed to load admin dashboard",
      message:
        "Frontend build not found. Run npm run build in the frontend directory.",
    });
  }
});

// API endpoint for frontend configuration
router.get("/api/config", (req: Request, res: Response) => {
  res.json({
    websocketUrl: process.env.WEBSOCKET_URL || "ws://localhost:3001",
    apiUrl: process.env.API_URL || "http://localhost:3001/api/v1",
    refreshInterval: 5000,
    features: {
      realTimeMetrics: true,
      adminCommands: true,
      providerManagement: true,
      costOptimization: true,
    },
  });
});

export { router as adminRoutes };

