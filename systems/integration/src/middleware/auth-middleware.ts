import { Request, Response, NextFunction } from "express";
import { UnifiedAuth } from "../services/unified-auth";

export interface AuthenticatedRequest extends Request {
  user?: any;
  systemId?: string;
}

export const authMiddleware = (unifiedAuth: UnifiedAuth) => {
  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const token = req.headers.authorization?.replace("Bearer ", "");

      if (!token) {
        res.status(401).json({ error: "Authentication token required" });
        return;
      }

      const decoded = await unifiedAuth.verifyToken(token);
      if (decoded) {
        req.user = decoded;
        req.systemId = (decoded as any).systemId;
      } else {
        res.status(401).json({ error: "Invalid authentication token" });
        return;
      }

      next();
    } catch (error) {
      res.status(401).json({ error: "Invalid authentication token" });
    }
  };
};

