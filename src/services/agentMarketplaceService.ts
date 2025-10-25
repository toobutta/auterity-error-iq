/**
 * Agent Marketplace Service
 * 
 * Handles agent storage and retrieval, metadata management, and marketplace operations
 * (Non-AI related functionality - pure marketplace infrastructure)
 */

import { z } from 'zod';

// Agent Marketplace Schemas
const AgentCategorySchema = z.enum([
  'customer_service',
  'sales', 
  'marketing',
  'support',
  'hr',
  'finance',
  'legal',
  'operations',
  'analytics',
  'data_processing',
  'automation',
  'integration',
  'custom'
]);

const AgentTierSchema = z.enum(['basic', 'professional', 'enterprise', 'custom']);

const MarketplaceStatusSchema = z.enum(['draft', 'review', 'published', 'suspended', 'deprecated']);

const PricingTierSchema = z.object({
  name: z.string(),
  price: z.number(),
  currency: z.string().default('USD'),
  billing_period: z.enum(['monthly', 'yearly', 'one_time', 'usage_based']),
  features: z.array(z.string()),
  limits: z.record(z.number()).optional()
});

const AgentMetadataSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  category: AgentCategorySchema,
  tier: AgentTierSchema,
  version: z.string().default('1.0.0'),
  status: MarketplaceStatusSchema.default('draft'),
  
  // Technical specifications
  base_model: z.string().optional(),
  capabilities: z.array(z.string()),
  required_integrations: z.array(z.string()).default([]),
  configuration_schema: z.record(z.unknown()).default({}),
  
  // Business model
  pricing_tiers: z.record(PricingTierSchema).default({}),
  revenue_share_percentage: z.number().min(0).max(100).default(0),
  creator_id: z.string(),
  
  // Usage statistics
  total_downloads: z.number().default(0),
  total_deployments: z.number().default(0),
  active_deployments: z.number().default(0),
  average_rating: z.number().min(0).max(5).default(0),
  total_reviews: z.number().default(0),
  
  // Metadata
  tags: z.array(z.string()).default([]),
  industries: z.array(z.string()).default([]),
  supported_languages: z.array(z.string()).default(['en']),
  documentation_url: z.string().optional(),
  support_url: z.string().optional(),
  demo_url: z.string().optional(),
  
  // Timestamps
  created_at: z.date().default(() => new Date()),
  updated_at: z.date().default(() => new Date()),
  published_at: z.date().optional(),
  last_updated_by: z.string().optional()
});

const AgentReviewSchema = z.object({
  id: z.string(),
  agent_id: z.string(),
  user_id: z.string(),
  rating: z.number().min(1).max(5),
  title: z.string(),
  content: z.string(),
  pros: z.array(z.string()).default([]),
  cons: z.array(z.string()).default([]),
  verified_purchase: z.boolean().default(false),
  helpful_votes: z.number().default(0),
  created_at: z.date().default(() => new Date()),
  updated_at: z.date().default(() => new Date())
});

const MarketplaceFilterSchema = z.object({
  category: AgentCategorySchema.optional(),
  tier: AgentTierSchema.optional(),
  min_rating: z.number().min(0).max(5).optional(),
  max_price: z.number().min(0).optional(),
  tags: z.array(z.string()).default([]),
  industries: z.array(z.string()).default([]),
  capabilities: z.array(z.string()).default([]),
  creator_id: z.string().optional(),
  search_query: z.string().optional(),
  sort_by: z.enum(['popularity', 'rating', 'price', 'newest', 'name']).default('popularity'),
  sort_order: z.enum(['asc', 'desc']).default('desc')
});

// Types
export type AgentCategory = z.infer<typeof AgentCategorySchema>;
export type AgentTier = z.infer<typeof AgentTierSchema>;
export type MarketplaceStatus = z.infer<typeof MarketplaceStatusSchema>;
export type PricingTier = z.infer<typeof PricingTierSchema>;
export type AgentMetadata = z.infer<typeof AgentMetadataSchema>;
export type AgentReview = z.infer<typeof AgentReviewSchema>;
export type MarketplaceFilter = z.infer<typeof MarketplaceFilterSchema>;

export interface MarketplaceStats {
  total_agents: number;
  published_agents: number;
  total_downloads: number;
  total_revenue: number;
  active_creators: number;
  categories: Record<AgentCategory, number>;
  tiers: Record<AgentTier, number>;
}

