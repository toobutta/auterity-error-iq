/**
 * Customer Template Marketplace
 *
 * Showcases AI-generated templates for customers to browse, customize, and deploy
 * Leverages Vercel AI SDK patterns and existing marketplace components
 */

import React, { useState, useEffect, useMemo } from 'react';
import { TemplateGenerator } from './TemplateGenerator';
import { templateGenerator } from '../../services/templateGenerator';
import { unifiedAIService } from '../../services/unifiedAIService';
import { stripeService } from '../../services/stripeService';

interface CustomerTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  difficulty: string;
  estimatedTime: number;
  price: number;
  thumbnail?: string;
  tags: string[];
  vercelTemplate: any;
  isCustomizable: boolean;
  features: string[];
  useCases: string[];
}

interface CustomerTemplateMarketplaceProps {
  onTemplateSelect?: (template: CustomerTemplate) => void;
  onTemplateDeploy?: (template: CustomerTemplate) => void;
  customerTier?: 'free' | 'pro' | 'enterprise';
  className?: string;
}

export const CustomerTemplateMarketplace: React.FC<CustomerTemplateMarketplaceProps> = ({
  onTemplateSelect,
  onTemplateDeploy,
  customerTier = 'free',
  className = ''
}) => {
  const [templates, setTemplates] = useState<CustomerTemplate[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showGenerator, setShowGenerator] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<CustomerTemplate | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Pre-built templates based on Vercel AI SDK patterns
  const preBuiltTemplates = useMemo(() => [
    {
      id: 'ai-chatbot',
      name: 'AI Customer Support Chatbot',
      description: 'Intelligent chatbot using Vercel AI SDK useChat hook for customer support automation',
      category: 'chatbot',
      difficulty: 'beginner',
      estimatedTime: 15,
      price: 299,
      tags: ['chatbot', 'customer-support', 'ai-sdk'],
      isCustomizable: true,
      features: [
        'Real-time chat interface',
        'Context-aware responses',
        'Multi-provider support',
        'Easy deployment to Vercel'
      ],
      useCases: [
        'Customer support automation',
        'FAQ answering',
        'Lead qualification',
        'Appointment scheduling'
      ],
      vercelTemplate: {
        framework: 'nextjs',
        aiFeatures: ['useChat', 'streaming'],
        deployment: {
          platform: 'vercel',
          aiGateway: true,
          edgeFunctions: false
        }
      }
    },
    {
      id: 'rag-knowledge-base',
      name: 'Document Q&A System',
      description: 'RAG-powered knowledge base using embeddings and similarity search',
      category: 'rag',
      difficulty: 'intermediate',
      estimatedTime: 30,
      price: 499,
      tags: ['rag', 'embeddings', 'knowledge-base', 'search'],
      isCustomizable: true,
      features: [
        'Document upload and processing',
        'Semantic search',
        'Context-aware answers',
        'Multiple document formats'
      ],
      useCases: [
        'Internal knowledge base',
        'Documentation Q&A',
        'Research assistance',
        'Policy lookup'
      ],
      vercelTemplate: {
        framework: 'nextjs',
        aiFeatures: ['embeddings', 'similarity-search'],
        deployment: {
          platform: 'vercel',
          aiGateway: true,
          edgeFunctions: true
        }
      }
    },
    {
      id: 'streaming-writer',
      name: 'AI Content Generator',
      description: 'Real-time content generation with streaming responses',
      category: 'streaming',
      difficulty: 'beginner',
      estimatedTime: 20,
      price: 199,
      tags: ['streaming', 'content-generation', 'real-time'],
      isCustomizable: true,
      features: [
        'Real-time text generation',
        'Multiple content types',
        'Progress indicators',
        'Export options'
      ],
      useCases: [
        'Blog post writing',
        'Email composition',
        'Social media content',
        'Marketing copy'
      ],
      vercelTemplate: {
        framework: 'nextjs',
        aiFeatures: ['streamText', 'progress-tracking'],
        deployment: {
          platform: 'vercel',
          aiGateway: true,
          edgeFunctions: false
        }
      }
    },
    {
      id: 'generative-ui-builder',
      name: 'Dynamic Form Builder',
      description: 'AI-powered form generation with dynamic UI components',
      category: 'generative-ui',
      difficulty: 'advanced',
      estimatedTime: 45,
      price: 349,
      tags: ['generative-ui', 'forms', 'dynamic-components'],
      isCustomizable: true,
      features: [
        'AI-generated form layouts',
        'Dynamic field types',
        'Validation rules',
        'Responsive design'
      ],
      useCases: [
        'Survey creation',
        'Application forms',
        'Feedback collection',
        'Registration systems'
      ],
      vercelTemplate: {
        framework: 'nextjs',
        aiFeatures: ['streamUI', 'dynamic-components'],
        deployment: {
          platform: 'vercel',
          aiGateway: true,
          edgeFunctions: true
        }
      }
    },
    {
      id: 'ai-tool-orchestrator',
      name: 'AI Tool Orchestrator',
      description: 'Multi-tool AI agent with function calling and orchestration',
      category: 'tools',
      difficulty: 'advanced',
      estimatedTime: 60,
      price: 599,
      tags: ['tools', 'orchestration', 'function-calling'],
      isCustomizable: true,
      features: [
        'Multiple AI tool integration',
        'Function calling',
        'Tool orchestration',
        'Error handling'
      ],
      useCases: [
        'API orchestration',
        'Data processing pipelines',
        'Integration automation',
        'Workflow automation'
      ],
      vercelTemplate: {
        framework: 'nextjs',
        aiFeatures: ['tool-calling', 'orchestration'],
        deployment: {
          platform: 'vercel',
          aiGateway: true,
          edgeFunctions: true
        }
      }
    }
  ], []);

  useEffect(() => {
    // Load templates based on customer tier
    loadTemplatesForTier();
  }, [customerTier]);

  const loadTemplatesForTier = async () => {
    let availableTemplates = [...preBuiltTemplates];

    // Add tier-specific templates
    if (customerTier === 'pro' || customerTier === 'enterprise') {
      availableTemplates = [
        ...availableTemplates,
        // Add advanced templates for pro/enterprise
      ];
    }

    if (customerTier === 'enterprise') {
      availableTemplates = [
        ...availableTemplates,
        // Add enterprise-specific templates
      ];
    }

    setTemplates(availableTemplates);
  };

  const filteredTemplates = useMemo(() => {
    return templates.filter(template => {
      const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
      const matchesSearch = searchQuery === '' ||
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesCategory && matchesSearch;
    });
  }, [templates, selectedCategory, searchQuery]);

  const handleTemplateSelect = (template: CustomerTemplate) => {
    setSelectedTemplate(template);
    onTemplateSelect?.(template);
  };

  const handleDeployTemplate = async (template: CustomerTemplate) => {
    try {
      setIsGenerating(true);

      // Check if Stripe is available
      if (!stripeService.isAvailable()) {
        alert('Payment system is not available. Please contact support.');
        return;
      }

      // Create Stripe checkout session
      await stripeService.purchaseTemplate(
        template.id,
        'customer@example.com' // In production, get from user auth
      );

      onTemplateDeploy?.(template);
    } catch (error) {
      console.error('Template purchase failed:', error);
      alert('Failed to process purchase. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };



  const categories = [
    { id: 'all', name: 'All Templates', count: templates.length },
    { id: 'chatbot', name: 'Chatbots', count: templates.filter(t => t.category === 'chatbot').length },
    { id: 'rag', name: 'Knowledge Base', count: templates.filter(t => t.category === 'rag').length },
    { id: 'streaming', name: 'Content Generation', count: templates.filter(t => t.category === 'streaming').length },
    { id: 'generative-ui', name: 'Dynamic UI', count: templates.filter(t => t.category === 'generative-ui').length },
    { id: 'tools', name: 'Tool Orchestration', count: templates.filter(t => t.category === 'tools').length }
  ];

  if (showGenerator) {
    return (
      <div className="template-marketplace">
        <div className="generator-header">
          <button
            onClick={() => setShowGenerator(false)}
            className="back-button"
          >
            ← Back to Marketplace
          </button>
          <h2>Create Custom Template</h2>
        </div>
        <TemplateGenerator
          onTemplateGenerated={(template) => {
            setTemplates(prev => [...prev, template as CustomerTemplate]);
            setShowGenerator(false);
          }}
        />
      </div>
    );
  }

  return (
    <div className={`customer-template-marketplace ${className}`}>
      {/* Header */}
      <div className="marketplace-header">
        <div className="header-content">
          <h1>AI Template Marketplace</h1>
          <p>Deploy production-ready AI applications in minutes using Vercel AI SDK patterns</p>

          <div className="tier-indicator">
            <span className={`tier-badge ${customerTier}`}>
              {customerTier.charAt(0).toUpperCase() + customerTier.slice(1)} Plan
            </span>
          </div>
        </div>

        <div className="header-actions">
          <button
            onClick={() => setShowGenerator(true)}
            className="create-custom-button"
          >
            Create Custom Template
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="marketplace-controls">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="category-filters">
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`category-button ${selectedCategory === category.id ? 'active' : ''}`}
            >
              {category.name} ({category.count})
            </button>
          ))}
        </div>
      </div>

      {/* Template Grid */}
      <div className="template-grid">
        {filteredTemplates.map(template => (
          <TemplateCard
            key={template.id}
            template={template}
            customerTier={customerTier}
            onSelect={() => handleTemplateSelect(template)}
            onDeploy={() => handleDeployTemplate(template)}
            isGenerating={isGenerating}
          />
        ))}
      </div>

      {/* Selected Template Details */}
      {selectedTemplate && (
        <TemplateDetailsModal
          template={selectedTemplate}
          onClose={() => setSelectedTemplate(null)}
          onDeploy={() => handleDeployTemplate(selectedTemplate)}
          customerTier={customerTier}
        />
      )}

      {/* Empty State */}
      {filteredTemplates.length === 0 && (
        <div className="empty-state">
          <h3>No templates found</h3>
          <p>Try adjusting your search or create a custom template.</p>
          <button
            onClick={() => setShowGenerator(true)}
            className="create-custom-button"
          >
            Create Custom Template
          </button>
        </div>
      )}
    </div>
  );
};

