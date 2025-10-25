import React, { useState, useMemo, useCallback } from 'react';
import { useStudioStore } from '../../hooks/useStudioStore.js';
import { NODE_CATEGORIES, DEFAULT_NODE_STYLES } from '../../constants/themes.js';
import { StudioNode, NodeType } from '../../types/studio';
import { 
  ChevronRightIcon, 
  ChevronLeftIcon,
  MagnifyingGlassIcon,
  StarIcon as StarIconOutline
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { getNodeIcon, getCategoryIcon } from '../../utils/professionalIcons.js';
import './NodePalette.css';

interface NodePaletteProps {
  width: number;
  collapsed: boolean;
  onResize: (width: number) => void;
  onToggleCollapse: () => void;
}

export const EnhancedNodePalette: React.FC<NodePaletteProps> = ({
  width,
  collapsed,
  onResize,
  onToggleCollapse,
}) => {
  const { state, actions } = useStudioStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [draggedNodeType, setDraggedNodeType] = useState<NodeType | null>(null);
  const [favorites, setFavorites] = useState<Set<NodeType>>(new Set(['start', 'action', 'decision', 'end']));
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // Toggle favorite status
  const toggleFavorite = useCallback((nodeType: NodeType) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(nodeType)) {
        newFavorites.delete(nodeType);
      } else {
        newFavorites.add(nodeType);
      }
      return newFavorites;
    });
  }, []);

  // Filter nodes based on search, category, and favorites
  const filteredCategories = useMemo(() => {
    return NODE_CATEGORIES.map(category => ({
      ...category,
      types: category.types.filter(nodeType => {
        const matchesSearch = !searchTerm ||
          getNodeLabel(nodeType).toLowerCase().includes(searchTerm.toLowerCase()) ||
          getNodeDescription(nodeType).toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || category.id === selectedCategory;
        const matchesFavorites = !showFavoritesOnly || favorites.has(nodeType);
        return matchesSearch && matchesCategory && matchesFavorites;
      }),
    })).filter(category => category.types.length > 0);
  }, [searchTerm, selectedCategory, showFavoritesOnly, favorites]);

  // Bulk operations
  const createMultipleNodes = useCallback((nodeType: NodeType, count: number = 3) => {
    const spacing = 150;
    const baseX = 200;
    const baseY = 200;

    for (let i = 0; i < count; i++) {
      const position = {
        x: baseX + (i % 2) * spacing,
        y: baseY + Math.floor(i / 2) * spacing
      };
      createNode(nodeType, position);
    }
  }, []);

  // Handle node drag start
  const handleDragStart = (event: React.DragEvent, nodeType: NodeType) => {
    setDraggedNodeType(nodeType);
    event.dataTransfer.setData('application/json', JSON.stringify({
      type: 'node-create',
      nodeType,
      timestamp: Date.now(),
    }));
    event.dataTransfer.effectAllowed = 'copy';

    // Create drag preview
    const dragPreview = document.createElement('div');
    dragPreview.innerHTML = `<div class="node-drag-preview">${getNodeLabel(nodeType)}</div>`;
    dragPreview.style.cssText = `
      position: absolute;
      top: -1000px;
      pointer-events: none;
      z-index: 1000;
    `;
    document.body.appendChild(dragPreview);
    event.dataTransfer.setDragImage(dragPreview, 10, 10);

    // Clean up preview after drag
    setTimeout(() => {
      document.body.removeChild(dragPreview);
    }, 0);
  };

  // Handle node drag end
  const handleDragEnd = () => {
    setDraggedNodeType(null);
  };

  // Create a new node
  const createNode = (nodeType: NodeType, position = { x: 100, y: 100 }) => {
    const nodeId = `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const style = DEFAULT_NODE_STYLES[nodeType] || DEFAULT_NODE_STYLES.custom;
    
    const newNode: StudioNode = {
      id: nodeId,
      type: nodeType,
      position,
      size: { width: 120, height: 60 },
      data: {
        label: getNodeLabel(nodeType),
        description: getNodeDescription(nodeType),
        properties: getDefaultProperties(nodeType),
        category: getCategoryForNodeType(nodeType),
      },
      style,
      selected: false,
      dragging: false,
      resizing: false,
    };

    actions.addNode(newNode);
    actions.selectNodes([nodeId]);
    actions.saveState();
  };

  // Get node label
  const getNodeLabel = (nodeType: NodeType): string => {
    const labels: Record<NodeType, string> = {
      // Flow Control
      'start': 'Start',
      'end': 'End',
      'decision': 'Decision',
      'condition': 'Condition',
      'switch': 'Switch',
      'loop': 'Loop',
      'parallel': 'Parallel',
      'merge': 'Merge',
      'wait': 'Wait',
      'delay': 'Delay',
      'timer': 'Timer',
      'split': 'Split',

      // Data Processing
      'data-transform': 'Transform',
      'filter': 'Filter',
      'sort': 'Sort',
      'aggregate': 'Aggregate',
      'join': 'Join',
      'split-data': 'Split Data',
      'data-validation': 'Validate',

      // Integration & API
      'api-call': 'API Call',
      'webhook': 'Webhook',
      'http-request': 'HTTP Request',
      'graphql': 'GraphQL',
      'websocket': 'WebSocket',
      'rest-api': 'REST API',

      // Communication
      'email': 'Email',
      'sms': 'SMS',
      'notification': 'Notification',
      'slack': 'Slack',
      'teams': 'Teams',
      'webhook-response': 'Webhook Response',

      // AI/ML
      'ai-model': 'AI Model',
      'text-generation': 'Text Generation',
      'image-processing': 'Image Processing',
      'classification': 'Classification',
      'sentiment-analysis': 'Sentiment Analysis',

      // Database & Storage
      'database': 'Database',
      'file-system': 'File System',
      's3-storage': 'S3 Storage',
      'redis': 'Redis',
      'mongodb': 'MongoDB',
      'postgresql': 'PostgreSQL',

      // Business Logic
      'action': 'Action',
      'script': 'Script',
      'function-call': 'Function Call',
      'business-rule': 'Business Rule',
      'validation-rule': 'Validation Rule',

      // Advanced
      'custom': 'Custom',
      'sub-workflow': 'Sub-workflow',
      'error-handler': 'Error Handler',
    };
    return labels[nodeType] || 'Node';
  };

  // Get node description
  const getNodeDescription = (nodeType: NodeType): string => {
    const descriptions: Record<NodeType, string> = {
      // Flow Control
      'start': 'Start point of the workflow',
      'end': 'End point of the workflow',
      'decision': 'Make a decision based on conditions',
      'condition': 'Check a condition',
      'switch': 'Route based on multiple conditions',
      'loop': 'Repeat a set of actions',
      'parallel': 'Execute multiple branches in parallel',
      'merge': 'Merge parallel branches',
      'wait': 'Wait for a specific condition or time',
      'delay': 'Add a time delay',
      'timer': 'Schedule execution at specific times',
      'split': 'Split workflow into multiple paths',

      // Data Processing
      'data-transform': 'Transform data from one format to another',
      'filter': 'Filter data based on conditions',
      'sort': 'Sort data by specified criteria',
      'aggregate': 'Aggregate data using functions like sum, count, avg',
      'join': 'Join multiple data sources',
      'split-data': 'Split data into multiple parts',
      'data-validation': 'Validate data against rules',

      // Integration & API
      'api-call': 'Call an external API',
      'webhook': 'Receive webhook data',
      'http-request': 'Make HTTP requests',
      'graphql': 'Execute GraphQL queries',
      'websocket': 'Handle WebSocket connections',
      'rest-api': 'REST API operations',

      // Communication
      'email': 'Send email notifications',
      'sms': 'Send SMS messages',
      'notification': 'Send notifications',
      'slack': 'Send Slack messages',
      'teams': 'Send Microsoft Teams messages',
      'webhook-response': 'Send webhook responses',

      // AI/ML
      'ai-model': 'Use AI/ML models',
      'text-generation': 'Generate text using AI',
      'image-processing': 'Process images with AI',
      'classification': 'Classify data using AI',
      'sentiment-analysis': 'Analyze sentiment of text',

      // Database & Storage
      'database': 'Database operations',
      'file-system': 'File system operations',
      's3-storage': 'Amazon S3 storage operations',
      'redis': 'Redis cache operations',
      'mongodb': 'MongoDB operations',
      'postgresql': 'PostgreSQL operations',

      // Business Logic
      'action': 'Execute an action or operation',
      'script': 'Run custom scripts',
      'function-call': 'Call custom functions',
      'business-rule': 'Apply business rules',
      'validation-rule': 'Apply validation rules',

      // Advanced
      'custom': 'Custom node',
      'sub-workflow': 'Execute a sub-workflow',
      'error-handler': 'Handle errors and exceptions',
    };
    return descriptions[nodeType] || 'Custom node';
  };

  // Get default properties for node type
  const getDefaultProperties = (nodeType: NodeType): Record<string, any> => {
    // Default properties implementation
    return {};
  };

  // Get category for node type
  const getCategoryForNodeType = (nodeType: NodeType): string => {
    for (const category of NODE_CATEGORIES) {
      if (category.types.includes(nodeType)) {
        return category.id;
      }
    }
    return 'advanced';
  };

  if (collapsed) {
    return (
      <div className="node-palette collapsed">
        <button 
          className="palette-toggle"
          onClick={onToggleCollapse}
          aria-label="Expand node palette"
        >
          <ChevronRightIcon className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="node-palette" style={{ width }}>
      {/* Header */}
      <div className="palette-header">
        <h3>Node Palette</h3>
        <button 
          className="palette-toggle"
          onClick={onToggleCollapse}
          aria-label="Collapse node palette"
        >
          <ChevronLeftIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Search */}
      <div className="palette-search">
        <div className="search-input-wrapper">
          <MagnifyingGlassIcon className="search-icon w-4 h-4" />
          <input
            type="text"
            placeholder="Search nodes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {/* Controls */}
      <div className="palette-controls">
        {/* Category Filter */}
        <div className="control-group">
          <label>Category:</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="category-select"
            aria-label="Filter by category"
          >
            <option value="all">All Categories</option>
            {NODE_CATEGORIES.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        {/* Favorites Toggle */}
        <div className="control-group">
          <button
            className={`favorites-toggle ${showFavoritesOnly ? 'active' : ''}`}
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            title={showFavoritesOnly ? 'Show all nodes' : 'Show favorites only'}
          >
            <StarIconOutline className="w-4 h-4" />
            <span>{showFavoritesOnly ? 'All' : 'Favorites'}</span>
          </button>
        </div>
      </div>

      {/* Node Categories */}
      <div className="palette-content">
        {filteredCategories.map(category => (
          <div key={category.id} className="node-category">
            <div className="category-header">
              {getCategoryIcon(category.id, { size: 'sm', className: 'category-icon' })}
              <span className="category-name">{category.name}</span>
              <span className="category-count">({category.types.length})</span>
            </div>
            
            <div className="category-nodes">
              {category.types.map(nodeType => (
                <div
                  key={nodeType}
                  className={`node-item ${draggedNodeType === nodeType ? 'dragging' : ''}`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, nodeType)}
                  onDragEnd={handleDragEnd}
                  onClick={() => createNode(nodeType)}
                  onDoubleClick={() => createNode(nodeType)}
                  title={getNodeDescription(nodeType)}
                >
                  <div className="node-content">
                    <span className="node-icon">
                      {getNodeIcon(nodeType, { size: 'sm' })}
                    </span>
                    <span className="node-label">{getNodeLabel(nodeType)}</span>
                  </div>
                  <button
                    className={`favorite-btn ${favorites.has(nodeType) ? 'favorited' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(nodeType);
                    }}
                    title={favorites.has(nodeType) ? 'Remove from favorites' : 'Add to favorites'}
                    aria-label={favorites.has(nodeType) ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    {favorites.has(nodeType) ? 
                      <StarIconSolid className="w-4 h-4 text-yellow-500" /> : 
                      <StarIconOutline className="w-4 h-4" />
                    }
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Resize Handle */}
      <div 
        className="panel-resize-handle"
        onMouseDown={(e) => {
          e.preventDefault();
          const startX = e.clientX;
          const startWidth = width;
          
          const handleMouseMove = (e: MouseEvent) => {
            const newWidth = Math.max(200, Math.min(400, startWidth + (e.clientX - startX)));
            onResize(newWidth);
          };
          
          const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
          };
          
          document.addEventListener('mousemove', handleMouseMove);
          document.addEventListener('mouseup', handleMouseUp);
        }}
      />
    </div>
  );
};

export default EnhancedNodePalette;
