/**
 * Agent Marketplace Component
 * 
 * Main marketplace UI for browsing, searching, and managing agents
 * (Non-AI related UI components - pure marketplace interface)
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  agentMarketplaceService,
  AgentMetadata,
  AgentCategory,
  AgentTier,
  MarketplaceFilter,
  MarketplaceStats
} from '../../services/agentMarketplaceService';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  StarIcon,
  HeartIcon,
  ShoppingCartIcon,
  EyeIcon,
  TagIcon,
  ClockIcon,
  UserIcon,
  ArrowDownIcon,
  ChevronDownIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';

interface AgentMarketplaceProps {
  userId?: string;
  onAgentSelect?: (agent: AgentMetadata) => void;
  onAgentPurchase?: (agent: AgentMetadata, tier: string) => void;
  className?: string;
}

export const AgentMarketplace: React.FC<AgentMarketplaceProps> = ({
  userId = 'user_123', // Default for demo
  onAgentSelect,
  onAgentPurchase,
  className = ''
}) => {
  const [agents, setAgents] = useState<AgentMetadata[]>([]);
  const [filteredAgents, setFilteredAgents] = useState<AgentMetadata[]>([]);
  const [stats, setStats] = useState<MarketplaceStats | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  
  // Filter and search state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<AgentCategory | 'all'>('all');
  const [selectedTier, setSelectedTier] = useState<AgentTier | 'all'>('all');
  const [minRating, setMinRating] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(0);
  const [sortBy, setSortBy] = useState<'popularity' | 'rating' | 'price' | 'newest' | 'name'>('popularity');
  const [showFilters, setShowFilters] = useState(false);
  
  // View state
  const [currentView, setCurrentView] = useState<'grid' | 'list'>('grid');
  const [selectedAgent, setSelectedAgent] = useState<AgentMetadata | null>(null);
  const [showAgentDetails, setShowAgentDetails] = useState(false);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Load agents and stats
        const [allAgents, marketplaceStats] = await Promise.all([
          agentMarketplaceService.getAgents(),
          agentMarketplaceService.getMarketplaceStats()
        ]);

        setAgents(allAgents);
        setStats(marketplaceStats);

        // Load user favorites
        if (userId) {
          const userFavorites = await agentMarketplaceService.getUserFavorites(userId);
          setFavorites(new Set(userFavorites.map(agent => agent.id)));
        }

      } catch (error) {
        console.error('Failed to load marketplace data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [userId]);

  // Apply filters and search
  const filter = useMemo((): MarketplaceFilter => ({
    category: selectedCategory === 'all' ? undefined : selectedCategory,
    tier: selectedTier === 'all' ? undefined : selectedTier,
    min_rating: minRating > 0 ? minRating : undefined,
    max_price: maxPrice > 0 ? maxPrice : undefined,
    search_query: searchQuery || undefined,
    sort_by: sortBy,
    sort_order: 'desc'
  }), [searchQuery, selectedCategory, selectedTier, minRating, maxPrice, sortBy]);

  useEffect(() => {
    const applyFilters = async () => {
      try {
        const filtered = await agentMarketplaceService.getAgents(filter);
        setFilteredAgents(filtered);
      } catch (error) {
        console.error('Failed to apply filters:', error);
        setFilteredAgents(agents);
      }
    };

    if (agents.length > 0) {
      applyFilters();
    }
  }, [agents, filter]);

  // Handle favorite toggle
  const handleFavoriteToggle = async (agentId: string) => {
    if (!userId) return;

    try {
      const isFavorite = favorites.has(agentId);
      
      if (isFavorite) {
        await agentMarketplaceService.removeFromFavorites(userId, agentId);
        setFavorites(prev => {
          const newSet = new Set(prev);
          newSet.delete(agentId);
          return newSet;
        });
      } else {
        await agentMarketplaceService.addToFavorites(userId, agentId);
        setFavorites(prev => new Set(prev).add(agentId));
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  // Handle agent selection
  const handleAgentClick = (agent: AgentMetadata) => {
    setSelectedAgent(agent);
    setShowAgentDetails(true);
    
    if (onAgentSelect) {
      onAgentSelect(agent);
    }
  };

  // Handle agent purchase
  const handlePurchase = (agent: AgentMetadata, tierName: string) => {
    if (onAgentPurchase) {
      onAgentPurchase(agent, tierName);
    }
  };

  // Format price
  const formatPrice = (price: number, currency: string = 'USD') => {
    if (price === 0) return 'Free';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(price);
  };

  // Get category display name
  const getCategoryDisplayName = (category: string) => {
    return category.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  // Render rating stars
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <StarIcon
        key={i}
        className={`h-4 w-4 ${
          i < Math.floor(rating) 
            ? 'text-yellow-400 fill-current' 
            : 'text-gray-300'
        }`}
      />
    ));
  };

  // Render agent card
  const renderAgentCard = (agent: AgentMetadata) => {
    const isFavorite = favorites.has(agent.id);
    const lowestPrice = Math.min(...Object.values(agent.pricing_tiers).map(tier => tier.price), 0);

    return (
      <div
        key={agent.id}
        className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer"
        onClick={() => handleAgentClick(agent)}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">{agent.name}</h3>
            <p className="text-sm text-gray-600 mb-2 line-clamp-2">{agent.description}</p>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                {getCategoryDisplayName(agent.category)}
              </span>
              <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full">
                {agent.tier}
              </span>
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleFavoriteToggle(agent.id);
            }}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            {isFavorite ? (
              <HeartSolidIcon className="h-5 w-5 text-red-500" />
            ) : (
              <HeartIcon className="h-5 w-5 text-gray-400" />
            )}
          </button>
        </div>

        {/* Rating and Stats */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="flex items-center">
              {renderStars(agent.average_rating)}
            </div>
            <span className="text-sm text-gray-600">
              {agent.average_rating.toFixed(1)} ({agent.total_reviews})
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <ArrowDownIcon className="h-4 w-4" />
              {agent.total_downloads}
            </div>
            <div className="flex items-center gap-1">
              <UserIcon className="h-4 w-4" />
              {agent.active_deployments}
            </div>
          </div>
        </div>

        {/* Capabilities */}
        <div className="mb-4">
          <div className="flex flex-wrap gap-1">
            {agent.capabilities.slice(0, 3).map(capability => (
              <span
                key={capability}
                className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded"
              >
                {capability}
              </span>
            ))}
            {agent.capabilities.length > 3 && (
              <span className="px-2 py-1 text-xs bg-gray-100 text-gray-500 rounded">
                +{agent.capabilities.length - 3} more
              </span>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="text-lg font-semibold text-gray-900">
            {formatPrice(lowestPrice)}
            {lowestPrice > 0 && Object.keys(agent.pricing_tiers).length > 1 && (
              <span className="text-sm text-gray-500 font-normal"> / month</span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAgentClick(agent);
              }}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors flex items-center gap-1"
            >
              <EyeIcon className="h-4 w-4" />
              View
            </button>
            {Object.keys(agent.pricing_tiers).length > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const firstTier = Object.keys(agent.pricing_tiers)[0];
                  handlePurchase(agent, firstTier);
                }}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center gap-1"
              >
                <ShoppingCartIcon className="h-4 w-4" />
                Get
              </button>
            )}
          </div>
        </div>
      </div>
    );
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
    <div className={`agent-marketplace ${className}`}>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Agent Marketplace</h1>
            <p className="text-gray-600 mt-1">Discover and deploy AI agents for your workflows</p>
          </div>
          {stats && (
            <div className="flex gap-6 text-sm text-gray-600">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{stats.total_agents}</div>
                <div>Total Agents</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{stats.published_agents}</div>
                <div>Published</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{stats.total_downloads.toLocaleString()}</div>
                <div>Downloads</div>
              </div>
            </div>
          )}
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search agents by name, description, or tags..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <FunnelIcon className="h-5 w-5" />
            Filters
            <ChevronDownIcon className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="popularity">Most Popular</option>
            <option value="rating">Highest Rated</option>
            <option value="price">Price: Low to High</option>
            <option value="newest">Newest</option>
            <option value="name">Name: A to Z</option>
          </select>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Categories</option>
                  <option value="customer_service">Customer Service</option>
                  <option value="sales">Sales</option>
                  <option value="marketing">Marketing</option>
                  <option value="support">Support</option>
                  <option value="hr">HR</option>
                  <option value="finance">Finance</option>
                  <option value="legal">Legal</option>
                  <option value="operations">Operations</option>
                  <option value="analytics">Analytics</option>
                  <option value="data_processing">Data Processing</option>
                  <option value="automation">Automation</option>
                  <option value="integration">Integration</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              {/* Tier Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tier</label>
                <select
                  value={selectedTier}
                  onChange={(e) => setSelectedTier(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Tiers</option>
                  <option value="basic">Basic</option>
                  <option value="professional">Professional</option>
                  <option value="enterprise">Enterprise</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              {/* Rating Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Rating</label>
                <select
                  value={minRating}
                  onChange={(e) => setMinRating(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="0">Any Rating</option>
                  <option value="3">3+ Stars</option>
                  <option value="4">4+ Stars</option>
                  <option value="4.5">4.5+ Stars</option>
                </select>
              </div>

              {/* Price Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Max Price</label>
                <select
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="0">Any Price</option>
                  <option value="10">Under $10</option>
                  <option value="50">Under $50</option>
                  <option value="100">Under $100</option>
                  <option value="500">Under $500</option>
                </select>
              </div>
            </div>

            {/* Clear Filters */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <button
                onClick={() => {
                  setSelectedCategory('all');
                  setSelectedTier('all');
                  setMinRating(0);
                  setMaxPrice(0);
                  setSearchQuery('');
                }}
                className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <XMarkIcon className="h-4 w-4" />
                Clear all filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      <div className="mb-4">
        <p className="text-gray-600">
          Showing {filteredAgents.length} of {agents.length} agents
        </p>
      </div>

      {/* Agent Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAgents.map(agent => renderAgentCard(agent))}
      </div>

      {/* Empty State */}
      {filteredAgents.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <MagnifyingGlassIcon className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No agents found</h3>
          <p className="text-gray-600">Try adjusting your search or filters to find what you're looking for.</p>
        </div>
      )}
    </div>
  );
};

export default AgentMarketplace;
