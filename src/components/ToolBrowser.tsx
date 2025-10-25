import React, { useState, useMemo } from 'react';
import { globalToolRegistry, toolNodeFactory, ToolDefinition } from '../utils/toolIntegration.js';
import './ToolBrowser.css';

interface ToolBrowserProps {
  onAddTool: (toolId: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const ToolBrowser: React.FC<ToolBrowserProps> = ({
  onAddTool,
  isOpen,
  onClose,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const tools = useMemo(() => globalToolRegistry.getAllTools(), []);
  const categories = useMemo(() => {
    const cats = new Set<string>(tools.map((tool: ToolDefinition) => tool.category));
    return ['all', ...Array.from(cats)];
  }, [tools]);

  const filteredTools = useMemo(() => {
    let filtered = tools;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter((tool: ToolDefinition) => tool.category === selectedCategory);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((tool: ToolDefinition) =>
        tool.name.toLowerCase().includes(query) ||
        tool.description.toLowerCase().includes(query) ||
        tool.category.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [tools, searchQuery, selectedCategory]);

  const handleAddTool = (toolId: string) => {
    onAddTool(toolId);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="tool-browser-overlay">
      <div className="tool-browser-modal">
        <div className="tool-browser-header">
          <h2>Tool Library</h2>
          <button className="tool-browser-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="tool-browser-controls">
          <div className="tool-browser-search">
            <input
              type="text"
              placeholder="Search tools..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="tool-browser-search-input"
            />
          </div>

          <div className="tool-browser-categories">
            {categories.map((category: string) => (
              <button
                key={category}
                className={`tool-category-button ${
                  selectedCategory === category ? 'active' : ''
                }`}
                onClick={() => setSelectedCategory(category)}
              >
                {category === 'all' ? 'All Tools' : category.replace('-', ' ').toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="tool-browser-content">
          {filteredTools.length === 0 ? (
            <div className="tool-browser-empty">
              <p>No tools found matching your criteria.</p>
            </div>
          ) : (
            <div className="tool-grid">
              {filteredTools.map((tool: ToolDefinition) => (
                <ToolCard
                  key={tool.id}
                  tool={tool}
                  onAdd={() => handleAddTool(tool.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface ToolCardProps {
  tool: ToolDefinition;
  onAdd: () => void;
}

const ToolCard: React.FC<ToolCardProps> = ({ tool, onAdd }) => {
  return (
    <div className="tool-card">
      <div className="tool-card-header">
        <div className="tool-icon">{tool.icon}</div>
        <div className="tool-info">
          <h3 className="tool-name">{tool.name}</h3>
          <span className="tool-category">{tool.category.replace('-', ' ')}</span>
        </div>
      </div>

      <div className="tool-card-body">
        <p className="tool-description">{tool.description}</p>

        <div className="tool-parameters">
          <h4>Parameters:</h4>
          <ul>
            {tool.parameters.map((param: any) => (
              <li key={param.name}>
                <span className="param-name">{param.name}</span>
                <span className="param-type">({param.type})</span>
                {param.required && <span className="param-required">*</span>}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="tool-card-footer">
        <button className="add-tool-button" onClick={onAdd}>
          Add to Workflow
        </button>
      </div>
    </div>
  );
};
