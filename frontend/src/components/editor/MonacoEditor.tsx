/**
 * Monaco Editor Component with Continue.dev Integration
 * Professional IDE experience with AI-powered code assistance
 */

import React, { useRef, useEffect, useState } from 'react';
import Editor, { Monaco } from '@monaco-editor/react';
import { useContinueDev } from '../../hooks/useContinueDev';
import { ContinueDevService, CodeContext, FileItem } from '../../services/continueDevService';

interface MonacoEditorProps {
  value: string;
  language: string;
  onChange?: (value: string) => void;
  theme?: 'vs-dark' | 'light';
  readOnly?: boolean;
  file?: FileItem;
  context?: CodeContext;
  onCodeGeneration?: (code: string) => void;
  className?: string;
}

export const MonacoEditor: React.FC<MonacoEditorProps> = ({
  value,
  language,
  onChange,
  theme = 'vs-dark',
  readOnly = false,
  file,
  context,
  onCodeGeneration,
  className = ''
}) => {
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const continueDev = useContinueDev();
  const [isGenerating, setIsGenerating] = useState(false);

  // Handle editor mount
  const handleEditorDidMount = (editor: any, monaco: Monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Setup Continue.dev completions
    setupContinueDevCompletions(editor, monaco);

    // Setup keyboard shortcuts
    setupKeyboardShortcuts(editor, monaco);

    // Configure editor options
    configureEditor(editor, monaco);
  };

  // Setup Continue.dev code completions
  const setupContinueDevCompletions = (editor: any, monaco: Monaco) => {
    monaco.languages.registerCompletionItemProvider(language, {
      provideCompletionItems: async (model: any, position: any) => {
        try {
          const code = model.getValue();
          const completions = await continueDev.getCompletions({
            code,
            position: {
              lineNumber: position.lineNumber,
              column: position.column
            },
            language
          });

          return {
            suggestions: completions.map((completion: any) => ({
              label: completion.label,
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: completion.code,
              documentation: completion.documentation,
              detail: 'Continue.dev AI'
            }))
          };
        } catch (error) {
          console.error('Continue.dev completions error:', error);
          return { suggestions: [] };
        }
      }
    });
  };

  // Setup keyboard shortcuts
  const setupKeyboardShortcuts = (editor: any, monaco: Monaco) => {
    // Ctrl+Shift+G: Generate code with Continue.dev
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyG, async () => {
      await generateCodeFromSelection();
    });

    // Ctrl+Shift+A: Analyze code
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyA, async () => {
      await analyzeCode();
    });

    // Ctrl+Shift+T: Generate tests
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyT, async () => {
      await generateTests();
    });
  };

  // Configure editor settings
  const configureEditor = (editor: any, monaco: Monaco) => {
    // Custom theme for better readability
    monaco.editor.defineTheme('auterity-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6A9955' },
        { token: 'keyword', foreground: '569CD6' },
        { token: 'string', foreground: 'CE9178' },
        { token: 'number', foreground: 'B5CEA8' },
        { token: 'type', foreground: '4EC9B0' },
        { token: 'function', foreground: 'DCDCAA' }
      ],
      colors: {
        'editor.background': '#1e1e1e',
        'editor.foreground': '#d4d4d4',
        'editor.lineHighlightBackground': '#2d2d30',
        'editor.selectionBackground': '#264f78'
      }
    });

    // Apply custom theme if dark theme is selected
    if (theme === 'vs-dark') {
      monaco.editor.setTheme('auterity-dark');
    }
  };

  // Generate code from current selection
  const generateCodeFromSelection = async () => {
    if (!editorRef.current) return;

    const selection = editorRef.current.getSelection();
    const selectedText = editorRef.current.getModel().getValueInRange(selection);

    if (!selectedText.trim()) {
      // Generate from current line context
      const position = selection.getStartPosition();
      const lineContent = editorRef.current.getModel().getLineContent(position.lineNumber);
      await generateCode(`Complete the following code: ${lineContent}`);
    } else {
      // Generate based on selection
      await generateCode(`Improve or complete this code: ${selectedText}`);
    }
  };

  // Analyze current code
  const analyzeCode = async () => {
    if (!editorRef.current) return;

    const code = editorRef.current.getValue();
    const analysis = await continueDev.analyzeCode(code, language);

    // Display analysis results (could be shown in a panel or tooltip)

    // Highlight issues in the editor
    if (analysis.issues && analysis.issues.length > 0) {
      highlightIssues(analysis.issues);
    }
  };

  // Generate tests for current code
  const generateTests = async () => {
    if (!editorRef.current) return;

    const code = editorRef.current.getValue();
    const tests = await continueDev.generateTests(code, language);

    if (tests) {
      // Could open a new tab/file with tests or insert at cursor
      onCodeGeneration?.(tests);
    }
  };

  // Generate code using Continue.dev
  const generateCode = async (prompt: string) => {
    setIsGenerating(true);
    try {
      const generatedCode = await continueDev.generateCode(prompt, {
        files: file ? [file] : [],
        ...context
      });

      if (generatedCode.code) {
        onCodeGeneration?.(generatedCode.code);
      }
    } catch (error) {
      console.error('Code generation error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Highlight issues in the editor
  const highlightIssues = (issues: { line: number; column: number; length?: number; message: string; severity: string }[]) => {
    if (!editorRef.current || !monacoRef.current) return;

    const markers = issues.map((issue) => ({
      startLineNumber: issue.line,
      startColumn: issue.column,
      endLineNumber: issue.line,
      endColumn: issue.column + (issue.length || 1),
      message: issue.message,
      severity: getSeverityLevel(issue.severity)
    }));

    const model = editorRef.current.getModel();
    Monaco.editor.setModelMarkers(model, 'auterity-analysis', markers);
  };

  // Convert severity string to Monaco marker severity
  const getSeverityLevel = (severity: string): Monaco.MarkerSeverity => {
    switch (severity) {
      case 'error':
        return Monaco.MarkerSeverity.Error;
      case 'warning':
        return Monaco.MarkerSeverity.Warning;
      default:
        return Monaco.MarkerSeverity.Info;
    }
  };

  const crewai_url = ''; // Placeholder for future use

  return (
    <div className={`monaco-editor-container ${className}`}>
      {/* Editor Toolbar */}
      <div className="editor-toolbar flex items-center justify-between p-2 bg-gray-800 text-white text-sm">
        <div className="editor-info flex items-center space-x-4">
          <span className="language-badge bg-blue-600 px-2 py-1 rounded text-xs">
            {language}
          </span>
          {file && (
            <span className="file-name text-gray-300">
              {file.name}
            </span>
          )}
          {isGenerating && (
            <span className="generating-indicator flex items-center space-x-2 text-yellow-400">
              <div className="animate-spin w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full"></div>
              <span>AI Generating...</span>
            </span>
          )}
        </div>

        <div className="editor-actions flex items-center space-x-2">
          <button
            onClick={generateCodeFromSelection}
            className="action-btn bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-xs"
            title="Generate code (Ctrl+Shift+G)"
          >
            🤖 Generate
          </button>
          <button
            onClick={analyzeCode}
            className="action-btn bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-xs"
            title="Analyze code (Ctrl+Shift+A)"
          >
            🔍 Analyze
          </button>
          <button
            onClick={generateTests}
            className="action-btn bg-purple-600 hover:bg-purple-700 px-3 py-1 rounded text-xs"
            title="Generate tests (Ctrl+Shift+T)"
          >
            🧪 Tests
          </button>
        </div>
      </div>

      {/* Monaco Editor */}
      <Editor
        height="600px"
        language={language}
        value={value}
        theme={theme}
        onChange={onChange}
        onMount={handleEditorDidMount}
        options={{
          minimap: { enabled: true },
          fontSize: 14,
          lineNumbers: 'on',
          bracketPairColorization: { enabled: true },
          formatOnPaste: true,
          formatOnType: true,
          suggestOnTriggerCharacters: true,
          codeLens: true,
          lightbulb: { enabled: true },
          readOnly,
          wordWrap: 'on',
          automaticLayout: true,
          scrollBeyondLastLine: false,
          smoothScrolling: true,
          cursorBlinking: 'smooth'
        }}
      />

      {/* Status Bar */}
      <div className="editor-status-bar flex items-center justify-between p-2 bg-gray-800 text-gray-300 text-xs">
        <div className="status-left flex items-center space-x-4">
          <span>UTF-8</span>
          <span>{language}</span>
          {file && <span>{file.path}</span>}
        </div>
        <div className="status-right">
          <span>Continue.dev Ready</span>
        </div>
      </div>
    </div>
  );
};
