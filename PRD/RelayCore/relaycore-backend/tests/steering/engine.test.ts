import { SteeringEngine } from '../../src/steering/engine';
import { SteeringRuleSet, RuleEvaluationContext } from '../../src/steering/types';

describe('SteeringEngine', () => {
  // Sample rule set for testing
  const testRuleSet: SteeringRuleSet = {
    version: '1.0',
    name: 'Test Rule Set',
    rules: [
      {
        id: 'rule1',
        name: 'Code to GPT-4',
        priority: 10,
        enabled: true,
        conditions: [
          {
            field: 'request.body.prompt',
            operator: 'contains',
            value: 'code'
          }
        ],
        operator: 'and',
        actions: [
          {
            type: 'route',
            params: {
              provider: 'openai',
              model: 'gpt-4'
            }
          }
        ],
        continue: true
      },
      {
        id: 'rule2',
        name: 'Long prompts to Claude',
        priority: 20,
        enabled: true,
        conditions: [
          {
            field: 'context.tokenCount',
            operator: 'gt',
            value: 4000
          }
        ],
        operator: 'and',
        actions: [
          {
            type: 'route',
            params: {
              provider: 'anthropic',
              model: 'claude-3-opus'
            }
          }
        ],
        continue: true
      },
      {
        id: 'rule3',
        name: 'Premium users to GPT-4',
        priority: 15,
        enabled: true,
        conditions: [
          {
            field: 'user.tier',
            operator: 'equals',
            value: 'premium'
          }
        ],
        operator: 'and',
        actions: [
          {
            type: 'route',
            params: {
              provider: 'openai',
              model: 'gpt-4'
            }
          }
        ],
        continue: true
      },
      {
        id: 'rule4',
        name: 'Reject harmful content',
        priority: 5,
        enabled: true,
        conditions: [
          {
            field: 'request.body.prompt',
            operator: 'contains',
            value: 'harmful'
          }
        ],
        operator: 'and',
        actions: [
          {
            type: 'reject',
            params: {
              message: 'Content rejected due to policy violation',
              status: 403
            }
          }
        ],
        continue: false
      },
      {
        id: 'rule5',
        name: 'Disabled rule',
        priority: 30,
        enabled: false,
        conditions: [
          {
            field: 'request.path',
            operator: 'contains',
            value: '/test'
          }
        ],
        operator: 'and',
        actions: [
          {
            type: 'log',
            params: {
              level: 'info',
              message: 'Test path detected'
            }
          }
        ],
        continue: true
      }
    ],
    defaultActions: [
      {
        type: 'route',
        params: {
          provider: 'openai',
          model: 'gpt-3.5-turbo'
        }
      }
    ]
  };

  let engine: SteeringEngine;

  beforeEach(() => {
    engine = new SteeringEngine(testRuleSet);
  });

  test('should match rule with contains operator', () => {
    const context: RuleEvaluationContext = {
      request: {
        body: {
          prompt: 'Please help me with this code snippet'
        }
      }
    };

    const { results, context: newContext } = engine.evaluate(context);
    
    expect(results[0].matched).toBe(true);
    expect(results[0].rule.id).toBe('rule1');
    expect(newContext.routing).toEqual({
      provider: 'openai',
      model: 'gpt-4'
    });
  });

  test('should match rule with gt operator', () => {
    const context: RuleEvaluationContext = {
      request: {
        body: {
          prompt: 'This is a very long prompt'
        }
      },
      context: {
        tokenCount: 5000
      }
    };

    const { results, context: newContext } = engine.evaluate(context);
    
    // First rule doesn't match
    expect(results[0].matched).toBe(false);
    
    // Second rule matches
    expect(results[1].matched).toBe(true);
    expect(results[1].rule.id).toBe('rule2');
    expect(newContext.routing).toEqual({
      provider: 'anthropic',
      model: 'claude-3-opus'
    });
  });

  test('should match rule with equals operator', () => {
    const context: RuleEvaluationContext = {
      request: {
        body: {
          prompt: 'Regular prompt'
        }
      },
      user: {
        tier: 'premium'
      }
    };

    const { results, context: newContext } = engine.evaluate(context);
    
    // First rule doesn't match
    expect(results[0].matched).toBe(false);
    
    // Third rule matches (rule2 is skipped in results because it doesn't match)
    expect(results[2].matched).toBe(true);
    expect(results[2].rule.id).toBe('rule3');
    expect(newContext.routing).toEqual({
      provider: 'openai',
      model: 'gpt-4'
    });
  });

  test('should stop evaluation when continue is false', () => {
    const context: RuleEvaluationContext = {
      request: {
        body: {
          prompt: 'This contains harmful content'
        }
      },
      user: {
        tier: 'premium'
      }
    };

    const { results, context: newContext } = engine.evaluate(context);
    
    // Rule4 matches and has continue: false
    expect(results[3].matched).toBe(true);
    expect(results[3].rule.id).toBe('rule4');
    expect(results[3].continue).toBe(false);
    expect(newContext.reject).toEqual({
      message: 'Content rejected due to policy violation',
      status: 403
    });
    
    // Only 4 results should be evaluated (rule5 is skipped)
    expect(results.length).toBe(4);
  });

  test('should skip disabled rules', () => {
    const context: RuleEvaluationContext = {
      request: {
        path: '/test',
        body: {
          prompt: 'Regular prompt'
        }
      }
    };

    const { results } = engine.evaluate(context);
    
    // Rule5 is disabled, so it shouldn't match
    const rule5Result = results.find(r => r.rule.id === 'rule5');
    expect(rule5Result?.matched).toBe(false);
  });

  test('should apply default actions when no rules match', () => {
    const context: RuleEvaluationContext = {
      request: {
        body: {
          prompt: 'Regular prompt with no special conditions'
        }
      }
    };

    const { results, context: newContext } = engine.evaluate(context);
    
    // No rules should match
    expect(results.every(r => !r.matched)).toBe(true);
    
    // Default action should be applied
    expect(newContext.routing).toEqual({
      provider: 'openai',
      model: 'gpt-3.5-turbo'
    });
  });

  test('should handle transform actions correctly', () => {
    // Add a rule with transform action for this test
    const transformRuleSet: SteeringRuleSet = {
      ...testRuleSet,
      rules: [
        ...testRuleSet.rules,
        {
          id: 'transform-rule',
          name: 'Transform Prompt',
          priority: 1,
          enabled: true,
          conditions: [
            {
              field: 'request.body.prompt',
              operator: 'exists'
            }
          ],
          operator: 'and',
          actions: [
            {
              type: 'transform',
              params: {
                transformation: {
                  field: 'request.body.prompt',
                  operation: 'append',
                  value: ' [Enhanced by RelayCore]'
                }
              }
            }
          ],
          continue: true
        }
      ]
    };

    const transformEngine = new SteeringEngine(transformRuleSet);
    
    const context: RuleEvaluationContext = {
      request: {
        body: {
          prompt: 'Original prompt'
        }
      }
    };

    const { context: newContext } = transformEngine.evaluate(context);
    
    // Prompt should be transformed
    expect(newContext.request.body.prompt).toBe('Original prompt [Enhanced by RelayCore]');
  });

  test('should handle inject actions correctly', () => {
    // Add a rule with inject action for this test
    const injectRuleSet: SteeringRuleSet = {
      ...testRuleSet,
      rules: [
        ...testRuleSet.rules,
        {
          id: 'inject-rule',
          name: 'Inject System Prompt',
          priority: 1,
          enabled: true,
          conditions: [
            {
              field: 'request.body.prompt',
              operator: 'exists'
            }
          ],
          operator: 'and',
          actions: [
            {
              type: 'inject',
              params: {
                context: {
                  field: 'request.body.system_prompt',
                  value: 'You are a helpful assistant.'
                }
              }
            }
          ],
          continue: true
        }
      ]
    };

    const injectEngine = new SteeringEngine(injectRuleSet);
    
    const context: RuleEvaluationContext = {
      request: {
        body: {
          prompt: 'Hello'
        }
      }
    };

    const { context: newContext } = injectEngine.evaluate(context);
    
    // System prompt should be injected
    expect(newContext.request.body.system_prompt).toBe('You are a helpful assistant.');
  });
});