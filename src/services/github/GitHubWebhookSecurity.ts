import crypto from 'crypto';
import { EventEmitter } from 'events';
import { githubAuditLogger } from './GitHubAuditLogger';

export interface WebhookSecurityConfig {
  secret: string;
  tolerance: number; // seconds
  maxPayloadSize: number; // bytes
  allowedIPs?: string[];
  rateLimit: {
    maxRequests: number;
    windowMs: number;
  };
}

export interface WebhookEvent {
  id: string;
  type: string;
  payload: any;
  signature: string;
  timestamp: number;
  ipAddress: string;
  userAgent?: string;
}

/**
 * Enhanced GitHub Webhook Security Service
 * Provides comprehensive webhook validation and security monitoring
 */
export class GitHubWebhookSecurity extends EventEmitter {
  private rateLimitCache: Map<string, { count: number; resetTime: number }> = new Map();

  constructor(private config: WebhookSecurityConfig) {
    super();
    this.setupSecurityMonitoring();
  }

  /**
   * Validate webhook signature with enhanced security
   */
  validateWebhookSignature(
    payload: string,
    signature: string,
    timestamp?: number
  ): { valid: boolean; reason?: string } {
    try {
      // Check if signature is provided
      if (!signature) {
        return { valid: false, reason: 'Missing signature' };
      }

      // Validate timestamp if provided (GitHub sends X-GitHub-Delivery)
      if (timestamp) {
        const now = Math.floor(Date.now() / 1000);
        const age = now - timestamp;

        if (Math.abs(age) > this.config.tolerance) {
          return { valid: false, reason: `Timestamp outside tolerance: ${age}s` };
        }
      }

      // Validate payload size
      if (payload.length > this.config.maxPayloadSize) {
        return { valid: false, reason: `Payload too large: ${payload.length} bytes` };
      }

      // Validate signature format
      if (!signature.startsWith('sha256=')) {
        return { valid: false, reason: 'Invalid signature format' };
      }

      const signatureHash = signature.slice(7); // Remove 'sha256=' prefix

      // Create expected signature
      const expectedSignature = crypto
        .createHmac('sha256', this.config.secret)
        .update(payload)
        .digest('hex');

      // Use constant-time comparison to prevent timing attacks
      const valid = crypto.timingSafeEqual(
        Buffer.from(signatureHash, 'hex'),
        Buffer.from(expectedSignature, 'hex')
      );

      return {
        valid,
        reason: valid ? undefined : 'Signature mismatch'
      };

    } catch (error) {
      return { valid: false, reason: `Validation error: ${error.message}` };
    }
  }

  /**
   * Validate IP address against whitelist
   */
  validateIPAddress(ipAddress: string): { valid: boolean; reason?: string } {
    if (!this.config.allowedIPs || this.config.allowedIPs.length === 0) {
      return { valid: true }; // No IP restrictions
    }

    // GitHub's webhook IP ranges (as of 2025)
    const githubIPs = [
      '192.30.252.0/22',
      '185.199.108.0/22',
      '140.82.112.0/20',
      '143.55.64.0/20',
      '2a0a:a440::/29',
      '2606:50c0::/32'
    ];

    const allAllowedIPs = [...this.config.allowedIPs, ...githubIPs];

    for (const allowedIP of allAllowedIPs) {
      if (this.isIPInRange(ipAddress, allowedIP)) {
        return { valid: true };
      }
    }

    return { valid: false, reason: `IP not in allowed ranges: ${ipAddress}` };
  }

  /**
   * Check rate limiting
   */
  checkRateLimit(identifier: string): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const windowKey = `${identifier}_${Math.floor(now / this.config.rateLimit.windowMs)}`;

    const current = this.rateLimitCache.get(windowKey) || { count: 0, resetTime: now + this.config.rateLimit.windowMs };

    if (now > current.resetTime) {
      current.count = 0;
      current.resetTime = now + this.config.rateLimit.windowMs;
    }

    current.count++;
    this.rateLimitCache.set(windowKey, current);

    const allowed = current.count <= this.config.rateLimit.maxRequests;
    const remaining = Math.max(0, this.config.rateLimit.maxRequests - current.count);

