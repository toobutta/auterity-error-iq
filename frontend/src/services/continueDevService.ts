/**
 * Continue.dev Service Integration
 * Provides AI-powered code generation and assistance
 */

export interface CodeContext {
  files?: FileItem[];
  workspace?: WorkspaceInfo;
  git?: GitContext;
  selection?: SelectionInfo;
}

export interface GeneratedCode {
  code: string;
  explanation: string;
  suggestions?: string[];
  tests?: string;
  documentation?: string;
  confidence?: number;
}

export interface CompletionItem {
  label: string;
  code: string;
  documentation?: string;
  kind?: string;
}

export interface CodeAnalysis {
  issues: CodeIssue[];
  suggestions: CodeSuggestion[];
  metrics: CodeMetrics;
}

export interface CodeIssue {
  type: 'error' | 'warning' | 'info';
  message: string;
  line: number;
  column: number;
  severity: 'low' | 'medium' | 'high';
}

export interface CodeSuggestion {
  type: 'refactor' | 'optimize' | 'security' | 'performance';
  description: string;
  code?: string;
  impact: 'low' | 'medium' | 'high';
}

export interface CodeMetrics {
  complexity: number;
  maintainability: number;
  testCoverage?: number;
  performance: number;
}

export interface FileItem {
  id: string;
  name: string;
  path: string;
  content: string;
  language: string;
  lastModified: Date;
}

export interface WorkspaceInfo {
  rootPath: string;
  name: string;
  type: 'project' | 'workspace';
  dependencies: string[];
}

export interface GitContext {
  branch: string;
  repository: string;
  recentCommits: GitCommit[];
  status: GitStatus;
}

export interface GitCommit {
  hash: string;
  message: string;
  author: string;
  date: Date;
  files: string[];
}

export interface GitStatus {
  modified: string[];
  staged: string[];
  untracked: string[];
  deleted: string[];
}

export interface SelectionInfo {
  startLine: number;
  startColumn: number;
  endLine: number;
  endColumn: number;
  text: string;
}

export class ContinueDevService {
  private apiKey: string;
  private baseURL: string;
  private models: {
    primary: string;
    fallback: string;
    local?: string;
  };

  constructor() {
    this.apiKey = process.env.REACT_APP_CONTINUE_API_KEY || '';
    this.baseURL = process.env.REACT_APP_CONTINUE_BASE_URL || 'https://api.continue.dev';
    this.models = {
      primary: 'anthropic/claude-3-opus-20240229',
      fallback: 'openai/gpt-4-turbo-preview',
      local: 'ollama/codellama:34b'
    };
  }

  async generateCode(prompt: string, context?: CodeContext): Promise<GeneratedCode> {
    try {
      const response = await fetch(`${this.baseURL}/v1/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          prompt,
          context: this.formatContext(context),
          model: this.models.primary,
          temperature: 0.3,
          max_tokens: 4000
        })
      });

      if (!response.ok) {
        throw new Error(`Continue.dev API error: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        code: data.code || '',
        explanation: data.explanation || '',
        suggestions: data.suggestions || [],
        tests: data.tests || '',
        documentation: data.documentation || '',
        confidence: data.confidence || 0.8
      };
    } catch (error) {
      console.error('Continue.dev code generation error:', error);
      return this.generateFallbackCode(prompt, context);
    }
  }

  async getCompletions(context: {
    code: string;
    position: { lineNumber: number; column: number };
    language: string;
  }): Promise<CompletionItem[]> {
    try {
      const response = await fetch(`${this.baseURL}/v1/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          code: context.code,
          position: context.position,
          language: context.language,
          model: this.models.primary
        })
      });

      if (!response.ok) {
        throw new Error(`Continue.dev completions error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.completions || [];
    } catch (error) {
      console.error('Continue.dev completions error:', error);
      return [];
    }
  }

  async analyzeCode(code: string, language?: string): Promise<CodeAnalysis> {
    try {
      const response = await fetch(`${this.baseURL}/v1/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          code,
          language: language || 'typescript',
          model: this.models.primary
        })
      });

      if (!response.ok) {
        throw new Error(`Continue.dev analysis error: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        issues: data.issues || [],
        suggestions: data.suggestions || [],
        metrics: data.metrics || {
          complexity: 0,
          maintainability: 0,
          performance: 0
        }
      };
    } catch (error) {
      console.error('Continue.dev analysis error:', error);
      return {
        issues: [],
        suggestions: [],
        metrics: {
          complexity: 0,
          maintainability: 0,
          performance: 0
        }
      };
    }
  }

  async generateTests(code: string, language?: string): Promise<string> {
    try {
      const response = await fetch(`${this.baseURL}/v1/generate-tests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          code,
          language: language || 'typescript',
          model: this.models.primary
        })
      });

      if (!response.ok) {
        throw new Error(`Continue.dev test generation error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.tests || '';
    } catch (error) {
      console.error('Continue.dev test generation error:', error);
      return '';
    }
  }

  private formatContext(context?: CodeContext): any {
    if (!context) return {};

    return {
      files: context.files?.map(file => ({
        name: file.name,
        path: file.path,
        content: file.content,
        language: file.language
      })),
      workspace: context.workspace,
      git: context.git,
      selection: context.selection
    };
  }

  private async generateFallbackCode(prompt: string, context?: CodeContext): Promise<GeneratedCode> {
    // Fallback implementation using basic templates
    const fallbackTemplates: Record<string, GeneratedCode> = {
      'react component': {
        code: `import React, { useState } from 'react';

interface ComponentProps {
  title?: string;
}

export const GeneratedComponent: React.FC<ComponentProps> = ({
  title = 'Generated Component'
}) => {
  const [count, setCount] = useState(0);

  return (
    <div className="generated-component">
      <h2>{title}</h2>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </div>
  );
};`,
        explanation: 'Generated a basic React component with state management',
        suggestions: [
          'Add TypeScript interfaces',
          'Implement error handling',
          'Add loading states'
        ]
      }
    };

    // Try to match prompt to template
    const matchedTemplate = Object.keys(fallbackTemplates).find(key =>
      prompt.toLowerCase().includes(key)
    );

    if (matchedTemplate) {
      return fallbackTemplates[matchedTemplate];
    }

    // Generic fallback
    return {
      code: `// Generated code for: ${prompt}
// This is a fallback implementation
// Please check your Continue.dev configuration

export function generatedFunction() {
  console.log('Generated function executed');
  return 'Hello from generated code';
}`,
      explanation: 'Fallback code generation - please verify Continue.dev configuration',
      suggestions: [
        'Check Continue.dev API key',
        'Verify network connectivity',
        'Review model configuration'
      ]
    };
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey && this.baseURL);
  }
}
