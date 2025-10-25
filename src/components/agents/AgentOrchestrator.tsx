/**
 * Agent Orchestrator Component
 * 
 * Manages multi-agent workflow orchestration and coordination
 */

import React, { useState, useEffect, useCallback } from 'react';
import { mcpProtocolService, RegisteredAgent, MCPMessage } from '../../services/mcpProtocolService';
import { 
  CpuChipIcon, 
  PlayIcon, 
  StopIcon, 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';

interface AgentTask {
  id: string;
  name: string;
  description: string;
  assignedAgentId?: string;
  status: 'pending' | 'assigned' | 'running' | 'completed' | 'failed';
  requiredCapabilities: string[];
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
  error?: string;
  startTime?: Date;
  endTime?: Date;
}

interface WorkflowOrchestration {
  id: string;
  name: string;
  description: string;
  tasks: AgentTask[];
  status: 'draft' | 'running' | 'completed' | 'failed' | 'paused';
  startTime?: Date;
  endTime?: Date;
  totalDuration?: number;
}

interface AgentOrchestratorProps {
  workflowId?: string;
  onOrchestrationComplete?: (result: WorkflowOrchestration) => void;
  onTaskUpdate?: (task: AgentTask) => void;
}

export const AgentOrchestrator: React.FC<AgentOrchestratorProps> = ({
  workflowId,
  onOrchestrationComplete,
  onTaskUpdate
}) => {
  const [agents, setAgents] = useState<RegisteredAgent[]>([]);
  const [orchestration, setOrchestration] = useState<WorkflowOrchestration | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  // Load available agents
  useEffect(() => {
    const loadAgents = () => {
      const availableAgents = mcpProtocolService.getAgents();
      setAgents(availableAgents);
    };

    loadAgents();

    // Listen for agent updates
    const handleAgentRegistered = (agent: RegisteredAgent) => {
      setAgents(prev => [...prev, agent]);
      addLog(`Agent registered: ${agent.name} (${agent.id})`);
    };

    const handleAgentActivated = (agent: RegisteredAgent) => {
      setAgents(prev => prev.map(a => a.id === agent.id ? agent : a));
      addLog(`Agent activated: ${agent.name}`);
    };

    const handleAgentDeactivated = (agent: RegisteredAgent) => {
      setAgents(prev => prev.map(a => a.id === agent.id ? agent : a));
      addLog(`Agent deactivated: ${agent.name}`);
    };

    mcpProtocolService.on('agent:registered', handleAgentRegistered);
    mcpProtocolService.on('agent:activated', handleAgentActivated);
    mcpProtocolService.on('agent:deactivated', handleAgentDeactivated);

    return () => {
      mcpProtocolService.off('agent:registered', handleAgentRegistered);
      mcpProtocolService.off('agent:activated', handleAgentActivated);
      mcpProtocolService.off('agent:deactivated', handleAgentDeactivated);
    };
  }, []);

  // Add log entry
  const addLog = useCallback((message: string) => {
    const timestamp = new Date().toISOString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  }, []);

  // Create sample orchestration
  const createSampleOrchestration = useCallback(() => {
    const sampleOrchestration: WorkflowOrchestration = {
      id: `orchestration_${Date.now()}`,
      name: 'Multi-Agent Data Processing Pipeline',
      description: 'Coordinate multiple agents to process and analyze workflow data',
      status: 'draft',
      tasks: [
        {
          id: 'task_1',
          name: 'Data Collection',
          description: 'Collect and validate input data',
          status: 'pending',
          requiredCapabilities: ['data_collection', 'validation'],
          input: { source: 'workflow_data', format: 'json' }
        },
        {
          id: 'task_2',
          name: 'Data Processing',
          description: 'Process and transform collected data',
          status: 'pending',
          requiredCapabilities: ['data_processing', 'transformation'],
          input: { dependencies: ['task_1'] }
        },
        {
          id: 'task_3',
          name: 'Analysis',
          description: 'Analyze processed data for insights',
          status: 'pending',
          requiredCapabilities: ['analysis', 'insights'],
          input: { dependencies: ['task_2'] }
        },
        {
          id: 'task_4',
          name: 'Report Generation',
          description: 'Generate final report with recommendations',
          status: 'pending',
          requiredCapabilities: ['reporting', 'documentation'],
          input: { dependencies: ['task_3'], format: 'pdf' }
        }
      ]
    };

    setOrchestration(sampleOrchestration);
    addLog('Sample orchestration created');
  }, [addLog]);

  // Assign agents to tasks based on capabilities
  const assignAgentsToTasks = useCallback(async () => {
    if (!orchestration) return;

    const updatedTasks = orchestration.tasks.map(task => {
      if (task.status !== 'pending') return task;

      // Find suitable agent for this task
      const suitableAgent = agents.find(agent =>
        agent.status === 'ACTIVE' &&
        task.requiredCapabilities.every(capability =>
          agent.capabilities.some(cap => cap.name === capability)
        )
      );

      if (suitableAgent) {
        addLog(`Assigned task "${task.name}" to agent "${suitableAgent.name}"`);
        return { ...task, assignedAgentId: suitableAgent.id, status: 'assigned' as const };
      } else {
        addLog(`No suitable agent found for task "${task.name}"`);
        return task;
      }
    });

    setOrchestration(prev => prev ? { ...prev, tasks: updatedTasks } : null);
  }, [orchestration, agents, addLog]);

  // Execute a single task
  const executeTask = useCallback(async (task: AgentTask): Promise<AgentTask> => {
    if (!task.assignedAgentId) {
      throw new Error(`Task ${task.id} has no assigned agent`);
    }

    addLog(`Starting execution of task "${task.name}"`);

    const updatedTask: AgentTask = {
      ...task,
      status: 'running',
      startTime: new Date()
    };

    // Send MCP message to agent
    try {
      const message: Omit<MCPMessage, 'id' | 'timestamp'> = {
        type: 'request',
        method: 'execute_task',
        params: {
          task_id: task.id,
          task_name: task.name,
          task_description: task.description,
          input: task.input
        }
      };

      await mcpProtocolService.sendMessage(task.assignedAgentId, message);

      // Simulate task execution (in real implementation, this would be event-driven)
      await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));

      const completedTask: AgentTask = {
        ...updatedTask,
        status: 'completed',
        endTime: new Date(),
        output: {
          result: 'Task completed successfully',
          data: { processed: true, timestamp: new Date().toISOString() }
        }
      };

      addLog(`Task "${task.name}" completed successfully`);
      return completedTask;

    } catch (error) {
      const failedTask: AgentTask = {
        ...updatedTask,
        status: 'failed',
        endTime: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };

      addLog(`Task "${task.name}" failed: ${failedTask.error}`);
      return failedTask;
    }
  }, [addLog]);

  // Run orchestration
  const runOrchestration = useCallback(async () => {
    if (!orchestration || isRunning) return;

    setIsRunning(true);
    addLog('Starting orchestration execution');

    const startTime = new Date();
    setOrchestration(prev => prev ? { ...prev, status: 'running', startTime } : null);

    try {
      // Execute tasks in dependency order
      const taskQueue = [...orchestration.tasks];
      const completedTasks: AgentTask[] = [];

      while (taskQueue.length > 0) {
        // Find tasks that can be executed (no pending dependencies)
        const executableTasks = taskQueue.filter(task => {
          if (task.status !== 'assigned') return false;
          
          const dependencies = (task.input.dependencies as string[]) || [];
          return dependencies.every(depId =>
            completedTasks.some(completed => completed.id === depId && completed.status === 'completed')
          );
        });

        if (executableTasks.length === 0) {
          // No executable tasks - check if we're stuck
          const pendingTasks = taskQueue.filter(task => task.status === 'assigned');
          if (pendingTasks.length > 0) {
            throw new Error('Circular dependency or unresolvable dependencies detected');
          }
          break;
        }

        // Execute tasks in parallel
        const taskPromises = executableTasks.map(task => executeTask(task));
        const results = await Promise.allSettled(taskPromises);

        // Process results
        results.forEach((result, index) => {
          const task = executableTasks[index];
          const taskIndex = taskQueue.findIndex(t => t.id === task.id);
          
          if (result.status === 'fulfilled') {
            completedTasks.push(result.value);
            taskQueue.splice(taskIndex, 1);
            
            // Update orchestration
            setOrchestration(prev => {
              if (!prev) return null;
              const updatedTasks = prev.tasks.map(t => t.id === result.value.id ? result.value : t);
              return { ...prev, tasks: updatedTasks };
            });

            if (onTaskUpdate) {
              onTaskUpdate(result.value);
            }
          } else {
            // Task failed
            const failedTask: AgentTask = {
              ...task,
              status: 'failed',
              endTime: new Date(),
              error: result.reason instanceof Error ? result.reason.message : 'Unknown error'
            };
            
            completedTasks.push(failedTask);
            taskQueue.splice(taskIndex, 1);
            
            addLog(`Task "${task.name}" failed: ${failedTask.error}`);
          }
        });
      }

      // Check final status
      const allCompleted = completedTasks.every(task => task.status === 'completed');
      const endTime = new Date();
      const totalDuration = endTime.getTime() - startTime.getTime();

      const finalOrchestration: WorkflowOrchestration = {
        ...orchestration,
        status: allCompleted ? 'completed' : 'failed',
        endTime,
        totalDuration,
        tasks: completedTasks
      };

      setOrchestration(finalOrchestration);
      addLog(`Orchestration ${allCompleted ? 'completed' : 'failed'} in ${totalDuration}ms`);

      if (onOrchestrationComplete) {
        onOrchestrationComplete(finalOrchestration);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addLog(`Orchestration failed: ${errorMessage}`);
      
      setOrchestration(prev => prev ? {
        ...prev,
        status: 'failed',
        endTime: new Date()
      } : null);
    } finally {
      setIsRunning(false);
    }
  }, [orchestration, isRunning, executeTask, addLog, onOrchestrationComplete, onTaskUpdate]);

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE':
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'running':
        return <ClockIcon className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'UNHEALTHY':
      case 'failed':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
      case 'INACTIVE':
      case 'pending':
        return <StopIcon className="h-5 w-5 text-gray-400" />;
      default:
        return <Cog6ToothIcon className="h-5 w-5 text-gray-400" />;
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'running':
        return 'text-blue-600 bg-blue-100';
      case 'UNHEALTHY':
      case 'failed':
        return 'text-red-600 bg-red-100';
      case 'assigned':
        return 'text-yellow-600 bg-yellow-100';
      case 'INACTIVE':
      case 'pending':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="agent-orchestrator p-6 bg-white rounded-lg shadow-sm">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Agent Orchestrator</h2>
        <p className="text-gray-600">Coordinate multiple agents to execute complex workflows</p>
      </div>

      {/* Available Agents */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Agents ({agents.length})</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map(agent => (
            <div key={agent.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">{agent.name}</h4>
                <div className="flex items-center gap-2">
                  {getStatusIcon(agent.status)}
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(agent.status)}`}>
                    {agent.status}
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-3">{agent.description}</p>
              <div className="flex items-center gap-2 mb-2">
                <CpuChipIcon className="h-4 w-4 text-gray-400" />
                <span className="text-xs text-gray-500">{agent.type}</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {agent.capabilities.slice(0, 3).map(cap => (
                  <span key={cap.name} className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                    {cap.name}
                  </span>
                ))}
                {agent.capabilities.length > 3 && (
                  <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                    +{agent.capabilities.length - 3}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Orchestration Controls */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Workflow Orchestration</h3>
          <div className="flex gap-2">
            {!orchestration && (
              <button
                onClick={createSampleOrchestration}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Sample
              </button>
            )}
            {orchestration && orchestration.status === 'draft' && (
              <button
                onClick={assignAgentsToTasks}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
              >
                Assign Agents
              </button>
            )}
            {orchestration && orchestration.tasks.some(t => t.status === 'assigned') && (
              <button
                onClick={runOrchestration}
                disabled={isRunning}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                  isRunning 
                    ? 'bg-gray-400 text-white cursor-not-allowed' 
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                <PlayIcon className="h-4 w-4" />
                {isRunning ? 'Running...' : 'Run Orchestration'}
              </button>
            )}
          </div>
        </div>

        {orchestration && (
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="font-medium text-gray-900">{orchestration.name}</h4>
                <p className="text-sm text-gray-600">{orchestration.description}</p>
              </div>
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(orchestration.status)}`}>
                {orchestration.status}
              </span>
            </div>

            {/* Tasks */}
            <div className="space-y-3">
              {orchestration.tasks.map(task => (
                <div key={task.id} className="border border-gray-100 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-medium text-gray-900">{task.name}</h5>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(task.status)}
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(task.status)}`}>
                        {task.status}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                  {task.assignedAgentId && (
                    <p className="text-xs text-blue-600">
                      Assigned to: {agents.find(a => a.id === task.assignedAgentId)?.name || task.assignedAgentId}
                    </p>
                  )}
                  {task.error && (
                    <p className="text-xs text-red-600 mt-1">Error: {task.error}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Logs */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Orchestration Logs</h3>
        <div className="bg-gray-900 text-gray-100 rounded-lg p-4 h-64 overflow-y-auto font-mono text-sm">
          {logs.length === 0 ? (
            <p className="text-gray-400">No logs yet...</p>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="mb-1">
                {log}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AgentOrchestrator;
