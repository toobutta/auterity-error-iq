/**
 * Express application for Cost-Aware Model Switching
 * 
 * This file exports the Express application without starting the server,
 * which is useful for testing.
 */

import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createLogger } from './utils/logger';
import budgetRoutes from './routes/budget.routes';
import modelRoutes from './routes/model.routes';
import costRoutes from './routes/cost.routes';
import selectionRoutes from './routes/selection.routes';
import webhookRoutes from './routes/webhook.routes';
import explainerRoutes from './routes/explainer.routes';

// Load environment variables
dotenv.config();

// Create logger
const logger = createLogger();

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/v1/budgets', budgetRoutes);
app.use('/api/v1/models', modelRoutes);
app.use('/api/v1/cost-analysis', costRoutes);
app.use('/api/v1/models/select', selectionRoutes);
app.use('/api/v1/webhooks', webhookRoutes);
app.use('/api/v1/explainer', explainerRoutes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
      status: err.status || 500
    }
  });
});

export default app;