/**
 * File Explorer Component
 * Provides file navigation and management within the IDE
 */

import React, { useState, useCallback } from 'react';
import { FileItem } from '../../services/continueDevService';

interface FileExplorerProps {
  files: FileItem[];
  activeFile?: FileItem | null;
  onFileSelect?: (file: FileItem) => void;
  onFileCreate?: (fileName: string) => void;
  onFileDelete?: (fileId: string) => void;
  onFileRename?: (fileId: string, newName: string) => void;
  className?: string;
}

interface FileTreeNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  children?: FileTreeNode[];
  file?: FileItem;
  expanded?: boolean;
}

export const FileExplorer: React.FC<FileExplorerProps> = ({
  files,
  activeFile,
  onFileSelect,
  onFileCreate,
  onFileDelete,
  onFileRename,
  className = ''
}) => {
  const [fileTree, setFileTree] = useState<FileTreeNode[]>([]);
  const [creatingFile, setCreatingFile] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);

  // Build file tree from flat file list
  React.useEffect(() => {
    const tree = buildFileTree(files);
    setFileTree(tree);
  }, [files]);

  const buildFileTree = useCallback((files: FileItem[]): FileTreeNode[] => {
    const root: FileTreeNode = {
      id: 'root',
      name: 'workspace',
      type: 'folder',
      children: [],
      expanded: true
    };

    files.forEach(file => {
      const pathParts = file.path.split('/');
      let currentNode = root;

      pathParts.forEach((part, index) => {
        const isLastPart = index === pathParts.length - 1;
        let childNode = currentNode.children?.find(child => child.name === part);

        if (!childNode) {
          childNode = {
            id: isLastPart ? file.id : `${currentNode.id}/${part}`,
            name: part,
            type: isLastPart ? 'file' : 'folder',
            children: isLastPart ? undefined : [],
            file: isLastPart ? file : undefined,
            expanded: false
          };
          currentNode.children = currentNode.children || [];
          currentNode.children.push(childNode);
        }

        if (!isLastPart) {
          currentNode = childNode;
        }
      });
    });

    return root.children || [];
  }, []);

  const filteredFiles = React.useMemo(() => {
    if (!searchTerm) return fileTree;

    const filterNodes = (nodes: FileTreeNode[]): FileTreeNode[] => {
      return nodes.reduce((filtered: FileTreeNode[], node) => {
        if (node.name.toLowerCase().includes(searchTerm.toLowerCase())) {
          filtered.push(node);
        } else if (node.children) {
          const filteredChildren = filterNodes(node.children);
          if (filteredChildren.length > 0) {
            filtered.push({ ...node, children: filteredChildren });
          }
        }
        return filtered;
      }, []);
    };

    return filterNodes(fileTree);
  }, [fileTree, searchTerm]);

  const handleFileClick = useCallback((file: FileItem) => {
    setSelectedFileId(file.id);
    onFileSelect?.(file);
  }, [onFileSelect]);

  const handleFolderToggle = useCallback((node: FileTreeNode) => {
    setFileTree(prevTree => {
      const updateNode = (nodes: FileTreeNode[]): FileTreeNode[] => {
        return nodes.map(n => {
          if (n.id === node.id) {
            return { ...n, expanded: !n.expanded };
          }
          if (n.children) {
            return { ...n, children: updateNode(n.children) };
          }
          return n;
        });
      };
      return updateNode(prevTree);
    });
  }, []);

  const handleCreateFile = useCallback(() => {
    if (newFileName.trim()) {
      onFileCreate?.(newFileName.trim());
      setNewFileName('');
      setCreatingFile(false);
    }
  }, [newFileName, onFileCreate]);

  const handleDeleteFile = useCallback((fileId: string) => {
    if (window.confirm('Are you sure you want to delete this file?')) {
      onFileDelete?.(fileId);
    }
  }, [onFileDelete]);

  const renderFileTree = (nodes: FileTreeNode[], level = 0): React.ReactNode => {
    return nodes.map(node => (
      <div key={node.id} className="file-tree-node">
        <div
          className={`file-tree-item flex items-center p-1 hover:bg-gray-700 cursor-pointer ${
            node.file?.id === activeFile?.id ? 'bg-blue-600 text-white' : 'text-gray-300'
          }`}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
          onClick={() => {
            if (node.type === 'folder') {
              handleFolderToggle(node);
            } else if (node.file) {
              handleFileClick(node.file);
            }
          }}
        >
          {/* File/Folder Icon */}
          <div className="flex items-center justify-center w-4 h-4 mr-2">
            {node.type === 'folder' ? (
              node.expanded ? '📂' : '📁'
            ) : (
              getFileIcon(node.name)
            )}
          </div>

          {/* File/Folder Name */}
          <span className="flex-1 truncate text-sm">
            {node.name}
          </span>

          {/* Actions */}
          {node.file && selectedFileId === node.file.id && (
            <div className="file-actions flex space-x-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  // Rename functionality could be added here
                }}
                className="action-btn text-xs hover:text-blue-400"
                title="Rename"
              >
                ✏️
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteFile(node.file!.id);
                }}
                className="action-btn text-xs hover:text-red-400"
                title="Delete"
              >
                🗑️
              </button>
            </div>
          )}
        </div>

        {/* Children */}
        {node.type === 'folder' && node.expanded && node.children && (
          <div className="file-tree-children">
            {renderFileTree(node.children, level + 1)}
          </div>
        )}
      </div>
    ));
  };

  return (
    <div className={`file-explorer bg-gray-800 text-white ${className}`}>
      {/* Header */}
      <div className="explorer-header p-3 border-b border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-200">Explorer</h3>
          <div className="header-actions flex space-x-1">
            <button
              onClick={() => setCreatingFile(true)}
              className="action-btn text-gray-400 hover:text-white"
              title="New File"
            >
              ➕
            </button>
            <button
              onClick={() => {/* Refresh functionality */}}
              className="action-btn text-gray-400 hover:text-white"
              title="Refresh"
            >
              🔄
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="search-container">
          <input
            type="text"
            placeholder="Search files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input w-full px-2 py-1 text-xs bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* File Tree */}
      <div className="file-tree flex-1 overflow-auto">
        {creatingFile && (
          <div className="create-file-input p-2 border-b border-gray-700">
            <input
              type="text"
              placeholder="Enter file name..."
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCreateFile();
                } else if (e.key === 'Escape') {
                  setCreatingFile(false);
                  setNewFileName('');
                }
              }}
              className="w-full px-2 py-1 text-xs bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-blue-500"
              autoFocus
            />
          </div>
        )}

        <div className="file-tree-content">
          {filteredFiles.length > 0 ? (
            renderFileTree(filteredFiles)
          ) : (
            <div className="empty-explorer flex items-center justify-center p-8 text-gray-500">
              <div className="text-center">
                <div className="text-2xl mb-2">📁</div>
                <div className="text-sm">No files found</div>
                {searchTerm && (
                  <div className="text-xs mt-1">
                    Try adjusting your search term
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer with file stats */}
      <div className="explorer-footer p-2 border-t border-gray-700 text-xs text-gray-400">
        <div className="file-stats">
          {files.length} file{files.length !== 1 ? 's' : ''}
        </div>
      </div>
    </div>
  );
};

// Utility function to get file icon based on extension
function getFileIcon(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();

  const iconMap: Record<string, string> = {
    'js': '🟨',
    'jsx': '⚛️',
    'ts': '🔷',
    'tsx': '⚛️',
    'py': '🐍',
    'java': '☕',
    'cpp': '🔧',
    'c': '🔧',
    'cs': '🔷',
    'php': '🐘',
    'rb': '💎',
    'go': '🐹',
    'rs': '🦀',
    'html': '🌐',
    'css': '🎨',
    'scss': '🎨',
    'json': '📄',
    'xml': '📄',
    'yaml': '📄',
    'yml': '📄',
    'md': '📝',
    'txt': '📄',
    'sql': '🗄️',
    'dockerfile': '🐳',
    'gitignore': '🚫'
  };

  return iconMap[ext || ''] || '📄';
}
