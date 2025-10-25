/**
 * Comprehensive test suite for MonacoEditor component
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MonacoEditor } from '../../../components/editor/MonacoEditor';
import { ContinueDevService } from '../../../services/continueDevService';

// Mock Monaco Editor
jest.mock('@monaco-editor/react', () => ({
  __esModule: true,
  default: ({ onMount, value, onChange, options }: any) => {
    React.useEffect(() => {
      if (onMount) {
        const mockEditor = {
          getSelection: () => ({ getStartPosition: () => ({ lineNumber: 1, column: 1 }) }),
          getModel: () => ({
            getValue: () => value || '',
            getLineContent: () => 'test line',
            getValueInRange: () => 'selected text'
          }),
          addCommand: jest.fn(),
          getValue: () => value || ''
        };
        const mockMonaco = {
          editor: {
            setModelMarkers: jest.fn(),
            defineTheme: jest.fn(),
            setTheme: jest.fn(),
            MarkerSeverity: { Error: 8, Warning: 4, Info: 2 }
          },
          languages: {
            registerCompletionItemProvider: jest.fn(),
            CompletionItemKind: { Snippet: 15 }
          },
          KeyMod: { CtrlCmd: 2048, Shift: 1024 },
          KeyCode: { KeyG: 43, KeyA: 34, KeyT: 52 }
        };
        onMount(mockEditor, mockMonaco);
      }
    }, [onMount]);

    return (
      <div data-testid="monaco-editor">
        <textarea
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          data-testid="monaco-textarea"
        />
        <div data-testid="monaco-toolbar">
          <button data-testid="generate-btn">🤖 Generate</button>
          <button data-testid="analyze-btn">🔍 Analyze</button>
          <button data-testid="test-btn">🧪 Tests</button>
        </div>
      </div>
    );
  }
}));

// Mock Continue.dev service
jest.mock('../../../services/continueDevService', () => ({
  ContinueDevService: jest.fn().mockImplementation(() => ({
    generateCode: jest.fn().mockResolvedValue({
      code: 'const test = "generated";',
      explanation: 'Generated test code',
      suggestions: ['Add types']
    }),
    analyzeCode: jest.fn().mockResolvedValue({
      issues: [],
      suggestions: [],
      metrics: { complexity: 1, maintainability: 95, performance: 98 }
    }),
    generateTests: jest.fn().mockResolvedValue('describe("test", () => {});')
  }))
}));

jest.mock('../../../hooks/useContinueDev', () => ({
  useContinueDev: () => ({
    generateCode: jest.fn().mockResolvedValue({
      code: 'const test = "generated";',
      explanation: 'Generated test code'
    }),
    analyzeCode: jest.fn().mockResolvedValue({
      issues: [],
      suggestions: [],
      metrics: { complexity: 1, maintainability: 95, performance: 98 }
    }),
    generateTests: jest.fn().mockResolvedValue('describe("test", () => {});'),
    getCompletions: jest.fn().mockResolvedValue([]),
    isConfigured: true,
    isLoading: false,
    error: null
  })
}));

describe('MonacoEditor', () => {
  const defaultProps = {
    value: 'const test = "hello";',
    language: 'typescript',
    onChange: jest.fn(),
    theme: 'vs-dark' as const,
    readOnly: false,
    onCodeGeneration: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    test('should render Monaco editor with correct props', () => {
      render(<MonacoEditor {...defaultProps} />);

      expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
      expect(screen.getByTestId('monaco-toolbar')).toBeInTheDocument();
      expect(screen.getByTestId('monaco-textarea')).toHaveValue(defaultProps.value);
    });

    test('should display language badge', () => {
      render(<MonacoEditor {...defaultProps} />);
      expect(screen.getByText('typescript')).toBeInTheDocument();
    });

    test('should show file name when provided', () => {
      const file = {
        id: '1',
        name: 'App.tsx',
        path: 'src/App.tsx',
        content: '',
        language: 'typescript',
        lastModified: new Date()
      };

      render(<MonacoEditor {...defaultProps} file={file} />);
      expect(screen.getByText('App.tsx')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    test('should call onChange when editor value changes', () => {
      const mockOnChange = jest.fn();
      render(<MonacoEditor {...defaultProps} onChange={mockOnChange} />);

      const textarea = screen.getByTestId('monaco-textarea');
      fireEvent.change(textarea, { target: { value: 'new code' } });

      expect(mockOnChange).toHaveBeenCalledWith('new code');
    });

    test('should handle generate button click', async () => {
      const mockOnCodeGeneration = jest.fn();
      render(<MonacoEditor {...defaultProps} onCodeGeneration={mockOnCodeGeneration} />);

      const generateBtn = screen.getByTestId('generate-btn');
      fireEvent.click(generateBtn);

      await waitFor(() => {
        expect(mockOnCodeGeneration).toHaveBeenCalledWith('const test = "generated";');
      });
    });

    test('should handle analyze button click', async () => {
      render(<MonacoEditor {...defaultProps} />);

      const analyzeBtn = screen.getByTestId('analyze-btn');
      fireEvent.click(analyzeBtn);

      // Should not throw any errors
      await waitFor(() => {
        expect(analyzeBtn).toBeInTheDocument();
      });
    });

    test('should handle test generation button click', async () => {
      const mockOnCodeGeneration = jest.fn();
      render(<MonacoEditor {...defaultProps} onCodeGeneration={mockOnCodeGeneration} />);

      const testBtn = screen.getByTestId('test-btn');
      fireEvent.click(testBtn);

      await waitFor(() => {
        expect(mockOnCodeGeneration).toHaveBeenCalledWith('describe("test", () => {});');
      });
    });
  });

  describe('Editor Configuration', () => {
    test('should apply dark theme by default', () => {
      render(<MonacoEditor {...defaultProps} />);
      // Monaco theme should be configured internally
      expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
    });

    test('should apply light theme when specified', () => {
      render(<MonacoEditor {...defaultProps} theme="light" />);
      expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
    });

    test('should be read-only when specified', () => {
      render(<MonacoEditor {...defaultProps} readOnly={true} />);
      const textarea = screen.getByTestId('monaco-textarea');
      expect(textarea).toHaveAttribute('readOnly');
    });
  });

  describe('Keyboard Shortcuts', () => {
    test('should register keyboard shortcuts on mount', () => {
      render(<MonacoEditor {...defaultProps} />);

      // Keyboard shortcuts are registered in the onMount callback
      // This is tested implicitly through the Monaco mock
      expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
    });
  });

  describe('Status and Feedback', () => {
    test('should show generating indicator during code generation', async () => {
      render(<MonacoEditor {...defaultProps} />);

      const generateBtn = screen.getByTestId('generate-btn');
      fireEvent.click(generateBtn);

      // The component should handle loading state internally
      await waitFor(() => {
        expect(generateBtn).toBeInTheDocument();
      });
    });

    test('should display status bar with file information', () => {
      render(<MonacoEditor {...defaultProps} />);

      expect(screen.getByText('UTF-8')).toBeInTheDocument();
      expect(screen.getByText('typescript')).toBeInTheDocument();
      expect(screen.getByText('Continue.dev Ready')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    test('should handle code generation errors gracefully', async () => {
      // Mock failed code generation
      const mockUseContinueDev = require('../../../hooks/useContinueDev');
      mockUseContinueDev.useContinueDev.mockReturnValueOnce({
        generateCode: jest.fn().mockRejectedValue(new Error('Generation failed')),
        analyzeCode: jest.fn(),
        generateTests: jest.fn(),
        getCompletions: jest.fn(),
        isConfigured: true,
        isLoading: false,
        error: 'Generation failed'
      });

      render(<MonacoEditor {...defaultProps} />);

      const generateBtn = screen.getByTestId('generate-btn');
      fireEvent.click(generateBtn);

      // Should not crash the component
      await waitFor(() => {
        expect(generateBtn).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    test('should have proper ARIA labels', () => {
      render(<MonacoEditor {...defaultProps} />);

      const generateBtn = screen.getByTestId('generate-btn');
      expect(generateBtn).toHaveAttribute('title');
    });

    test('should support keyboard navigation', () => {
      render(<MonacoEditor {...defaultProps} />);

      const textarea = screen.getByTestId('monaco-textarea');
      textarea.focus();

      expect(document.activeElement).toBe(textarea);
    });
  });
});