export interface AgentDownload {
  id: string;
  agent_id: string;
  user_id: string;
  version: string;
  download_date: Date;
  price_paid: number;
  currency: string;
  license_type: string;
}

export class AgentMarketplaceService {
  private agents: Map<string, AgentMetadata> = new Map();
  private reviews: Map<string, AgentReview[]> = new Map();
  private downloads: Map<string, AgentDownload[]> = new Map();
  private favorites: Map<string, Set<string>> = new Map(); // userId -> Set<agentId>

  // ===== AGENT STORAGE AND RETRIEVAL =====

  /**
   * Store agent metadata in marketplace
   */
  async storeAgent(metadata: Omit<AgentMetadata, 'id' | 'created_at' | 'updated_at'>): Promise<AgentMetadata> {
    const agent: AgentMetadata = {
      ...metadata,
      id: this.generateId(),
      created_at: new Date(),
      updated_at: new Date()
    };

    // Validate agent metadata
    const validatedAgent = AgentMetadataSchema.parse(agent);
    
    this.agents.set(validatedAgent.id, validatedAgent);
    return validatedAgent;
  }

  /**
   * Retrieve agent by ID
   */
  async getAgent(agentId: string): Promise<AgentMetadata | null> {
    return this.agents.get(agentId) || null;
  }

  /**
   * Update agent metadata
   */
  async updateAgent(agentId: string, updates: Partial<AgentMetadata>): Promise<AgentMetadata | null> {
    const existingAgent = this.agents.get(agentId);
    if (!existingAgent) {
      return null;
    }

    const updatedAgent: AgentMetadata = {
      ...existingAgent,
      ...updates,
      updated_at: new Date()
    };

    // Validate updated agent
    const validatedAgent = AgentMetadataSchema.parse(updatedAgent);
    
    this.agents.set(agentId, validatedAgent);
    return validatedAgent;
  }

  /**
   * Delete agent from marketplace
   */
  async deleteAgent(agentId: string): Promise<boolean> {
    const deleted = this.agents.delete(agentId);
    if (deleted) {
      // Clean up related data
      this.reviews.delete(agentId);
      this.downloads.delete(agentId);
      
      // Remove from favorites
      for (const [userId, favoriteSet] of this.favorites.entries()) {
        favoriteSet.delete(agentId);
      }
    }
    return deleted;
  }

  /**
   * Get all agents with filtering and sorting
   */
  async getAgents(filter?: MarketplaceFilter): Promise<AgentMetadata[]> {
    let agents = Array.from(this.agents.values());

    if (!filter) {
      return agents;
    }

    const validatedFilter = MarketplaceFilterSchema.parse(filter);

    // Apply filters
    if (validatedFilter.category) {
      agents = agents.filter(agent => agent.category === validatedFilter.category);
    }

    if (validatedFilter.tier) {
      agents = agents.filter(agent => agent.tier === validatedFilter.tier);
    }

    if (validatedFilter.min_rating) {
      agents = agents.filter(agent => agent.average_rating >= validatedFilter.min_rating!);
    }

    if (validatedFilter.max_price) {
      agents = agents.filter(agent => {
        const prices = Object.values(agent.pricing_tiers).map(tier => tier.price);
        return prices.length === 0 || Math.min(...prices) <= validatedFilter.max_price!;
      });
    }

    if (validatedFilter.tags.length > 0) {
      agents = agents.filter(agent =>
        validatedFilter.tags.some(tag => agent.tags.includes(tag))
      );
    }

    if (validatedFilter.industries.length > 0) {
      agents = agents.filter(agent =>
        validatedFilter.industries.some(industry => agent.industries.includes(industry))
      );
    }

    if (validatedFilter.capabilities.length > 0) {
      agents = agents.filter(agent =>
        validatedFilter.capabilities.some(capability => agent.capabilities.includes(capability))
      );
    }

    if (validatedFilter.creator_id) {
      agents = agents.filter(agent => agent.creator_id === validatedFilter.creator_id);
    }

    if (validatedFilter.search_query) {
      const query = validatedFilter.search_query.toLowerCase();
      agents = agents.filter(agent =>
        agent.name.toLowerCase().includes(query) ||
        agent.description.toLowerCase().includes(query) ||
        agent.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Apply sorting
    agents.sort((a, b) => {
      let comparison = 0;
      
      switch (validatedFilter.sort_by) {
        case 'popularity':
          comparison = b.total_downloads - a.total_downloads;
          break;
        case 'rating':
          comparison = b.average_rating - a.average_rating;
          break;
        case 'price':
          const aPrice = Math.min(...Object.values(a.pricing_tiers).map(tier => tier.price), Infinity);
          const bPrice = Math.min(...Object.values(b.pricing_tiers).map(tier => tier.price), Infinity);
          comparison = aPrice - bPrice;
          break;
        case 'newest':
          comparison = b.created_at.getTime() - a.created_at.getTime();
          break;
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
      }

      return validatedFilter.sort_order === 'asc' ? comparison : -comparison;
    });

    return agents;
  }

  // ===== AGENT METADATA MANAGEMENT =====

  /**
   * Update agent statistics
   */
  async updateAgentStats(agentId: string, stats: Partial<Pick<AgentMetadata, 'total_downloads' | 'total_deployments' | 'active_deployments'>>): Promise<void> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    const updatedAgent = { ...agent, ...stats, updated_at: new Date() };
    this.agents.set(agentId, updatedAgent);
  }

  /**
   * Add tags to agent
   */
  async addAgentTags(agentId: string, tags: string[]): Promise<void> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    const uniqueTags = [...new Set([...agent.tags, ...tags])];
    await this.updateAgent(agentId, { tags: uniqueTags });
  }

