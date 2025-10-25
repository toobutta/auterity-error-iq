import React, { useState } from 'react';
import { NodeTemplate, TemplateCategory } from '../types/studio.js';
import { WORKFLOW_TEMPLATES, TEMPLATE_CATEGORIES } from '../constants/templates.js';
import './TemplateBrowser.css';

interface TemplateBrowserProps {
  onSelectTemplate: (template: NodeTemplate) => void;
  onClose: () => void;
}

export const TemplateBrowser: React.FC<TemplateBrowserProps> = ({
  onSelectTemplate,
  onClose,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTemplates = WORKFLOW_TEMPLATES.filter(template => {
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="template-browser">
      <div className="template-browser-header">
        <h2>Workflow Templates</h2>
        <button onClick={onClose} className="close-button">×</button>
      </div>

      <div className="template-browser-controls">
        <input
          type="text"
          placeholder="Search templates..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />

        <div className="category-filters">
          <button
            className={selectedCategory === 'all' ? 'active' : ''}
            onClick={() => setSelectedCategory('all')}
          >
            All
          </button>
          {TEMPLATE_CATEGORIES.map(category => (
            <button
              key={category}
              className={selectedCategory === category ? 'active' : ''}
              onClick={() => setSelectedCategory(category)}
            >
              {category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </button>
          ))}
        </div>
      </div>

      <div className="template-grid">
        {filteredTemplates.map(template => (
          <div
            key={template.id}
            className="template-card"
            onClick={() => onSelectTemplate(template)}
          >
            <div className="template-icon">{template.icon}</div>
            <div className="template-info">
              <h3>{template.name}</h3>
              <p>{template.description}</p>
              <div className="template-tags">
                {template.tags.slice(0, 3).map(tag => (
                  <span key={tag} className="tag">{tag}</span>
                ))}
              </div>
            </div>
            <div className="template-category">{template.category}</div>
          </div>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="no-templates">
          <p>No templates found matching your criteria.</p>
        </div>
      )}
    </div>
  );
};
