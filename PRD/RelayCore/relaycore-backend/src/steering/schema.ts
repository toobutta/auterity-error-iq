/**
 * Schema validation for steering rules
 * 
 * This file provides functions to validate YAML steering rules against the expected schema.
 */

import * as yaml from 'js-yaml';
import { SteeringRuleSet, SteeringRule, RuleCondition, RuleAction } from './types';

/**
 * Error thrown when rule validation fails
 */
export class RuleValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RuleValidationError';
  }
}

/**
 * Validates a condition object
 */
function validateCondition(condition: any, ruleId: string): RuleCondition {
  if (!condition.field || typeof condition.field !== 'string') {
    throw new RuleValidationError(`Rule ${ruleId}: Condition must have a valid 'field' property`);
  }

  const validOperators = [
    'equals', 'not_equals', 'contains', 'not_contains', 'regex',
    'gt', 'lt', 'gte', 'lte', 'in', 'not_in', 'exists', 'not_exists'
  ];

  if (!condition.operator || !validOperators.includes(condition.operator)) {
    throw new RuleValidationError(
      `Rule ${ruleId}: Condition must have a valid 'operator' property (${validOperators.join(', ')})`
    );
  }

  // Check if value is required for this operator
  const operatorsRequiringValue = [
    'equals', 'not_equals', 'contains', 'not_contains', 'regex',
    'gt', 'lt', 'gte', 'lte', 'in', 'not_in'
  ];

  if (operatorsRequiringValue.includes(condition.operator) && condition.value === undefined) {
    throw new RuleValidationError(
      `Rule ${ruleId}: Condition with operator '${condition.operator}' must have a 'value' property`
    );
  }

  // For 'in' and 'not_in' operators, value must be an array
  if (['in', 'not_in'].includes(condition.operator) && !Array.isArray(condition.value)) {
    throw new RuleValidationError(
      `Rule ${ruleId}: Condition with operator '${condition.operator}' must have an array 'value'`
    );
  }

  return condition as RuleCondition;
}

/**
 * Validates an action object
 */
function validateAction(action: any, ruleId: string): RuleAction {
  const validActionTypes = ['route', 'transform', 'inject', 'reject', 'log'];
  
  if (!action.type || !validActionTypes.includes(action.type)) {
    throw new RuleValidationError(
      `Rule ${ruleId}: Action must have a valid 'type' property (${validActionTypes.join(', ')})`
    );
  }

  if (!action.params || typeof action.params !== 'object') {
    throw new RuleValidationError(`Rule ${ruleId}: Action must have a 'params' object`);
  }

  // Validate params based on action type
  switch (action.type) {
    case 'route':
      if (!action.params.provider) {
        throw new RuleValidationError(`Rule ${ruleId}: 'route' action must specify a 'provider'`);
      }
      break;
    
    case 'transform':
      if (!action.params.transformation || !action.params.transformation.field || !action.params.transformation.operation) {
        throw new RuleValidationError(
          `Rule ${ruleId}: 'transform' action must have a valid 'transformation' object with 'field' and 'operation'`
        );
      }
      
      const validOperations = ['replace', 'append', 'prepend', 'delete'];
      if (!validOperations.includes(action.params.transformation.operation)) {
        throw new RuleValidationError(
          `Rule ${ruleId}: 'transform' action must have a valid 'operation' (${validOperations.join(', ')})`
        );
      }
      
      if (action.params.transformation.operation !== 'delete' && action.params.transformation.value === undefined) {
        throw new RuleValidationError(
          `Rule ${ruleId}: 'transform' action with operation '${action.params.transformation.operation}' must have a 'value'`
        );
      }
      break;
    
    case 'inject':
      if (!action.params.context || !action.params.context.field || action.params.context.value === undefined) {
        throw new RuleValidationError(
          `Rule ${ruleId}: 'inject' action must have a valid 'context' object with 'field' and 'value'`
        );
      }
      break;
    
    case 'reject':
      if (!action.params.message) {
        throw new RuleValidationError(`Rule ${ruleId}: 'reject' action must have a 'message'`);
      }
      break;
    
    case 'log':
      const validLogLevels = ['debug', 'info', 'warn', 'error'];
      if (!action.params.level || !validLogLevels.includes(action.params.level)) {
        throw new RuleValidationError(
          `Rule ${ruleId}: 'log' action must have a valid 'level' (${validLogLevels.join(', ')})`
        );
      }
      break;
  }

  return action as RuleAction;
}

