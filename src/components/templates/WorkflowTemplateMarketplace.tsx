/**
 * WORKFLOW STUDIO TEMPLATE MARKETPLACE
 * 
 * Integrates Auterity's existing template marketplace with workflow-specific
 * features for discovering, previewing, and importing workflow templates.
 */

import React, { useState, useCallback, useEffect, useMemo } from "react";
import { useAuth } from '../../../auterity-error-iq/frontend/src/contexts/AuthContext';
import { useNotifications } from '../../../auterity-error-iq/frontend/src/components/notifications/NotificationSystem';

// Enhanced interfaces for workflow templates
interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: 'business' | 'automation' | 'data' | 'integration' | 'analytics' | 'custom';
  industry?: 'healthcare' | 'finance' | 'retail' | 'manufacturing' | 'education' | 'general';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  rating: number;
  reviewCount: number;
  downloadCount: number;
  author: {
    id: string;
    name: string;
    avatar?: string;
    verified: boolean;
  };
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  preview: {
    thumbnail: string;
    nodeCount: number;
    estimatedTime: number;
    complexity: number;
  };
  workflow: {
    nodes: any[];
    connections: any[];
    metadata: Record<string, any>;
  };
  isFavorite?: boolean;
  isInstalled?: boolean;
}

interface TemplateCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  templateCount: number;
}

interface WorkflowTemplateMarketplaceProps {
  onTemplateImport?: (template: WorkflowTemplate) => void;
  onTemplatePreview?: (template: WorkflowTemplate) => void;
  initialCategory?: string;
  className?: string;
}

