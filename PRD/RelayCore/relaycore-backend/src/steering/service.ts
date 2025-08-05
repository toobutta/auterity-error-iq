/**
 * Steering Rule Service
 * 
 * This file provides a service for managing and applying steering rules.
 */

import { SteeringEngine } from './engine';
import { SteeringRuleSet, SteeringRule, RuleEvaluationContext } from './types';
import { parseRules, serializeRules } from './schema';
import * as fs from 'fs';
import * as path from 'path';
import { EventEmitter } from 'events';

/**
 * Service for managing steering rules
 */
export class SteeringService extends EventEmitter {
  private engine: SteeringEngine;
  private rulesFilePath: string;
  private watchInterval: NodeJS.Timeout | null = null;
  private lastModified: Date | null = null;

  /**
   * Creates a new SteeringService
   * 
   * @param rulesFilePath Path to the rules YAML file
   * @param logger Optional logger instance
   * @param watchForChanges Whether to watch for file changes
   */
  constructor(rulesFilePath: string, private logger: any = console, watchForChanges = false) {
    super();
    this.rulesFilePath = path.resolve(rulesFilePath);
    
    // Create default rules file if it doesn't exist
    if (!fs.existsSync(this.rulesFilePath)) {
      const defaultRules: SteeringRuleSet = {
        version: '1.0',
        name: 'Default Rule Set',
        description: 'Default steering rules',
        rules: [],
        defaultActions: [
          {
            type: 'route',
            params: {
              provider: 'default'
            }
          }
        ]
      };
      
      // Ensure directory exists
      const dir = path.dirname(this.rulesFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.writeFileSync(this.rulesFilePath, serializeRules(defaultRules), 'utf8');
    }
    
    // Initialize the engine
    this.engine = new SteeringEngine(this.rulesFilePath, logger);
    
    // Set up file watching if requested
    if (watchForChanges) {
      this.startWatching();
    }
  }

  /**
   * Starts watching the rules file for changes
   */
  public startWatching(): void {
    if (this.watchInterval) {
      return; // Already watching
    }
    
    this.lastModified = fs.statSync(this.rulesFilePath).mtime;
    
    this.watchInterval = setInterval(() => {
      try {
        const stats = fs.statSync(this.rulesFilePath);
        if (this.lastModified && stats.mtime > this.lastModified) {
          this.logger.info(`Rules file changed, reloading: ${this.rulesFilePath}`);
          this.reloadRules();
          this.lastModified = stats.mtime;
        }
      } catch (error) {
        this.logger.error(`Error checking rules file: ${error}`);
      }
    }, 5000); // Check every 5 seconds
  }

  /**
   * Stops watching the rules file
   */
  public stopWatching(): void {
    if (this.watchInterval) {
      clearInterval(this.watchInterval);
      this.watchInterval = null;
    }
  }

  /**
   * Reloads rules from the file
   */
  public reloadRules(): void {
    try {
      const yamlContent = fs.readFileSync(this.rulesFilePath, 'utf8');
      const ruleSet = parseRules(yamlContent);
      this.engine.updateRuleSet(ruleSet);
      this.emit('rulesReloaded', ruleSet);
    } catch (error) {
      this.logger.error(`Error reloading rules: ${error}`);
      this.emit('error', error);
    }
  }

  /**
   * Gets the current rule set
   */
  public getRuleSet(): SteeringRuleSet {
    return this.engine.getRuleSet();
  }

  /**
   * Updates the rule set and saves it to the file
   * 
   * @param ruleSet The new rule set
   */
  public updateRuleSet(ruleSet: SteeringRuleSet): void {
    try {
      // Validate by parsing
      parseRules(serializeRules(ruleSet));
      
      // Update the engine
      this.engine.updateRuleSet(ruleSet);
      
      // Save to file
      fs.writeFileSync(this.rulesFilePath, serializeRules(ruleSet), 'utf8');
      
      this.emit('rulesUpdated', ruleSet);
    } catch (error) {
      this.logger.error(`Error updating rules: ${error}`);
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Adds a new rule to the rule set
   * 
   * @param rule The rule to add
   */
  public addRule(rule: SteeringRule): void {
    const ruleSet = this.getRuleSet();
    
    // Check for duplicate ID
    if (ruleSet.rules.some(r => r.id === rule.id)) {
      throw new Error(`Rule with ID ${rule.id} already exists`);
    }
    
    // Add the rule
    ruleSet.rules.push(rule);
    
    // Sort by priority
    ruleSet.rules.sort((a, b) => a.priority - b.priority);
    
    // Update the rule set
    this.updateRuleSet(ruleSet);
  }

  /**
   * Updates an existing rule
   * 
   * @param rule The updated rule
   */
  public updateRule(rule: SteeringRule): void {
    const ruleSet = this.getRuleSet();
    
    // Find the rule
    const index = ruleSet.rules.findIndex(r => r.id === rule.id);
    if (index === -1) {
      throw new Error(`Rule with ID ${rule.id} not found`);
    }
    
    // Update the rule
    ruleSet.rules[index] = rule;
    
    // Sort by priority
    ruleSet.rules.sort((a, b) => a.priority - b.priority);
    
    // Update the rule set
    this.updateRuleSet(ruleSet);
  }

  /**
   * Deletes a rule
   * 
   * @param ruleId The ID of the rule to delete
   */
  public deleteRule(ruleId: string): void {
    const ruleSet = this.getRuleSet();
    
    // Find the rule
    const index = ruleSet.rules.findIndex(r => r.id === ruleId);
    if (index === -1) {
      throw new Error(`Rule with ID ${ruleId} not found`);
    }
    
    // Remove the rule
    ruleSet.rules.splice(index, 1);
    
    // Update the rule set
    this.updateRuleSet(ruleSet);
  }

  /**
   * Updates the default actions
   * 
   * @param defaultActions The new default actions
   */
  public updateDefaultActions(defaultActions: SteeringRuleSet['defaultActions']): void {
    const ruleSet = this.getRuleSet();
    ruleSet.defaultActions = defaultActions;
    this.updateRuleSet(ruleSet);
  }

  /**
   * Evaluates the rules against a context
   * 
   * @param context The evaluation context
   * @returns The evaluation results and modified context
   */
  public evaluate(context: RuleEvaluationContext): ReturnType<SteeringEngine['evaluate']> {
    return this.engine.evaluate(context);
  }

  /**
   * Cleans up resources
   */
  public dispose(): void {
    this.stopWatching();
    this.removeAllListeners();
  }
}