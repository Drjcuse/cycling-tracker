import { Router, Request, Response } from "express";
import pool from "../db/index.js";

const router = Router();

interface HealthResponse {
  status: "healthy" | "unhealthy";
  timestamp: string;
  uptime: number;
  checks: {
    database: {
      status: "up" | "down";
      responseTime?: number;
      error?: string;
    };
    memory: {
      used: number;
      total: number;
      percentUsed: number;
    };
  };
}

router.get("/health", async (_req: Request, res: Response): Promise<void> => {
  const startTime = Date.now();
  const healthCheck: HealthResponse = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks: {
      database: {
        status: "up"
      },
      memory: {
        used: 0,
        total: 0,
        percentUsed: 0
      }
    }
  };

  try {
    const dbStart = Date.now();
    await pool.query("SELECT 1");
    const dbResponseTime = Date.now() - dbStart;
    
    healthCheck.checks.database.status = "up";
    healthCheck.checks.database.responseTime = dbResponseTime;
  } catch (error) {
    healthCheck.status = "unhealthy";
    healthCheck.checks.database.status = "down";
    healthCheck.checks.database.error = error instanceof Error ? error.message : "Unknown error";
  }

  const memUsage = process.memoryUsage();
  healthCheck.checks.memory = {
    used: Math.round(memUsage.heapUsed / 1024 / 1024),
    total: Math.round(memUsage.heapTotal / 1024 / 1024),
    percentUsed: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100)
  };

  const statusCode = healthCheck.status === "healthy" ? 200 : 503;
  const responseTime = Date.now() - startTime;
  
  res.status(statusCode).json({
    ...healthCheck,
    responseTime
  });
});

export default router;
