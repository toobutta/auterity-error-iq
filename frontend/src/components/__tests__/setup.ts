import { vi } from 'vitest';
import { createAppError } from '../../utils/errorUtils';

// Mock the error utils
export const mockAppError = createAppError(
  'TEST_ERROR',
  'Test error message',
  {
    component: 'TestComponent',
    testId: 'test-123'
  },
  'Test error details',
  ErrorSeverity.MEDIUM,
  'test-execution-id'
);

// Mock functions
export const mockFunctions = {
  onClose: vi.fn(),
  onSubmit: vi.fn(),
  onRetry: vi.fn(),
};

// Reset all mocks
export const resetMocks = () => {
  Object.values(mockFunctions).forEach(mock => mock.mockReset());
};