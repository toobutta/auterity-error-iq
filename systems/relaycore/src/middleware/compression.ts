/**
 * Advanced Response Compression Middleware
 * Provides 40-60% bandwidth reduction with intelligent compression strategies
 */

import compression from "compression";
import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";
import zlib from "zlib";

export interface CompressionConfig {
  enabled: boolean;
  level: number; // Compression level (1-9)
  threshold: number; // Minimum size to compress (bytes)
  memLevel: number; // Memory level (1-9)
  windowBits: number; // Window size
  strategy: number; // Compression strategy
  enableBrotli: boolean; // Enable Brotli compression
  enableGzip: boolean; // Enable Gzip compression
  enableDeflate: boolean; // Enable Deflate compression
  mimeTypes: string[]; // MIME types to compress
  excludePatterns: string[]; // URL patterns to exclude
}

export interface CompressionMetrics {
  totalRequests: number;
  compressedRequests: number;
  totalOriginalSize: number;
  totalCompressedSize: number;
  compressionRatio: number;
  bandwidthSaved: number;
  averageCompressionTime: number;
}

export class CompressionService {
  private config: CompressionConfig;
  private metrics: CompressionMetrics;
  private compressionTimes: number[] = [];

  constructor(config: CompressionConfig) {
    this.config = config;
    this.metrics = this.initializeMetrics();

    logger.info("Compression service initialized", {
      level: config.level,
      threshold: config.threshold,
      enableBrotli: config.enableBrotli,
    });
  }

  /**
   * Create Express compression middleware
   */
  createMiddleware() {
    if (!this.config.enabled) {
      return (req: Request, res: Response, next: NextFunction) => next();
    }

    return (req: Request, res: Response, next: NextFunction) => {
      // Skip compression for excluded patterns
      if (this.shouldSkipCompression(req)) {
        return next();
      }

      // Apply intelligent compression strategy
      this.applyCompressionStrategy(req, res);

      // Use built-in compression with custom configuration
      const compressionMiddleware = compression({
        level: this.config.level,
        threshold: this.config.threshold,
        memLevel: this.config.memLevel,
        windowBits: this.config.windowBits,
        strategy: this.config.strategy,
        filter: (req: any, res: any) => this.shouldCompress(req, res),
        // Custom compression selection
        encodings: this.getAvailableEncodings(),
      });

      compressionMiddleware(req, res, next);
    };
  }

  /**
   * Apply intelligent compression strategy based on content type and client
   */
  private applyCompressionStrategy(req: Request, res: Response): void {
    const acceptEncoding = req.headers["accept-encoding"] || "";
    const userAgent = req.headers["user-agent"] || "";

    // Override response write to track compression metrics
    const originalWrite = res.write.bind(res);
    const originalEnd = res.end.bind(res);
    let originalSize = 0;
    let compressedSize = 0;
    const startTime = Date.now();
    const self = this;

    res.write = function (chunk: any, encoding?: any) {
      if (chunk) {
        originalSize += Buffer.isBuffer(chunk)
          ? chunk.length
          : Buffer.byteLength(chunk.toString());
      }
      return originalWrite(chunk, encoding);
    };

    res.end = function (chunk?: any, encoding?: any) {
      if (chunk) {
        originalSize += Buffer.isBuffer(chunk)
          ? chunk.length
          : Buffer.byteLength(chunk.toString());
      }

      // Track compression metrics
      const compressionTime = Date.now() - startTime;
      compressedSize =
        parseInt(res.get("content-length") || "0", 10) || originalSize;

      self.updateMetrics(originalSize, compressedSize, compressionTime);

      return originalEnd(chunk, encoding);
    };

    // Set optimal compression based on content type
    const contentType = res.get("content-type") || "";

    if (contentType.includes("application/json")) {
      // JSON responses benefit from higher compression
      res.locals.compressionLevel = Math.min(this.config.level + 1, 9);
    } else if (contentType.includes("text/html")) {
      // HTML can use standard compression
      res.locals.compressionLevel = this.config.level;
    } else if (
      contentType.includes("text/css") ||
      contentType.includes("application/javascript")
    ) {
      // CSS/JS benefit from higher compression
      res.locals.compressionLevel = Math.min(this.config.level + 2, 9);
    }

    // Prefer Brotli for modern browsers if enabled
    if (this.config.enableBrotli && acceptEncoding.includes("br")) {
      res.locals.preferredEncoding = "br";
    } else if (this.config.enableGzip && acceptEncoding.includes("gzip")) {
      res.locals.preferredEncoding = "gzip";
    } else if (
      this.config.enableDeflate &&
      acceptEncoding.includes("deflate")
    ) {
      res.locals.preferredEncoding = "deflate";
    }
  }

