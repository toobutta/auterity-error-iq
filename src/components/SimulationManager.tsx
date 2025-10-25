import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useStudioStore } from '../hooks/useStudioStore';
import { DebugPanel } from './panels/DebugPanel';
import { WorkflowSimulationEngine, createSimulationEngine } from '../utils/simulationEngine';
import {
  SimulationControls,
  ExecutionStep,
  SimulationError,
  VariableInfo,
  VariableHistory,
  SimulationState
} from '../types/simulation';

interface SimulationManagerProps {
  className?: string;
}

export const SimulationManager: React.FC<SimulationManagerProps> = ({ className = '' }) => {
  const { state, actions } = useStudioStore();
  const { panels, nodes, connections } = state;

  // Simulation state
  const [simulationEngine, setSimulationEngine] = useState<WorkflowSimulationEngine | null>(null);
  const [executionHistory, setExecutionHistory] = useState<ExecutionStep[]>([]);
  const [errors, setErrors] = useState<SimulationError[]>([]);
  const [variables, setVariables] = useState<Map<string, VariableInfo>>(new Map());
  const [variableHistory, setVariableHistory] = useState<VariableHistory[]>([]);
  const [currentStep, setCurrentStep] = useState<ExecutionStep | null>(null);

  // Refs for cleanup
  const engineRef = useRef<WorkflowSimulationEngine | null>(null);

  // Initialize simulation engine when nodes/connections change
  useEffect(() => {
    if (nodes.size > 0) {
      const engine = createSimulationEngine(nodes, connections);
      setSimulationEngine(engine);
      engineRef.current = engine;
    }
  }, [nodes, connections]);

  // Simulation event handlers
  const handleSimulationStep = useCallback((step: ExecutionStep) => {
    setExecutionHistory(prev => [...prev, step]);
    setCurrentStep(step);

    // Update variables based on step
    if (step.outputData) {
      Object.entries(step.outputData).forEach(([key, value]) => {
        const variable: VariableInfo = {
          name: key,
          value,
          type: typeof value,
          lastModified: step.timestamp,
          modifiedBy: step.nodeId
        };
        setVariables(prev => new Map(prev.set(key, variable)));

        // Add to variable history
        setVariableHistory(prev => [...prev, {
          timestamp: step.timestamp,
          variableName: key,
          oldValue: variables.get(key)?.value,
          newValue: value,
          nodeId: step.nodeId
        }]);
      });
    }
  }, [variables]);

  const handleSimulationError = useCallback((error: SimulationError) => {
    setErrors(prev => [...prev, error]);
  }, []);

  // Simulation controls
  const controls: SimulationControls = {
    play: useCallback(async () => {
      if (!simulationEngine) return;

      try {
        await simulationEngine.execute(
          handleSimulationStep,
          (result) => {
            console.log('Simulation completed:', result);
          },
          handleSimulationError
        );
      } catch (error) {
        console.error('Simulation failed:', error);
      }
    }, [simulationEngine, handleSimulationStep, handleSimulationError]),

    pause: useCallback(() => {
      simulationEngine?.pause();
    }, [simulationEngine]),

    stop: useCallback(() => {
      simulationEngine?.stop();
    }, [simulationEngine]),

    step: useCallback(async () => {
      if (!simulationEngine) return;

      try {
        await simulationEngine.step(handleSimulationStep);
      } catch (error) {
        console.error('Step execution failed:', error);
      }
    }, [simulationEngine, handleSimulationStep]),

    reset: useCallback(() => {
      simulationEngine?.reset();
      setExecutionHistory([]);
      setErrors([]);
      setVariables(new Map());
      setVariableHistory([]);
      setCurrentStep(null);
    }, [simulationEngine]),

    setSpeed: useCallback((speed: number) => {
      // Implementation would adjust simulation speed
      console.log('Setting simulation speed:', speed);
    }, []),

    toggleBreakpoint: useCallback((nodeId: string) => {
      if (simulationEngine) {
        // Check if breakpoint exists
        const hasBreakpoint = Array.from(simulationEngine.getState().breakpoints).includes(nodeId);

        if (hasBreakpoint) {
          simulationEngine.removeBreakpoint(nodeId);
        } else {
          simulationEngine.addBreakpoint(nodeId);
        }
      }
    }, [simulationEngine]),

    addWatchVariable: useCallback((expression: string) => {
      if (simulationEngine) {
        simulationEngine.addWatchVariable(expression);
      }
    }, [simulationEngine])
  };

  // Toggle debug panel
  const handleToggleDebug = useCallback(() => {
    actions.togglePanel('debug');
  }, [actions]);

  const handleCloseDebug = useCallback(() => {
    actions.togglePanel('debug');
  }, [actions]);

  if (!panels.debug.visible) {
    return null;
  }

  return (
    <DebugPanel
      visible={panels.debug.visible}
      onClose={handleCloseDebug}
      onToggle={handleToggleDebug}
      controls={controls}
      executionHistory={executionHistory}
      errors={errors}
      variables={variables}
      variableHistory={variableHistory}
      currentStep={currentStep}
    />
  );
};
