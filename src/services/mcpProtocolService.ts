/**
 * MCP (Model Control Protocol) Service
 * 
 * Handles MCP server/client communication, agent registration and discovery,
 * MCP message handling, and agent lifecycle management.
 */

import { EventEmitter } from 'events';
import { z } from 'zod';

// MCP Protocol Schemas
const MCPMessageSchema = z.object({
  id: z.string(),
  type: z.enum(['request', 'response', 'notification', 'error']),
  method: z.string().optional(),
  params: z.record(z.unknown()).optional(),
  result: z.unknown().optional(),
  error: z.object({
    code: z.number(),
    message: z.string(),
    data: z.unknown().optional()
  }).optional(),
  timestamp: z.number()
});

const AgentCapabilitySchema = z.object({
  name: z.string(),
  description: z.string(),
  input_schema: z.record(z.unknown()),
  output_schema: z.record(z.unknown()),
  version: z.string().default('1.0.0')
});

const AgentRegistrationSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  type: z.enum(['MCP', 'OPENAI', 'CUSTOM', 'A2A']),
  capabilities: z.array(AgentCapabilitySchema),
  config: z.record(z.unknown()),
  health_url: z.string().optional(),
  metadata: z.record(z.unknown()).optional()
});

// Types
export type MCPMessage = z.infer<typeof MCPMessageSchema>;
export type AgentCapability = z.infer<typeof AgentCapabilitySchema>;
export type AgentRegistration = z.infer<typeof AgentRegistrationSchema>;

export interface MCPServer {
  id: string;
  name: string;
  description: string;
  config: Record<string, unknown>;
  status: 'ACTIVE' | 'INACTIVE' | 'UNHEALTHY' | 'MAINTENANCE';
  health_endpoint?: string;
  process_id?: string;
  last_health_check?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface RegisteredAgent {
  id: string;
  name: string;
  description: string;
  type: 'MCP' | 'OPENAI' | 'CUSTOM' | 'A2A';
  capabilities: AgentCapability[];
  config: Record<string, unknown>;
  status: 'ACTIVE' | 'INACTIVE' | 'UNHEALTHY' | 'MAINTENANCE';
  health_url?: string;
  mcp_server_id?: string;
  user_id: string;
  last_health_check?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface MCPConnection {
  id: string;
  server_id: string;
  client_id: string;
  status: 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED' | 'ERROR';
  last_ping?: Date;
  created_at: Date;
}

export class MCPProtocolService extends EventEmitter {
  private servers: Map<string, MCPServer> = new Map();
  private agents: Map<string, RegisteredAgent> = new Map();
  private connections: Map<string, MCPConnection> = new Map();
  private messageQueue: Map<string, MCPMessage[]> = new Map();
  private healthCheckInterval?: NodeJS.Timeout;
  
  constructor() {
    super();
    this.startHealthChecks();
  }

  // ===== MCP SERVER MANAGEMENT =====

  /**
   * Register a new MCP server
   */
  async registerServer(serverConfig: Omit<MCPServer, 'id' | 'created_at' | 'updated_at'>): Promise<MCPServer> {
    const server: MCPServer = {
      ...serverConfig,
      id: this.generateId(),
      created_at: new Date(),
      updated_at: new Date()
    };

    this.servers.set(server.id, server);
    this.emit('server:registered', server);

    // Start health monitoring if endpoint provided
    if (server.health_endpoint) {
      this.scheduleHealthCheck(server.id);
    }

    return server;
  }

  /**
   * Get all registered MCP servers
   */
  getServers(): MCPServer[] {
    return Array.from(this.servers.values());
  }

  /**
   * Get server by ID
   */
  getServer(serverId: string): MCPServer | undefined {
    return this.servers.get(serverId);
  }

  /**
   * Update server status
   */
  async updateServerStatus(serverId: string, status: MCPServer['status']): Promise<void> {
    const server = this.servers.get(serverId);
    if (!server) {
      throw new Error(`Server ${serverId} not found`);
    }

    server.status = status;
    server.updated_at = new Date();
    this.servers.set(serverId, server);
    this.emit('server:status_changed', { serverId, status });
  }

  // ===== AGENT REGISTRATION AND DISCOVERY =====

  /**
   * Register a new agent with the MCP system
   */
  async registerAgent(registration: AgentRegistration, userId: string): Promise<RegisteredAgent> {
    // Validate registration data
    const validatedRegistration = AgentRegistrationSchema.parse(registration);

    const agent: RegisteredAgent = {
      ...validatedRegistration,
      user_id: userId,
      status: 'INACTIVE',
      created_at: new Date(),
      updated_at: new Date()
    };

    this.agents.set(agent.id, agent);
    this.emit('agent:registered', agent);

    // Auto-activate if health URL provided
    if (agent.health_url) {
      await this.activateAgent(agent.id);
    }

    return agent;
  }

  /**
   * Discover agents by capability
   */
  discoverAgentsByCapability(capabilityName: string): RegisteredAgent[] {
    return Array.from(this.agents.values()).filter(agent =>
      agent.capabilities.some(cap => cap.name === capabilityName) &&
      agent.status === 'ACTIVE'
    );
  }

  /**
   * Discover agents by type
   */
  discoverAgentsByType(type: RegisteredAgent['type']): RegisteredAgent[] {
    return Array.from(this.agents.values()).filter(agent =>
      agent.type === type && agent.status === 'ACTIVE'
    );
  }

  /**
   * Get all registered agents
   */
  getAgents(): RegisteredAgent[] {
    return Array.from(this.agents.values());
  }

  /**
   * Get agent by ID
   */
  getAgent(agentId: string): RegisteredAgent | undefined {
    return this.agents.get(agentId);
  }

  // ===== AGENT LIFECYCLE MANAGEMENT =====

  /**
   * Activate an agent
   */
  async activateAgent(agentId: string): Promise<void> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    // Perform health check if URL provided
    if (agent.health_url) {
      const isHealthy = await this.checkAgentHealth(agentId);
      if (!isHealthy) {
        throw new Error(`Agent ${agentId} failed health check`);
      }
    }

    agent.status = 'ACTIVE';
    agent.updated_at = new Date();
    this.agents.set(agentId, agent);
    this.emit('agent:activated', agent);
  }

  /**
   * Deactivate an agent
   */
  async deactivateAgent(agentId: string): Promise<void> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    agent.status = 'INACTIVE';
    agent.updated_at = new Date();
    this.agents.set(agentId, agent);
    this.emit('agent:deactivated', agent);
  }

