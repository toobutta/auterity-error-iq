/**
 * RelayCore Logger Utility
 * Centralized logging configuration
 */

import winston from "winston";

const logLevel = process.env.LOG_LEVEL || "info";
const environment = process.env.NODE_ENV || "development";

// Create logger instance
export const logger = winston.createLogger({
  level: logLevel,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  ),
  defaultMeta: {
    service: "relaycore",
    environment,
  },
  transports: [
    // Console transport for development
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          return `${timestamp} [${level}]: ${message} ${Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ""}`;
        }),
      ),
    }),
  ],
});

// Add file transport for production
if (environment === "production") {
  logger.add(
    new winston.transports.File({
      filename: "logs/error.log",
      level: "error",
    }),
  );

  logger.add(
    new winston.transports.File({
      filename: "logs/combined.log",
    }),
  );
}

export default logger;

