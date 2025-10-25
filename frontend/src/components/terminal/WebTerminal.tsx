/**
 * Web-Based Terminal Component with Xterm.js
 * Provides command-line interface for development tasks
 */

import React, { useEffect, useRef, useState } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { WebLinksAddon } from 'xterm-addon-web-links';
import 'xterm/css/xterm.css';

interface WebTerminalProps {
  commands?: Record<string, (args: string[]) => Promise<string>>;
  prompt?: string;
  theme?: 'dark' | 'light';
  onCommand?: (command: string) => void;
  className?: string;
  height?: string;
}

export const WebTerminal: React.FC<WebTerminalProps> = ({
  commands = {},
  prompt = '$ ',
  theme = 'dark',
  onCommand,
  className = '',
  height = '400px'
}) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const [currentDirectory, setCurrentDirectory] = useState('/');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Built-in commands
  const builtInCommands: Record<string, (args: string[]) => Promise<string>> = {
    help: async () => {
      return `Available commands:
  help                    - Show this help
  clear                   - Clear terminal
  pwd                     - Show current directory
  ls                      - List files
  cd <dir>                - Change directory
  create-workflow <name>  - Create new workflow
  deploy <env>            - Deploy to environment
  logs <service>          - Show service logs
  test                    - Run tests
  analyze                 - Analyze current code
  generate <type>         - Generate code/templates`;
    },

    clear: async () => {
      xtermRef.current?.clear();
      return '';
    },

    pwd: async () => {
      return currentDirectory;
    },

    ls: async () => {
      // Mock file listing - in real implementation, this would call an API
      return `drwxr-xr-x  5 user  group    160 Jan 15 10:30 .
drwxr-xr-x 15 user  group    480 Jan 15 10:30 ..
-rw-r--r--  1 user  group   1024 Jan 15 10:30 package.json
-rw-r--r--  1 user  group   2048 Jan 15 10:30 tsconfig.json
drwxr-xr-x  3 user  group     96 Jan 15 10:30 src
drwxr-xr-x  2 user  group     64 Jan 15 10:30 tests
-rw-r--r--  1 user  group   4096 Jan 15 10:30 README.md`;
    },

    cd: async (args: string[]) => {
      if (args.length === 0) return 'cd: missing argument';
      const newDir = args[0];
      setCurrentDirectory(newDir);
      return `Changed directory to ${newDir}`;
    },

    create: async (args: string[]) => {
      if (args.length === 0) return 'create: missing type (workflow|component|test)';
      const type = args[0];
      return `Creating ${type}... (This would integrate with Continue.dev to generate code)`;
    },

    deploy: async (args: string[]) => {
      if (args.length === 0) return 'deploy: missing environment (dev|staging|prod)';
      const env = args[0];
      return `Deploying to ${env} environment... (This would trigger deployment pipeline)`;
    },

    logs: async (args: string[]) => {
      const service = args[0] || 'all';
      return `Showing logs for ${service}... (This would fetch real-time logs)`;
    },

    test: async () => {
      return `Running test suite...
✅ Unit tests: 245/250 passed
✅ Integration tests: 45/50 passed
✅ E2E tests: 12/15 passed
⚠️  Some tests failed - check logs for details`;
    },

    analyze: async () => {
      return `Analyzing current codebase...
📊 Complexity: Medium (Score: 7.2/10)
🔍 Issues found: 3 warnings, 1 error
💡 Suggestions: 5 optimizations available
📈 Test coverage: 85%`;
    },

    generate: async (args: string[]) => {
      if (args.length === 0) return 'generate: missing type (component|test|docs)';
      const type = args[0];
      return `Generating ${type}... (This would use Continue.dev to generate code)`;
    }
  };

  // Combine built-in and custom commands
  const allCommands = { ...builtInCommands, ...commands };

  useEffect(() => {
    if (!terminalRef.current) return;

    // Initialize terminal
    const terminal = new Terminal({
      theme: theme === 'dark' ? {
        background: '#1e1e1e',
        foreground: '#d4d4d4',
        cursor: '#ffffff',
        selection: '#264f78'
      } : {
        background: '#ffffff',
        foreground: '#000000',
        cursor: '#000000',
        selection: '#add6ff'
      },
      fontSize: 14,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      cursorBlink: true,
      convertEol: true,
      allowTransparency: true,
      scrollback: 1000
    });

    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();

    terminal.loadAddon(fitAddon);
    terminal.loadAddon(webLinksAddon);

    terminal.open(terminalRef.current);
    fitAddon.fit();

    // Store references
    xtermRef.current = terminal;
    fitAddonRef.current = fitAddon;

    // Setup event handlers
    setupEventHandlers(terminal);

    // Welcome message
    terminal.writeln('Welcome to Auterity Terminal');
    terminal.writeln(`Type 'help' for available commands`);
    terminal.write(prompt);

    return () => {
      terminal.dispose();
    };
  }, [commands, prompt, theme]);

  // Setup terminal event handlers
  const setupEventHandlers = (terminal: Terminal) => {
    let currentLine = '';
    let cursorPosition = 0;

    terminal.onData((data) => {
      const code = data.charCodeAt(0);

      switch (code) {
        case 13: // Enter
          handleEnter(currentLine);
          currentLine = '';
          cursorPosition = 0;
          break;

        case 127: // Backspace
          if (cursorPosition > 0) {
            currentLine = currentLine.slice(0, cursorPosition - 1) + currentLine.slice(cursorPosition);
            cursorPosition--;
            updateDisplay(currentLine, cursorPosition);
          }
          break;

        case 27: // Escape sequences (arrow keys, etc.)
          if (data.length > 1) {
            handleEscapeSequence(data, currentLine, cursorPosition);
          }
          break;

        default:
          // Regular character input
          if (data >= ' ' && data <= '~') {
            currentLine = currentLine.slice(0, cursorPosition) + data + currentLine.slice(cursorPosition);
            cursorPosition++;
            updateDisplay(currentLine, cursorPosition);
          }
          break;
      }
    });
  };

  // Handle enter key press
  const handleEnter = async (line: string) => {
    const command = line.trim();

    if (command) {
      // Add to history
      setCommandHistory(prev => [...prev, command]);
      setHistoryIndex(-1);

      // Execute command
      await executeCommand(command);

      // Notify parent component
      onCommand?.(command);
    } else {
      xtermRef.current?.write('\r\n' + prompt);
    }
  };

  // Execute command
  const executeCommand = async (command: string) => {
    const terminal = xtermRef.current;
    if (!terminal) return;

    const parts = command.split(' ');
    const cmd = parts[0];
    const args = parts.slice(1);

    terminal.write('\r\n');

    try {
      let result = '';

      if (allCommands[cmd]) {
        result = await allCommands[cmd](args);
      } else {
        result = `Command not found: ${cmd}. Type 'help' for available commands.`;
      }

      if (result) {
        terminal.writeln(result);
      }
    } catch (error) {
      terminal.writeln(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    terminal.write(prompt);
  };

  // Handle escape sequences (arrow keys, etc.)
  const handleEscapeSequence = (data: string, currentLine: string, cursorPosition: number) => {
    // Handle arrow keys for history navigation
    if (data === '\x1b[A') { // Up arrow
      navigateHistory(-1);
    } else if (data === '\x1b[B') { // Down arrow
      navigateHistory(1);
    } else if (data === '\x1b[C') { // Right arrow
      // Move cursor right
    } else if (data === '\x1b[D') { // Left arrow
      // Move cursor left
    }
  };

  // Navigate command history
  const navigateHistory = (direction: number) => {
    const terminal = xtermRef.current;
    if (!terminal || commandHistory.length === 0) return;

    const newIndex = Math.max(-1, Math.min(commandHistory.length - 1, historyIndex + direction));
    setHistoryIndex(newIndex);

    let displayLine = '';
    if (newIndex >= 0) {
      displayLine = commandHistory[commandHistory.length - 1 - newIndex];
    }

    // Clear current line and display historical command
    terminal.write('\r' + prompt + displayLine + '\x1b[K');
  };

  // Update terminal display
  const updateDisplay = (line: string, cursorPos: number) => {
    const terminal = xtermRef.current;
    if (!terminal) return;

    // Clear line and rewrite
    terminal.write('\r' + prompt + line + '\x1b[K');

    // Move cursor to correct position
    if (cursorPos < line.length) {
      terminal.write(`\x1b[${prompt.length + cursorPos + 1}G`);
    }
  };

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (fitAddonRef.current) {
        fitAddonRef.current.fit();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className={`web-terminal-container ${className}`}>
      {/* Terminal Header */}
      <div className="terminal-header flex items-center justify-between p-2 bg-gray-800 text-white text-sm">
        <div className="terminal-info flex items-center space-x-2">
          <div className="terminal-icon">⌨️</div>
          <span>Auterity Terminal</span>
          <span className="text-gray-400">•</span>
          <span className="text-gray-400">{currentDirectory}</span>
        </div>
        <div className="terminal-actions flex space-x-2">
          <button className="terminal-btn text-xs hover:bg-gray-700 px-2 py-1 rounded">
            Clear
          </button>
          <button className="terminal-btn text-xs hover:bg-gray-700 px-2 py-1 rounded">
            Help
          </button>
        </div>
      </div>

      {/* Terminal Body */}
      <div
        ref={terminalRef}
        className="terminal-body"
        style={{ height }}
      />

      {/* Quick Command Bar */}
      <div className="terminal-footer flex flex-wrap gap-1 p-2 bg-gray-800 border-t border-gray-700">
        <QuickCommand icon="📁" command="ls" tooltip="List files" />
        <QuickCommand icon="🔍" command="analyze" tooltip="Analyze code" />
        <QuickCommand icon="🧪" command="test" tooltip="Run tests" />
        <QuickCommand icon="🚀" command="deploy staging" tooltip="Deploy to staging" />
        <QuickCommand icon="📋" command="help" tooltip="Show help" />
      </div>
    </div>
  );
};

// Quick Command Component
interface QuickCommandProps {
  icon: string;
  command: string;
  tooltip: string;
}

const QuickCommand: React.FC<QuickCommandProps> = ({ icon, command, tooltip }) => {
  return (
    <button
      className="quick-cmd-btn flex items-center space-x-1 px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs text-gray-300 hover:text-white transition-colors"
      title={tooltip}
      onClick={() => {
        // This would trigger the command in the terminal
        // Implementation would depend on the terminal instance
      }}
    >
      <span>{icon}</span>
      <span>{command}</span>
    </button>
  );
};
