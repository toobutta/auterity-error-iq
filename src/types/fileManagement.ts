// File Management System Types
export interface WorkflowFile {
  id: string;
  name: string;
  description?: string;
  version: string;
  created: Date;
  modified: Date;
  author: string;
  tags: string[];
  thumbnail?: string;
  metadata: WorkflowMetadata;
}

export interface WorkflowMetadata {
  nodeCount: number;
  connectionCount: number;
  canvasSize: { width: number; height: number };
  viewport: { x: number; y: number; zoom: number };
  estimatedComplexity: 'simple' | 'medium' | 'complex';
  categories: string[];
  lastExecutionTime?: number;
  executionCount: number;
}

export interface WorkflowSnapshot {
  id: string;
  timestamp: Date;
  description: string;
  nodes: Map<string, any>;
  connections: Map<string, any>;
  canvas: any;
  thumbnail?: string;
  size: number; // bytes
}

export interface TemplateLibrary {
  templates: WorkflowTemplate[];
  categories: TemplateCategory[];
  favorites: string[];
  recentlyUsed: string[];
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  author: string;
  version: string;
  tags: string[];
  thumbnail: string;
  preview: string; // larger preview image
  complexity: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number; // minutes
  nodes: any[];
  connections: any[];
  viewport: { x: number; y: number; zoom: number };
  usageCount: number;
  rating: number;
  created: Date;
  modified: Date;
}

export interface TemplateCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  templateCount: number;
}

export interface ImportExportOptions {
  format: 'json' | 'xml' | 'yaml' | 'workflow';
  includeMetadata: boolean;
  includeThumbnails: boolean;
  compress: boolean;
  password?: string;
  version: string;
}

export interface StorageProvider {
  name: string;
  type: 'local' | 'cloud' | 'indexeddb';
  capacity?: number;
  used: number;
  available: number;
  isOnline: boolean;
  lastSync?: Date;
}

export interface AutoSaveConfig {
  enabled: boolean;
  interval: number; // seconds
  maxBackups: number;
  backupOnClose: boolean;
  backupOnError: boolean;
}

export interface VersionHistory {
  current: WorkflowSnapshot;
  snapshots: WorkflowSnapshot[];
  maxSnapshots: number;
  autoSave: boolean;
}

export interface FileDialogState {
  visible: boolean;
  mode: 'open' | 'save' | 'import' | 'export';
  title: string;
  filters: FileFilter[];
  selectedFiles: string[];
  currentDirectory: string;
}

export interface FileFilter {
  name: string;
  extensions: string[];
  description: string;
}

export interface PresentationMode {
  enabled: boolean;
  currentSlide: number;
  slides: PresentationSlide[];
  autoAdvance: boolean;
  advanceInterval: number; // seconds
  showControls: boolean;
  fullscreen: boolean;
}

export interface PresentationSlide {
  id: string;
  title: string;
  description: string;
  viewport: { x: number; y: number; zoom: number };
  highlightedNodes: string[];
  highlightedConnections: string[];
  annotations: SlideAnnotation[];
  transition: 'fade' | 'slide' | 'zoom';
}

export interface SlideAnnotation {
  id: string;
  type: 'text' | 'arrow' | 'circle' | 'rectangle';
  position: { x: number; y: number };
  content: string;
  style: AnnotationStyle;
}

export interface AnnotationStyle {
  color: string;
  size: number;
  opacity: number;
  fontSize?: number;
  fontFamily?: string;
}

// File Management Actions
export interface FileManagementActions {
  // File operations
  newWorkflow: () => void;
  openWorkflow: (fileId?: string) => void;
  saveWorkflow: (options?: SaveOptions) => Promise<void>;
  saveAsWorkflow: (options?: SaveOptions) => Promise<void>;
  importWorkflow: (data: any, format: string) => Promise<void>;
  exportWorkflow: (options: ImportExportOptions) => Promise<string>;

  // Template operations
  loadTemplate: (templateId: string) => Promise<void>;
  saveAsTemplate: (template: Partial<WorkflowTemplate>) => Promise<void>;
  deleteTemplate: (templateId: string) => Promise<void>;
  favoriteTemplate: (templateId: string) => void;

  // Version control
  createSnapshot: (description?: string) => void;
  restoreSnapshot: (snapshotId: string) => void;
  deleteSnapshot: (snapshotId: string) => void;
  compareSnapshots: (snapshotId1: string, snapshotId2: string) => void;

  // Storage management
  getStorageInfo: () => StorageProvider[];
  cleanupStorage: () => Promise<void>;
  backupToCloud: () => Promise<void>;
  restoreFromCloud: () => Promise<void>;

  // Presentation
  enterPresentationMode: () => void;
  exitPresentationMode: () => void;
  nextSlide: () => void;
  previousSlide: () => void;
  goToSlide: (slideIndex: number) => void;
}

export interface SaveOptions {
  name?: string;
  description?: string;
  tags?: string[];
  autoSave?: boolean;
  createSnapshot?: boolean;
}

// Recent Files Management
export interface RecentFile {
  id: string;
  name: string;
  path: string;
  thumbnail?: string;
  lastOpened: Date;
  size: number;
  type: 'workflow' | 'template';
}

// Cloud Integration Types
export interface CloudProvider {
  name: string;
  type: 'google' | 'dropbox' | 'onedrive' | 'github' | 'custom';
  isAuthenticated: boolean;
  userInfo?: CloudUser;
  syncEnabled: boolean;
  lastSync?: Date;
}

export interface CloudUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface CloudFile {
  id: string;
  name: string;
  path: string;
  size: number;
  modified: Date;
  shared: boolean;
  collaborators: CloudUser[];
}

// Search and Organization
export interface FileSearchQuery {
  query: string;
  filters: {
    type?: 'workflow' | 'template' | 'all';
    category?: string;
    author?: string;
    tags?: string[];
    dateRange?: { start: Date; end: Date };
    complexity?: 'beginner' | 'intermediate' | 'advanced';
    rating?: { min: number; max: number };
  };
  sortBy: 'name' | 'modified' | 'created' | 'size' | 'usage';
  sortOrder: 'asc' | 'desc';
  limit: number;
  offset: number;
}

export interface FileSearchResult {
  files: WorkflowFile[];
  templates: WorkflowTemplate[];
  totalCount: number;
  hasMore: boolean;
}

// Backup and Recovery
export interface BackupConfig {
  enabled: boolean;
  location: string;
  frequency: 'manual' | 'daily' | 'weekly' | 'monthly';
  retention: number; // days
  includeThumbnails: boolean;
  compress: boolean;
  encrypt: boolean;
}

export interface BackupInfo {
  id: string;
  name: string;
  created: Date;
  size: number;
  fileCount: number;
  status: 'completed' | 'failed' | 'in-progress';
  location: string;
}
