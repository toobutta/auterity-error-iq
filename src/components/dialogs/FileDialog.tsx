import React, { useState, useEffect, useCallback } from 'react';
import { useStudioStore } from '../../hooks/useStudioStore';
import { fileManagementService } from '../../services/fileManagementService';
import {
  FileDialogState,
  WorkflowFile,
  WorkflowTemplate,
  FileSearchQuery,
  FileSearchResult
} from '../../types/fileManagement';
import './FileDialog.css';

interface FileDialogProps {
  dialog: FileDialogState;
  onClose: () => void;
  onFileSelected: (file: WorkflowFile | WorkflowTemplate) => void;
  onSave: (options: any) => void;
}

export const FileDialog: React.FC<FileDialogProps> = ({
  dialog,
  onClose,
  onFileSelected,
  onSave
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [recentFiles, setRecentFiles] = useState<WorkflowFile[]>([]);
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);
  const [searchResults, setSearchResults] = useState<FileSearchResult | null>(null);
  const [viewMode, setViewMode] = useState<'recent' | 'templates' | 'search'>('recent');
  const [saveOptions, setSaveOptions] = useState({
    name: '',
    description: '',
    tags: [] as string[],
    newTag: ''
  });

  // Load data based on mode
  useEffect(() => {
    if (dialog.visible) {
      switch (dialog.mode) {
        case 'open':
          loadRecentFiles();
          loadTemplates();
          break;
        case 'save':
        case 'save':
          // Pre-fill with current workflow name
          break;
      }
    }
  }, [dialog.visible, dialog.mode]);

  const loadRecentFiles = useCallback(async () => {
    // Would get from service
    setRecentFiles([]);
  }, []);

  const loadTemplates = useCallback(async () => {
    // Would get from service
    setTemplates([]);
  }, []);

  const handleSearch = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSearchResults(null);
      return;
    }

    const searchQuery: FileSearchQuery = {
      query,
      filters: {},
      sortBy: 'modified',
      sortOrder: 'desc',
      limit: 20,
      offset: 0
    };

    // Would call search service
    setSearchResults(null);
  }, []);

  const handleFileSelect = useCallback((file: WorkflowFile | WorkflowTemplate) => {
    setSelectedFiles([file.id]);
  }, []);

  const handleFileDoubleClick = useCallback((file: WorkflowFile | WorkflowTemplate) => {
    onFileSelected(file);
  }, [onFileSelected]);

  const handleSave = useCallback(() => {
    if (!saveOptions.name.trim()) return;

    onSave({
      ...saveOptions,
      tags: saveOptions.tags.filter(tag => tag.trim())
    });
  }, [saveOptions, onSave]);

  const handleAddTag = useCallback(() => {
    if (saveOptions.newTag.trim() && !saveOptions.tags.includes(saveOptions.newTag.trim())) {
      setSaveOptions(prev => ({
        ...prev,
        tags: [...prev.tags, prev.newTag.trim()],
        newTag: ''
      }));
    }
  }, [saveOptions.newTag]);

  const handleRemoveTag = useCallback((tagToRemove: string) => {
    setSaveOptions(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  }, []);

  if (!dialog.visible) return null;

  return (
    <div className="file-dialog-overlay">
      <div className="file-dialog">
        {/* Header */}
        <div className="file-dialog-header">
          <h2>{dialog.title}</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        {/* Content */}
        <div className="file-dialog-content">
          {dialog.mode === 'open' && (
            <OpenFileDialog
              viewMode={viewMode}
              setViewMode={setViewMode}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              recentFiles={recentFiles}
              templates={templates}
              searchResults={searchResults}
              selectedFiles={selectedFiles}
              onFileSelect={handleFileSelect}
              onFileDoubleClick={handleFileDoubleClick}
              onSearch={handleSearch}
            />
          )}

          {dialog.mode === 'save' && (
            <SaveFileDialog
              saveOptions={saveOptions}
              setSaveOptions={setSaveOptions}
              onAddTag={handleAddTag}
              onRemoveTag={handleRemoveTag}
            />
          )}
        </div>

        {/* Footer */}
        <div className="file-dialog-footer">
          {dialog.mode === 'open' && (
            <>
              <button className="btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button
                className="btn-primary"
                disabled={selectedFiles.length === 0}
                onClick={() => {
                  const file = recentFiles.find(f => f.id === selectedFiles[0]) ||
                              templates.find(t => t.id === selectedFiles[0]);
                  if (file) onFileSelected(file);
                }}
              >
                Open
              </button>
            </>
          )}

          {dialog.mode === 'save' && (
            <>
              <button className="btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button
                className="btn-primary"
                disabled={!saveOptions.name.trim()}
                onClick={handleSave}
              >
                Save
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Open File Dialog Component
interface OpenFileDialogProps {
  viewMode: 'recent' | 'templates' | 'search';
  setViewMode: (mode: 'recent' | 'templates' | 'search') => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  recentFiles: WorkflowFile[];
  templates: WorkflowTemplate[];
  searchResults: FileSearchResult | null;
  selectedFiles: string[];
  onFileSelect: (file: WorkflowFile | WorkflowTemplate) => void;
  onFileDoubleClick: (file: WorkflowFile | WorkflowTemplate) => void;
  onSearch: (query: string) => void;
}

const OpenFileDialog: React.FC<OpenFileDialogProps> = ({
  viewMode,
  setViewMode,
  searchQuery,
  setSearchQuery,
  recentFiles,
  templates,
  searchResults,
  selectedFiles,
  onFileSelect,
  onFileDoubleClick,
  onSearch
}) => {
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (query.length >= 2) {
      onSearch(query);
      setViewMode('search');
    } else if (query.length === 0) {
      setViewMode('recent');
    }
  }, [setSearchQuery, onSearch, setViewMode]);

  return (
    <>
      {/* Search Bar */}
      <div className="file-dialog-search">
        <input
          type="text"
          placeholder="Search workflows and templates..."
          value={searchQuery}
          onChange={handleSearchChange}
          className="search-input"
        />
        <button className="search-btn">🔍</button>
      </div>

      {/* View Mode Tabs */}
      <div className="file-dialog-tabs">
        <button
          className={`tab-btn ${viewMode === 'recent' ? 'active' : ''}`}
          onClick={() => setViewMode('recent')}
        >
          Recent ({recentFiles.length})
        </button>
        <button
          className={`tab-btn ${viewMode === 'templates' ? 'active' : ''}`}
          onClick={() => setViewMode('templates')}
        >
          Templates ({templates.length})
        </button>
        {searchResults && (
          <button
            className={`tab-btn ${viewMode === 'search' ? 'active' : ''}`}
            onClick={() => setViewMode('search')}
          >
            Search Results ({searchResults.totalCount})
          </button>
        )}
      </div>

      {/* File List */}
      <div className="file-list">
        {viewMode === 'recent' && (
          <FileList
            files={recentFiles}
            selectedFiles={selectedFiles}
            onFileSelect={onFileSelect}
            onFileDoubleClick={onFileDoubleClick}
            emptyMessage="No recent files"
          />
        )}

        {viewMode === 'templates' && (
          <TemplateList
            templates={templates}
            selectedFiles={selectedFiles}
            onFileSelect={onFileSelect}
            onFileDoubleClick={onFileDoubleClick}
            emptyMessage="No templates available"
          />
        )}

        {viewMode === 'search' && searchResults && (
          <SearchResultsList
            results={searchResults}
            selectedFiles={selectedFiles}
            onFileSelect={onFileSelect}
            onFileDoubleClick={onFileDoubleClick}
          />
        )}
      </div>
    </>
  );
};

// Save File Dialog Component
interface SaveFileDialogProps {
  saveOptions: {
    name: string;
    description: string;
    tags: string[];
    newTag: string;
  };
  setSaveOptions: React.Dispatch<React.SetStateAction<{
    name: string;
    description: string;
    tags: string[];
    newTag: string;
  }>>;
  onAddTag: () => void;
  onRemoveTag: (tag: string) => void;
}

const SaveFileDialog: React.FC<SaveFileDialogProps> = ({
  saveOptions,
  setSaveOptions,
  onAddTag,
  onRemoveTag
}) => {
  return (
    <div className="save-dialog-content">
      {/* File Name */}
      <div className="form-group">
        <label htmlFor="file-name">File Name</label>
        <input
          id="file-name"
          type="text"
          value={saveOptions.name}
          onChange={(e) => setSaveOptions(prev => ({ ...prev, name: e.target.value }))}
          placeholder="Enter workflow name"
          className="form-input"
        />
      </div>

      {/* Description */}
      <div className="form-group">
        <label htmlFor="file-description">Description</label>
        <textarea
          id="file-description"
          value={saveOptions.description}
          onChange={(e) => setSaveOptions(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Enter workflow description"
          className="form-textarea"
          rows={3}
        />
      </div>

      {/* Tags */}
      <div className="form-group">
        <label>Tags</label>
        <div className="tags-input">
          <input
            type="text"
            value={saveOptions.newTag}
            onChange={(e) => setSaveOptions(prev => ({ ...prev, newTag: e.target.value }))}
            onKeyPress={(e) => e.key === 'Enter' && onAddTag()}
            placeholder="Add tag"
            className="tag-input"
          />
          <button
            type="button"
            onClick={onAddTag}
            className="add-tag-btn"
            disabled={!saveOptions.newTag.trim()}
          >
            Add
          </button>
        </div>
        <div className="tags-list">
          {saveOptions.tags.map((tag, index) => (
            <span key={index} className="tag">
              {tag}
              <button
                type="button"
                onClick={() => onRemoveTag(tag)}
                className="remove-tag-btn"
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

// File List Components
interface FileListProps {
  files: WorkflowFile[];
  selectedFiles: string[];
  onFileSelect: (file: WorkflowFile) => void;
  onFileDoubleClick: (file: WorkflowFile) => void;
  emptyMessage: string;
}

const FileList: React.FC<FileListProps> = ({
  files,
  selectedFiles,
  onFileSelect,
  onFileDoubleClick,
  emptyMessage
}) => {
  if (files.length === 0) {
    return <div className="empty-state">{emptyMessage}</div>;
  }

  return (
    <div className="file-items">
      {files.map((file) => (
        <div
          key={file.id}
          className={`file-item ${selectedFiles.includes(file.id) ? 'selected' : ''}`}
          onClick={() => onFileSelect(file)}
          onDoubleClick={() => onFileDoubleClick(file)}
        >
          <div className="file-icon">📄</div>
          <div className="file-info">
            <div className="file-name">{file.name}</div>
            <div className="file-meta">
              Modified: {file.modified.toLocaleDateString()} •
              {file.metadata.nodeCount} nodes
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const TemplateList: React.FC<{
  templates: WorkflowTemplate[];
  selectedFiles: string[];
  onFileSelect: (template: WorkflowTemplate) => void;
  onFileDoubleClick: (template: WorkflowTemplate) => void;
  emptyMessage: string;
}> = ({
  templates,
  selectedFiles,
  onFileSelect,
  onFileDoubleClick,
  emptyMessage
}) => {
  if (templates.length === 0) {
    return <div className="empty-state">{emptyMessage}</div>;
  }

  return (
    <div className="file-items">
      {templates.map((template) => (
        <div
          key={template.id}
          className={`file-item ${selectedFiles.includes(template.id) ? 'selected' : ''}`}
          onClick={() => onFileSelect(template)}
          onDoubleClick={() => onFileDoubleClick(template)}
        >
          <div className="file-icon">📋</div>
          <div className="file-info">
            <div className="file-name">{template.name}</div>
            <div className="file-meta">
              {template.category} • {template.complexity} •
              {template.estimatedTime}min • ⭐ {template.rating}
            </div>
            <div className="file-description">{template.description}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

const SearchResultsList: React.FC<{
  results: FileSearchResult;
  selectedFiles: string[];
  onFileSelect: (file: WorkflowFile | WorkflowTemplate) => void;
  onFileDoubleClick: (file: WorkflowFile | WorkflowTemplate) => void;
}> = ({
  results,
  selectedFiles,
  onFileSelect,
  onFileDoubleClick
}) => {
  const allItems = [...results.files, ...results.templates];

  return (
    <div className="file-items">
      {allItems.map((item) => (
        <div
          key={item.id}
          className={`file-item ${selectedFiles.includes(item.id) ? 'selected' : ''}`}
          onClick={() => onFileSelect(item)}
          onDoubleClick={() => onFileDoubleClick(item)}
        >
          <div className="file-icon">
            {'metadata' in item ? '📄' : '📋'}
          </div>
          <div className="file-info">
            <div className="file-name">{item.name}</div>
            <div className="file-meta">
              {'metadata' in item
                ? `${item.metadata.nodeCount} nodes • Modified: ${item.modified.toLocaleDateString()}`
                : `${item.category} • ${item.complexity} • ⭐ ${item.rating}`
              }
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