// Template Card Component
const TemplateCard: React.FC<{
  template: CustomerTemplate;
  customerTier: string;
  onSelect: () => void;
  onDeploy: () => void;
  isGenerating: boolean;
}> = ({ template, customerTier, onSelect, onDeploy, isGenerating }) => (
  <div className="template-card">
    <div className="template-header">
      <div className="template-icon">
        {template.category === 'chatbot' && '💬'}
        {template.category === 'rag' && '📚'}
        {template.category === 'streaming' && '⚡'}
        {template.category === 'generative-ui' && '🎨'}
        {template.category === 'tools' && '🔧'}
      </div>
      <div className="template-meta">
        <span className={`difficulty ${template.difficulty}`}>
          {template.difficulty}
        </span>
        <span className="time">{template.estimatedTime}min</span>
      </div>
    </div>

    <div className="template-content">
      <h3>{template.name}</h3>
      <p>{template.description}</p>

      <div className="template-pricing">
        <div className="price">${template.price}</div>
        <div className="price-label">one-time</div>
      </div>

      <div className="template-features">
        {template.features.slice(0, 3).map(feature => (
          <span key={feature} className="feature-tag">
            {feature}
          </span>
        ))}
      </div>

      <div className="template-tags">
        {template.tags.map(tag => (
          <span key={tag} className="tag">
            {tag}
          </span>
        ))}
      </div>
    </div>

    <div className="template-actions">
      <button onClick={onSelect} className="view-details-button">
        View Details
      </button>
      <button
        onClick={onDeploy}
        disabled={isGenerating}
        className="deploy-button"
      >
        {isGenerating ? 'Purchasing...' : `Purchase $${template.price}`}
      </button>
    </div>
  </div>
);