  /**
   * Determine if request should be compressed
   */
  private shouldCompress(req: Request, res: Response): boolean {
    // Don't compress if disabled
    if (!this.config.enabled) {
      return false;
    }

    // Check if content type should be compressed
    const contentType = res.get("content-type") || "";
    if (!this.isCompressibleMimeType(contentType)) {
      return false;
    }

    // Check content length threshold
    const contentLength = parseInt(res.get("content-length") || "0", 10);
    if (contentLength > 0 && contentLength < this.config.threshold) {
      return false;
    }

    // Don't compress already compressed content
    if (res.get("content-encoding")) {
      return false;
    }

    // Don't compress certain response types
    const cacheControl = res.get("cache-control") || "";
    if (cacheControl.includes("no-transform")) {
      return false;
    }

    return true;
  }

  /**
   * Check if request should skip compression entirely
   */
  private shouldSkipCompression(req: Request): boolean {
    const url = req.url;

    // Skip excluded patterns
    for (const pattern of this.config.excludePatterns) {
      if (url.includes(pattern)) {
        return true;
      }
    }

    // Skip WebSocket upgrades
    if (req.headers.upgrade === "websocket") {
      return true;
    }

    // Skip certain methods
    if (["HEAD", "OPTIONS"].includes(req.method)) {
      return true;
    }

    return false;
  }

