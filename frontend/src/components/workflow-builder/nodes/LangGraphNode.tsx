import React, { useState, useCallback } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Alert, AlertDescription } from '../../ui/alert';
import { Loader2, GitBranch, Timer, AlertCircle, CheckCircle, Workflow } from 'lucide-react';
import { NodeData } from "../../../types/workflow";
import { useUnifiedAIService } from '../../templates/ai-integration';

interface LangGraphConfig {
  workflowId?: string;
  decisionTimeout?: number;
  nodes?: Array<{
    id: string;
    type: string;
    config: Record<string, any>;
  }>;
  edges?: Array<{
    source: string;
    target: string;
    condition?: string;
  }>;
}

const LangGraphNode: React.FC<NodeProps> = ({
  data,
  selected,
}) => {
  const nodeData = data as NodeData;
  const hasErrors = nodeData.validationErrors && nodeData.validationErrors.length > 0;

  // Extract LangGraph configuration
  const workflowConfig = (nodeData.config as { workflowConfig?: LangGraphConfig })?.workflowConfig || {};
  const nodeCount = workflowConfig.nodes?.length || 0;
  const edgeCount = workflowConfig.edges?.length || 0;
  const decisionTimeout = workflowConfig.decisionTimeout || 60;

  // Get node type distribution for display
  const nodeTypes = workflowConfig.nodes?.reduce((acc, node) => {
    acc[node.type] = (acc[node.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  const topNodeType = Object.entries(nodeTypes).sort(([,a], [,b]) => b - a)[0];

  // Unified AI Service integration
  const aiService = useUnifiedAIService({
    defaultProvider: 'gpt-4',
    enableRouting: true,
    enableCostOptimization: true,
    enableCaching: true,
    monitoringEnabled: true
  });

  const [isExecuting, setIsExecuting] = useState(false);

  // Handle LangGraph execution through unified service
  const handleExecute = useCallback(async () => {
    if (nodeCount === 0) return;

    setIsExecuting(true);
    try {
      const workflowPrompt = `Execute LangGraph workflow orchestration:

Workflow Configuration:
- Nodes: ${nodeCount} configured
- Edges: ${edgeCount} connections
- Decision Timeout: ${decisionTimeout} seconds
- Primary Node Type: ${topNodeType ? topNodeType[0] : 'N/A'}

Node Types: ${Object.entries(nodeTypes).map(([type, count]) => `${type}(${count})`).join(', ')}

Please simulate the graph-based workflow execution and provide a comprehensive analysis of the orchestration process.`;

      const response = await aiService.execute({
        prompt: workflowPrompt,
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 2000
      });

      // Update node data with execution results
      if (!nodeData.config.workflowConfig) {
        nodeData.config.workflowConfig = {};
      }
      nodeData.config.workflowConfig.lastExecution = {
        timestamp: new Date().toISOString(),
        response: response.content.substring(0, 500),
        cost: response.usage.cost,
        provider: response.provider
      };

    } catch (error) {
      console.error('LangGraph execution error:', error);
    } finally {
      setIsExecuting(false);
    }
  }, [nodeCount, edgeCount, decisionTimeout, topNodeType, nodeTypes, aiService, nodeData.config]);

  return (
    <Card className={`w-80 ${selected ? 'ring-2 ring-blue-500' : ''}`}>
      <Handle type="target" position={Position.Top} className="w-3 h-3" />

      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2 text-sm">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
            <Workflow className="h-4 w-4" />
          </div>
          <span>{nodeData.label}</span>
          <Badge variant="secondary" className="text-xs">
            LangGraph
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
            <GitBranch className="h-4 w-4 text-blue-500" />
            <div>
              <div className="font-medium">{nodeCount}</div>
              <div className="text-xs text-muted-foreground">Nodes</div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Timer className="h-4 w-4 text-blue-500" />
            <div>
              <div className="font-medium">{decisionTimeout}s</div>
              <div className="text-xs text-muted-foreground">Timeout</div>
            </div>
          </div>
        </div>

        {/* Node Type Distribution */}
        {Object.keys(nodeTypes).length > 0 && (
          <div className="space-y-2">
            <span className="text-sm font-medium">Node Types</span>
            <div className="flex flex-wrap gap-2">
              {Object.entries(nodeTypes).slice(0, 3).map(([type, count]) => (
                <Badge key={type} variant="outline" className="text-xs">
                  {type}: {count}
                </Badge>
              ))}
              {Object.keys(nodeTypes).length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{Object.keys(nodeTypes).length - 3}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Execute Button */}
        <Button
          onClick={handleExecute}
          disabled={isExecuting || nodeCount === 0}
          size="sm"
          className="w-full"
          variant="outline"
        >
          {isExecuting && <Loader2 className="h-3 w-3 mr-2 animate-spin" />}
          {isExecuting ? 'Executing...' : 'Execute Workflow'}
        </Button>

        {/* Last Execution Results */}
        {nodeData.config.workflowConfig?.lastExecution && (
          <div className="border-t pt-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium">Last Execution</span>
              <Badge variant="outline" className="text-xs">
                ${nodeData.config.workflowConfig.lastExecution.cost?.toFixed(4)}
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground bg-gray-50 p-2 rounded max-h-20 overflow-hidden">
              {nodeData.config.workflowConfig.lastExecution.response}
            </div>
            <div className="flex items-center justify-between mt-2 text-xs">
              <span className="flex items-center space-x-1">
                <CheckCircle className="h-3 w-3 text-green-500" />
                <span>Provider: {nodeData.config.workflowConfig.lastExecution.provider}</span>
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

export default LangGraphNode;
