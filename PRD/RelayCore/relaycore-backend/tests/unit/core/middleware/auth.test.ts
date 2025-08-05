import { Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../../../../src/core/middleware/auth';
import jwt from 'jsonwebtoken';

// Mock jsonwebtoken
jest.mock('jsonwebtoken');

describe('Auth Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup mock request and response
    mockRequest = {
      headers: {},
      get: jest.fn((name: string) => {
        return mockRequest.headers?.[name.toLowerCase()];
      })
    };
    
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    
    nextFunction = jest.fn();
  });

  it('should return 401 if no authorization header is provided', () => {
    // Execute
    authMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);
    
    // Verify
    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: 'Unauthorized',
      message: 'No authorization token provided'
    });
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('should return 401 if authorization header has invalid format', () => {
    // Setup
    mockRequest.headers = {
      authorization: 'InvalidFormat token123'
    };
    
    // Execute
    authMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);
    
    // Verify
    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: 'Unauthorized',
      message: 'Invalid authorization format'
    });
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('should return 401 if token verification fails', () => {
    // Setup
    mockRequest.headers = {
      authorization: 'Bearer invalidToken'
    };
    
    // Mock jwt.verify to throw an error
    (jwt.verify as jest.Mock).mockImplementation(() => {
      throw new Error('Invalid token');
    });
    
    // Execute
    authMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);
    
    // Verify
    expect(jwt.verify).toHaveBeenCalledWith('invalidToken', expect.any(String));
    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: 'Unauthorized',
      message: 'Invalid token'
    });
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('should call next() if token is valid', () => {
    // Setup
    mockRequest.headers = {
      authorization: 'Bearer validToken'
    };
    
    const decodedToken = { userId: '123', role: 'user' };
    
    // Mock jwt.verify to return a decoded token
    (jwt.verify as jest.Mock).mockReturnValue(decodedToken);
    
    // Execute
    authMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);
    
    // Verify
    expect(jwt.verify).toHaveBeenCalledWith('validToken', expect.any(String));
    expect(mockRequest.user).toEqual(decodedToken);
    expect(nextFunction).toHaveBeenCalled();
    expect(mockResponse.status).not.toHaveBeenCalled();
    expect(mockResponse.json).not.toHaveBeenCalled();
  });

  it('should accept API key in place of JWT token', () => {
    // Setup
    mockRequest.headers = {
      'x-api-key': 'valid-api-key'
    };
    
    // Mock API key validation (this would typically be a database lookup)
    // For this test, we'll assume the API key is valid
    (mockRequest as any).isValidApiKey = jest.fn().mockReturnValue(true);
    
    // Execute
    authMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);
    
    // Verify
    expect(nextFunction).toHaveBeenCalled();
    expect(mockResponse.status).not.toHaveBeenCalled();
    expect(mockResponse.json).not.toHaveBeenCalled();
  });

  it('should return 401 if API key is invalid', () => {
    // Setup
    mockRequest.headers = {
      'x-api-key': 'invalid-api-key'
    };
    
    // Mock API key validation to return false
    (mockRequest as any).isValidApiKey = jest.fn().mockReturnValue(false);
    
    // Execute
    authMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);
    
    // Verify
    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: 'Unauthorized',
      message: 'Invalid API key'
    });
    expect(nextFunction).not.toHaveBeenCalled();
  });
});