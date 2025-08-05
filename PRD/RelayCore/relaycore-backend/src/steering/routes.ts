/**
 * Steering Rule Routes
 * 
 * This file defines the Express routes for managing steering rules.
 */

import { Router } from 'express';
import { SteeringController } from './controller';
import { SteeringService } from './service';

/**
 * Creates Express routes for managing steering rules
 * 
 * @param steeringService The steering service to use
 * @returns Express router
 */
export function createSteeringRoutes(steeringService: SteeringService): Router {
  const router = Router();
  const controller = new SteeringController(steeringService);

  // Get all rules
  router.get('/', controller.getRules);

  // Create a new rule
  router.post('/', controller.createRule);

  // Get a specific rule
  router.get('/:id', controller.getRule);

  // Update a rule
  router.put('/:id', controller.updateRule);

  // Delete a rule
  router.delete('/:id', controller.deleteRule);

  // Update rule priorities
  router.post('/priorities', controller.updatePriorities);

  // Update default actions
  router.post('/default-actions', controller.updateDefaultActions);

  // Test a rule
  router.post('/test', controller.testRule);

  // Reload rules from file
  router.post('/reload', controller.reloadRules);

  return router;
}