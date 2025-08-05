/**
 * Logger utility
 */

import winston from 'winston';

/**
 * Create a logger instance
 * 
 * @param module Optional module name for context
 * @returns Winston logger instance
 */
export function createLogger(module?: string): winston.Logger {
  const logLevel = process.env.LOG_LEVEL || 'info';
  
  const logger = winston.createLogger({
    level: logLevel,
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json()
    ),
    defaultMeta: { service: 'cost-aware-model-switching', module },
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.printf(({ timestamp, level, message, module, ...meta }) => {
            const context = module ? `[${module}]` : '';
            const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
            return `${timestamp} ${level} ${context}: ${message} ${metaStr}`;
          })
        )
      })
    ]
  });

  // Add file transport in production
  if (process.env.NODE_ENV === 'production') {
    logger.add(
      new winston.transports.File({ 
        filename: 'logs/error.log', 
        level: 'error',
        maxsize: 10485760, // 10MB
        maxFiles: 5
      })
    );
    
    logger.add(
      new winston.transports.File({ 
        filename: 'logs/combined.log',
        maxsize: 10485760, // 10MB
        maxFiles: 5
      })
    );
  }

  return logger;
}