/**
 * Log Sanitization Utilities
 * Prevents log injection attacks by sanitizing user input
 */

export const sanitizeForLog = (input: any): string => {
  if (typeof input !== "string") {
    input = String(input);
  }

  // Remove newlines, carriage returns, and other control characters
  return input
    .replace(/[\r\n\t]/g, " ")
    .replace(/[\x00-\x1f\x7f-\x9f]/g, "")
    .substring(0, 1000); // Limit length
};

export const sanitizeObject = (obj: any): any => {
  if (typeof obj === "string") {
    return sanitizeForLog(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }

  if (obj && typeof obj === "object") {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[sanitizeForLog(key)] = sanitizeObject(value);
    }
    return sanitized;
  }

  return obj;
};

