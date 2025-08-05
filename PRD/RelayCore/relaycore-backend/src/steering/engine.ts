/**
 * Steering Rule Engine
 * 
 * This file contains the core logic for evaluating steering rules against requests
 * and determining the appropriate actions to take.
 */

import { 
  SteeringRuleSet, 
  SteeringRule, 
  RuleCondition, 
  RuleAction, 
  RuleEvaluationResult,
  RuleEvaluationContext
} from './types';
import { parseRules } from './schema';
import * as fs from 'fs';
import * as path from 'path';
import { get } from 'lodash';

/**
 * Class for evaluating steering rules
 */
export class SteeringEngine {
  private ruleSet: SteeringRuleSet;
  private logger: any;

  /**
   * Creates a new SteeringEngine
   * 
   * @param ruleSet The rule set to use, or path to a YAML file containing rules
   * @param logger Optional logger instance
   */
  constructor(ruleSet: SteeringRuleSet | string, logger?: any) {
    if (typeof ruleSet === 'string') {
      // Load rules from file
      const yamlContent = fs.readFileSync(path.resolve(ruleSet), 'utf8');
      this.ruleSet = parseRules(yamlContent);
    } else {
      this.ruleSet = ruleSet;
    }

    this.logger = logger || console;
    this.validateRuleSet();
  }

  /**
   * Validates the rule set for consistency
   */
  private validateRuleSet(): void {
    // Check for duplicate rule IDs
    const ruleIds = new Set<string>();
    for (const rule of this.ruleSet.rules) {
      if (ruleIds.has(rule.id)) {
        throw new Error(`Duplicate rule ID: ${rule.id}`);
      }
      ruleIds.add(rule.id);
    }

    // Sort rules by priority
    this.ruleSet.rules.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Evaluates a single condition against the context
   * 
   * @param condition The condition to evaluate
   * @param context The evaluation context
   * @returns Whether the condition matches
   */
  private evaluateCondition(condition: RuleCondition, context: RuleEvaluationContext): boolean {
    const { field, operator, value } = condition;
    
    // Get the field value from the context using lodash get for nested properties
    const fieldValue = get(context, field);
    
    // Evaluate based on operator
    switch (operator) {
      case 'equals':
        return fieldValue === value;
      
      case 'not_equals':
        return fieldValue !== value;
      
      case 'contains':
        if (typeof fieldValue === 'string' && typeof value === 'string') {
          return fieldValue.includes(value);
        } else if (Array.isArray(fieldValue)) {
          return fieldValue.includes(value);
        }
        return false;
      
      case 'not_contains':
        if (typeof fieldValue === 'string' && typeof value === 'string') {
          return !fieldValue.includes(value);
        } else if (Array.isArray(fieldValue)) {
          return !fieldValue.includes(value);
        }
        return true;
      
      case 'regex':
        if (typeof fieldValue === 'string' && typeof value === 'string') {
          const regex = new RegExp(value);
          return regex.test(fieldValue);
        }
        return false;
      
      case 'gt':
        return typeof fieldValue === 'number' && typeof value === 'number' && fieldValue > value;
      
      case 'lt':
        return typeof fieldValue === 'number' && typeof value === 'number' && fieldValue < value;
      
      case 'gte':
        return typeof fieldValue === 'number' && typeof value === 'number' && fieldValue >= value;
      
      case 'lte':
        return typeof fieldValue === 'number' && typeof value === 'number' && fieldValue <= value;
      
      case 'in':
        return Array.isArray(value) && value.includes(fieldValue);
      
      case 'not_in':
        return Array.isArray(value) && !value.includes(fieldValue);
      
      case 'exists':
        return fieldValue !== undefined && fieldValue !== null;
      
      case 'not_exists':
        return fieldValue === undefined || fieldValue === null;
      
      default:
        this.logger.warn(`Unknown operator: ${operator}`);
        return false;
    }
  }

  /**
   * Evaluates a rule against the context
   * 
   * @param rule The rule to evaluate
   * @param context The evaluation context
   * @returns Whether the rule matches
   */
  private evaluateRule(rule: SteeringRule, context: RuleEvaluationContext): boolean {
    // Skip disabled rules
    if (!rule.enabled) {
      return false;
    }

    // Evaluate all conditions
    const results = rule.conditions.map(condition => this.evaluateCondition(condition, context));
    
    // Combine results based on operator
    if (rule.operator === 'and') {
      return results.every(result => result);
    } else {
      return results.some(result => result);
    }
  }

  /**
   * Applies a single action to the context
   * 
   * @param action The action to apply
   * @param context The evaluation context
   * @returns The modified context
   */
  private applyAction(action: RuleAction, context: RuleEvaluationContext): RuleEvaluationContext {
    const { type, params } = action;
    
    // Create a deep copy of the context to avoid modifying the original
    const newContext = JSON.parse(JSON.stringify(context));
    
    switch (type) {
      case 'route':
        // Set the provider and model for routing
        newContext.routing = newContext.routing || {};
        if (params.provider) {
          newContext.routing.provider = params.provider;
        }
        if (params.model) {
          newContext.routing.model = params.model;
        }
        break;
      
      case 'transform':
        if (params.transformation) {
          const { field, operation, value } = params.transformation;
          const currentValue = get(newContext, field);
          
          switch (operation) {
            case 'replace':
              // Set the field to the new value
              this.setNestedProperty(newContext, field, value);
              break;
            
            case 'append':
              if (typeof currentValue === 'string' && typeof value === 'string') {
                this.setNestedProperty(newContext, field, currentValue + value);
              } else if (Array.isArray(currentValue)) {
                const newArray = [...currentValue];
                if (Array.isArray(value)) {
                  newArray.push(...value);
                } else {
                  newArray.push(value);
                }
                this.setNestedProperty(newContext, field, newArray);
              }
              break;
            
            case 'prepend':
              if (typeof currentValue === 'string' && typeof value === 'string') {
                this.setNestedProperty(newContext, field, value + currentValue);
              } else if (Array.isArray(currentValue)) {
                const newArray = Array.isArray(value) ? [...value] : [value];
                newArray.push(...currentValue);
                this.setNestedProperty(newContext, field, newArray);
              }
              break;
            
            case 'delete':
              this.deleteNestedProperty(newContext, field);
              break;
          }
        }
        break;
      
      case 'inject':
        if (params.context) {
          const { field, value } = params.context;
          this.setNestedProperty(newContext, field, value);
        }
        break;
      
      case 'reject':
        newContext.reject = {
          message: params.message || 'Request rejected by steering rule',
          status: params.status || 400
        };
        break;
      
      case 'log':
        const level = params.level || 'info';
        const message = `Rule action: ${JSON.stringify(params)}`;
        
        if (this.logger) {
          if (typeof this.logger[level] === 'function') {
            this.logger[level](message);
          } else {
            this.logger.info(message);
          }
        }
        break;
    }
    
    return newContext;
  }

  /**
   * Sets a nested property in an object
   * 
   * @param obj The object to modify
   * @param path The path to the property
   * @param value The value to set
   */
  private setNestedProperty(obj: any, path: string, value: any): void {
    const parts = path.split('.');
    let current = obj;
    
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!current[part]) {
        current[part] = {};
      }
      current = current[part];
    }
    
