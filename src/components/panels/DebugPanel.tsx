import React, { useState, useCallback, useMemo } from 'react';
import { useStudioStore } from '../../hooks/useStudioStore';
import {
  DebugPanelState,
  ExecutionStep,
  SimulationError,
  VariableInfo,
  VariableHistory,
  SimulationControls
} from '../../types/simulation';
import './DebugPanel.css';

interface DebugPanelProps {
  visible: boolean;
  onClose: () => void;
  onToggle: () => void;
  controls: SimulationControls;
  executionHistory: ExecutionStep[];
  errors: SimulationError[];
  variables: Map<string, VariableInfo>;
  variableHistory: VariableHistory[];
  currentStep: ExecutionStep | null;
}

export const DebugPanel: React.FC<DebugPanelProps> = ({
  visible,
  onClose,
  onToggle,
  controls,
  executionHistory,
  errors,
  variables,
  variableHistory,
  currentStep
}) => {
  const [activeTab, setActiveTab] = useState<'variables' | 'execution' | 'breakpoints' | 'performance'>('execution');
  const [variableFilter, setVariableFilter] = useState('');
  const [executionFilter, setExecutionFilter] = useState<'all' | 'errors' | 'breakpoints'>('all');

  const filteredVariables = useMemo(() => {
    return Array.from(variables.values()).filter(variable =>
      variable.name.toLowerCase().includes(variableFilter.toLowerCase())
    );
  }, [variables, variableFilter]);

  const filteredExecutionHistory = useMemo(() => {
    return executionHistory.filter(step => {
      switch (executionFilter) {
        case 'errors':
          return step.status === 'failed';
        case 'breakpoints':
          return step.status === 'pending'; // Could be enhanced to track breakpoint hits
        default:
          return true;
      }
    });
  }, [executionHistory, executionFilter]);

  if (!visible) {
    return (
      <div className="debug-panel collapsed">
        <button
          className="debug-toggle"
          onClick={onToggle}
          title="Open Debug Panel"
        >
          🐛
        </button>
      </div>
    );
  }

  return (
    <div className="debug-panel">
      {/* Header */}
      <div className="debug-header">
        <div className="debug-title">
          <span className="debug-icon">🐛</span>
          <span>Debug Panel</span>
        </div>
        <button
          className="debug-close"
          onClick={onClose}
          title="Close Debug Panel"
        >
          ✕
        </button>
      </div>

      {/* Simulation Controls */}
      <div className="debug-controls">
        <div className="control-buttons">
          <button
            className="control-btn play"
            onClick={controls.play}
            title="Run/Resume Simulation"
          >
            ▶️
          </button>
          <button
            className="control-btn pause"
            onClick={controls.pause}
            title="Pause Simulation"
          >
            ⏸️
          </button>
          <button
            className="control-btn stop"
            onClick={controls.stop}
            title="Stop Simulation"
          >
            ⏹️
          </button>
          <button
            className="control-btn step"
            onClick={controls.step}
            title="Step Through Execution"
          >
            ⏭️
          </button>
          <button
            className="control-btn reset"
            onClick={controls.reset}
            title="Reset Simulation"
          >
            🔄
          </button>
        </div>

        <div className="speed-control">
          <label>Speed:</label>
          <input
            type="range"
            min="0.1"
            max="5"
            step="0.1"
            defaultValue="1"
            onChange={(e) => controls.setSpeed(parseFloat(e.target.value))}
            title="Execution Speed"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="debug-tabs">
        <button
          className={`tab-btn ${activeTab === 'execution' ? 'active' : ''}`}
          onClick={() => setActiveTab('execution')}
        >
          Execution ({executionHistory.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'variables' ? 'active' : ''}`}
          onClick={() => setActiveTab('variables')}
        >
          Variables ({variables.size})
        </button>
        <button
          className={`tab-btn ${activeTab === 'breakpoints' ? 'active' : ''}`}
          onClick={() => setActiveTab('breakpoints')}
        >
          Breakpoints
        </button>
        <button
          className={`tab-btn ${activeTab === 'performance' ? 'active' : ''}`}
          onClick={() => setActiveTab('performance')}
        >
          Performance
        </button>
      </div>

      {/* Tab Content */}
      <div className="debug-content">
        {activeTab === 'execution' && (
          <ExecutionTab
            history={filteredExecutionHistory}
            errors={errors}
            currentStep={currentStep}
            filter={executionFilter}
            onFilterChange={setExecutionFilter}
          />
        )}

        {activeTab === 'variables' && (
          <VariablesTab
            variables={filteredVariables}
            history={variableHistory}
            filter={variableFilter}
            onFilterChange={setVariableFilter}
          />
        )}

        {activeTab === 'breakpoints' && (
          <BreakpointsTab controls={controls} />
        )}

        {activeTab === 'performance' && (
          <PerformanceTab history={executionHistory} />
        )}
      </div>
    </div>
  );
};

// Execution Tab Component
interface ExecutionTabProps {
  history: ExecutionStep[];
  errors: SimulationError[];
  currentStep: ExecutionStep | null;
  filter: 'all' | 'errors' | 'breakpoints';
  onFilterChange: (filter: 'all' | 'errors' | 'breakpoints') => void;
}

const ExecutionTab: React.FC<ExecutionTabProps> = ({
  history,
  errors,
  currentStep,
  filter,
  onFilterChange
}) => {
  return (
    <div className="execution-tab">
      {/* Filters */}
      <div className="execution-filters">
        <select
          value={filter}
          onChange={(e) => onFilterChange(e.target.value as any)}
          className="filter-select"
        >
          <option value="all">All Steps</option>
          <option value="errors">Errors Only</option>
          <option value="breakpoints">Breakpoint Hits</option>
        </select>
      </div>

      {/* Current Step */}
      {currentStep && (
        <div className="current-step">
          <h4>Current Step</h4>
          <div className="step-info">
            <div className="step-node">Node: {currentStep.nodeId}</div>
            <div className="step-status status-{currentStep.status}">
              {currentStep.status}
            </div>
            <div className="step-time">
              {currentStep.executionTime.toFixed(2)}ms
            </div>
          </div>
        </div>
      )}

      {/* Execution History */}
      <div className="execution-history">
        <h4>Execution History</h4>
        <div className="history-list">
          {history.map((step, index) => (
            <div
              key={step.id}
              className={`history-item ${currentStep?.id === step.id ? 'current' : ''}`}
            >
              <div className="step-header">
                <span className="step-number">{index + 1}</span>
                <span className="step-node-id">{step.nodeId}</span>
                <span className={`step-status status-${step.status}`}>
                  {step.status}
                </span>
                <span className="step-time">
                  {step.executionTime.toFixed(2)}ms
                </span>
              </div>

              {step.error && (
                <div className="step-error">
                  Error: {step.error}
                </div>
              )}

              <div className="step-data">
                <details>
                  <summary>Input/Output Data</summary>
                  <pre>{JSON.stringify({
                    input: step.inputData,
                    output: step.outputData
                  }, null, 2)}</pre>
                </details>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="execution-errors">
          <h4>Errors ({errors.length})</h4>
          <div className="error-list">
            {errors.map((error, index) => (
              <div key={index} className="error-item">
                <div className="error-node">Node: {error.nodeId}</div>
                <div className="error-message">{error.message}</div>
                <div className="error-time">
                  {new Date(error.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Variables Tab Component
interface VariablesTabProps {
  variables: VariableInfo[];
  history: VariableHistory[];
  filter: string;
  onFilterChange: (filter: string) => void;
}

const VariablesTab: React.FC<VariablesTabProps> = ({
  variables,
  history,
  filter,
  onFilterChange
}) => {
  return (
    <div className="variables-tab">
      {/* Search */}
      <div className="variables-search">
        <input
          type="text"
          placeholder="Search variables..."
          value={filter}
          onChange={(e) => onFilterChange(e.target.value)}
          className="variable-search-input"
        />
      </div>

      {/* Variables List */}
      <div className="variables-list">
        <h4>Variables ({variables.length})</h4>
        <div className="variable-items">
          {variables.map((variable) => (
            <div key={variable.name} className="variable-item">
              <div className="variable-header">
                <span className="variable-name">{variable.name}</span>
                <span className="variable-type">{variable.type}</span>
              </div>
              <div className="variable-value">
                <pre>{JSON.stringify(variable.value, null, 2)}</pre>
              </div>
              <div className="variable-meta">
                <span>Last modified: {new Date(variable.lastModified).toLocaleTimeString()}</span>
                <span>By: {variable.modifiedBy}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Variable History */}
      <div className="variable-history">
        <h4>Recent Changes</h4>
        <div className="history-items">
          {history.slice(-10).map((change, index) => (
            <div key={index} className="history-item">
              <div className="history-variable">{change.variableName}</div>
              <div className="history-change">
                <span className="old-value">{JSON.stringify(change.oldValue)}</span>
                <span className="arrow">→</span>
                <span className="new-value">{JSON.stringify(change.newValue)}</span>
              </div>
              <div className="history-time">
                {new Date(change.timestamp).toLocaleTimeString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Breakpoints Tab Component
interface BreakpointsTabProps {
  controls: SimulationControls;
}

const BreakpointsTab: React.FC<BreakpointsTabProps> = ({ controls }) => {
  const [breakpoints, setBreakpoints] = useState<string[]>([]);
  const [newBreakpoint, setNewBreakpoint] = useState('');

  const addBreakpoint = useCallback(() => {
    if (newBreakpoint.trim()) {
      setBreakpoints(prev => [...prev, newBreakpoint.trim()]);
      controls.toggleBreakpoint(newBreakpoint.trim());
      setNewBreakpoint('');
    }
  }, [newBreakpoint, controls]);

  const removeBreakpoint = useCallback((nodeId: string) => {
    setBreakpoints(prev => prev.filter(bp => bp !== nodeId));
    controls.toggleBreakpoint(nodeId);
  }, [controls]);

  return (
    <div className="breakpoints-tab">
      <div className="add-breakpoint">
        <input
          type="text"
          placeholder="Enter node ID for breakpoint"
          value={newBreakpoint}
          onChange={(e) => setNewBreakpoint(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && addBreakpoint()}
          className="breakpoint-input"
        />
        <button onClick={addBreakpoint} className="add-btn">
          Add Breakpoint
        </button>
      </div>

      <div className="breakpoints-list">
        <h4>Active Breakpoints ({breakpoints.length})</h4>
        <div className="breakpoint-items">
          {breakpoints.map((nodeId) => (
            <div key={nodeId} className="breakpoint-item">
              <span className="breakpoint-node">{nodeId}</span>
              <button
                onClick={() => removeBreakpoint(nodeId)}
                className="remove-btn"
                title="Remove breakpoint"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Performance Tab Component
interface PerformanceTabProps {
  history: ExecutionStep[];
}

const PerformanceTab: React.FC<PerformanceTabProps> = ({ history }) => {
  const stats = useMemo(() => {
    if (history.length === 0) return null;

    const totalTime = history.reduce((sum, step) => sum + step.executionTime, 0);
    const avgTime = totalTime / history.length;
    const maxTime = Math.max(...history.map(step => step.executionTime));
    const minTime = Math.min(...history.map(step => step.executionTime));

    const statusCounts = history.reduce((counts, step) => {
      counts[step.status] = (counts[step.status] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);

    return {
      totalSteps: history.length,
      totalTime,
      avgTime,
      maxTime,
      minTime,
      statusCounts
    };
  }, [history]);

  if (!stats) {
    return (
      <div className="performance-tab">
        <div className="no-data">No execution data available</div>
      </div>
    );
  }

  return (
    <div className="performance-tab">
      <div className="performance-summary">
        <h4>Execution Summary</h4>
        <div className="summary-grid">
          <div className="summary-item">
            <span className="label">Total Steps:</span>
            <span className="value">{stats.totalSteps}</span>
          </div>
          <div className="summary-item">
            <span className="label">Total Time:</span>
            <span className="value">{stats.totalTime.toFixed(2)}ms</span>
          </div>
          <div className="summary-item">
            <span className="label">Average Time:</span>
            <span className="value">{stats.avgTime.toFixed(2)}ms</span>
          </div>
          <div className="summary-item">
            <span className="label">Fastest:</span>
            <span className="value">{stats.minTime.toFixed(2)}ms</span>
          </div>
          <div className="summary-item">
            <span className="label">Slowest:</span>
            <span className="value">{stats.maxTime.toFixed(2)}ms</span>
          </div>
        </div>
      </div>

      <div className="performance-chart">
        <h4>Execution Timeline</h4>
        <div className="timeline">
          {history.map((step, index) => (
            <div
              key={step.id}
              className={`timeline-item status-${step.status}`}
              style={{
                width: `${(step.executionTime / stats.maxTime) * 100}%`,
                minWidth: '2px'
              }}
              title={`${step.nodeId}: ${step.executionTime.toFixed(2)}ms`}
            >
              <span className="timeline-label">{index + 1}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
