/**
 * Plugin System Architecture
 * Extensible plugin system for the Auterity IDE
 */

// Plugin Interfaces
export interface Plugin {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  homepage?: string;
  repository?: string;
  license?: string;
  keywords?: string[];
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  engines?: Record<string, string>;

  // Lifecycle hooks
  activate?: (context: PluginContext) => Promise<void> | void;
  deactivate?: () => Promise<void> | void;

  // Configuration
  config?: PluginConfig;

  // Extension points
  extensions?: PluginExtensions;
}

export interface PluginContext {
  // Core services
  ide: IDEAPI;
  workspace: WorkspaceAPI;
  editor: EditorAPI;
  collaboration: CollaborationAPI;
  ai: AIAPI;

  // Utility functions
  logger: LoggerAPI;
  storage: StorageAPI;
  events: EventAPI;

  // Plugin management
  plugins: PluginManagerAPI;
}

export interface PluginConfig {
  enabled: boolean;
  settings: Record<string, any>;
  keybindings?: Keybinding[];
  themes?: Theme[];
  languages?: Language[];
}

export interface PluginExtensions {
  commands?: Command[];
  views?: View[];
  menus?: MenuItem[];
  toolbars?: ToolbarItem[];
  statusBarItems?: StatusBarItem[];
  keybindings?: Keybinding[];
  themes?: Theme[];
  languages?: Language[];
  syntaxes?: SyntaxDefinition[];
  completions?: CompletionProvider[];
  diagnostics?: DiagnosticProvider[];
}

// Core API Interfaces
export interface IDEAPI {
  version: string;
  platform: string;
  isDevelopment: boolean;

  // IDE state
  getCurrentFile(): FileItem | null;
  getOpenFiles(): FileItem[];
  getActiveEditor(): EditorAPI | null;

  // UI manipulation
  showNotification(message: string, type?: 'info' | 'warning' | 'error'): void;
  showProgress(title: string, cancellable?: boolean): ProgressHandle;
  openDialog(dialog: DialogOptions): Promise<any>;
}

export interface WorkspaceAPI {
  rootPath: string;
  name: string;
  files: FileItem[];

  // File operations
  findFiles(pattern: string): Promise<FileItem[]>;
  readFile(path: string): Promise<string>;
  writeFile(path: string, content: string): Promise<void>;
  createFile(path: string, content?: string): Promise<FileItem>;
  deleteFile(path: string): Promise<void>;
  renameFile(oldPath: string, newPath: string): Promise<void>;

  // Directory operations
  createDirectory(path: string): Promise<void>;
  deleteDirectory(path: string): Promise<void>;
  listDirectory(path: string): Promise<FileItem[]>;

  // Workspace events
  onDidChangeFiles: Event<FileChangeEvent[]>;
  onDidChangeWorkspace: Event<WorkspaceChangeEvent>;
}

export interface EditorAPI {
  // Editor state
  getValue(): string;
  setValue(value: string): void;
  getSelection(): Selection;
  setSelection(selection: Selection): void;
  getCursorPosition(): Position;
  setCursorPosition(position: Position): void;

  // File operations
  save(): Promise<void>;
  revert(): Promise<void>;

  // View operations
  revealRange(range: Range): void;
  scrollToPosition(position: Position): void;

  // Language features
  setLanguage(languageId: string): void;
  getLanguage(): string;

  // Editor events
  onDidChangeContent: Event<TextChangeEvent>;
  onDidChangeSelection: Event<SelectionChangeEvent>;
  onDidChangeCursorPosition: Event<CursorChangeEvent>;
}

export interface CollaborationAPI {
  // Session management
  createSession(name: string): Promise<CollaborationSession>;
  joinSession(sessionId: string): Promise<void>;
  leaveSession(): Promise<void>;

  // Real-time features
  broadcast(type: string, data: any): void;
  onMessage: Event<CollaborationMessage>;

  // User management
  getParticipants(): CollaborationParticipant[];
  onParticipantJoined: Event<CollaborationParticipant>;
  onParticipantLeft: Event<CollaborationParticipant>;
}

export interface AIAPI {
  // Code generation
  generateCode(prompt: string, context?: CodeContext): Promise<GeneratedCode>;
  getCompletions(context: CompletionContext): Promise<CompletionItem[]>;

  // Code analysis
  analyzeCode(code: string, language?: string): Promise<CodeAnalysis>;
  generateTests(code: string, language?: string): Promise<string>;

  // Model management
  listModels(): Promise<AIModel[]>;
  switchModel(modelId: string): Promise<void>;

  // AI events
  onGenerationComplete: Event<GenerationResult>;
  onAnalysisComplete: Event<AnalysisResult>;
}

