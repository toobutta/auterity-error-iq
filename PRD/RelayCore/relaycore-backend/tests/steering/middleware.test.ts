import { createSteeringMiddleware } from '../../src/steering/middleware';
import { SteeringService } from '../../src/steering/service';
import { Request, Response } from 'express';

// Mock SteeringService
jest.mock('../../src/steering/service');

describe('SteeringMiddleware', () => {
  let mockSteeringService: jest.Mocked<SteeringService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    // Create mock SteeringService
    mockSteeringService = new SteeringService('') as jest.Mocked<SteeringService>;
    mockSteeringService.evaluate = jest.fn();

    // Create mock Express objects
    mockRequest = {
      body: { prompt: 'test prompt' },
      query: {},
      params: {},
      headers: { 'user-agent': 'test-agent' },
      method: 'POST',
      path: '/test',
      url: '/test',
      ip: '127.0.0.1',
      user: { id: 'user1', tier: 'premium' }
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    mockNext = jest.fn();
  });

  test('should apply routing decision', () => {
    // Mock evaluate to return a routing decision
    mockSteeringService.evaluate.mockReturnValue({
      results: [
        {
          matched: true,
          rule: {
            id: 'rule1',
            name: 'Test Rule',
            priority: 10,
            enabled: true,
            conditions: [],
            operator: 'and',
            actions: [],
            continue: true
          },
          actions: [],
          continue: true
        }
      ],
      context: {
        request: mockRequest,
        user: mockRequest.user,
        routing: {
          provider: 'openai',
          model: 'gpt-4'
        }
      }
    });

    // Create middleware
    const middleware = createSteeringMiddleware(mockSteeringService, {
      applyRouting: true,
      applyRejection: true
    });

    // Call middleware
    middleware(mockRequest as Request, mockResponse as Response, mockNext);

    // Check that evaluate was called with the correct context
    expect(mockSteeringService.evaluate).toHaveBeenCalledWith(expect.objectContaining({
      request: expect.objectContaining({
        body: mockRequest.body,
        query: mockRequest.query,
        params: mockRequest.params,
        headers: mockRequest.headers,
        method: mockRequest.method,
        path: mockRequest.path,
        url: mockRequest.url,
        ip: mockRequest.ip
      }),
      user: mockRequest.user
    }));

    // Check that routing decision was applied
    expect(mockRequest.routingDecision).toEqual({
      provider: 'openai',
      model: 'gpt-4'
    });

    // Check that next was called
    expect(mockNext).toHaveBeenCalled();
  });

  test('should apply rejection decision', () => {
    // Mock evaluate to return a rejection decision
    mockSteeringService.evaluate.mockReturnValue({
      results: [
        {
          matched: true,
          rule: {
            id: 'rule1',
            name: 'Test Rule',
            priority: 10,
            enabled: true,
            conditions: [],
            operator: 'and',
            actions: [],
            continue: false
          },
          actions: [],
          continue: false
        }
      ],
      context: {
        request: mockRequest,
        user: mockRequest.user,
        reject: {
          message: 'Request rejected',
          status: 403
        }
      }
    });

    // Create middleware
    const middleware = createSteeringMiddleware(mockSteeringService, {
      applyRouting: true,
      applyRejection: true
    });

    // Call middleware
    middleware(mockRequest as Request, mockResponse as Response, mockNext);

    // Check that evaluate was called
    expect(mockSteeringService.evaluate).toHaveBeenCalled();

    // Check that response was sent with rejection
    expect(mockResponse.status).toHaveBeenCalledWith(403);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: 'Request rejected'
    });

    // Check that next was not called
    expect(mockNext).not.toHaveBeenCalled();
  });

  test('should not apply rejection if applyRejection is false', () => {
    // Mock evaluate to return a rejection decision
    mockSteeringService.evaluate.mockReturnValue({
      results: [
        {
          matched: true,
          rule: {
            id: 'rule1',
            name: 'Test Rule',
            priority: 10,
            enabled: true,
            conditions: [],
            operator: 'and',
            actions: [],
            continue: false
          },
          actions: [],
          continue: false
        }
      ],
      context: {
        request: mockRequest,
        user: mockRequest.user,
        reject: {
          message: 'Request rejected',
          status: 403
        }
      }
    });

    // Create middleware with applyRejection: false
    const middleware = createSteeringMiddleware(mockSteeringService, {
      applyRouting: true,
      applyRejection: false
    });

    // Call middleware
    middleware(mockRequest as Request, mockResponse as Response, mockNext);

    // Check that evaluate was called
    expect(mockSteeringService.evaluate).toHaveBeenCalled();

    // Check that response was not sent with rejection
    expect(mockResponse.status).not.toHaveBeenCalled();
    expect(mockResponse.json).not.toHaveBeenCalled();

    // Check that next was called
    expect(mockNext).toHaveBeenCalled();
  });

  test('should not apply routing if applyRouting is false', () => {
    // Mock evaluate to return a routing decision
    mockSteeringService.evaluate.mockReturnValue({
      results: [
        {
          matched: true,
          rule: {
            id: 'rule1',
            name: 'Test Rule',
            priority: 10,
            enabled: true,
            conditions: [],
            operator: 'and',
            actions: [],
            continue: true
          },
          actions: [],
          continue: true
        }
      ],
      context: {
        request: mockRequest,
        user: mockRequest.user,
        routing: {
          provider: 'openai',
          model: 'gpt-4'
        }
      }
    });

    // Create middleware with applyRouting: false
    const middleware = createSteeringMiddleware(mockSteeringService, {
      applyRouting: false,
      applyRejection: true
    });

    // Call middleware
    middleware(mockRequest as Request, mockResponse as Response, mockNext);

    // Check that evaluate was called
    expect(mockSteeringService.evaluate).toHaveBeenCalled();

    // Check that routing decision was not applied
    expect(mockRequest.routingDecision).toBeUndefined();

    // Check that next was called
    expect(mockNext).toHaveBeenCalled();
  });

  test('should use custom user and organization functions', () => {
    // Mock evaluate to return a simple context
    mockSteeringService.evaluate.mockReturnValue({
      results: [],
      context: {
        request: mockRequest,
        user: { id: 'custom-user' },
        organization: { id: 'custom-org' }
      }
    });

    // Custom functions
    const getUserFromRequest = jest.fn().mockReturnValue({ id: 'custom-user' });
    const getOrganizationFromRequest = jest.fn().mockReturnValue({ id: 'custom-org' });

    // Create middleware with custom functions
    const middleware = createSteeringMiddleware(mockSteeringService, {
      getUserFromRequest,
      getOrganizationFromRequest
    });

    // Call middleware
    middleware(mockRequest as Request, mockResponse as Response, mockNext);

    // Check that custom functions were called
    expect(getUserFromRequest).toHaveBeenCalledWith(mockRequest);
    expect(getOrganizationFromRequest).toHaveBeenCalledWith(mockRequest);

    // Check that evaluate was called with the custom user and organization
    expect(mockSteeringService.evaluate).toHaveBeenCalledWith(expect.objectContaining({
      user: { id: 'custom-user' },
      organization: { id: 'custom-org' }
    }));

    // Check that next was called
    expect(mockNext).toHaveBeenCalled();
  });

  test('should include additional context', () => {
    // Mock evaluate to return a simple context
    mockSteeringService.evaluate.mockReturnValue({
      results: [],
      context: {
        request: mockRequest,
        user: mockRequest.user,
        context: {
          testValue: 'test'
        }
      }
    });

    // Static additional context
    const additionalContext = { testValue: 'test' };

    // Create middleware with additional context
    const middleware = createSteeringMiddleware(mockSteeringService, {
      additionalContext
    });

    // Call middleware
    middleware(mockRequest as Request, mockResponse as Response, mockNext);

    // Check that evaluate was called with the additional context
    expect(mockSteeringService.evaluate).toHaveBeenCalledWith(expect.objectContaining({
      context: additionalContext
    }));

    // Check that next was called
    expect(mockNext).toHaveBeenCalled();
  });

  test('should include dynamic additional context', () => {
    // Mock evaluate to return a simple context
    mockSteeringService.evaluate.mockReturnValue({
      results: [],
      context: {
        request: mockRequest,
        user: mockRequest.user,
        context: {
          dynamicValue: 'dynamic'
        }
      }
    });

    // Dynamic additional context function
    const additionalContext = jest.fn().mockReturnValue({ dynamicValue: 'dynamic' });

    // Create middleware with dynamic additional context
    const middleware = createSteeringMiddleware(mockSteeringService, {
      additionalContext
    });

    // Call middleware
    middleware(mockRequest as Request, mockResponse as Response, mockNext);

    // Check that the dynamic function was called
    expect(additionalContext).toHaveBeenCalledWith(mockRequest);

    // Check that evaluate was called with the dynamic additional context
    expect(mockSteeringService.evaluate).toHaveBeenCalledWith(expect.objectContaining({
      context: { dynamicValue: 'dynamic' }
    }));

    // Check that next was called
    expect(mockNext).toHaveBeenCalled();
  });

  test('should handle errors gracefully', () => {
    // Mock evaluate to throw an error
    mockSteeringService.evaluate.mockImplementation(() => {
      throw new Error('Test error');
    });

    // Create middleware
    const middleware = createSteeringMiddleware(mockSteeringService);

    // Call middleware
    middleware(mockRequest as Request, mockResponse as Response, mockNext);

    // Check that next was called with the error
    expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
  });
});