import { SteeringService } from '../../src/steering/service';
import * as fs from 'fs';
import * as path from 'path';
import { SteeringRuleSet, SteeringRule } from '../../src/steering/types';

// Mock fs module
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  writeFileSync: jest.fn(),
  readFileSync: jest.fn(),
  mkdirSync: jest.fn(),
  statSync: jest.fn(() => ({ mtime: new Date() }))
}));

describe('SteeringService', () => {
  const testRulesPath = '/test/rules.yaml';
  const mockLogger = {
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn()
  };

  // Sample rule set for testing
  const testRuleSet: SteeringRuleSet = {
    version: '1.0',
    name: 'Test Rule Set',
    rules: [
      {
        id: 'rule1',
        name: 'Test Rule 1',
        priority: 10,
        enabled: true,
        conditions: [
          {
            field: 'request.body.prompt',
            operator: 'contains',
            value: 'test'
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

  // Sample rule for testing
  const testRule: SteeringRule = {
    id: 'rule2',
    name: 'Test Rule 2',
    priority: 20,
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
          provider: 'anthropic',
          model: 'claude-3-opus'
        }
      }
    ],
    continue: true
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock file existence check
    (fs.existsSync as jest.Mock).mockReturnValue(false);
    
    // Mock file read
    (fs.readFileSync as jest.Mock).mockImplementation((filePath) => {
      if (filePath === path.resolve(testRulesPath)) {
        return JSON.stringify(testRuleSet);
      }
      throw new Error(`Unexpected file path: ${filePath}`);
    });
  });

  test('should create default rules file if it does not exist', () => {
    new SteeringService(testRulesPath, mockLogger);
    
    expect(fs.existsSync).toHaveBeenCalledWith(path.resolve(testRulesPath));
    expect(fs.writeFileSync).toHaveBeenCalled();
  });

  test('should not create default rules file if it exists', () => {
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    
    new SteeringService(testRulesPath, mockLogger);
    
    expect(fs.existsSync).toHaveBeenCalledWith(path.resolve(testRulesPath));
    expect(fs.writeFileSync).not.toHaveBeenCalled();
  });

  test('should get rule set', () => {
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    
    const service = new SteeringService(testRulesPath, mockLogger);
    const ruleSet = service.getRuleSet();
    
    expect(ruleSet).toBeDefined();
  });

  test('should add a new rule', () => {
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    
    const service = new SteeringService(testRulesPath, mockLogger);
    
    // Mock the engine's getRuleSet and updateRuleSet methods
    service['engine'].getRuleSet = jest.fn().mockReturnValue(testRuleSet);
    service['engine'].updateRuleSet = jest.fn();
    
    service.addRule(testRule);
    
    expect(service['engine'].getRuleSet).toHaveBeenCalled();
    expect(service['engine'].updateRuleSet).toHaveBeenCalled();
    expect(fs.writeFileSync).toHaveBeenCalled();
  });

  test('should update an existing rule', () => {
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    
    const service = new SteeringService(testRulesPath, mockLogger);
    
    // Mock the engine's getRuleSet and updateRuleSet methods
    const mockRuleSet = { ...testRuleSet, rules: [...testRuleSet.rules, testRule] };
    service['engine'].getRuleSet = jest.fn().mockReturnValue(mockRuleSet);
    service['engine'].updateRuleSet = jest.fn();
    
    const updatedRule = { ...testRule, name: 'Updated Rule 2' };
    service.updateRule(updatedRule);
    
    expect(service['engine'].getRuleSet).toHaveBeenCalled();
    expect(service['engine'].updateRuleSet).toHaveBeenCalled();
    expect(fs.writeFileSync).toHaveBeenCalled();
  });

  test('should throw error when updating non-existent rule', () => {
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    
    const service = new SteeringService(testRulesPath, mockLogger);
    
    // Mock the engine's getRuleSet method
    service['engine'].getRuleSet = jest.fn().mockReturnValue(testRuleSet);
    
    const nonExistentRule = { ...testRule, id: 'non-existent' };
    
    expect(() => {
      service.updateRule(nonExistentRule);
    }).toThrow(`Rule with ID ${nonExistentRule.id} not found`);
  });

  test('should delete a rule', () => {
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    
    const service = new SteeringService(testRulesPath, mockLogger);
    
    // Mock the engine's getRuleSet and updateRuleSet methods
    const mockRuleSet = { ...testRuleSet, rules: [...testRuleSet.rules, testRule] };
    service['engine'].getRuleSet = jest.fn().mockReturnValue(mockRuleSet);
    service['engine'].updateRuleSet = jest.fn();
    
    service.deleteRule(testRule.id);
    
    expect(service['engine'].getRuleSet).toHaveBeenCalled();
    expect(service['engine'].updateRuleSet).toHaveBeenCalled();
    expect(fs.writeFileSync).toHaveBeenCalled();
  });

  test('should throw error when deleting non-existent rule', () => {
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    
    const service = new SteeringService(testRulesPath, mockLogger);
    
    // Mock the engine's getRuleSet method
    service['engine'].getRuleSet = jest.fn().mockReturnValue(testRuleSet);
    
    expect(() => {
      service.deleteRule('non-existent');
    }).toThrow('Rule with ID non-existent not found');
  });

  test('should update default actions', () => {
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    
    const service = new SteeringService(testRulesPath, mockLogger);
    
    // Mock the engine's getRuleSet and updateRuleSet methods
    service['engine'].getRuleSet = jest.fn().mockReturnValue(testRuleSet);
    service['engine'].updateRuleSet = jest.fn();
    
    const newDefaultActions = [
      {
        type: 'route',
        params: {
          provider: 'anthropic',
          model: 'claude-3-haiku'
        }
      }
    ];
    
    service.updateDefaultActions(newDefaultActions);
    
    expect(service['engine'].getRuleSet).toHaveBeenCalled();
    expect(service['engine'].updateRuleSet).toHaveBeenCalled();
    expect(fs.writeFileSync).toHaveBeenCalled();
  });

  test('should reload rules from file', () => {
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    
    const service = new SteeringService(testRulesPath, mockLogger);
    
    // Mock the engine's updateRuleSet method
    service['engine'].updateRuleSet = jest.fn();
    
    // Add a spy on the emit method
    const emitSpy = jest.spyOn(service, 'emit');
    
    service.reloadRules();
    
    expect(fs.readFileSync).toHaveBeenCalledWith(path.resolve(testRulesPath), 'utf8');
    expect(service['engine'].updateRuleSet).toHaveBeenCalled();
    expect(emitSpy).toHaveBeenCalledWith('rulesReloaded', expect.anything());
  });

  test('should start and stop watching', () => {
    jest.useFakeTimers();
    
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    
    const service = new SteeringService(testRulesPath, mockLogger);
    
    service.startWatching();
    expect(service['watchInterval']).toBeDefined();
    
    service.stopWatching();
    expect(service['watchInterval']).toBeNull();
    
    jest.useRealTimers();
  });

  test('should dispose resources', () => {
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    
    const service = new SteeringService(testRulesPath, mockLogger);
    
    // Add a spy on the stopWatching method
    const stopWatchingSpy = jest.spyOn(service, 'stopWatching');
    
    service.dispose();
    
    expect(stopWatchingSpy).toHaveBeenCalled();
  });
});