    return { allowed, remaining, resetTime: current.resetTime };
  }

  /**
   * Process webhook with comprehensive security validation
   */
  async processWebhook(
    event: WebhookEvent
  ): Promise<{ valid: boolean; reason?: string; securityEvents: string[] }> {
    const securityEvents: string[] = [];
    let valid = true;
    let reason = '';

    // 1. Validate payload size
    if (JSON.stringify(event.payload).length > this.config.maxPayloadSize) {
      valid = false;
      reason = 'Payload size exceeds limit';
      securityEvents.push('payload_too_large');
    }

    // 2. Validate IP address
    if (valid) {
      const ipValidation = this.validateIPAddress(event.ipAddress);
      if (!ipValidation.valid) {
        valid = false;
        reason = ipValidation.reason || 'IP validation failed';
        securityEvents.push('invalid_ip_address');
      }
    }

    // 3. Check rate limiting
    if (valid) {
      const rateLimit = this.checkRateLimit(event.ipAddress);
      if (!rateLimit.allowed) {
        valid = false;
        reason = 'Rate limit exceeded';
        securityEvents.push('rate_limit_exceeded');
      }
    }

    // 4. Validate signature
    if (valid) {
      const signatureValidation = this.validateWebhookSignature(
        JSON.stringify(event.payload),
        event.signature,
        event.timestamp
      );

      if (!signatureValidation.valid) {
        valid = false;
        reason = signatureValidation.reason || 'Signature validation failed';
        securityEvents.push('invalid_signature');
      }
    }

    // 5. Validate payload structure
    if (valid) {
      const payloadValidation = this.validatePayloadStructure(event.payload);
      if (!payloadValidation.valid) {
        valid = false;
        reason = payloadValidation.reason || 'Invalid payload structure';
        securityEvents.push('invalid_payload_structure');
      }
    }

    // Log security events
    if (securityEvents.length > 0) {
      await this.logSecurityEvents(event, securityEvents, valid);
    }

    // Emit events
    if (valid) {
      this.emit('webhook_validated', event);
    } else {
      this.emit('webhook_rejected', { event, reason, securityEvents });
    }

    return { valid, reason, securityEvents };
  }

  /**
   * Validate webhook payload structure
   */
  private validatePayloadStructure(payload: any): { valid: boolean; reason?: string } {
    try {
      // Check for required GitHub webhook fields
      if (!payload || typeof payload !== 'object') {
        return { valid: false, reason: 'Invalid payload format' };
      }

      // Validate action field for certain event types
      if (payload.action !== undefined && typeof payload.action !== 'string') {
        return { valid: false, reason: 'Invalid action field' };
      }

      // Validate repository field
      if (payload.repository && typeof payload.repository !== 'object') {
        return { valid: false, reason: 'Invalid repository field' };
      }

      // Validate sender field
      if (payload.sender && typeof payload.sender !== 'object') {
        return { valid: false, reason: 'Invalid sender field' };
      }

      return { valid: true };

    } catch (error) {
      return { valid: false, reason: `Payload validation error: ${error.message}` };
    }
  }

  /**
   * Check if IP is in CIDR range
   */
  private isIPInRange(ip: string, cidr: string): boolean {
    try {
      const [range, bits] = cidr.split('/');
      const mask = ~(2 ** (32 - parseInt(bits)) - 1);

      const ipNum = this.ipToNumber(ip);
      const rangeNum = this.ipToNumber(range);

      return (ipNum & mask) === (rangeNum & mask);
    } catch (error) {
      return false;
    }
  }

  /**
   * Convert IP address to number
   */
  private ipToNumber(ip: string): number {
    return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet), 0);
  }

  /**
   * Log security events
   */
  private async logSecurityEvents(
    event: WebhookEvent,
    securityEvents: string[],
    valid: boolean
  ): Promise<void> {
    for (const securityEvent of securityEvents) {
      const severity = this.getEventSeverity(securityEvent);

      await githubAuditLogger.logSecurityEvent(
        `webhook_${securityEvent}`,
        severity,
        {
          webhookId: event.id,
          eventType: event.type,
          ipAddress: event.ipAddress,
          userAgent: event.userAgent,
          payloadSize: JSON.stringify(event.payload).length,
          validationPassed: valid
        }
      );
    }
  }

  /**
   * Get severity level for security events
   */
  private getEventSeverity(event: string): 'low' | 'medium' | 'high' | 'critical' {
    const severityMap: Record<string, 'low' | 'medium' | 'high' | 'critical'> = {
      'payload_too_large': 'medium',
      'invalid_ip_address': 'high',
      'rate_limit_exceeded': 'medium',
      'invalid_signature': 'critical',
      'invalid_payload_structure': 'high'
    };

    return severityMap[event] || 'medium';
  }

  /**
   * Setup security monitoring
   */
  private setupSecurityMonitoring(): void {
    // Clean up rate limit cache periodically
    setInterval(() => {
      const now = Date.now();
      for (const [key, value] of this.rateLimitCache.entries()) {
        if (now > value.resetTime) {
          this.rateLimitCache.delete(key);
        }
      }
    }, 60000); // Clean every minute

    // Handle security alerts
    this.on('webhook_rejected', async (data) => {
      // Security alert handled
    });

    // Monitor for attack patterns
    this.on('webhook_validated', async (event) => {
      // Additional monitoring logic can be added here
    });
  }

  /**
   * Get security statistics
   */
  async getSecurityStatistics(
    timeRange: { from: Date; to: Date }
  ): Promise<{
    totalWebhooks: number;
    rejectedWebhooks: number;
    securityEvents: Record<string, number>;
    rateLimitHits: number;
  }> {
    // This would query the audit logs for security statistics
    const logs = await githubAuditLogger.getAuditLogs({
      action: 'security_event',
      dateFrom: timeRange.from,
      dateTo: timeRange.to
    });

    const stats = {
      totalWebhooks: 0,
      rejectedWebhooks: 0,
      securityEvents: {} as Record<string, number>,
      rateLimitHits: 0
    };

    logs.entries.forEach(entry => {
      if (entry.resource.startsWith('webhook_')) {
        stats.totalWebhooks++;

        if (entry.metadata.validationPassed === false) {
          stats.rejectedWebhooks++;
        }

        const eventType = entry.resource.replace('webhook_', '');
        stats.securityEvents[eventType] = (stats.securityEvents[eventType] || 0) + 1;

        if (eventType === 'rate_limit_exceeded') {
          stats.rateLimitHits++;
        }
      }
    });

    return stats;
  }
}

// Default security configuration
export const defaultWebhookSecurityConfig: WebhookSecurityConfig = {
  secret: process.env.GITHUB_WEBHOOK_SECRET || '',
  tolerance: 300, // 5 minutes
  maxPayloadSize: 1024 * 1024, // 1MB
  rateLimit: {
    maxRequests: 100,
    windowMs: 60000 // 1 minute
  }
};

// Export singleton instance
export const githubWebhookSecurity = new GitHubWebhookSecurity(defaultWebhookSecurityConfig);</content>
<parameter name="filePath">c:\Users\Andrew\OneDrive\Documents\auterity-error-iq\src\services\github\GitHubWebhookSecurity.ts
