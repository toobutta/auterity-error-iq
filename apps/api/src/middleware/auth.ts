import { NextFunction, Request, Response } from 'express';
import { config } from '../config.js';

export function authenticateApiKey(req: Request, res: Response, next: NextFunction) {
  const apiKey = req.headers['x-api-key'] as string;
  
  if (!apiKey) {
    return res.status(401).json({ error: 'API key required' });
  }
  
  if (apiKey !== config.apiKey) {
    return res.status(401).json({ error: 'Invalid API key' });
  }
  
  next();
}

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  console.error('Error:', err);
  
  if (err.type === 'validation') {
    return res.status(400).json({ 
      error: 'Validation failed', 
      details: err.errors 
    });
  }
  
  if (err.type === 'etag_mismatch') {
    return res.status(409).json({ 
      error: 'ETag mismatch - resource has been modified' 
    });
  }
  
  res.status(500).json({ error: 'Internal server error' });
}
