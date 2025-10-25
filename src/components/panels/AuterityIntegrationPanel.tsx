import React, { useState, useEffect } from 'react';
import { auterityIntegration, WorkflowExecutionResult, AIModelSuggestion } from '../services/auterityIntegration.js';
import { useStudioStore } from '../hooks/useStudioStore.js';
import './AuterityIntegrationPanel.css';

interface AuterityIntegrationPanelProps {
  className?: string;
}

export const AuterityIntegrationPanel: React.FC<AuterityIntegrationPanelProps> = ({ className }) => {
  const { state } = useStudioStore();
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<WorkflowExecutionResult | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<AIModelSuggestion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [templates, setTemplates] = useState<any[]>([]);

  // Convert studio state to workflow format
  const currentWorkflow = {
    id: 'current-workflow',
    name: 'Current Workflow',
    nodes: Array.from(state.nodes.values()),
    edges: Array.from(state.connections.values()).map((conn: any) => ({
      id: conn.id,
      source: conn.from,
      target: conn.to,
      type: 'default'
    }))
  };

  useEffect(() => {
    // Load available templates on mount
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const availableTemplates = await auterityIntegration.getWorkflowTemplates();
      setTemplates(availableTemplates);
    } catch (err) {
      setError('Failed to load workflow templates');
    }
  };

  const handleExecuteWorkflow = async () => {
    setIsExecuting(true);
    setError(null);

    try {
      const result = await auterityIntegration.executeWorkflow(currentWorkflow);
      setExecutionResult(result);

      // Get AI suggestions after execution
      const suggestions = await auterityIntegration.getAISuggestions(currentWorkflow);
      setAiSuggestions(suggestions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Execution failed');
    } finally {
      setIsExecuting(false);
    }
  };

  const handleGetAISuggestions = async () => {
    try {
      const suggestions = await auterityIntegration.getAISuggestions(currentWorkflow);
      setAiSuggestions(suggestions);
    } catch (err) {
      setError('Failed to get AI suggestions');
    }
  };

  return (
    <div className={`auterity-integration-panel ${className || ''}`}>
      <div className="panel-header">
        <h3>Auterity Integration</h3>
        <p>Execute workflows and get AI-powered optimization suggestions</p>
      </div>

      <div className="panel-actions">
        <button
          onClick={handleExecuteWorkflow}
          disabled={isExecuting || currentWorkflow.nodes.length === 0}
          className="execute-btn"
        >
          {isExecuting ? 'Executing...' : 'Execute Workflow'}
        </button>

        <button
          onClick={handleGetAISuggestions}
          disabled={currentWorkflow.nodes.length === 0}
          className="suggestions-btn"
        >
          Get AI Suggestions
        </button>
      </div>

      {executionResult && (
        <div className="execution-result">
          <h4>Execution Result</h4>
          <div className="result-details">
            <p><strong>Status:</strong> {executionResult.status}</p>
            <p><strong>Execution ID:</strong> {executionResult.executionId}</p>
            {executionResult.metrics && (
              <p><strong>Execution Time:</strong> {executionResult.metrics.executionTime}ms</p>
            )}
            {executionResult.result && (
              <pre>{JSON.stringify(executionResult.result, null, 2)}</pre>
            )}
          </div>
        </div>
      )}

      {aiSuggestions.length > 0 && (
        <div className="ai-suggestions">
          <h4>AI Optimization Suggestions</h4>
          {aiSuggestions.map((suggestion, index) => (
            <div key={index} className="suggestion-item">
              <h5>Node: {suggestion.nodeId}</h5>
              {suggestion.suggestions.map((sugg: any, i: number) => (
                <div key={i} className="suggestion-detail">
                  <p><strong>Type:</strong> {sugg.type}</p>
                  <p><strong>Confidence:</strong> {(sugg.confidence * 100).toFixed(1)}%</p>
                  <p><strong>Reasoning:</strong> {sugg.reasoning}</p>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {templates.length > 0 && (
        <div className="workflow-templates">
          <h4>Available Templates</h4>
          <div className="template-list">
            {templates.map((template, index) => (
              <div key={index} className="template-item">
                <h5>{template.name}</h5>
                <p>{template.description}</p>
                <button className="template-btn">
                  Load Template
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="error-message">
          <p>Error: {error}</p>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}
    </div>
  );
};
