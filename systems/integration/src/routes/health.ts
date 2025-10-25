import { Router } from "express";

const router = Router();

router.get("/", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    service: "three-system-integration",
    version: "1.0.0",
  });
});

router.get("/detailed", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    service: "three-system-integration",
    version: "1.0.0",
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV || "development",
  });
});

export { router as healthRoutes };