export const WorkflowTemplateMarketplace: React.FC<WorkflowTemplateMarketplaceProps> = ({
  onTemplateImport,
  onTemplatePreview,
  initialCategory,
  className = ''
}) => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();

  // State management
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);
  const [categories, setCategories] = useState<TemplateCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory || 'all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'popular' | 'recent' | 'rating' | 'name'>('popular');
  const [selectedTemplate, setSelectedTemplate] = useState<WorkflowTemplate | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  // Load templates and categories
  useEffect(() => {
    loadMarketplaceData();
  }, []);

  const loadMarketplaceData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Mock data loading - in real implementation, this would call marketplace API
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock categories
      const mockCategories: TemplateCategory[] = [
        { id: 'business', name: 'Business Process', description: 'Customer service, sales, HR workflows', icon: '💼', templateCount: 24 },
        { id: 'automation', name: 'Automation', description: 'Task automation and scheduling', icon: '🤖', templateCount: 18 },
        { id: 'data', name: 'Data Processing', description: 'ETL, data transformation, analysis', icon: '📊', templateCount: 15 },
        { id: 'integration', name: 'Integration', description: 'API integration and data sync', icon: '🔗', templateCount: 12 },
        { id: 'analytics', name: 'Analytics', description: 'Reporting and analytics workflows', icon: '📈', templateCount: 9 }
      ];

      // Mock templates
      const mockTemplates: WorkflowTemplate[] = [
        {
          id: 'template_1',
          name: 'Customer Onboarding Workflow',
          description: 'Complete customer onboarding process with email verification, profile setup, and welcome sequence',
          category: 'business',
          industry: 'general',
          difficulty: 'beginner',
          rating: 4.8,
          reviewCount: 156,
          downloadCount: 2340,
          author: { id: 'author_1', name: 'Sarah Johnson', verified: true },
          tags: ['onboarding', 'email', 'automation', 'customer'],
          createdAt: new Date('2024-01-15'),
          updatedAt: new Date('2024-01-20'),
          preview: { thumbnail: '/thumbnails/onboarding.png', nodeCount: 8, estimatedTime: 300, complexity: 2 },
          workflow: { nodes: [], connections: [], metadata: {} }
        },
        {
          id: 'template_2',
          name: 'Data ETL Pipeline',
          description: 'Extract, transform, and load data from multiple sources with error handling and monitoring',
          category: 'data',
          industry: 'general',
          difficulty: 'advanced',
          rating: 4.6,
          reviewCount: 89,
          downloadCount: 1240,
          author: { id: 'author_2', name: 'Mike Chen', verified: true },
          tags: ['etl', 'data', 'pipeline', 'monitoring'],
          createdAt: new Date('2024-01-10'),
          updatedAt: new Date('2024-01-18'),
          preview: { thumbnail: '/thumbnails/etl.png', nodeCount: 12, estimatedTime: 600, complexity: 4 },
          workflow: { nodes: [], connections: [], metadata: {} }
        },
        {
          id: 'template_3',
          name: 'Invoice Processing Automation',
          description: 'Automated invoice processing with OCR, validation, and approval workflow',
          category: 'automation',
          industry: 'finance',
          difficulty: 'intermediate',
          rating: 4.7,
          reviewCount: 203,
          downloadCount: 3120,
          author: { id: 'author_3', name: 'Emma Davis', verified: true },
          tags: ['invoice', 'ocr', 'approval', 'finance'],
          createdAt: new Date('2024-01-12'),
          updatedAt: new Date('2024-01-22'),
          preview: { thumbnail: '/thumbnails/invoice.png', nodeCount: 10, estimatedTime: 450, complexity: 3 },
          workflow: { nodes: [], connections: [], metadata: {} }
        },
        {
          id: 'template_4',
          name: 'Social Media Analytics',
          description: 'Collect and analyze social media metrics with automated reporting',
          category: 'analytics',
          industry: 'retail',
          difficulty: 'intermediate',
          rating: 4.5,
          reviewCount: 127,
          downloadCount: 890,
          author: { id: 'author_4', name: 'Alex Rodriguez', verified: false },
          tags: ['social-media', 'analytics', 'reporting', 'metrics'],
          createdAt: new Date('2024-01-08'),
          updatedAt: new Date('2024-01-16'),
          preview: { thumbnail: '/thumbnails/social.png', nodeCount: 15, estimatedTime: 720, complexity: 3 },
          workflow: { nodes: [], connections: [], metadata: {} }
        },
        {
          id: 'template_5',
          name: 'API Integration Workflow',
          description: 'Seamless integration between multiple APIs with rate limiting and error handling',
          category: 'integration',
          industry: 'general',
          difficulty: 'advanced',
          rating: 4.9,
          reviewCount: 78,
          downloadCount: 1560,
          author: { id: 'author_5', name: 'David Kim', verified: true },
          tags: ['api', 'integration', 'rate-limiting', 'error-handling'],
          createdAt: new Date('2024-01-05'),
          updatedAt: new Date('2024-01-14'),
          preview: { thumbnail: '/thumbnails/api.png', nodeCount: 9, estimatedTime: 180, complexity: 4 },
          workflow: { nodes: [], connections: [], metadata: {} }
        }
      ];

      setCategories(mockCategories);
      setTemplates(mockTemplates);

      // Load user favorites
      const userFavorites = new Set(['template_1', 'template_3']);
      setFavorites(userFavorites);

    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Marketplace Load Failed',
        message: 'Failed to load template marketplace. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  }, [addNotification]);

  // Filter and sort templates
  const filteredAndSortedTemplates = useMemo(() => {
    let filtered = templates;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(template => template.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(template =>
        template.name.toLowerCase().includes(query) ||
        template.description.toLowerCase().includes(query) ||
        template.tags.some(tag => tag.toLowerCase().includes(query)) ||
        template.author.name.toLowerCase().includes(query)
      );
    }

    // Sort templates
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'popular':
          return b.downloadCount - a.downloadCount;
        case 'recent':
          return b.updatedAt.getTime() - a.updatedAt.getTime();
        case 'rating':
          return b.rating - a.rating;
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

    return sorted;
  }, [templates, selectedCategory, searchQuery, sortBy]);

  // Handle template actions
  const handleTemplateImport = useCallback(async (template: WorkflowTemplate) => {
    try {
      // Mock import process
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (onTemplateImport) {
        onTemplateImport(template);
      }

      addNotification({
        type: 'success',
        title: 'Template Imported',
        message: `Successfully imported "${template.name}" template`
      });

      // Update download count
      setTemplates(prev => prev.map(t => 
        t.id === template.id 
          ? { ...t, downloadCount: t.downloadCount + 1, isInstalled: true }
          : t
      ));

    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Import Failed',
        message: 'Failed to import template. Please try again.'
      });
    }
  }, [onTemplateImport, addNotification]);

  const handleTemplatePreview = useCallback((template: WorkflowTemplate) => {
    setSelectedTemplate(template);
    setShowPreview(true);
    if (onTemplatePreview) {
      onTemplatePreview(template);
    }
  }, [onTemplatePreview]);

  const handleToggleFavorite = useCallback((templateId: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(templateId)) {
        newFavorites.delete(templateId);
      } else {
        newFavorites.add(templateId);
      }
      return newFavorites;
    });

    addNotification({
      type: 'success',
      title: favorites.has(templateId) ? 'Removed from Favorites' : 'Added to Favorites',
      message: 'Template favorites updated'
    });
  }, [favorites, addNotification]);

  // Get difficulty color
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'text-green-600 bg-green-100';
      case 'intermediate': return 'text-yellow-600 bg-yellow-100';
      case 'advanced': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Format time
  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m`;
  };

  if (isLoading) {
    return (
      <div className={`template-marketplace-loading ${className}`}>
        <div className="loading-content">
          <div className="spinner large"></div>
          <p>Loading template marketplace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`workflow-template-marketplace ${className}`}>
      {/* Header */}
      <div className="marketplace-header">
        <div className="header-content">
          <h2>🛒 Template Marketplace</h2>
          <p>Discover and import workflow templates to accelerate your development</p>
        </div>
        <div className="header-stats">
          <div className="stat">
            <span className="stat-value">{templates.length}</span>
            <span className="stat-label">Templates</span>
          </div>
          <div className="stat">
            <span className="stat-value">{categories.length}</span>
            <span className="stat-label">Categories</span>
          </div>
          <div className="stat">
            <span className="stat-value">{favorites.size}</span>
            <span className="stat-label">Favorites</span>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="marketplace-filters">
        <div className="search-section">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search templates by name, description, or tags..."
            className="search-input"
          />
        </div>

        <div className="filter-section">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="category-filter"
          >
            <option value="all">All Categories</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.icon} {category.name} ({category.templateCount})
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="sort-filter"
          >
            <option value="popular">Most Popular</option>
            <option value="recent">Most Recent</option>
            <option value="rating">Highest Rated</option>
            <option value="name">Name (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Categories */}
      <div className="category-grid">
        {categories.map(category => (
          <div
            key={category.id}
            className={`category-card ${selectedCategory === category.id ? 'selected' : ''}`}
            onClick={() => setSelectedCategory(category.id)}
          >
            <div className="category-icon">{category.icon}</div>
            <div className="category-info">
              <h4>{category.name}</h4>
              <p>{category.description}</p>
              <span className="template-count">{category.templateCount} templates</span>
            </div>
          </div>
        ))}
      </div>

      {/* Templates Grid */}
      <div className="templates-section">
        <div className="section-header">
          <h3>
            {selectedCategory === 'all' ? 'All Templates' : categories.find(c => c.id === selectedCategory)?.name}
            <span className="result-count">({filteredAndSortedTemplates.length} results)</span>
          </h3>
        </div>

        {filteredAndSortedTemplates.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <h3>No Templates Found</h3>
            <p>Try adjusting your search criteria or browse different categories.</p>
          </div>
        ) : (
          <div className="templates-grid">
            {filteredAndSortedTemplates.map(template => (
              <div key={template.id} className="template-card">
                {/* Template Header */}
                <div className="template-header">
                  <div className="template-thumbnail">
                    <div className="thumbnail-placeholder">
                      {template.category === 'business' && '💼'}
                      {template.category === 'automation' && '🤖'}
                      {template.category === 'data' && '📊'}
                      {template.category === 'integration' && '🔗'}
                      {template.category === 'analytics' && '📈'}
                    </div>
                  </div>
                  <button
                    className={`favorite-button ${favorites.has(template.id) ? 'active' : ''}`}
                    onClick={() => handleToggleFavorite(template.id)}
                  >
                    {favorites.has(template.id) ? '❤️' : '🤍'}
                  </button>
                </div>

                {/* Template Info */}
                <div className="template-info">
                  <h4 className="template-name">{template.name}</h4>
                  <p className="template-description">{template.description}</p>

                  {/* Template Meta */}
                  <div className="template-meta">
                    <div className="meta-row">
                      <span className={`difficulty-badge ${getDifficultyColor(template.difficulty)}`}>
                        {template.difficulty}
                      </span>
                      <div className="rating">
                        <span className="stars">⭐ {template.rating}</span>
                        <span className="review-count">({template.reviewCount})</span>
                      </div>
                    </div>

                    <div className="meta-row">
                      <span className="node-count">📦 {template.preview.nodeCount} nodes</span>
                      <span className="estimated-time">⏱️ {formatTime(template.preview.estimatedTime)}</span>
                    </div>
                  </div>

                  {/* Template Tags */}
                  <div className="template-tags">
                    {template.tags.slice(0, 3).map(tag => (
                      <span key={tag} className="tag">#{tag}</span>
                    ))}
                    {template.tags.length > 3 && (
                      <span className="tag-more">+{template.tags.length - 3}</span>
                    )}
                  </div>

                  {/* Author Info */}
                  <div className="template-author">
                    <span className="author-name">
                      {template.author.name}
                      {template.author.verified && <span className="verified">✅</span>}
                    </span>
                    <span className="download-count">
                      📥 {template.downloadCount.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Template Actions */}
                <div className="template-actions">
                  <button
                    onClick={() => handleTemplatePreview(template)}
                    className="btn btn-secondary btn-small"
                  >
                    👁️ Preview
                  </button>
                  <button
                    onClick={() => handleTemplateImport(template)}
                    className="btn btn-primary btn-small"
                    disabled={template.isInstalled}
                  >
                    {template.isInstalled ? '✅ Installed' : '📥 Import'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Template Preview Modal */}
      {showPreview && selectedTemplate && (
        <div className="template-preview-modal">
          <div className="modal-backdrop" onClick={() => setShowPreview(false)} />
          <div className="modal-content">
            <div className="modal-header">
              <h3>{selectedTemplate.name}</h3>
              <button
                onClick={() => setShowPreview(false)}
                className="modal-close"
              >
                ❌
              </button>
            </div>
            
            <div className="modal-body">
              <div className="preview-info">
                <p>{selectedTemplate.description}</p>
                
                <div className="preview-stats">
                  <div className="stat">
                    <span className="label">Nodes:</span>
                    <span className="value">{selectedTemplate.preview.nodeCount}</span>
                  </div>
                  <div className="stat">
                    <span className="label">Estimated Time:</span>
                    <span className="value">{formatTime(selectedTemplate.preview.estimatedTime)}</span>
                  </div>
                  <div className="stat">
                    <span className="label">Complexity:</span>
                    <span className="value">{'⭐'.repeat(selectedTemplate.preview.complexity)}</span>
                  </div>
                </div>

                <div className="preview-workflow">
                  <h4>Workflow Preview</h4>
                  <div className="workflow-placeholder">
                    <p>🔄 Interactive workflow preview would be displayed here</p>
                    <p>• Visual representation of nodes and connections</p>
                    <p>• Interactive exploration of workflow logic</p>
                    <p>• Configuration requirements and dependencies</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button
                onClick={() => setShowPreview(false)}
                className="btn btn-secondary"
              >
                Close
              </button>
              <button
                onClick={() => {
                  handleTemplateImport(selectedTemplate);
                  setShowPreview(false);
                }}
                className="btn btn-primary"
              >
                Import Template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkflowTemplateMarketplace;