    current[parts[parts.length - 1]] = value;
  }

  /**
   * Deletes a nested property in an object
   * 
   * @param obj The object to modify
   * @param path The path to the property
   */
  private deleteNestedProperty(obj: any, path: string): void {
    const parts = path.split('.');
    let current = obj;
    
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!current[part]) {
        return; // Property doesn't exist
      }
      current = current[part];
    }
    
    delete current[parts[parts.length - 1]];
  }

  /**
   * Evaluates all rules against the context
   * 
   * @param context The evaluation context
   * @returns The evaluation results and modified context
   */
  public evaluate(context: RuleEvaluationContext): { 
    results: RuleEvaluationResult[],
    context: RuleEvaluationContext 
  } {
    let currentContext = { ...context };
    const results: RuleEvaluationResult[] = [];
    
    // Evaluate each rule in priority order
    for (const rule of this.ruleSet.rules) {
      const matched = this.evaluateRule(rule, currentContext);
      
      if (matched) {
        // Apply all actions for this rule
        for (const action of rule.actions) {
          currentContext = this.applyAction(action, currentContext);
        }
        
        // Record the result
        results.push({
          matched: true,
          rule,
          actions: rule.actions,
          continue: rule.continue
        });
        
        // Stop if the rule says not to continue
        if (!rule.continue) {
          break;
        }
      } else {
        // Record the non-match
        results.push({
          matched: false,
          rule,
          actions: [],
          continue: true
        });
      }
    }
    
    // Apply default actions if no rules matched
    if (results.every(result => !result.matched) && this.ruleSet.defaultActions) {
      for (const action of this.ruleSet.defaultActions) {
        currentContext = this.applyAction(action, currentContext);
      }
    }
    
    return { results, context: currentContext };
  }

  /**
   * Gets the current rule set
   */
  public getRuleSet(): SteeringRuleSet {
    return this.ruleSet;
  }

  /**
   * Updates the rule set
   * 
   * @param ruleSet The new rule set
   */
  public updateRuleSet(ruleSet: SteeringRuleSet): void {
    this.ruleSet = ruleSet;
    this.validateRuleSet();
  }
}