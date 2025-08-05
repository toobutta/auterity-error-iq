/**
 * Steering Rule Controller
 * 
 * This file provides API endpoints for managing steering rules.
 */

import { Request, Response } from 'express';
import { SteeringService } from './service';
import { SteeringRule, SteeringRuleSet } from './types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Controller for managing steering rules
 */
export class SteeringController {
  /**
   * Creates a new SteeringController
   * 
   * @param steeringService The steering service to use
   */
  constructor(private steeringService: SteeringService) {}

  /**
   * Gets all rules
   */
  public getRules = (req: Request, res: Response): void => {
    try {
      const ruleSet = this.steeringService.getRuleSet();
      res.json(ruleSet);
    } catch (error) {
      res.status(500).json({ error: `Failed to get rules: ${error}` });
    }
  };

  /**
   * Gets a specific rule by ID
   */
  public getRule = (req: Request, res: Response): void => {
    try {
      const { id } = req.params;
      const ruleSet = this.steeringService.getRuleSet();
      const rule = ruleSet.rules.find(r => r.id === id);
      
      if (!rule) {
        res.status(404).json({ error: `Rule with ID ${id} not found` });
        return;
      }
      
      res.json(rule);
    } catch (error) {
      res.status(500).json({ error: `Failed to get rule: ${error}` });
    }
  };

  /**
   * Creates a new rule
   */
  public createRule = (req: Request, res: Response): void => {
    try {
      const ruleData = req.body;
      
      // Generate ID if not provided
      if (!ruleData.id) {
        ruleData.id = uuidv4();
      }
      
      // Set default values if not provided
      if (ruleData.enabled === undefined) {
        ruleData.enabled = true;
      }
      
      if (ruleData.continue === undefined) {
        ruleData.continue = true;
      }
      
      if (!ruleData.priority) {
        // Set priority to be higher than any existing rule
        const ruleSet = this.steeringService.getRuleSet();
        const maxPriority = ruleSet.rules.reduce((max, rule) => Math.max(max, rule.priority), 0);
        ruleData.priority = maxPriority + 10;
      }
      
      // Add metadata
      ruleData.metadata = {
        ...ruleData.metadata,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Add the rule
      this.steeringService.addRule(ruleData as SteeringRule);
      
      res.status(201).json(ruleData);
    } catch (error) {
      res.status(400).json({ error: `Failed to create rule: ${error}` });
    }
  };

  /**
   * Updates an existing rule
   */
  public updateRule = (req: Request, res: Response): void => {
    try {
      const { id } = req.params;
      const ruleData = req.body;
      
      // Ensure ID matches
      if (ruleData.id && ruleData.id !== id) {
        res.status(400).json({ error: 'Rule ID in body does not match URL parameter' });
        return;
      }
      
      ruleData.id = id;
      
      // Get the existing rule to merge with updates
      const ruleSet = this.steeringService.getRuleSet();
      const existingRule = ruleSet.rules.find(r => r.id === id);
      
      if (!existingRule) {
        res.status(404).json({ error: `Rule with ID ${id} not found` });
        return;
      }
      
      // Update metadata
      ruleData.metadata = {
        ...existingRule.metadata,
        ...ruleData.metadata,
        updatedAt: new Date().toISOString()
      };
      
      // Merge with existing rule
      const updatedRule = {
        ...existingRule,
        ...ruleData
      };
      
      // Update the rule
      this.steeringService.updateRule(updatedRule);
      
      res.json(updatedRule);
    } catch (error) {
      res.status(400).json({ error: `Failed to update rule: ${error}` });
    }
  };

  /**
   * Deletes a rule
   */
  public deleteRule = (req: Request, res: Response): void => {
    try {
      const { id } = req.params;
      
      // Delete the rule
      this.steeringService.deleteRule(id);
      
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ error: `Failed to delete rule: ${error}` });
    }
  };

  /**
   * Updates rule priorities
   */
  public updatePriorities = (req: Request, res: Response): void => {
    try {
      const { priorities } = req.body;
      
      if (!Array.isArray(priorities)) {
        res.status(400).json({ error: 'Priorities must be an array' });
        return;
      }
      
      // Get the current rule set
      const ruleSet = this.steeringService.getRuleSet();
      
      // Update priorities
      for (const { id, priority } of priorities) {
        const rule = ruleSet.rules.find(r => r.id === id);
        if (rule) {
          rule.priority = priority;
        }
      }
      
      // Sort by priority
      ruleSet.rules.sort((a, b) => a.priority - b.priority);
      
      // Update the rule set
      this.steeringService.updateRuleSet(ruleSet);
      
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ error: `Failed to update priorities: ${error}` });
    }
  };

  /**
   * Updates the default actions
   */
  public updateDefaultActions = (req: Request, res: Response): void => {
    try {
      const { defaultActions } = req.body;
      
      if (!Array.isArray(defaultActions)) {
        res.status(400).json({ error: 'Default actions must be an array' });
        return;
      }
      
      // Update default actions
      this.steeringService.updateDefaultActions(defaultActions);
      
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ error: `Failed to update default actions: ${error}` });
    }
  };

  /**
   * Tests a rule against a sample request
   */
  public testRule = (req: Request, res: Response): void => {
    try {
      const { rule, context } = req.body;
      
      if (!rule || !context) {
        res.status(400).json({ error: 'Both rule and context are required' });
        return;
      }
      
      // Create a temporary rule set with just this rule
      const tempRuleSet: SteeringRuleSet = {
        version: '1.0',
        name: 'Test Rule Set',
        rules: [rule],
        defaultActions: []
      };
      
      // Create a temporary engine
      const tempEngine = new SteeringService.prototype.constructor.prototype.engine.constructor(tempRuleSet);
      
      // Evaluate the rule
      const result = tempEngine.evaluate(context);
      
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: `Failed to test rule: ${error}` });
    }
  };

  /**
   * Reloads rules from the file
   */
  public reloadRules = (req: Request, res: Response): void => {
    try {
      this.steeringService.reloadRules();
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: `Failed to reload rules: ${error}` });
    }
  };
}