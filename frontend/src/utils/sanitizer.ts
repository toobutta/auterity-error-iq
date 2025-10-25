export const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>]/g, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+=/gi, "")
    .trim();
};

export const sanitizeLog = (input: string): string => {
  return input.replace(/[\r\n]/g, " ").trim();
};

export const sanitizeJSON = (obj: unknown): unknown => {
  if (typeof obj === "string") {
    return sanitizeInput(obj);
  }
  if (Array.isArray(obj)) {
    return obj.map(sanitizeJSON);
  }
  if (obj && typeof obj === "object") {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[sanitizeInput(key)] = sanitizeJSON(value);
    }
    return sanitized;
  }
  return obj;
};


