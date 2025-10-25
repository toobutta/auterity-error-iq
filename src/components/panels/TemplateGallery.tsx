import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useStudioStore } from '../../hooks/useStudioStore';
import { fileManagementService } from '../../services/fileManagementService';
import {
  WorkflowTemplate,
  TemplateCategory,
  FileSearchQuery
} from '../../types/fileManagement';
import './TemplateGallery.css';

interface TemplateGalleryProps {
  visible: boolean;
  onClose: () => void;
  onTemplateSelect: (template: WorkflowTemplate) => void;
}

export const TemplateGallery: React.FC<TemplateGalleryProps> = ({
  visible,
  onClose,
  onTemplateSelect
}) => {
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);
  const [categories, setCategories] = useState<TemplateCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'rating' | 'usage' | 'modified'>('rating');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [loading, setLoading] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  // Load templates and categories
  useEffect(() => {
    if (visible) {
      loadTemplates();
      loadCategories();
      loadFavorites();
    }
  }, [visible]);

  const loadTemplates = useCallback(async () => {
    setLoading(true);
    try {
      // Would get from service
      const templateData = await fileManagementService.getTemplates();
      setTemplates(templateData);
    } catch (error) {
      console.error('Failed to load templates:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadCategories = useCallback(async () => {
    // Would get from service
    const categoryData: TemplateCategory[] = [
      {
        id: 'all',
        name: 'All Templates',
        description: 'All available templates',
        icon: '📚',
        color: '#6b7280',
        templateCount: 0
      },
      {
        id: 'favorites',
        name: 'Favorites',
        description: 'Your favorite templates',
        icon: '⭐',
        color: '#fbbf24',
        templateCount: 0
      }
    ];
    setCategories(categoryData);
  }, []);

  const loadFavorites = useCallback(() => {
    // Would get from service
    setFavorites(new Set(['template_1', 'template_3']));
  }, []);

  // Filter and sort templates
  const filteredTemplates = useMemo(() => {
    let filtered = templates;

    // Filter by category
    if (selectedCategory === 'favorites') {
      filtered = filtered.filter(template => favorites.has(template.id));
    } else if (selectedCategory !== 'all') {
      filtered = filtered.filter(template => template.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(template =>
        template.name.toLowerCase().includes(query) ||
        template.description.toLowerCase().includes(query) ||
        template.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Sort templates
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'rating':
          return b.rating - a.rating;
        case 'usage':
          return b.usageCount - a.usageCount;
        case 'modified':
          return new Date(b.modified).getTime() - new Date(a.modified).getTime();
        default:
          return 0;
      }
    });

    return filtered;
  }, [templates, selectedCategory, searchQuery, sortBy, favorites]);

  const handleTemplateSelect = useCallback((template: WorkflowTemplate) => {
    onTemplateSelect(template);
    // Track usage
    fileManagementService.trackTemplateUsage(template.id);
  }, [onTemplateSelect]);

  const handleFavoriteToggle = useCallback((templateId: string) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(templateId)) {
      newFavorites.delete(templateId);
    } else {
      newFavorites.add(templateId);
    }
    setFavorites(newFavorites);
    fileManagementService.toggleTemplateFavorite(templateId);
  }, [favorites]);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setSelectedCategory('all'); // Reset category when searching
  }, []);

  if (!visible) return null;

  return (
    <div className="template-gallery-overlay">
      <div className="template-gallery">
        {/* Header */}
        <div className="gallery-header">
          <div className="gallery-title">
            <span className="gallery-icon">📚</span>
            <span>Template Gallery</span>
          </div>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        {/* Toolbar */}
        <div className="gallery-toolbar">
          {/* Search */}
          <div className="search-section">
            <input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="search-input"
            />
            <button className="search-btn">🔍</button>
          </div>

          {/* Filters */}
          <div className="filter-section">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="category-select"
            >
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.icon} {category.name}
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="sort-select"
            >
              <option value="rating">⭐ Rating</option>
              <option value="usage">📊 Usage</option>
              <option value="name">📝 Name</option>
              <option value="modified">🕒 Modified</option>
            </select>
          </div>

          {/* View Toggle */}
          <div className="view-toggle">
            <button
              className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Grid View"
            >
              ⊞
            </button>
            <button
              className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              title="List View"
            >
              ☰
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="gallery-content">
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading templates...</p>
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📭</div>
              <h3>No templates found</h3>
              <p>Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className={`templates-container ${viewMode}`}>
              {filteredTemplates.map(template => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  isFavorite={favorites.has(template.id)}
                  viewMode={viewMode}
                  onSelect={handleTemplateSelect}
                  onFavoriteToggle={handleFavoriteToggle}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="gallery-footer">
          <div className="template-stats">
            Showing {filteredTemplates.length} of {templates.length} templates
          </div>
          <div className="gallery-actions">
            <button className="btn-secondary" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Template Card Component
interface TemplateCardProps {
  template: WorkflowTemplate;
  isFavorite: boolean;
  viewMode: 'grid' | 'list';
  onSelect: (template: WorkflowTemplate) => void;
  onFavoriteToggle: (templateId: string) => void;
}

const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  isFavorite,
  viewMode,
  onSelect,
  onFavoriteToggle
}) => {
  const handleFavoriteClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onFavoriteToggle(template.id);
  }, [template.id, onFavoriteToggle]);

  return (
    <div
      className={`template-card ${viewMode}`}
      onClick={() => onSelect(template)}
    >
      {/* Preview Image */}
      <div className="template-preview">
        {template.thumbnail ? (
          <img
            src={template.thumbnail}
            alt={template.name}
            className="preview-image"
          />
        ) : (
          <div className="preview-placeholder">
            <div className="placeholder-icon">📋</div>
            <div className="placeholder-text">No Preview</div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="template-content">
        <div className="template-header">
          <h3 className="template-name">{template.name}</h3>
          <button
            className={`favorite-btn ${isFavorite ? 'favorited' : ''}`}
            onClick={handleFavoriteClick}
            title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            {isFavorite ? '⭐' : '☆'}
          </button>
        </div>

        <p className="template-description">{template.description}</p>

        <div className="template-meta">
          <div className="meta-item">
            <span className="meta-icon">🏷️</span>
            <span>{template.category}</span>
          </div>
          <div className="meta-item">
            <span className="meta-icon">📊</span>
            <span>{template.complexity}</span>
          </div>
          <div className="meta-item">
            <span className="meta-icon">⏱️</span>
            <span>{template.estimatedTime}min</span>
          </div>
        </div>

        <div className="template-stats">
          <div className="stat-item">
            <span className="stat-label">Rating:</span>
            <span className="stat-value">⭐ {template.rating.toFixed(1)}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Used:</span>
            <span className="stat-value">{template.usageCount}x</span>
          </div>
        </div>

        {/* Tags */}
        <div className="template-tags">
          {template.tags.slice(0, 3).map((tag, index) => (
            <span key={index} className="tag">
              {tag}
            </span>
          ))}
          {template.tags.length > 3 && (
            <span className="tag more">+{template.tags.length - 3}</span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="template-actions">
        <button className="use-template-btn">
          Use Template
        </button>
      </div>
    </div>
  );
};
