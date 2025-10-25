import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useStudioStore } from '../../hooks/useStudioStore';
import { fileManagementService } from '../../services/fileManagementService';
import { FileDialog } from '../dialogs/FileDialog';
import { TemplateGallery } from '../panels/TemplateGallery';
import {
  WorkflowFile,
  WorkflowTemplate,
  RecentFile,
  StorageProvider
} from '../../types/fileManagement';
import './FileMenu.css';

interface FileMenuProps {
  className?: string;
}

export const FileMenu: React.FC<FileMenuProps> = ({ className = '' }) => {
  const { state, actions } = useStudioStore();
  const [isOpen, setIsOpen] = useState(false);
  const [fileDialog, setFileDialog] = useState({
    visible: false,
    mode: 'open' as 'open' | 'save',
    title: 'Open Workflow'
  });
  const [templateGallery, setTemplateGallery] = useState({
    visible: false
  });
  const [recentFiles, setRecentFiles] = useState<RecentFile[]>([]);
  const [storageInfo, setStorageInfo] = useState<StorageProvider[]>([]);

  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Load recent files and storage info
  useEffect(() => {
    loadRecentFiles();
    loadStorageInfo();
  }, []);

  // Handle click outside to close menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node) &&
          buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadRecentFiles = useCallback(async () => {
    try {
      const files = await fileManagementService.getRecentFiles();
      setRecentFiles(files);
    } catch (error) {
      console.error('Failed to load recent files:', error);
    }
  }, []);

  const loadStorageInfo = useCallback(async () => {
    try {
      const info = fileManagementService.getStorageInfo();
      setStorageInfo(info);
    } catch (error) {
      console.error('Failed to load storage info:', error);
    }
  }, []);

  // File operations
  const handleNewWorkflow = useCallback(() => {
    fileManagementService.newWorkflow();
    setIsOpen(false);
  }, []);

  const handleOpenWorkflow = useCallback(() => {
    setFileDialog({
      visible: true,
      mode: 'open',
      title: 'Open Workflow'
    });
    setIsOpen(false);
  }, []);

  const handleSaveWorkflow = useCallback(async () => {
    try {
      await fileManagementService.saveWorkflow();
      // Show success message
      console.log('Workflow saved successfully');
    } catch (error) {
      console.error('Failed to save workflow:', error);
    }
    setIsOpen(false);
  }, []);

  const handleSaveAsWorkflow = useCallback(() => {
    setFileDialog({
      visible: true,
      mode: 'save',
      title: 'Save Workflow As'
    });
    setIsOpen(false);
  }, []);

  const handleOpenTemplateGallery = useCallback(() => {
    setTemplateGallery({ visible: true });
    setIsOpen(false);
  }, []);

  const handleImportWorkflow = useCallback(async (data: any, format: string) => {
    try {
      await fileManagementService.importWorkflow(data, format);
      console.log('Workflow imported successfully');
    } catch (error) {
      console.error('Failed to import workflow:', error);
    }
  }, []);

  const handleExportWorkflow = useCallback(async (options: any) => {
    try {
      const exportedData = await fileManagementService.exportWorkflow(options);
      // Download file
      const blob = new Blob([exportedData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `workflow.${options.format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export workflow:', error);
    }
  }, []);

  // Dialog handlers
  const handleFileSelected = useCallback((file: WorkflowFile | WorkflowTemplate) => {
    // Load the selected file (would be handled by store)
    console.log('File selected:', file);
    setFileDialog(prev => ({ ...prev, visible: false }));
  }, []);

  const handleFileDialogClose = useCallback(() => {
    setFileDialog(prev => ({ ...prev, visible: false }));
  }, []);

  const handleTemplateSelect = useCallback((template: WorkflowTemplate) => {
    // Load template (would be handled by store)
    console.log('Template selected:', template);
    setTemplateGallery({ visible: false });
  }, []);

  const handleTemplateGalleryClose = useCallback(() => {
    setTemplateGallery({ visible: false });
  }, []);

  const handleSaveDialogSubmit = useCallback((options: any) => {
    // Save with options
    console.log('Save options:', options);
    setFileDialog(prev => ({ ...prev, visible: false }));
  }, []);

  return (
    <>
      <div className={`file-menu ${className}`}>
        <button
          ref={buttonRef}
          className="file-menu-btn"
          onClick={() => setIsOpen(!isOpen)}
          title="File Menu"
        >
          📁 File
          <span className="menu-arrow">{isOpen ? '▲' : '▼'}</span>
        </button>

        {isOpen && (
          <div ref={menuRef} className="file-menu-dropdown">
            {/* File Operations */}
            <div className="menu-section">
              <div className="menu-group">
                <button
                  className="menu-item"
                  onClick={handleNewWorkflow}
                  title="Create a new workflow"
                >
                  <span className="menu-icon">🆕</span>
                  <span className="menu-label">New Workflow</span>
                  <span className="menu-shortcut">Ctrl+N</span>
                </button>

                <button
                  className="menu-item"
                  onClick={handleOpenWorkflow}
                  title="Open an existing workflow"
                >
                  <span className="menu-icon">📂</span>
                  <span className="menu-label">Open Workflow</span>
                  <span className="menu-shortcut">Ctrl+O</span>
                </button>

                <div className="menu-separator" />

                <button
                  className="menu-item"
                  onClick={handleSaveWorkflow}
                  title="Save current workflow"
                >
                  <span className="menu-icon">💾</span>
                  <span className="menu-label">Save</span>
                  <span className="menu-shortcut">Ctrl+S</span>
                </button>

                <button
                  className="menu-item"
                  onClick={handleSaveAsWorkflow}
                  title="Save workflow with new name"
                >
                  <span className="menu-icon">💾</span>
                  <span className="menu-label">Save As...</span>
                  <span className="menu-shortcut">Ctrl+Shift+S</span>
                </button>
              </div>

              {/* Import/Export */}
              <div className="menu-group">
                <div className="menu-group-title">Import/Export</div>

                <button
                  className="menu-item"
                  onClick={() => handleImportWorkflow(null, 'json')}
                  title="Import workflow from file"
                >
                  <span className="menu-icon">📥</span>
                  <span className="menu-label">Import...</span>
                </button>

                <button
                  className="menu-item"
                  onClick={() => handleExportWorkflow({ format: 'json' })}
                  title="Export workflow to file"
                >
                  <span className="menu-icon">📤</span>
                  <span className="menu-label">Export...</span>
                </button>
              </div>

              {/* Templates */}
              <div className="menu-group">
                <div className="menu-group-title">Templates</div>

                <button
                  className="menu-item"
                  onClick={handleOpenTemplateGallery}
                  title="Browse workflow templates"
                >
                  <span className="menu-icon">📚</span>
                  <span className="menu-label">Template Gallery</span>
                </button>

                <button
                  className="menu-item"
                  onClick={() => {/* Save as template */}}
                  title="Save current workflow as template"
                >
                  <span className="menu-icon">⭐</span>
                  <span className="menu-label">Save as Template</span>
                </button>
              </div>
            </div>

            {/* Recent Files */}
            {recentFiles.length > 0 && (
              <div className="menu-section">
                <div className="menu-section-title">Recent Files</div>
                <div className="recent-files">
                  {recentFiles.slice(0, 5).map((file) => (
                    <button
                      key={file.id}
                      className="menu-item recent-file"
                      onClick={() => handleFileSelected(file as any)}
                      title={`Open ${file.name}`}
                    >
                      <span className="menu-icon">
                        {file.type === 'workflow' ? '📄' : '📋'}
                      </span>
                      <span className="menu-label">{file.name}</span>
                      <span className="menu-meta">
                        {file.lastOpened.toLocaleDateString()}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Storage Info */}
            {storageInfo.length > 0 && (
              <div className="menu-section">
                <div className="menu-section-title">Storage</div>
                {storageInfo.map((provider) => (
                  <div key={provider.name} className="storage-info">
                    <div className="storage-name">{provider.name}</div>
                    <div className="storage-details">
                      <div className="storage-bar">
                        <div
                          className="storage-used"
                          style={{
                            width: `${(provider.used / (provider.capacity || provider.used + provider.available)) * 100}%`
                          }}
                        />
                      </div>
                      <div className="storage-text">
                        {(provider.used / 1024 / 1024).toFixed(1)} MB used
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* File Dialog */}
      <FileDialog
        dialog={fileDialog}
        onClose={handleFileDialogClose}
        onFileSelected={handleFileSelected}
        onSave={handleSaveDialogSubmit}
      />

      {/* Template Gallery */}
      <TemplateGallery
        visible={templateGallery.visible}
        onClose={handleTemplateGalleryClose}
        onTemplateSelect={handleTemplateSelect}
      />
    </>
  );
};
