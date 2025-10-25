import { vi } from "vitest";
import { createAppError } from "../../utils/errorUtils";
import { ErrorSeverity } from "../../types/error";

// Mock the error utils
export const mockAppError = createAppError(
  "TEST_ERROR",
  "Test error message",
  {
    component: "TestComponent",
  },
  "Test error details",
  ErrorSeverity.MEDIUM,
  "test-execution-id",
);

// Mock functions
export const mockFunctions = {
  onClose: vi.fn(),
  onSubmit: vi.fn(),
  onRetry: vi.fn(),
};

// Reset all mocks
export const resetMocks = () => {
  Object.values(mockFunctions).forEach((mock) => mock.mockReset());
};


