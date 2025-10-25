import { useState, useEffect, useCallback, useMemo } from 'react';

interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  industry: string;
  tags: string[];
  author: {
    name: string;
    avatar?: string;
    verified: boolean;
  };
  rating: number;
  reviewCount: number;
  downloadCount: number;
  lastUpdated: Date;
  version: string;
  compatibility: string[];
  nodes: any[];
  edges: any[];
  metadata: {
    estimatedTime: number; // minutes
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    useCases: string[];
    prerequisites: string[];
    outputs: string[];
  };
  screenshots: string[];
  demoUrl?: string;
  documentationUrl?: string;
  price?: number;
  isPremium: boolean;
  isFeatured: boolean;
  isNew: boolean;
}

interface MarketplaceFilters {
  search: string;
  category: string;
  industry: string;
  difficulty: string;
  rating: number;
  price: 'free' | 'premium' | 'all';
  sortBy: 'popular' | 'rating' | 'newest' | 'downloads';
  sortOrder: 'asc' | 'desc';
}

interface MarketplaceStats {
  totalTemplates: number;
  totalDownloads: number;
  totalUsers: number;
  categories: { name: string; count: number }[];
  industries: { name: string; count: number }[];
}

export const useWorkflowMarketplace = () => {
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<WorkflowTemplate[]>([]);
  const [stats, setStats] = useState<MarketplaceStats | null>(null);
  const [filters, setFilters] = useState<MarketplaceFilters>({
    search: '',
    category: 'all',
    industry: 'all',
    difficulty: 'all',
    rating: 0,
    price: 'all',
    sortBy: 'popular',
    sortOrder: 'desc'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<WorkflowTemplate | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  // Load marketplace data
  const loadMarketplace = useCallback(async () => {
    setIsLoading(true);
    try {
      // Simulate API call - replace with actual API
      const mockTemplates: WorkflowTemplate[] = [
        {
          id: 'healthcare-patient-intake',
          name: 'Patient Intake Automation',
          description: 'Complete patient registration and intake workflow with HIPAA compliance',
          category: 'Healthcare',
          industry: 'Healthcare',
          tags: ['patient', 'registration', 'HIPAA', 'forms', 'notifications'],
          author: {
            name: 'MedicalFlow Solutions',
            verified: true
          },
          rating: 4.8,
          reviewCount: 156,
          downloadCount: 2340,
          lastUpdated: new Date('2025-01-15'),
          version: '2.1.0',
          compatibility: ['AutoMatrix 2.0+', 'RelayCore 1.5+'],
          nodes: [],
          edges: [],
          metadata: {
            estimatedTime: 45,
            difficulty: 'intermediate',
            useCases: ['Patient registration', 'Insurance verification', 'Appointment scheduling'],
            prerequisites: ['HIPAA compliance setup', 'Patient database'],
            outputs: ['Patient records', 'Appointment confirmations', 'Insurance verification']
          },
          screenshots: ['/screenshots/healthcare-1.png', '/screenshots/healthcare-2.png'],
          documentationUrl: '/docs/healthcare-patient-intake',
          isPremium: false,
          isFeatured: true,
          isNew: false
        },
        {
          id: 'automotive-lead-qualification',
          name: 'Lead Qualification System',
          description: 'Automate lead scoring and qualification for automotive dealerships',
          category: 'Sales',
          industry: 'Automotive',
          tags: ['leads', 'scoring', 'qualification', 'CRM', 'automotive'],
          author: {
            name: 'AutoTech Solutions',
            verified: true
          },
          rating: 4.6,
          reviewCount: 89,
          downloadCount: 1876,
          lastUpdated: new Date('2025-02-01'),
          version: '1.8.2',
          compatibility: ['AutoMatrix 2.0+', 'RelayCore 1.5+'],
          nodes: [],
          edges: [],
          metadata: {
            estimatedTime: 30,
            difficulty: 'beginner',
            useCases: ['Lead scoring', 'Customer qualification', 'Follow-up automation'],
            prerequisites: ['CRM integration', 'Lead database'],
            outputs: ['Qualified leads', 'Scoring reports', 'Follow-up tasks']
          },
          screenshots: ['/screenshots/automotive-1.png', '/screenshots/automotive-2.png'],
          documentationUrl: '/docs/automotive-lead-qualification',
          isPremium: false,
          isFeatured: true,
          isNew: true
        },
        {
          id: 'ecommerce-order-fulfillment',
          name: 'E-commerce Order Fulfillment',
          description: 'Complete order processing and fulfillment automation',
          category: 'Operations',
          industry: 'E-commerce',
          tags: ['orders', 'fulfillment', 'inventory', 'shipping', 'notifications'],
          author: {
            name: 'ShopFlow Pro',
            verified: false
          },
          rating: 4.4,
          reviewCount: 67,
          downloadCount: 1234,
          lastUpdated: new Date('2025-01-28'),
          version: '1.5.1',
          compatibility: ['AutoMatrix 2.0+', 'RelayCore 1.5+'],
          nodes: [],
          edges: [],
          metadata: {
            estimatedTime: 60,
            difficulty: 'advanced',
            useCases: ['Order processing', 'Inventory management', 'Shipping automation'],
            prerequisites: ['E-commerce platform', 'Inventory system', 'Shipping API'],
            outputs: ['Order confirmations', 'Shipping labels', 'Inventory updates']
          },
          screenshots: ['/screenshots/ecommerce-1.png', '/screenshots/ecommerce-2.png'],
          documentationUrl: '/docs/ecommerce-order-fulfillment',
          price: 49.99,
          isPremium: true,
          isFeatured: false,
          isNew: false
        },
        {
          id: 'financial-compliance-reporting',
          name: 'Financial Compliance Reporting',
          description: 'Automated regulatory reporting and compliance monitoring',
          category: 'Compliance',
          industry: 'Financial Services',
          tags: ['compliance', 'reporting', 'regulatory', 'audit', 'finance'],
          author: {
            name: 'FinTech Compliance Inc',
            verified: true
          },
          rating: 4.9,
          reviewCount: 203,
          downloadCount: 3456,
          lastUpdated: new Date('2025-02-10'),
          version: '3.2.0',
          compatibility: ['AutoMatrix 2.0+', 'RelayCore 1.5+', 'NeuroWeaver 1.0+'],
          nodes: [],
          edges: [],
          metadata: {
            estimatedTime: 90,
            difficulty: 'advanced',
            useCases: ['Regulatory reporting', 'Compliance monitoring', 'Audit trails'],
            prerequisites: ['Financial data sources', 'Compliance framework', 'Audit logging'],
            outputs: ['Compliance reports', 'Audit logs', 'Regulatory filings']
          },
          screenshots: ['/screenshots/finance-1.png', '/screenshots/finance-2.png'],
          documentationUrl: '/docs/financial-compliance-reporting',
          price: 99.99,
          isPremium: true,
          isFeatured: true,
          isNew: false
        },
        {
          id: 'manufacturing-quality-control',
          name: 'Quality Control Automation',
          description: 'Automated quality inspection and defect tracking system',
          category: 'Quality',
          industry: 'Manufacturing',
          tags: ['quality', 'inspection', 'defects', 'tracking', 'manufacturing'],
          author: {
            name: 'QualityTech Solutions',
            verified: true
          },
          rating: 4.7,
          reviewCount: 134,
          downloadCount: 2156,
          lastUpdated: new Date('2025-01-20'),
          version: '2.0.3',
          compatibility: ['AutoMatrix 2.0+', 'RelayCore 1.5+'],
          nodes: [],
          edges: [],
          metadata: {
            estimatedTime: 75,
            difficulty: 'intermediate',
            useCases: ['Quality inspection', 'Defect tracking', 'Process monitoring'],
            prerequisites: ['Quality control system', 'IoT sensors', 'Production database'],
            outputs: ['Quality reports', 'Defect analysis', 'Process improvements']
          },
          screenshots: ['/screenshots/manufacturing-1.png', '/screenshots/manufacturing-2.png'],
          documentationUrl: '/docs/manufacturing-quality-control',
          price: 79.99,
          isPremium: true,
          isFeatured: false,
          isNew: false
        }
      ];

      const mockStats: MarketplaceStats = {
        totalTemplates: mockTemplates.length,
        totalDownloads: mockTemplates.reduce((sum, t) => sum + t.downloadCount, 0),
        totalUsers: 15420,
        categories: [
          { name: 'Healthcare', count: 1 },
          { name: 'Sales', count: 1 },
          { name: 'Operations', count: 1 },
          { name: 'Compliance', count: 1 },
          { name: 'Quality', count: 1 }
        ],
        industries: [
          { name: 'Healthcare', count: 1 },
          { name: 'Automotive', count: 1 },
          { name: 'E-commerce', count: 1 },
          { name: 'Financial Services', count: 1 },
          { name: 'Manufacturing', count: 1 }
        ]
      };

      setTemplates(mockTemplates);
      setStats(mockStats);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Apply filters and sorting
  const applyFilters = useCallback(() => {
    let filtered = [...templates];

    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(template =>
        template.name.toLowerCase().includes(searchTerm) ||
        template.description.toLowerCase().includes(searchTerm) ||
        template.tags.some(tag => tag.toLowerCase().includes(searchTerm)) ||
        template.industry.toLowerCase().includes(searchTerm) ||
        template.category.toLowerCase().includes(searchTerm)
      );
    }

    // Category filter
    if (filters.category !== 'all') {
      filtered = filtered.filter(template => template.category === filters.category);
    }

    // Industry filter
    if (filters.industry !== 'all') {
      filtered = filtered.filter(template => template.industry === filters.industry);
    }

    // Difficulty filter
    if (filters.difficulty !== 'all') {
      filtered = filtered.filter(template => template.metadata.difficulty === filters.difficulty);
    }

    // Rating filter
    if (filters.rating > 0) {
      filtered = filtered.filter(template => template.rating >= filters.rating);
    }

    // Price filter
    if (filters.price === 'free') {
      filtered = filtered.filter(template => !template.isPremium);
    } else if (filters.price === 'premium') {
      filtered = filtered.filter(template => template.isPremium);
    }

    // Sorting
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (filters.sortBy) {
        case 'popular':
          comparison = b.downloadCount - a.downloadCount;
          break;
        case 'rating':
          comparison = b.rating - a.rating;
          break;
        case 'newest':
          comparison = new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
          break;
        case 'downloads':
          comparison = b.downloadCount - a.downloadCount;
          break;
        default:
          comparison = 0;
      }

      return filters.sortOrder === 'asc' ? comparison : -comparison;
    });

    setFilteredTemplates(filtered);
  }, [templates, filters]);

  // Update filters
  const updateFilters = useCallback((newFilters: Partial<MarketplaceFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  // Toggle favorite
  const toggleFavorite = useCallback((templateId: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(templateId)) {
        newFavorites.delete(templateId);
      } else {
        newFavorites.add(templateId);
      }
      return newFavorites;
    });
  }, []);

  // Import template
  const importTemplate = useCallback(async (template: WorkflowTemplate) => {
    try {
      // Simulate import process
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Here you would integrate with the workflow builder to import the template

      return {
        success: true,
        workflowId: `workflow-${Date.now()}`,
        message: `Successfully imported ${template.name}`
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to import template'
      };
    }
  }, []);

  // Get featured templates
  const featuredTemplates = useMemo(() => {
    return templates.filter(template => template.isFeatured);
  }, [templates]);

  // Get new templates
  const newTemplates = useMemo(() => {
    return templates.filter(template => template.isNew);
  }, [templates]);

  // Get popular templates
  const popularTemplates = useMemo(() => {
    return [...templates].sort((a, b) => b.downloadCount - a.downloadCount).slice(0, 10);
  }, [templates]);

  // Load marketplace on mount
  useEffect(() => {
    loadMarketplace();
  }, [loadMarketplace]);

  // Apply filters when they change
  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  return {
    // Data
    templates: filteredTemplates,
    allTemplates: templates,
    stats,
    featuredTemplates,
    newTemplates,
    popularTemplates,

    // State
    filters,
    isLoading,
    selectedTemplate,
    favorites,

    // Actions
    updateFilters,
    toggleFavorite,
    importTemplate,
    setSelectedTemplate,
    loadMarketplace
  };
};


