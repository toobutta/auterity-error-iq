import React, { useState, useMemo } from 'react';
import { useWorkflowMarketplace } from '../../hooks/useWorkflowMarketplace';

interface WorkflowMarketplaceProps {
  onImportTemplate?: (template: any) => void;
  className?: string;
}

export const WorkflowMarketplace: React.FC<WorkflowMarketplaceProps> = ({
  onImportTemplate,
  className = ''
}) => {
  const {
    templates,
    stats,
    featuredTemplates,
    newTemplates,
    popularTemplates,
    filters,
    isLoading,
    selectedTemplate,
    favorites,
    updateFilters,
    toggleFavorite,
    importTemplate,
    setSelectedTemplate
  } = useWorkflowMarketplace();

  const [activeTab, setActiveTab] = useState<'browse' | 'featured' | 'new' | 'popular'>('browse');
  const [isImporting, setIsImporting] = useState<string | null>(null);

  // Get current templates based on active tab
  const currentTemplates = useMemo(() => {
    switch (activeTab) {
      case 'featured':
        return featuredTemplates;
      case 'new':
        return newTemplates;
      case 'popular':
        return popularTemplates;
      default:
        return templates;
    }
  }, [activeTab, templates, featuredTemplates, newTemplates, popularTemplates]);

  // Handle template import
  const handleImportTemplate = async (template: any) => {
    setIsImporting(template.id);
    try {
      const result = await importTemplate(template);
      if (result.success && onImportTemplate) {
        onImportTemplate(template);
      }
    } finally {
      setIsImporting(null);
    }
  };

  // Format number for display
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  // Get difficulty color
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'text-green-600 bg-green-100';
      case 'intermediate': return 'text-yellow-600 bg-yellow-100';
      case 'advanced': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Get rating stars
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span
        key={i}
        className={`text-sm ${i < Math.floor(rating) ? 'text-yellow-400' : 'text-gray-300'}`}
      >
        ★
      </span>
    ));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading marketplace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Workflow Marketplace</h2>
            <p className="text-gray-600 mt-1">
              Discover and import pre-built workflow templates
            </p>
          </div>

          {/* Stats */}
          {stats && (
            <div className="flex items-center space-x-6 text-sm text-gray-600">
              <div className="text-center">
                <div className="font-semibold text-lg text-gray-900">{stats.totalTemplates}</div>
                <div>Templates</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-lg text-gray-900">{formatNumber(stats.totalDownloads)}</div>
                <div>Downloads</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-lg text-gray-900">{formatNumber(stats.totalUsers)}</div>
                <div>Users</div>
              </div>
            </div>
          )}
        </div>

        {/* Search and Filters */}
        <div className="mt-6 space-y-4">
          {/* Search */}
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search templates..."
                value={filters.search}
                onChange={(e) => updateFilters({ search: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Quick Filters */}
            <select
              value={filters.category}
              onChange={(e) => updateFilters({ category: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Categories</option>
              {stats?.categories.map(cat => (
                <option key={cat.name} value={cat.name}>{cat.name} ({cat.count})</option>
              ))}
            </select>

            <select
              value={filters.industry}
              onChange={(e) => updateFilters({ industry: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Industries</option>
              {stats?.industries.map(ind => (
                <option key={ind.name} value={ind.name}>{ind.name} ({ind.count})</option>
              ))}
            </select>

            <select
              value={filters.price}
              onChange={(e) => updateFilters({ price: e.target.value as any })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Prices</option>
              <option value="free">Free Only</option>
              <option value="premium">Premium Only</option>
            </select>
          </div>

          {/* Tabs */}
          <div className="flex items-center space-x-1">
            {[
              { id: 'browse', label: 'Browse All', count: templates.length },
              { id: 'featured', label: 'Featured', count: featuredTemplates.length },
              { id: 'new', label: 'New', count: newTemplates.length },
              { id: 'popular', label: 'Popular', count: popularTemplates.length }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Template Grid */}
      <div className="p-6">
        {currentTemplates.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No templates found</h3>
            <p className="text-gray-600">Try adjusting your search or filter criteria</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentTemplates.map((template) => (
              <div
                key={template.id}
                className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setSelectedTemplate(template)}
              >
                {/* Template Image */}
                <div className="h-48 bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                  {template.screenshots[0] ? (
                    <img
                      src={template.screenshots[0]}
                      alt={template.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-4xl">📋</div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 text-lg leading-tight">
                      {template.name}
                    </h3>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(template.id);
                      }}
                      className={`text-xl ${favorites.has(template.id) ? 'text-red-500' : 'text-gray-300 hover:text-red-500'}`}
                    >
                      ♥
                    </button>
                  </div>

                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {template.description}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1 mb-3">
                    {template.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                    {template.tags.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                        +{template.tags.length - 3}
                      </span>
                    )}
                  </div>

                  {/* Rating and Downloads */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center">
                        {renderStars(template.rating)}
                      </div>
                      <span className="text-sm text-gray-600">
                        {template.rating} ({template.reviewCount})
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      {formatNumber(template.downloadCount)} downloads
                    </div>
                  </div>

                  {/* Author and Difficulty */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">by</span>
                      <span className="text-sm font-medium text-gray-900">{template.author.name}</span>
                      {template.author.verified && (
                        <span className="text-blue-500 text-sm">✓</span>
                      )}
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full capitalize ${getDifficultyColor(template.metadata.difficulty)}`}>
                      {template.metadata.difficulty}
                    </span>
                  </div>

                  {/* Price and Import */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {template.isPremium ? (
                        <span className="text-lg font-bold text-gray-900">
                          ${template.price}
                        </span>
                      ) : (
                        <span className="text-lg font-bold text-green-600">Free</span>
                      )}
                      {template.isNew && (
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                          New
                        </span>
                      )}
                      {template.isFeatured && (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full">
                          Featured
                        </span>
                      )}
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleImportTemplate(template);
                      }}
                      disabled={isImporting === template.id}
                      className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isImporting === template.id ? 'Importing...' : 'Import'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Template Detail Modal */}
      {selectedTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {selectedTemplate.name}
                  </h3>
                  <p className="text-gray-600">{selectedTemplate.description}</p>
                </div>
                <button
                  onClick={() => setSelectedTemplate(null)}
                  className="text-gray-400 hover:text-gray-600 text-xl"
                >
                  ×
                </button>
              </div>

              {/* Screenshots */}
              {selectedTemplate.screenshots.length > 0 && (
                <div className="mb-6">
                  <div className="grid grid-cols-2 gap-4">
                    {selectedTemplate.screenshots.map((screenshot, index) => (
                      <img
                        key={index}
                        src={screenshot}
                        alt={`${selectedTemplate.name} screenshot ${index + 1}`}
                        className="rounded-lg border border-gray-200"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Details</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Category:</span>
                      <span className="font-medium">{selectedTemplate.category}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Industry:</span>
                      <span className="font-medium">{selectedTemplate.industry}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Difficulty:</span>
                      <span className={`px-2 py-1 text-xs rounded-full capitalize ${getDifficultyColor(selectedTemplate.metadata.difficulty)}`}>
                        {selectedTemplate.metadata.difficulty}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Estimated Time:</span>
                      <span className="font-medium">{selectedTemplate.metadata.estimatedTime} min</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Version:</span>
                      <span className="font-medium">{selectedTemplate.version}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Use Cases</h4>
                  <ul className="space-y-1 text-sm text-gray-600">
                    {selectedTemplate.metadata.useCases.map((useCase, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-blue-500 mr-2">•</span>
                        {useCase}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Prerequisites */}
              {selectedTemplate.metadata.prerequisites.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-3">Prerequisites</h4>
                  <ul className="space-y-1 text-sm text-gray-600">
                    {selectedTemplate.metadata.prerequisites.map((prereq, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-orange-500 mr-2">⚠</span>
                        {prereq}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Outputs */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">Outputs</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  {selectedTemplate.metadata.outputs.map((output, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-green-500 mr-2">✓</span>
                      {output}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    {renderStars(selectedTemplate.rating)}
                    <span className="text-sm text-gray-600">
                      {selectedTemplate.rating} ({selectedTemplate.reviewCount} reviews)
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {formatNumber(selectedTemplate.downloadCount)} downloads
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  {selectedTemplate.documentationUrl && (
                    <a
                      href={selectedTemplate.documentationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Documentation
                    </a>
                  )}

                  <button
                    onClick={() => handleImportTemplate(selectedTemplate)}
                    disabled={isImporting === selectedTemplate.id}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isImporting === selectedTemplate.id ? 'Importing...' : 'Import Template'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


