/**
 * Steering Rule Middleware
 * 
 * This file provides Express middleware for applying steering rules to incoming requests.
 */

import { Request, Response, NextFunction } from 'express';
import { SteeringService } from './service';
import { RuleEvaluationContext } from './types';

/**
 * Options for the steering middleware
 */
export interface SteeringMiddlewareOptions {
  // Whether to apply routing decisions automatically
  applyRouting?: boolean;
  
  // Whether to reject requests that match reject rules
  applyRejection?: boolean;
  
  // Function to get the user from the request
  getUserFromRequest?: (req: Request) => any;
  
  // Function to get the organization from the request
  getOrganizationFromRequest?: (req: Request) => any;
  
  // Additional context to include in evaluation
  additionalContext?: Record<string, any> | ((req: Request) => Record<string, any>);
}

/**
 * Creates Express middleware for applying steering rules
 * 
 * @param steeringService The steering service to use
 * @param options Options for the middleware
 * @returns Express middleware function
 */
export function createSteeringMiddleware(
  steeringService: SteeringService,
  options: SteeringMiddlewareOptions = {}
) {
  const {
    applyRouting = true,
    applyRejection = true,
    getUserFromRequest = (req) => req.user,
    getOrganizationFromRequest = (req) => req.organization,
    additionalContext = {}
  } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Build the evaluation context
      const context: RuleEvaluationContext = {
        request: {
          body: req.body,
          query: req.query,
          params: req.params,
          headers: req.headers,
          method: req.method,
          path: req.path,
          url: req.url,
          ip: req.ip
        },
        user: getUserFromRequest(req),
        organization: getOrganizationFromRequest(req),
        context: typeof additionalContext === 'function' 
          ? additionalContext(req) 
          : additionalContext
      };

      // Evaluate the rules
      const { results, context: newContext } = steeringService.evaluate(context);

      // Store the results on the request for later use
      (req as any).steeringResults = results;
      (req as any).steeringContext = newContext;

      // Apply routing if enabled
      if (applyRouting && newContext.routing) {
        (req as any).routingDecision = newContext.routing;
      }

      // Apply rejection if enabled
      if (applyRejection && newContext.reject) {
        return res.status(newContext.reject.status || 400).json({
          error: newContext.reject.message || 'Request rejected by steering rule'
        });
      }

      // Continue to the next middleware
      next();
    } catch (error) {
      // Log the error and continue
      console.error('Error in steering middleware:', error);
      next(error);
    }
  };
}