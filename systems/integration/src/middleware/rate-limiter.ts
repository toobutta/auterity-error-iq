import { Request, Response, NextFunction } from "express";

const requests = new Map<string, { count: number; resetTime: number }>();

export const rateLimiter = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const clientId = req.ip || "unknown";
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxRequests = 100;

  const clientData = requests.get(clientId);

  if (!clientData || now > clientData.resetTime) {
    requests.set(clientId, {
      count: 1,
      resetTime: now + windowMs,
    });
    next();
    return;
  }

  if (clientData.count >= maxRequests) {
    res.status(429).json({
      error: "Too many requests",
      retryAfter: Math.ceil((clientData.resetTime - now) / 1000),
    });
    return;
  }

  clientData.count++;
  next();
};