/**
 * Validates a rule object
 */
function validateRule(rule: any): SteeringRule {
  if (!rule.id || typeof rule.id !== 'string') {
    throw new RuleValidationError('Rule must have a valid string ID');
  }

  if (!rule.name || typeof rule.name !== 'string') {
    throw new RuleValidationError(`Rule ${rule.id}: Must have a valid 'name' property`);
  }

  if (rule.priority === undefined || typeof rule.priority !== 'number') {
    throw new RuleValidationError(`Rule ${rule.id}: Must have a valid numeric 'priority'`);
  }

  if (rule.enabled === undefined || typeof rule.enabled !== 'boolean') {
    throw new RuleValidationError(`Rule ${rule.id}: Must have a valid boolean 'enabled' property`);
  }

  if (!rule.conditions || !Array.isArray(rule.conditions) || rule.conditions.length === 0) {
    throw new RuleValidationError(`Rule ${rule.id}: Must have at least one condition`);
  }

  if (!rule.operator || !['and', 'or'].includes(rule.operator)) {
    throw new RuleValidationError(`Rule ${rule.id}: Must have a valid 'operator' ('and' or 'or')`);
  }

  if (!rule.actions || !Array.isArray(rule.actions) || rule.actions.length === 0) {
    throw new RuleValidationError(`Rule ${rule.id}: Must have at least one action`);
  }

  if (rule.continue === undefined || typeof rule.continue !== 'boolean') {
    throw new RuleValidationError(`Rule ${rule.id}: Must have a valid boolean 'continue' property`);
  }

  // Validate each condition
  const validatedConditions = rule.conditions.map((condition: any) => validateCondition(condition, rule.id));

  // Validate each action
  const validatedActions = rule.actions.map((action: any) => validateAction(action, rule.id));

  return {
    ...rule,
    conditions: validatedConditions,
    actions: validatedActions
  } as SteeringRule;
}

/**
 * Validates a rule set object
 */
function validateRuleSet(ruleSet: any): SteeringRuleSet {
  if (!ruleSet.version || typeof ruleSet.version !== 'string') {
    throw new RuleValidationError('Rule set must have a valid version');
  }

  if (!ruleSet.name || typeof ruleSet.name !== 'string') {
    throw new RuleValidationError('Rule set must have a valid name');
  }

  if (!ruleSet.rules || !Array.isArray(ruleSet.rules)) {
    throw new RuleValidationError('Rule set must have an array of rules');
  }

  // Validate each rule
  const validatedRules = ruleSet.rules.map(validateRule);

  // Validate default actions if present
  let validatedDefaultActions: RuleAction[] | undefined = undefined;
  if (ruleSet.defaultActions) {
    if (!Array.isArray(ruleSet.defaultActions)) {
      throw new RuleValidationError('Rule set defaultActions must be an array');
    }
    validatedDefaultActions = ruleSet.defaultActions.map((action: any) => validateAction(action, 'default'));
  }

  return {
    ...ruleSet,
    rules: validatedRules,
    defaultActions: validatedDefaultActions
  } as SteeringRuleSet;
}

/**
 * Parses and validates a YAML string containing steering rules
 */
export function parseRules(yamlString: string): SteeringRuleSet {
  try {
    const parsed = yaml.load(yamlString) as any;
    return validateRuleSet(parsed);
  } catch (error) {
    if (error instanceof RuleValidationError) {
      throw error;
    } else if (error instanceof Error) {
      throw new RuleValidationError(`Failed to parse YAML: ${error.message}`);
    } else {
      throw new RuleValidationError('Unknown error parsing YAML');
    }
  }
}

/**
 * Serializes a rule set to YAML
 */
export function serializeRules(ruleSet: SteeringRuleSet): string {
  return yaml.dump(ruleSet);
}