// Template Details Modal
const TemplateDetailsModal: React.FC<{
  template: CustomerTemplate;
  onClose: () => void;
  onDeploy: () => void;
  customerTier: string;
}> = ({ template, onClose, onDeploy, customerTier }) => (
  <div className="template-modal-overlay" onClick={onClose}>
    <div className="template-modal" onClick={e => e.stopPropagation()}>
      <div className="modal-header">
        <div className="template-icon-large">
          {template.category === 'chatbot' && '💬'}
          {template.category === 'rag' && '📚'}
          {template.category === 'streaming' && '⚡'}
          {template.category === 'generative-ui' && '🎨'}
          {template.category === 'tools' && '🔧'}
        </div>
        <div className="template-info">
          <h2>{template.name}</h2>
          <div className="template-meta">
            <span className={`difficulty ${template.difficulty}`}>
              {template.difficulty}
            </span>
            <span className="time">{template.estimatedTime}min setup</span>
            <span className="category">{template.category}</span>
          </div>
        </div>
        <button onClick={onClose} className="close-button">×</button>
      </div>

      <div className="modal-content">
        <div className="template-description">
          <h3>Description</h3>
          <p>{template.description}</p>
        </div>

        <div className="template-features">
          <h3>Features</h3>
          <ul>
            {template.features.map(feature => (
              <li key={feature}>{feature}</li>
            ))}
          </ul>
        </div>

        <div className="template-use-cases">
          <h3>Use Cases</h3>
          <ul>
            {template.useCases.map(useCase => (
              <li key={useCase}>{useCase}</li>
            ))}
          </ul>
        </div>

        <div className="vercel-config">
          <h3>Vercel Configuration</h3>
          <div className="config-grid">
            <div className="config-item">
              <strong>Framework:</strong> {template.vercelTemplate.framework}
            </div>
            <div className="config-item">
              <strong>AI Gateway:</strong> {template.vercelTemplate.deployment.aiGateway ? 'Yes' : 'No'}
            </div>
            <div className="config-item">
              <strong>Edge Functions:</strong> {template.vercelTemplate.deployment.edgeFunctions ? 'Yes' : 'No'}
            </div>
          </div>
        </div>
      </div>

      <div className="modal-actions">
        <button onClick={onClose} className="cancel-button">
          Cancel
        </button>
        <button onClick={onDeploy} className="deploy-button">
          Deploy Template
        </button>
      </div>
    </div>
  </div>
);

export default CustomerTemplateMarketplace;