// Utility APIs
export interface LoggerAPI {
  debug(message: string, ...args: any[]): void;
  info(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  error(message: string, ...args: any[]): void;
}

export interface StorageAPI {
  get<T>(key: string, defaultValue?: T): Promise<T>;
  set<T>(key: string, value: T): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
  keys(): Promise<string[]>;
}

export interface EventAPI {
  emit(event: string, data?: any): void;
  on(event: string, handler: (data?: any) => void): Disposable;
  once(event: string, handler: (data?: any) => void): Disposable;
  off(event: string, handler?: (data?: any) => void): void;
}

export interface PluginManagerAPI {
  getPlugin(id: string): Plugin | undefined;
  getAllPlugins(): Plugin[];
  isPluginEnabled(id: string): boolean;
  enablePlugin(id: string): Promise<void>;
  disablePlugin(id: string): Promise<void>;
  reloadPlugin(id: string): Promise<void>;
  uninstallPlugin(id: string): Promise<void>;
}

// Extension Point Interfaces
export interface Command {
  id: string;
  title: string;
  category?: string;
  icon?: string;
  keybinding?: string;
  when?: string;
  handler: (context?: any) => Promise<void> | void;
}

export interface View {
  id: string;
  name: string;
  icon?: string;
  component: React.ComponentType<any>;
  location: 'sidebar' | 'panel' | 'editor' | 'bottom';
  when?: string;
  order?: number;
}

export interface MenuItem {
  id: string;
  label: string;
  icon?: string;
  command?: string;
  submenu?: MenuItem[];
  when?: string;
  group?: string;
  order?: number;
}

export interface ToolbarItem {
  id: string;
  icon: string;
  tooltip: string;
  command: string;
  when?: string;
  order?: number;
}

export interface StatusBarItem {
  id: string;
  text: string;
  tooltip?: string;
  command?: string;
  alignment: 'left' | 'right';
  priority?: number;
  when?: string;
}

export interface Keybinding {
  key: string;
  command: string;
  when?: string;
  mac?: string;
  linux?: string;
  win?: string;
}

export interface Theme {
  id: string;
  name: string;
  type: 'light' | 'dark' | 'highContrast';
  colors: Record<string, string>;
  tokenColors?: TokenColor[];
}

export interface Language {
  id: string;
  extensions: string[];
  filenames?: string[];
  firstLine?: string;
  configuration?: string;
}

export interface SyntaxDefinition {
  language: string;
  scopeName: string;
  path: string;
  embeddedLanguages?: Record<string, string>;
  tokenTypes?: Record<string, string>;
}

export interface CompletionProvider {
  language: string;
  provideCompletions: (context: CompletionContext) => Promise<CompletionItem[]>;
  resolveCompletion?: (item: CompletionItem) => Promise<CompletionItem>;
  triggerCharacters?: string[];
}

export interface DiagnosticProvider {
  language: string;
  provideDiagnostics: (document: TextDocument) => Promise<Diagnostic[]>;
}

// Data Types
export interface FileItem {
  id: string;
  name: string;
  path: string;
  content: string;
  language: string;
  lastModified: Date;
  isDirty?: boolean;
}

export interface Position {
  lineNumber: number;
  column: number;
}

export interface Range {
  start: Position;
  end: Position;
}

export interface Selection {
  start: Position;
  end: Position;
}

export interface TextChangeEvent {
  changes: TextChange[];
  versionId: number;
}

export interface TextChange {
  range: Range;
  text: string;
  rangeLength: number;
}

export interface SelectionChangeEvent {
  selection: Selection;
  source: string;
}

export interface CursorChangeEvent {
  position: Position;
  source: string;
}

export interface FileChangeEvent {
  type: 'created' | 'changed' | 'deleted';
  file: FileItem;
}

export interface WorkspaceChangeEvent {
  type: 'added' | 'removed' | 'changed';
  folder: string;
}

export interface CollaborationSession {
  id: string;
  name: string;
  participants: CollaborationParticipant[];
}

export interface CollaborationParticipant {
  id: string;
  name: string;
  color: string;
  cursor?: Position;
}

export interface CollaborationMessage {
  type: string;
  data: any;
  sender: string;
  timestamp: Date;
}

export interface CodeContext {
  files: FileItem[];
  selection?: Selection;
  workspace?: any;
}

export interface GeneratedCode {
  code: string;
  explanation: string;
  suggestions?: string[];
  confidence?: number;
}

export interface CompletionContext {
  code: string;
  position: Position;
  language: string;
  triggerCharacter?: string;
}

export interface CompletionItem {
  label: string;
  kind: string;
  detail?: string;
  documentation?: string;
  insertText: string;
  range?: Range;
}

export interface CodeAnalysis {
  issues: CodeIssue[];
  suggestions: CodeSuggestion[];
  metrics: CodeMetrics;
}

export interface CodeIssue {
  type: 'error' | 'warning' | 'info';
  message: string;
  range: Range;
  severity: 'low' | 'medium' | 'high';
}

export interface CodeSuggestion {
  type: 'refactor' | 'optimize' | 'security';
  description: string;
  range?: Range;
  newText?: string;
}

export interface CodeMetrics {
  complexity: number;
  maintainability: number;
  testCoverage?: number;
}

export interface AIModel {
  id: string;
  name: string;
  provider: string;
  contextLength: number;
  capabilities: string[];
}

export interface GenerationResult {
  code: string;
  model: string;
  duration: number;
  tokens: number;
}

export interface AnalysisResult {
  issues: CodeIssue[];
  suggestions: CodeSuggestion[];
  duration: number;
}

export interface TokenColor {
  name?: string;
  scope: string | string[];
  settings: {
    foreground?: string;
    background?: string;
    fontStyle?: string;
  };
}

export interface TextDocument {
  uri: string;
  languageId: string;
  version: number;
  getText(range?: Range): string;
  positionAt(offset: number): Position;
  offsetAt(position: Position): number;
}

export interface Diagnostic {
  range: Range;
  message: string;
  severity: 'error' | 'warning' | 'info' | 'hint';
  source?: string;
  code?: string | number;
}

export interface DialogOptions {
  title: string;
  message?: string;
  type: 'info' | 'warning' | 'error' | 'question';
  buttons?: string[];
  defaultId?: number;
  cancelId?: number;
}

export interface ProgressHandle {
  report(value: { increment?: number; message?: string }): void;
  cancel(): void;
}

export interface Disposable {
  dispose(): void;
}

export interface Event<T> {
  (listener: (e: T) => void): Disposable;
}

// Plugin Manager Implementation
export class PluginManager {
  private plugins: Map<string, Plugin> = new Map();
  private enabledPlugins: Set<string> = new Set();
  private pluginContexts: Map<string, PluginContext> = new Map();