  /**
   * Remove an agent from the system
   */
  async unregisterAgent(agentId: string): Promise<void> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    // Deactivate first if active
    if (agent.status === 'ACTIVE') {
      await this.deactivateAgent(agentId);
    }

    this.agents.delete(agentId);
    this.emit('agent:unregistered', { agentId });
  }

  // ===== MCP MESSAGE HANDLING =====

  /**
   * Send MCP message to an agent
   */
  async sendMessage(targetAgentId: string, message: Omit<MCPMessage, 'id' | 'timestamp'>): Promise<string> {
    const agent = this.agents.get(targetAgentId);
    if (!agent) {
      throw new Error(`Agent ${targetAgentId} not found`);
    }

    if (agent.status !== 'ACTIVE') {
      throw new Error(`Agent ${targetAgentId} is not active`);
    }

    const mcpMessage: MCPMessage = {
      ...message,
      id: this.generateId(),
      timestamp: Date.now()
    };

    // Validate message
    const validatedMessage = MCPMessageSchema.parse(mcpMessage);

    // Queue message for delivery
    this.queueMessage(targetAgentId, validatedMessage);
    this.emit('message:sent', { targetAgentId, message: validatedMessage });

    return validatedMessage.id;
  }

  /**
   * Send broadcast message to all active agents with specific capability
   */
  async broadcastToCapability(capabilityName: string, message: Omit<MCPMessage, 'id' | 'timestamp'>): Promise<string[]> {
    const agents = this.discoverAgentsByCapability(capabilityName);
    const messageIds: string[] = [];

    for (const agent of agents) {
      try {
        const messageId = await this.sendMessage(agent.id, message);
        messageIds.push(messageId);
      } catch (error) {
        console.error(`Failed to send message to agent ${agent.id}:`, error);
      }
    }

    return messageIds;
  }

  /**
   * Handle incoming MCP message
   */
  async handleIncomingMessage(sourceAgentId: string, message: MCPMessage): Promise<void> {
    // Validate message
    const validatedMessage = MCPMessageSchema.parse(message);

    // Process based on message type
    switch (validatedMessage.type) {
      case 'request':
        await this.handleRequest(sourceAgentId, validatedMessage);
        break;
      case 'response':
        await this.handleResponse(sourceAgentId, validatedMessage);
        break;
      case 'notification':
        await this.handleNotification(sourceAgentId, validatedMessage);
        break;
      case 'error':
        await this.handleError(sourceAgentId, validatedMessage);
        break;
    }

    this.emit('message:received', { sourceAgentId, message: validatedMessage });
  }

  // ===== HEALTH MONITORING =====

  /**
   * Check health of a specific agent
   */
  async checkAgentHealth(agentId: string): Promise<boolean> {
    const agent = this.agents.get(agentId);
    if (!agent || !agent.health_url) {
      return false;
    }

    try {
      const response = await fetch(agent.health_url, {
        method: 'GET',
        timeout: 5000
      });

      const isHealthy = response.ok;
      agent.last_health_check = new Date();
      
      if (!isHealthy && agent.status === 'ACTIVE') {
        agent.status = 'UNHEALTHY';
        this.emit('agent:unhealthy', agent);
      }

      return isHealthy;
    } catch (error) {
      console.error(`Health check failed for agent ${agentId}:`, error);
      
      if (agent.status === 'ACTIVE') {
        agent.status = 'UNHEALTHY';
        this.emit('agent:unhealthy', agent);
      }
      
      return false;
    }
  }

  /**
   * Start periodic health checks
   */
  private startHealthChecks(): void {
    this.healthCheckInterval = setInterval(async () => {
      const activeAgents = Array.from(this.agents.values()).filter(
        agent => agent.status === 'ACTIVE' && agent.health_url
      );

      for (const agent of activeAgents) {
        await this.checkAgentHealth(agent.id);
      }
    }, 30000); // Check every 30 seconds
  }

  /**
   * Schedule health check for a specific server
   */
  private scheduleHealthCheck(serverId: string): void {
    // Implementation for server health checks
    // Similar to agent health checks but for servers
  }

  // ===== UTILITY METHODS =====

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `mcp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Queue message for delivery
   */
  private queueMessage(agentId: string, message: MCPMessage): void {
    if (!this.messageQueue.has(agentId)) {
      this.messageQueue.set(agentId, []);
    }
    this.messageQueue.get(agentId)!.push(message);
  }

  /**
   * Get queued messages for an agent
   */
  getQueuedMessages(agentId: string): MCPMessage[] {
    return this.messageQueue.get(agentId) || [];
  }

  /**
   * Clear message queue for an agent
   */
  clearMessageQueue(agentId: string): void {
    this.messageQueue.delete(agentId);
  }

  // ===== MESSAGE HANDLERS =====

  private async handleRequest(sourceAgentId: string, message: MCPMessage): Promise<void> {
    // Handle MCP request messages
    this.emit('request:received', { sourceAgentId, message });
  }

  private async handleResponse(sourceAgentId: string, message: MCPMessage): Promise<void> {
    // Handle MCP response messages
    this.emit('response:received', { sourceAgentId, message });
  }

  private async handleNotification(sourceAgentId: string, message: MCPMessage): Promise<void> {
    // Handle MCP notification messages
    this.emit('notification:received', { sourceAgentId, message });
  }

  private async handleError(sourceAgentId: string, message: MCPMessage): Promise<void> {
    // Handle MCP error messages
    this.emit('error:received', { sourceAgentId, message });
  }

  // ===== CLEANUP =====

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    this.removeAllListeners();
    this.servers.clear();
    this.agents.clear();
    this.connections.clear();
    this.messageQueue.clear();
  }
}

// Export singleton instance
export const mcpProtocolService = new MCPProtocolService();
