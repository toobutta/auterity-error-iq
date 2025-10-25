/**
 * Unified IDE Component
 * Brings together Monaco Editor, Continue.dev, Terminal, and GitHub integration
 * Provides a comprehensive development environment
 */

import React, { useState, useEffect, useCallback } from 'react';
import { MonacoEditor } from './MonacoEditor';
import { WebTerminal } from '../terminal/WebTerminal';
import { useContinueDev } from '../../hooks/useContinueDev';
import { ContinueDevService, FileItem, CodeContext } from '../../services/continueDevService';
import { GitHubIntegrationService, GitHubRepository } from '../../services/githubIntegration';

interface UnifiedIDEProps {
  initialFiles?: FileItem[];
  connectedRepository?: GitHubRepository;
  onFileChange?: (file: FileItem) => void;
  onCodeGeneration?: (code: string) => void;
  className?: string;
}

interface IDEPanel {
  id: string;
  title: string;
  icon: string;
  component: React.ReactNode;
  isVisible: boolean;
  size: number;
}

export const UnifiedIDE: React.FC<UnifiedIDEProps> = ({
  initialFiles = [],
  connectedRepository,
  onFileChange,
  onCodeGeneration,
  className = ''
}) => {
  // Core state
  const [activeFile, setActiveFile] = useState<FileItem | null>(null);
  const [files, setFiles] = useState<FileItem[]>(initialFiles);
  const [currentRepository, setCurrentRepository] = useState<GitHubRepository | null>(
    connectedRepository || null
  );

  // UI state
  const [showTerminal, setShowTerminal] = useState(true);
  const [showGitPanel, setShowGitPanel] = useState(false);
  const [showContinuePanel, setShowContinuePanel] = useState(false);
  const [layout, setLayout] = useState<'horizontal' | 'vertical'>('horizontal');
  const [panels, setPanels] = useState<IDEPanel[]>([]);

  // Services
  const continueDev = useContinueDev();
  const [githubService] = useState(() => new GitHubIntegrationService());

  // Initialize panels
  useEffect(() => {
    const initialPanels: IDEPanel[] = [
      {
        id: 'explorer',
        title: 'Explorer',
        icon: '📁',
        component: <FileExplorer files={files} onFileSelect={handleFileSelect} />,
        isVisible: true,
        size: 250
      },
      {
        id: 'git',
        title: 'Git',
        icon: '🔀',
        component: <GitPanel repository={currentRepository} />,
        isVisible: showGitPanel,
        size: 300
      },
      {
        id: 'continue',
        title: 'AI Assistant',
        icon: '🤖',
        component: <ContinuePanel onCodeGeneration={handleCodeGeneration} />,
        isVisible: showContinuePanel,
        size: 350
      }
    ];
    setPanels(initialPanels);
  }, [files, currentRepository, showGitPanel, showContinuePanel]);

  // File management
  const handleFileSelect = useCallback((file: FileItem) => {
    setActiveFile(file);
    onFileChange?.(file);
  }, [onFileChange]);

  const handleFileCreate = useCallback((fileName: string, content: string = '') => {
    const newFile: FileItem = {
      id: Date.now().toString(),
      name: fileName,
      path: fileName,
      content,
      language: getLanguageFromFilename(fileName),
      lastModified: new Date()
    };

    setFiles(prev => [...prev, newFile]);
    setActiveFile(newFile);
  }, []);

  const handleFileUpdate = useCallback((fileId: string, content: string) => {
    setFiles(prev => prev.map(file =>
      file.id === fileId
        ? { ...file, content, lastModified: new Date() }
        : file
    ));

    if (activeFile?.id === fileId) {
      setActiveFile(prev => prev ? { ...prev, content, lastModified: new Date() } : null);
    }
  }, [activeFile]);

  const handleFileDelete = useCallback((fileId: string) => {
    setFiles(prev => prev.filter(file => file.id !== fileId));

    if (activeFile?.id === fileId) {
      const remainingFiles = files.filter(file => file.id !== fileId);
      setActiveFile(remainingFiles.length > 0 ? remainingFiles[0] : null);
    }
  }, [activeFile, files]);

  // Code generation
  const handleCodeGeneration = useCallback(async (prompt: string) => {
    const context: CodeContext = {
      files: [activeFile].filter(Boolean),
      workspace: {
        rootPath: '/',
        name: currentRepository?.name || 'workspace',
        dependencies: []
      }
    };

    const generatedCode = await continueDev.generateCode(prompt, context);

    if (generatedCode?.code) {
      onCodeGeneration?.(generatedCode.code);
    }
  }, [activeFile, currentRepository, continueDev, onCodeGeneration]);

  // Terminal commands
  const handleTerminalCommand = useCallback(async (command: string) => {
    const parts = command.split(' ');
    const cmd = parts[0];
    const args = parts.slice(1);

    switch (cmd) {
      case 'create':
        if (args[0] === 'file' && args[1]) {
          handleFileCreate(args[1]);
        }
        break;
      case 'generate':
        if (args.length > 0) {
          await handleCodeGeneration(args.join(' '));
        }
        break;
      case 'git':
        if (args[0] === 'status' && currentRepository) {
          // Handle git status
        }
        break;
      default:
        // Unknown command
        break;
    }
  }, [handleFileCreate, handleCodeGeneration, currentRepository]);

  // Repository connection
  const handleRepositoryConnect = useCallback(async (owner: string, repo: string) => {
    try {
      const repository = await githubService.connectRepository(owner, repo);
      setCurrentRepository(repository);
    } catch (error) {
      // Repository connection failed
    }
  }, [githubService]);

  // Layout management
  const togglePanel = useCallback((panelId: string) => {
    setPanels(prev => prev.map(panel =>
      panel.id === panelId
        ? { ...panel, isVisible: !panel.isVisible }
        : panel
    ));

    // Update specific panel visibility states
    switch (panelId) {
      case 'git':
        setShowGitPanel(prev => !prev);
        break;
      case 'continue':
        setShowContinuePanel(prev => !prev);
        break;
    }
  }, []);

  return (
    <div className={`unified-ide ${layout} ${className}`}>
      {/* Top Toolbar */}
      <div className="ide-toolbar flex items-center justify-between p-3 bg-gray-800 text-white border-b border-gray-700">
        <div className="toolbar-left flex items-center space-x-4">
          {/* File Menu */}
          <div className="file-menu relative">
            <button className="toolbar-btn">File</button>
            <div className="dropdown-menu absolute top-full left-0 mt-1 bg-gray-700 rounded shadow-lg">
              <button onClick={() => handleFileCreate('new-file.js')} className="menu-item">
                New File
              </button>
              <button onClick={() => {/* Open file dialog */}} className="menu-item">
                Open File
              </button>
              <button onClick={() => {/* Save file */}} className="menu-item">
                Save
              </button>
            </div>
          </div>

          {/* View Controls */}
          <div className="view-controls flex items-center space-x-2">
            <button
              onClick={() => setLayout(layout === 'horizontal' ? 'vertical' : 'horizontal')}
              className="toolbar-btn"
              title="Toggle Layout"
            >
              {layout === 'horizontal' ? '⬌' : '⬍'}
            </button>

            <div className="panel-toggles flex space-x-1">
              <button
                onClick={() => togglePanel('explorer')}
                className={`panel-toggle ${panels.find(p => p.id === 'explorer')?.isVisible ? 'active' : ''}`}
                title="Toggle Explorer"
              >
                📁
              </button>
              <button
                onClick={() => togglePanel('git')}
                className={`panel-toggle ${showGitPanel ? 'active' : ''}`}
                title="Toggle Git Panel"
              >
                🔀
              </button>
              <button
                onClick={() => togglePanel('continue')}
                className={`panel-toggle ${showContinuePanel ? 'active' : ''}`}
                title="Toggle AI Assistant"
              >
                🤖
              </button>
            </div>
          </div>
        </div>

        <div className="toolbar-center flex items-center space-x-4">
          {/* Repository Status */}
          {currentRepository && (
            <div className="repo-status flex items-center space-x-2 bg-gray-700 px-3 py-1 rounded">
              <span className="repo-icon">📦</span>
              <span className="repo-name text-sm">{currentRepository.fullName}</span>
              <span className="repo-branch bg-blue-600 px-2 py-0.5 rounded text-xs">main</span>
            </div>
          )}

          {/* AI Status */}
          <div className="ai-status flex items-center space-x-2">
            <div className={`ai-indicator w-2 h-2 rounded-full ${
              continueDev.isConfigured ? 'bg-green-500' : 'bg-red-500'
            }`} />
            <span className="text-xs">
              {continueDev.isConfigured ? 'AI Ready' : 'AI Offline'}
            </span>
          </div>
        </div>

        <div className="toolbar-right flex items-center space-x-2">
          {/* Quick Actions */}
          <button
            onClick={() => handleCodeGeneration('Generate component for ' + (activeFile?.name || 'current task'))}
            className="quick-action-btn bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm"
            disabled={!continueDev.isConfigured}
          >
            🚀 Generate
          </button>

          <button
            onClick={() => setShowTerminal(!showTerminal)}
            className={`terminal-toggle ${showTerminal ? 'active' : ''}`}
            title="Toggle Terminal"
          >
            ⌨️
          </button>
        </div>
      </div>

      {/* Main IDE Layout */}
      <div className="ide-main flex flex-1 overflow-hidden">
        {/* Left Sidebar - Panels */}
        <div className="ide-sidebar flex">
          {panels.map(panel => panel.isVisible && (
            <div
              key={panel.id}
              className="panel-container"
              style={{ width: `${panel.size}px` }}
            >
              <div className="panel-header flex items-center justify-between p-2 bg-gray-700 text-white">
                <div className="flex items-center space-x-2">
                  <span>{panel.icon}</span>
                  <span className="text-sm font-medium">{panel.title}</span>
                </div>
                <button
                  onClick={() => togglePanel(panel.id)}
                  className="panel-close text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
              <div className="panel-content flex-1 overflow-auto">
                {panel.component}
              </div>
            </div>
          ))}
        </div>

        {/* Main Editor Area */}
        <div className="ide-editor flex-1 flex flex-col">
          {activeFile ? (
            <MonacoEditor
              value={activeFile.content}
              language={activeFile.language}
              onChange={(content) => handleFileUpdate(activeFile.id, content)}
              file={activeFile}
              onCodeGeneration={onCodeGeneration}
              className="flex-1"
            />
          ) : (
            <div className="empty-editor flex items-center justify-center flex-1 bg-gray-50">
              <div className="text-center">
                <div className="text-4xl mb-4">📝</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No file selected
                </h3>
                <p className="text-gray-500 mb-4">
                  Select a file from the explorer or create a new one
                </p>
                <button
                  onClick={() => handleFileCreate('welcome.js', '// Welcome to Auterity IDE\n// Start coding here!')}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Create Welcome File
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar - Could be used for additional panels */}
        <div className="ide-right-sidebar">
          {/* Future: Outline, Problems, Search results, etc. */}
        </div>
      </div>

      {/* Bottom Terminal */}
      {showTerminal && (
        <div className="ide-terminal">
          <div className="terminal-header flex items-center justify-between p-2 bg-gray-800 text-white border-t border-gray-700">
            <div className="flex items-center space-x-2">
              <span>⌨️</span>
              <span className="text-sm font-medium">Terminal</span>
            </div>
            <button
              onClick={() => setShowTerminal(false)}
              className="terminal-close text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>
          <WebTerminal
            onCommand={handleTerminalCommand}
            height="200px"
            className="flex-1"
          />
        </div>
      )}

      {/* Status Bar */}
      <div className="ide-status-bar flex items-center justify-between p-2 bg-gray-800 text-white text-xs border-t border-gray-700">
        <div className="status-left flex items-center space-x-4">
          <span>UTF-8</span>
          <span>{activeFile?.language || 'plaintext'}</span>
          {activeFile && <span>{activeFile.path}</span>}
        </div>
        <div className="status-right flex items-center space-x-4">
          <span>Continue.dev: {continueDev.isConfigured ? 'Connected' : 'Disconnected'}</span>
          <span>Git: {currentRepository ? 'Connected' : 'Disconnected'}</span>
          <span>Files: {files.length}</span>
        </div>
      </div>
    </div>
  );
};

// Utility function to detect language from filename
function getLanguageFromFilename(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  const languageMap: Record<string, string> = {
    'js': 'javascript',
    'jsx': 'javascript',
    'ts': 'typescript',
    'tsx': 'typescript',
    'py': 'python',
    'java': 'java',
    'cpp': 'cpp',
    'c': 'c',
    'cs': 'csharp',
    'php': 'php',
    'rb': 'ruby',
    'go': 'go',
    'rs': 'rust',
    'swift': 'swift',
    'kt': 'kotlin',
    'scala': 'scala',
    'html': 'html',
    'css': 'css',
    'scss': 'scss',
    'less': 'less',
    'json': 'json',
    'xml': 'xml',
    'yaml': 'yaml',
    'yml': 'yaml',
    'md': 'markdown',
    'sql': 'sql',
    'sh': 'shell',
    'bash': 'shell',
    'dockerfile': 'dockerfile'
  };

  return languageMap[ext || ''] || 'plaintext';
}