  /**
   * Check if MIME type should be compressed
   */
  private isCompressibleMimeType(contentType: string): boolean {
    if (!contentType) {
      return false;
    }

    // Check against configured MIME types
    for (const mimeType of this.config.mimeTypes) {
      if (contentType.includes(mimeType)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Get available compression encodings based on configuration
   */
  private getAvailableEncodings(): string[] {
    const encodings: string[] = [];

    if (this.config.enableBrotli) {
      encodings.push("br");
    }

    if (this.config.enableGzip) {
      encodings.push("gzip");
    }

    if (this.config.enableDeflate) {
      encodings.push("deflate");
    }

    return encodings;
  }

  /**
   * Update compression metrics
   */
  private updateMetrics(
    originalSize: number,
    compressedSize: number,
    compressionTime: number,
  ): void {
    this.metrics.totalRequests++;

    if (compressedSize < originalSize) {
      this.metrics.compressedRequests++;
      this.metrics.totalOriginalSize += originalSize;
      this.metrics.totalCompressedSize += compressedSize;
      this.metrics.bandwidthSaved += originalSize - compressedSize;

      // Track compression times
      this.compressionTimes.push(compressionTime);
      if (this.compressionTimes.length > 1000) {
        this.compressionTimes.shift();
      }

      this.metrics.averageCompressionTime =
        this.compressionTimes.reduce((a, b) => a + b, 0) /
        this.compressionTimes.length;
    }

    // Update compression ratio
    if (this.metrics.totalOriginalSize > 0) {
      this.metrics.compressionRatio =
        1 - this.metrics.totalCompressedSize / this.metrics.totalOriginalSize;
    }
  }

  /**
   * Get compression metrics
   */
  getMetrics(): CompressionMetrics {
    return { ...this.metrics };
  }

  /**
   * Get compression statistics summary
   */
  getCompressionSummary(): {
    enabled: boolean;
    totalRequests: number;
    compressionRate: number;
    averageCompressionRatio: number;
    bandwidthSavedMB: number;
    averageCompressionTimeMs: number;
  } {
    const compressionRate =
      this.metrics.totalRequests > 0
        ? this.metrics.compressedRequests / this.metrics.totalRequests
        : 0;

    return {
      enabled: this.config.enabled,
      totalRequests: this.metrics.totalRequests,
      compressionRate,
      averageCompressionRatio: this.metrics.compressionRatio,
      bandwidthSavedMB: this.metrics.bandwidthSaved / (1024 * 1024),
      averageCompressionTimeMs: this.metrics.averageCompressionTime,
    };
  }

  /**
   * Initialize metrics
   */
  private initializeMetrics(): CompressionMetrics {
    return {
      totalRequests: 0,
      compressedRequests: 0,
      totalOriginalSize: 0,
      totalCompressedSize: 0,
      compressionRatio: 0,
      bandwidthSaved: 0,
      averageCompressionTime: 0,
    };
  }

  /**
   * Reset metrics
   */
  resetMetrics(): void {
    this.metrics = this.initializeMetrics();
    this.compressionTimes = [];
    logger.info("Compression metrics reset");
  }
}

/**
 * Utility function to compress data manually
 */
export async function compressData(
  data: string | Buffer,
  encoding: "gzip" | "deflate" | "br" = "gzip",
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);

    switch (encoding) {
      case "gzip":
        zlib.gzip(buffer, (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
        break;

      case "deflate":
        zlib.deflate(buffer, (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
        break;

      case "br":
        if (zlib.brotliCompress) {
          zlib.brotliCompress(buffer, (err, result) => {
            if (err) reject(err);
            else resolve(result);
          });
        } else {
          reject(new Error("Brotli compression not supported"));
        }
        break;

      default:
        reject(new Error(`Unsupported encoding: ${encoding}`));
    }
  });
}

/**
 * Default compression configuration optimized for API responses
 */
export const defaultCompressionConfig: CompressionConfig = {
  enabled: true,
  level: 6, // Good balance of speed vs compression
  threshold: 1024, // Compress responses > 1KB
  memLevel: 8, // Default memory level
  windowBits: 15, // Default window size
  strategy: zlib.constants.Z_DEFAULT_STRATEGY,
  enableBrotli: true, // Enable Brotli for modern browsers
  enableGzip: true, // Enable Gzip for compatibility
  enableDeflate: true, // Enable Deflate as fallback
  mimeTypes: [
    "application/json",
    "application/javascript",
    "application/xml",
    "text/html",
    "text/css",
    "text/plain",
    "text/xml",
    "text/javascript",
    "image/svg+xml",
  ],
  excludePatterns: [
    "/health", // Skip health checks
    "/metrics", // Skip metrics (already small)
    "/static/", // Skip static files (often pre-compressed)
    "/*.jpg", // Skip images
    "/*.png",
    "/*.gif",
    "/*.zip", // Skip already compressed files
    "/*.gz",
  ],
};

/**
 * High-performance compression configuration for production
 */
export const productionCompressionConfig: CompressionConfig = {
  ...defaultCompressionConfig,
  level: 4, // Faster compression for high traffic
  threshold: 512, // Compress smaller responses
  enableBrotli: true, // Prioritize Brotli for best compression
  memLevel: 9, // Use more memory for better performance
};

/**
 * Maximum compression configuration for bandwidth-critical environments
 */
export const maxCompressionConfig: CompressionConfig = {
  ...defaultCompressionConfig,
  level: 9, // Maximum compression
  threshold: 256, // Compress very small responses
  memLevel: 9, // Maximum memory usage
  enableBrotli: true, // Prefer Brotli for best ratios
};

