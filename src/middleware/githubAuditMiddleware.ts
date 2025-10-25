import { Request, Response, NextFunction } from 'express';
import { githubAuditLogger } from '../services/github/GitHubAuditLogger';

/**
 * Express middleware for automatic GitHub API call auditing
 * Ensures comprehensive logging for GDPR compliance
 */
export function githubAuditMiddleware() {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const startTime = Date.now();
    const originalSend = res.send;
    const originalJson = res.json;

    // Capture response data
    let responseData: any = null;
    let responseSent = false;

    // Override send method to capture response
    res.send = function(data: any) {
      responseData = data;
      responseSent = true;
      return originalSend.call(this, data);
    };

    // Override json method to capture response
    res.json = function(data: any) {
      responseData = data;
      responseSent = true;
      return originalJson.call(this, data);
    };

    // Log when response is finished
    res.on('finish', async () => {
      try {
        const duration = Date.now() - startTime;
        const userId = (req as any).user?.id || (req as any).session?.userId;

        await githubAuditLogger.logGitHubApiCall({
          userId,
          action: req.method,
          resource: req.path,
          method: req.method,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          success: res.statusCode < 400,
          duration,
          metadata: {
            requestSize: JSON.stringify(req.body || {}).length,
            responseSize: responseData ? JSON.stringify(responseData).length : 0,
            queryParams: req.query,
            headers: {
              contentType: req.get('Content-Type'),
              accept: req.get('Accept'),
              userAgent: req.get('User-Agent')
            },
            statusCode: res.statusCode,
            endpoint: req.originalUrl
          }
        });
      } catch (error) {
        console.error('Failed to log GitHub API call:', error);
        // Don't fail the request if logging fails
      }
    });

    next();
  };
}

/**
 * Middleware for GitHub webhook auditing
 */
export function githubWebhookAuditMiddleware() {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const startTime = Date.now();
    const webhookId = req.headers['x-github-delivery'] as string;
    const eventType = req.headers['x-github-event'] as string;
    const signature = req.headers['x-hub-signature-256'] as string;

    // Store original response methods
    const originalSend = res.send;
    const originalJson = res.json;

    let responseData: any = null;
    let processingSuccess = false;

    res.send = function(data: any) {
      responseData = data;
      processingSuccess = res.statusCode < 400;
      return originalSend.call(this, data);
    };

    res.json = function(data: any) {
      responseData = data;
      processingSuccess = res.statusCode < 400;
      return originalJson.call(this, data);
    };

    res.on('finish', async () => {
      try {
        const duration = Date.now() - startTime;

        await githubAuditLogger.logWebhookEvent(
          webhookId || 'unknown',
          eventType || 'unknown',
          req.body,
          processingSuccess
        );

        // Additional security logging for webhook events
        if (!signature) {
          await githubAuditLogger.logSecurityEvent(
            'webhook_missing_signature',
            'high',
            {
              webhookId,
              eventType,
              ipAddress: req.ip,
              userAgent: req.get('User-Agent'),
              payloadSize: JSON.stringify(req.body || {}).length
            }
          );
        }
      } catch (error) {
        console.error('Failed to log webhook event:', error);
      }
    });

    next();
  };
}

/**
 * Middleware for GitHub authentication auditing
 */
export function githubAuthAuditMiddleware() {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const originalSend = res.send;
    const originalJson = res.json;

    let authSuccess = false;
    let userId: string | undefined;

    res.send = function(data: any) {
      if (res.statusCode === 200) {
        authSuccess = true;
        // Extract user ID from response if available
        try {
          const responseData = JSON.parse(data);
          userId = responseData.userId || responseData.id;
        } catch (e) {
          // Ignore parsing errors
        }
      }
      return originalSend.call(this, data);
    };

    res.json = function(data: any) {
      if (res.statusCode === 200) {
        authSuccess = true;
        userId = data.userId || data.id;
      }
      return originalJson.call(this, data);
    };

    res.on('finish', async () => {
      try {
        await githubAuditLogger.logAuthenticationEvent(
          userId || 'unknown',
          authSuccess,
          'oauth2',
          req.ip,
          {
            endpoint: req.originalUrl,
            method: req.method,
            userAgent: req.get('User-Agent'),
            statusCode: res.statusCode
          }
        );
      } catch (error) {
        console.error('Failed to log authentication event:', error);
      }
    });

    next();
  };
}

/**
 * Middleware for GitHub data access auditing
 */
export function githubDataAccessAuditMiddleware() {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = (req as any).user?.id || (req as any).session?.userId;
    const dataType = req.path.split('/').pop() || 'unknown';

    // Determine operation type from HTTP method
    let operation: 'read' | 'write' | 'delete' = 'read';
    if (req.method === 'POST' || req.method === 'PUT') {
      operation = 'write';
    } else if (req.method === 'DELETE') {
      operation = 'delete';
    }

    const originalSend = res.send;
    const originalJson = res.json;

    let recordCount = 0;

    res.send = function(data: any) {
      if (res.statusCode === 200 && data) {
        try {
          const parsed = JSON.parse(data);
          if (Array.isArray(parsed)) {
            recordCount = parsed.length;
          } else if (parsed.data && Array.isArray(parsed.data)) {
            recordCount = parsed.data.length;
          } else {
            recordCount = 1;
          }
        } catch (e) {
          recordCount = 1;
        }
      }
      return originalSend.call(this, data);
    };

    res.json = function(data: any) {
      if (res.statusCode === 200 && data) {
        if (Array.isArray(data)) {
          recordCount = data.length;
        } else if (data.data && Array.isArray(data.data)) {
          recordCount = data.data.length;
        } else {
          recordCount = 1;
        }
      }
      return originalJson.call(this, data);
    };

    res.on('finish', async () => {
      if (userId && res.statusCode === 200) {
        try {
          await githubAuditLogger.logDataAccess(
            userId,
            dataType,
            operation,
            recordCount,
            req.ip
          );
        } catch (error) {
          console.error('Failed to log data access:', error);
        }
      }
    });

    next();
  };
}</content>
<parameter name="filePath">c:\Users\Andrew\OneDrive\Documents\auterity-error-iq\src\middleware\githubAuditMiddleware.ts