  constructor(private context: PluginContext) {}

  async loadPlugin(plugin: Plugin): Promise<void> {
    try {
      this.plugins.set(plugin.id, plugin);

      // Create plugin-specific context
      const pluginContext = {
        ...this.context,
        logger: {
          ...this.context.logger,
          debug: (msg: string, ...args: any[]) => this.context.logger.debug(`[${plugin.name}] ${msg}`, ...args),
          info: (msg: string, ...args: any[]) => this.context.logger.info(`[${plugin.name}] ${msg}`, ...args),
          warn: (msg: string, ...args: any[]) => this.context.logger.warn(`[${plugin.name}] ${msg}`, ...args),
          error: (msg: string, ...args: any[]) => this.context.logger.error(`[${plugin.name}] ${msg}`, ...args)
        }
      };

      this.pluginContexts.set(plugin.id, pluginContext);

      // Activate plugin if enabled
      if (plugin.config?.enabled) {
        await this.enablePlugin(plugin.id);
      }

      this.context.logger.info(`Plugin loaded: ${plugin.name} v${plugin.version}`);
    } catch (error) {
      this.context.logger.error(`Failed to load plugin ${plugin.name}:`, error);
      throw error;
    }
  }

  async enablePlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    if (this.enabledPlugins.has(pluginId)) {
      return; // Already enabled
    }

    try {
      const context = this.pluginContexts.get(pluginId);
      if (plugin.activate && context) {
        await plugin.activate(context);
      }

      this.enabledPlugins.add(pluginId);
      this.context.logger.info(`Plugin enabled: ${plugin.name}`);
    } catch (error) {
      this.context.logger.error(`Failed to enable plugin ${plugin.name}:`, error);
      throw error;
    }
  }

  async disablePlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    if (!this.enabledPlugins.has(pluginId)) {
      return; // Already disabled
    }

    try {
      if (plugin.deactivate) {
        await plugin.deactivate();
      }

      this.enabledPlugins.delete(pluginId);
      this.context.logger.info(`Plugin disabled: ${plugin.name}`);
    } catch (error) {
      this.context.logger.error(`Failed to disable plugin ${plugin.name}:`, error);
      throw error;
    }
  }

  async reloadPlugin(pluginId: string): Promise<void> {
    await this.disablePlugin(pluginId);
    await this.enablePlugin(pluginId);
  }

  getPlugin(pluginId: string): Plugin | undefined {
    return this.plugins.get(pluginId);
  }

  getAllPlugins(): Plugin[] {
    return Array.from(this.plugins.values());
  }

  isPluginEnabled(pluginId: string): boolean {
    return this.enabledPlugins.has(pluginId);
  }

  getEnabledPlugins(): Plugin[] {
    return Array.from(this.enabledPlugins)
      .map(id => this.plugins.get(id))
      .filter(Boolean) as Plugin[];
  }

  dispose(): void {
    // Disable all plugins
    this.enabledPlugins.forEach(pluginId => {
      const plugin = this.plugins.get(pluginId);
      if (plugin?.deactivate) {
        try {
          plugin.deactivate();
        } catch (error) {
          this.context.logger.error(`Error disabling plugin ${plugin.name}:`, error);
        }
      }
    });

    this.plugins.clear();
    this.enabledPlugins.clear();
    this.pluginContexts.clear();
  }
}
