import React, { useState, useCallback } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Alert, AlertDescription } from '../../ui/alert';
import { Loader2, Users, Target, AlertCircle, CheckCircle, Zap } from 'lucide-react';
import { NodeData } from "../../../types/workflow";
import { useUnifiedAIService } from '../../templates/ai-integration';

interface CrewAIConfig {
  crewId?: string;
  collaborationStrategy?: "hierarchical" | "democratic" | "swarm";
  maxConcurrentTasks?: number;
  agents?: Array<{
    id: string;
    name: string;
    role: {
      name: string;
      description: string;
      capabilities: Array<{
        name: string;
        description: string;
      }>;
      expertise_areas: string[];
    };
    model?: string;
    temperature?: number;
  }>;
  tasks?: Array<{
    id: string;
    description: string;
    priority?: number;
    dependencies?: string[];
  }>;
  goal?: string;
}

const CrewAINode: React.FC<NodeProps> = ({
  data,
  selected,
}) => {
  const nodeData = data as NodeData;
  const hasErrors = nodeData.validationErrors && nodeData.validationErrors.length > 0;

  // Extract CrewAI configuration
  const crewConfig = (nodeData.config as { crewConfig?: CrewAIConfig })?.crewConfig || {};
  const agentCount = crewConfig.agents?.length || 0;
  const taskCount = crewConfig.tasks?.length || 0;
  const strategy = crewConfig.collaborationStrategy || "hierarchical";

  // Unified AI Service integration
  const aiService = useUnifiedAIService({
    defaultProvider: 'gpt-4',
    enableRouting: true,
    enableCostOptimization: true,
    enableCaching: true,
    monitoringEnabled: true
  });

  const [isExecuting, setIsExecuting] = useState(false);

  // Get strategy icon
  const getStrategyIcon = (strategy: string) => {
    switch (strategy) {
      case "hierarchical": return <Users className="h-4 w-4" />;
      case "democratic": return <Target className="h-4 w-4" />;
      case "swarm": return <Zap className="h-4 w-4" />;
      default: return <Users className="h-4 w-4" />;
    }
  };

  // Handle CrewAI execution through unified service
  const handleExecute = useCallback(async () => {
    if (!crewConfig.goal) return;

    setIsExecuting(true);
    try {
      const crewPrompt = `Execute CrewAI collaboration with strategy: ${strategy}

Goal: ${crewConfig.goal}

Agents: ${agentCount} configured
Tasks: ${taskCount} configured

Please simulate the multi-agent collaboration and provide a comprehensive response.`;

      const response = await aiService.execute({
        prompt: crewPrompt,
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 2000
      });

      // Update node data with execution results
      if (!nodeData.config.crewConfig) {
        nodeData.config.crewConfig = {};
      }
      nodeData.config.crewConfig.lastExecution = {
        timestamp: new Date().toISOString(),
        response: response.content.substring(0, 500),
        cost: response.usage.cost,
        provider: response.provider
      };

    } catch (error) {
      console.error('CrewAI execution error:', error);
    } finally {
      setIsExecuting(false);
    }
  }, [crewConfig, strategy, agentCount, taskCount, aiService, nodeData.config]);

  return (
    <Card className={`w-80 ${selected ? 'ring-2 ring-purple-500' : ''}`}>
      <Handle type="target" position={Position.Top} className="w-3 h-3" />

      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2 text-sm">
          <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
            {getStrategyIcon(strategy)}
          </div>
          <span>{nodeData.label}</span>
          <Badge variant="secondary" className="text-xs">
            CrewAI
          </Badge>
        </CardTitle>
        <CardDescription className="text-xs">
          {nodeData.description}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Configuration Summary */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4 text-purple-500" />
            <div>
              <div className="font-medium">{agentCount}</div>
              <div className="text-xs text-muted-foreground">Agents</div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Target className="h-4 w-4 text-purple-500" />
            <div>
              <div className="font-medium">{taskCount}</div>
              <div className="text-xs text-muted-foreground">Tasks</div>
            </div>
          </div>
        </div>

        {/* Strategy Display */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Strategy</span>
          <Badge variant="outline" className="capitalize">
            {strategy}
          </Badge>
        </div>

        {/* Goal Display */}
        {crewConfig.goal && (
          <div className="space-y-2">
            <span className="text-sm font-medium">Goal</span>
            <div className="text-xs text-muted-foreground bg-purple-50 p-2 rounded max-h-16 overflow-hidden">
              {crewConfig.goal}
            </div>
          </div>
        )}

        {/* Execute Button */}
        <Button
          onClick={handleExecute}
          disabled={isExecuting || !crewConfig.goal}
          size="sm"
          className="w-full"
          variant="outline"
        >
          {isExecuting && <Loader2 className="h-3 w-3 mr-2 animate-spin" />}
          {isExecuting ? 'Executing...' : 'Execute Crew'}
        </Button>

        {/* Last Execution Results */}
        {nodeData.config.crewConfig?.lastExecution && (
          <div className="border-t pt-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium">Last Execution</span>
              <Badge variant="outline" className="text-xs">
                ${nodeData.config.crewConfig.lastExecution.cost?.toFixed(4)}
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground bg-gray-50 p-2 rounded max-h-20 overflow-hidden">
              {nodeData.config.crewConfig.lastExecution.response}
            </div>
            <div className="flex items-center justify-between mt-2 text-xs">
              <span className="flex items-center space-x-1">
                <CheckCircle className="h-3 w-3 text-green-500" />
                <span>Provider: {nodeData.config.crewConfig.lastExecution.provider}</span>
              </span>
            </div>
          </div>
        )}

        {/* Error Display */}
        {aiService.error && (
          <Alert variant="destructive" className="py-2">
            <AlertCircle className="h-3 w-3" />
            <AlertDescription className="text-xs">
              {aiService.error}
            </AlertDescription>
          </Alert>
        )}

        {/* Validation Errors */}
        {hasErrors && (
          <Alert variant="destructive" className="py-2">
            <AlertCircle className="h-3 w-3" />
            <AlertDescription className="text-xs">
              {nodeData.validationErrors?.[0]}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>

      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </Card>
  );
};

export default CrewAINode;