  /**
   * Remove tags from agent
   */
  async removeAgentTags(agentId: string, tags: string[]): Promise<void> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    const filteredTags = agent.tags.filter(tag => !tags.includes(tag));
    await this.updateAgent(agentId, { tags: filteredTags });
  }

  /**
   * Update agent pricing
   */
  async updateAgentPricing(agentId: string, pricing: Record<string, PricingTier>): Promise<void> {
    // Validate pricing tiers
    const validatedPricing: Record<string, PricingTier> = {};
    for (const [tierName, tier] of Object.entries(pricing)) {
      validatedPricing[tierName] = PricingTierSchema.parse(tier);
    }

    await this.updateAgent(agentId, { pricing_tiers: validatedPricing });
  }

  // ===== REVIEWS AND RATINGS =====

  /**
   * Add review for an agent
   */
  async addReview(review: Omit<AgentReview, 'id' | 'created_at' | 'updated_at'>): Promise<AgentReview> {
    const newReview: AgentReview = {
      ...review,
      id: this.generateId(),
      created_at: new Date(),
      updated_at: new Date()
    };

    // Validate review
    const validatedReview = AgentReviewSchema.parse(newReview);

    // Store review
    if (!this.reviews.has(review.agent_id)) {
      this.reviews.set(review.agent_id, []);
    }
    this.reviews.get(review.agent_id)!.push(validatedReview);

    // Update agent rating
    await this.recalculateAgentRating(review.agent_id);

    return validatedReview;
  }

  /**
   * Get reviews for an agent
   */
  async getAgentReviews(agentId: string): Promise<AgentReview[]> {
    return this.reviews.get(agentId) || [];
  }

  /**
   * Recalculate agent rating based on reviews
   */
  private async recalculateAgentRating(agentId: string): Promise<void> {
    const reviews = this.reviews.get(agentId) || [];
    
    if (reviews.length === 0) {
      await this.updateAgent(agentId, { average_rating: 0, total_reviews: 0 });
      return;
    }

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;

    await this.updateAgent(agentId, { 
      average_rating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
      total_reviews: reviews.length 
    });
  }

  // ===== DOWNLOADS AND PURCHASES =====

  /**
   * Record agent download
   */
  async recordDownload(download: Omit<AgentDownload, 'id' | 'download_date'>): Promise<AgentDownload> {
    const newDownload: AgentDownload = {
      ...download,
      id: this.generateId(),
      download_date: new Date()
    };

    // Store download
    if (!this.downloads.has(download.agent_id)) {
      this.downloads.set(download.agent_id, []);
    }
    this.downloads.get(download.agent_id)!.push(newDownload);

    // Update agent download count
    const agent = this.agents.get(download.agent_id);
    if (agent) {
      await this.updateAgentStats(download.agent_id, {
        total_downloads: agent.total_downloads + 1
      });
    }

    return newDownload;
  }

  /**
   * Get download history for an agent
   */
  async getAgentDownloads(agentId: string): Promise<AgentDownload[]> {
    return this.downloads.get(agentId) || [];
  }

  /**
   * Get download history for a user
   */
  async getUserDownloads(userId: string): Promise<AgentDownload[]> {
    const allDownloads: AgentDownload[] = [];
    
    for (const downloads of this.downloads.values()) {
      allDownloads.push(...downloads.filter(download => download.user_id === userId));
    }

    return allDownloads.sort((a, b) => b.download_date.getTime() - a.download_date.getTime());
  }

  // ===== FAVORITES =====

  /**
   * Add agent to user favorites
   */
  async addToFavorites(userId: string, agentId: string): Promise<void> {
    if (!this.favorites.has(userId)) {
      this.favorites.set(userId, new Set());
    }
    this.favorites.get(userId)!.add(agentId);
  }

  /**
   * Remove agent from user favorites
   */
  async removeFromFavorites(userId: string, agentId: string): Promise<void> {
    const userFavorites = this.favorites.get(userId);
    if (userFavorites) {
      userFavorites.delete(agentId);
    }
  }

  /**
   * Get user's favorite agents
   */
  async getUserFavorites(userId: string): Promise<AgentMetadata[]> {
    const favoriteIds = this.favorites.get(userId) || new Set();
    const favorites: AgentMetadata[] = [];

    for (const agentId of favoriteIds) {
      const agent = this.agents.get(agentId);
      if (agent) {
        favorites.push(agent);
      }
    }

    return favorites;
  }

  /**
   * Check if agent is in user favorites
   */
  async isInFavorites(userId: string, agentId: string): Promise<boolean> {
    const userFavorites = this.favorites.get(userId);
    return userFavorites ? userFavorites.has(agentId) : false;
  }

  // ===== MARKETPLACE STATISTICS =====

  /**
   * Get marketplace statistics
   */
  async getMarketplaceStats(): Promise<MarketplaceStats> {
    const agents = Array.from(this.agents.values());
    
    const stats: MarketplaceStats = {
      total_agents: agents.length,
      published_agents: agents.filter(agent => agent.status === 'published').length,
      total_downloads: agents.reduce((sum, agent) => sum + agent.total_downloads, 0),
      total_revenue: 0, // Would be calculated from actual purchases
      active_creators: new Set(agents.map(agent => agent.creator_id)).size,
      categories: {} as Record<AgentCategory, number>,
      tiers: {} as Record<AgentTier, number>
    };

    // Calculate category distribution
    for (const category of Object.values(AgentCategorySchema.enum)) {
      stats.categories[category] = agents.filter(agent => agent.category === category).length;
    }

    // Calculate tier distribution
    for (const tier of Object.values(AgentTierSchema.enum)) {
      stats.tiers[tier] = agents.filter(agent => agent.tier === tier).length;
    }

    return stats;
  }

  // ===== UTILITY METHODS =====

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get featured agents
   */
  async getFeaturedAgents(limit: number = 6): Promise<AgentMetadata[]> {
    const agents = await this.getAgents({
      sort_by: 'rating',
      sort_order: 'desc'
    });

    return agents
      .filter(agent => agent.status === 'published' && agent.average_rating >= 4.0)
      .slice(0, limit);
  }

  /**
   * Get trending agents
   */
  async getTrendingAgents(limit: number = 6): Promise<AgentMetadata[]> {
    const agents = await this.getAgents({
      sort_by: 'popularity',
      sort_order: 'desc'
    });

    return agents
      .filter(agent => agent.status === 'published')
      .slice(0, limit);
  }

  /**
   * Get new agents
   */
  async getNewAgents(limit: number = 6): Promise<AgentMetadata[]> {
    const agents = await this.getAgents({
      sort_by: 'newest',
      sort_order: 'desc'
    });

    return agents
      .filter(agent => agent.status === 'published')
      .slice(0, limit);
  }

  /**
   * Search agents by text query
   */
  async searchAgents(query: string, limit: number = 20): Promise<AgentMetadata[]> {
    const agents = await this.getAgents({
      search_query: query,
      sort_by: 'popularity',
      sort_order: 'desc'
    });

    return agents.slice(0, limit);
  }
}

// Export singleton instance
export const agentMarketplaceService = new AgentMarketplaceService();
