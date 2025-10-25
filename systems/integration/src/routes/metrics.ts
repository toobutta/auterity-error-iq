import { Router } from "express";

const router = Router();

router.get("/", (req, res) => {
  const metrics = {
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    cpu: process.cpuUsage(),
    platform: process.platform,
    nodeVersion: process.version,
    pid: process.pid,
  };

  res.json(metrics);
});

router.get("/system", (req, res) => {
  res.json({
    timestamp: new Date().toISOString(),
    system: {
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
      uptime: process.uptime(),
      loadAverage: require("os").loadavg(),
      totalMemory: require("os").totalmem(),
      freeMemory: require("os").freemem(),
      cpuCount: require("os").cpus().length,
    },
  });
});

export { router as metricsRoutes };

