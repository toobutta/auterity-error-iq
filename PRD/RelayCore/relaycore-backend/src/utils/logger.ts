import winston from 'winston';
import { configManager } from '../config/configManager';

const config = configManager.getConfig();
const logLevel = process.env.LOG_LEVEL || config.server?.logging?.level || 'info';
const logFormat = process.env.LOG_FORMAT || config.server?.logging?.format || 'json';

// Define log format
const formats = {
  json: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  text: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ level, message, timestamp, ...meta }) => {
      return `${timestamp} ${level.toUpperCase()}: ${message} ${
        Object.keys(meta).length ? JSON.stringify(meta) : ''
      }`;
    })
  ),
};

// Create logger
const logger = winston.createLogger({
  level: logLevel,
  format: formats[logFormat as keyof typeof formats] || formats.json,
  defaultMeta: { service: 'relaycore' },
  transports: [
    new winston.transports.Console(),
  ],
});

// Add file transport if configured
if (config.server?.logging?.destination === 'file' && config.server?.logging?.file) {
  logger.add(
    new winston.transports.File({ 
      filename: config.server.logging.file,
      maxsize: 10485760, // 10MB
      maxFiles: 5,
      tailable: true,
    })
  );
}

export { logger };