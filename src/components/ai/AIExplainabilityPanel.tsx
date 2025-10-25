/**
 * AI Explainability Panel
 * Provides transparency and interpretability for AI model decisions
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  LightBulbIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  CpuChipIcon,
  ChartBarIcon,
  EyeIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

interface AIExplanation {
  id: string;
  modelName: string;
  input: any;
  output: any;
  confidence: number;
  explanation: {
    featureImportance: Array<{ feature: string; importance: number; contribution: number }>;
    decisionPath: Array<{ step: string; reasoning: string; confidence: number }>;
    counterfactuals: Array<{ scenario: string; outcome: any; probability: number }>;
    similarCases: Array<{ case: any; similarity: number; outcome: any }>;
  };
  metadata: {
    modelVersion: string;
    trainingDataSize: number;
    lastTrained: string;
    framework: string;
    latency: number;
    cost: number;
  };
  timestamp: string;
}

interface AIExplainabilityPanelProps {
  explanation: AIExplanation | null;
  onFeatureClick?: (feature: string) => void;
  onCounterfactualClick?: (counterfactual: any) => void;
  onSimilarCaseClick?: (caseData: any) => void;
  showAdvanced?: boolean;
  className?: string;
}

export const AIExplainabilityPanel: React.FC<AIExplainabilityPanelProps> = ({
  explanation,
  onFeatureClick,
  onCounterfactualClick,
  onSimilarCaseClick,
  showAdvanced = false,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'features' | 'decision' | 'counterfactuals' | 'similar'>('overview');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['overview']));

  // Confidence level categorization
  const getConfidenceLevel = (confidence: number) => {
    if (confidence >= 0.9) return { level: 'high', color: '#10b981', icon: CheckCircleIcon };
    if (confidence >= 0.7) return { level: 'medium', color: '#f59e0b', icon: ExclamationTriangleIcon };
    return { level: 'low', color: '#ef4444', icon: ExclamationTriangleIcon };
  };

  // Feature importance visualization
  const FeatureImportanceChart: React.FC<{
    features: Array<{ feature: string; importance: number; contribution: number }>
  }> = ({ features }) => {
    const maxImportance = Math.max(...features.map(f => Math.abs(f.importance)));
    const sortedFeatures = [...features].sort((a, b) => Math.abs(b.importance) - Math.abs(a.importance));

    return (
      <div className="feature-importance-chart">
        {sortedFeatures.slice(0, 10).map((feature, index) => {
          const percentage = (Math.abs(feature.importance) / maxImportance) * 100;
          const isPositive = feature.contribution > 0;

          return (
            <div key={feature.feature} className="feature-bar">
              <div className="feature-label">
                <button
                  className="feature-name"
                  onClick={() => onFeatureClick?.(feature.feature)}
                  title={`Click to explore ${feature.feature}`}
                >
                  {feature.feature}
                </button>
                <span className="feature-value">
                  {feature.contribution > 0 ? '+' : ''}{feature.contribution.toFixed(3)}
                </span>
              </div>
              <div className="feature-bar-container">
                <div
                  className={`feature-bar-fill ${isPositive ? 'positive' : 'negative'}`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Decision path visualization
  const DecisionPath: React.FC<{
    path: Array<{ step: string; reasoning: string; confidence: number }>
  }> = ({ path }) => {
    return (
      <div className="decision-path">
        {path.map((step, index) => {
          const confidenceInfo = getConfidenceLevel(step.confidence);
          const ConfidenceIcon = confidenceInfo.icon;

          return (
            <div key={index} className="decision-step">
              <div className="step-header">
                <div className="step-number">{index + 1}</div>
                <div className="step-title">{step.step}</div>
                <div
                  className="step-confidence"
                  style={{ color: confidenceInfo.color }}
                >
                  <ConfidenceIcon className="confidence-icon" />
                  {(step.confidence * 100).toFixed(0)}%
                </div>
              </div>
              <div className="step-reasoning">{step.reasoning}</div>
              {index < path.length - 1 && <div className="step-connector">↓</div>}
            </div>
          );
        })}
      </div>
    );
  };

  // Counterfactual scenarios
  const CounterfactualScenarios: React.FC<{
    counterfactuals: Array<{ scenario: string; outcome: any; probability: number }>
  }> = ({ counterfactuals }) => {
    return (
      <div className="counterfactuals">
        {counterfactuals.map((cf, index) => (
          <div key={index} className="counterfactual-card">
            <div className="counterfactual-header">
              <h4>What if...</h4>
              <span className="probability">
                {(cf.probability * 100).toFixed(1)}% chance
              </span>
            </div>
            <div className="counterfactual-scenario">{cf.scenario}</div>
            <div className="counterfactual-outcome">
              <strong>Outcome:</strong> {JSON.stringify(cf.outcome, null, 2)}
            </div>
            <button
              className="counterfactual-explore"
              onClick={() => onCounterfactualClick?.(cf)}
            >
              Explore This Scenario
            </button>
          </div>
        ))}
      </div>
    );
  };

  // Similar cases
  const SimilarCases: React.FC<{
    cases: Array<{ case: any; similarity: number; outcome: any }>
  }> = ({ cases }) => {
    return (
      <div className="similar-cases">
        {cases.map((caseData, index) => (
          <div key={index} className="similar-case-card">
            <div className="case-header">
              <div className="similarity-score">
                {(caseData.similarity * 100).toFixed(0)}% similar
              </div>
              <div className="case-outcome">
                Outcome: {JSON.stringify(caseData.outcome)}
              </div>
            </div>
            <div className="case-details">
              <pre>{JSON.stringify(caseData.case, null, 2)}</pre>
            </div>
            <button
              className="case-explore"
              onClick={() => onSimilarCaseClick?.(caseData)}
            >
              View Similar Case
            </button>
          </div>
        ))}
      </div>
    );
  };

  // Expand/collapse section
  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  // Model reliability assessment
  const modelReliability = useMemo(() => {
    if (!explanation) return null;

    const factors = {
      confidence: explanation.confidence,
      dataFreshness: Date.now() - new Date(explanation.metadata.lastTrained).getTime(),
      dataSize: explanation.metadata.trainingDataSize,
      latency: explanation.metadata.latency
    };

    let score = 0;
    let concerns: string[] = [];

    // Confidence factor
    if (factors.confidence >= 0.8) score += 30;
    else if (factors.confidence >= 0.6) score += 20;
    else score += 10;

    // Data freshness factor (prefer data trained within 30 days)
    const daysSinceTraining = factors.dataFreshness / (1000 * 60 * 60 * 24);
    if (daysSinceTraining <= 30) score += 25;
    else if (daysSinceTraining <= 90) score += 15;
    else {
      score += 5;
      concerns.push('Model may be outdated');
    }

    // Data size factor
    if (factors.dataSize >= 100000) score += 25;
    else if (factors.dataSize >= 10000) score += 15;
    else {
      score += 5;
      concerns.push('Limited training data');
    }

    // Latency factor
    if (factors.latency <= 100) score += 20;
    else if (factors.latency <= 500) score += 15;
    else {
      score += 5;
      concerns.push('High latency detected');
    }

    return {
      score: Math.min(score, 100),
      level: score >= 80 ? 'high' : score >= 60 ? 'medium' : 'low',
      concerns
    };
  }, [explanation]);

  if (!explanation) {
    return (
      <div className={`ai-explainability-panel ${className}`}>
        <div className="no-explanation">
          <InformationCircleIcon className="no-explanation-icon" />
          <h3>No AI Explanation Available</h3>
          <p>This decision was not made by an AI model or explanation data is unavailable.</p>
        </div>
      </div>
    );
  }

  const confidenceInfo = getConfidenceLevel(explanation.confidence);

  return (
    <div className={`ai-explainability-panel ${className}`}>
      {/* Header */}
      <div className="explanation-header">
        <div className="header-content">
          <div className="model-info">
            <h3>AI Decision Explanation</h3>
            <div className="model-details">
              <span className="model-name">{explanation.modelName}</span>
              <span className="model-version">v{explanation.metadata.modelVersion}</span>
              <span className="framework">{explanation.metadata.framework}</span>
            </div>
          </div>

          <div className="confidence-indicator">
            <div
              className={`confidence-badge confidence-${confidenceInfo.level}`}
              style={{ backgroundColor: confidenceInfo.color }}
            >
              <confidenceInfo.icon className="confidence-icon" />
              <span>{(explanation.confidence * 100).toFixed(1)}% Confident</span>
            </div>
          </div>
        </div>

        {modelReliability && (
          <div className="reliability-indicator">
            <div className="reliability-score">
              <span>Reliability: </span>
              <span className={`reliability-value reliability-${modelReliability.level}`}>
                {modelReliability.score}/100
              </span>
            </div>
            {modelReliability.concerns.length > 0 && (
              <div className="reliability-concerns">
                {modelReliability.concerns.map((concern, index) => (
                  <span key={index} className="concern-tag">{concern}</span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="explanation-tabs">
        {[
          { id: 'overview', label: 'Overview', icon: EyeIcon },
          { id: 'features', label: 'Key Factors', icon: ChartBarIcon },
          { id: 'decision', label: 'Decision Path', icon: LightBulbIcon },
          { id: 'counterfactuals', label: 'What If?', icon: CpuChipIcon },
          { id: 'similar', label: 'Similar Cases', icon: InformationCircleIcon }
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={`tab-button ${activeTab === id ? 'active' : ''}`}
            onClick={() => setActiveTab(id as any)}
          >
            <Icon className="tab-icon" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="explanation-content">
        {activeTab === 'overview' && (
          <div className="overview-section">
            <div className="section-header">
              <h4>Decision Summary</h4>
              <button
                className="expand-toggle"
                onClick={() => toggleSection('overview')}
              >
                {expandedSections.has('overview') ? 'Collapse' : 'Expand'}
              </button>
            </div>

            {expandedSections.has('overview') && (
              <div className="overview-content">
                <div className="input-output">
                  <div className="data-section">
                    <h5>Input Data</h5>
                    <pre>{JSON.stringify(explanation.input, null, 2)}</pre>
                  </div>
                  <div className="data-section">
                    <h5>Model Output</h5>
                    <pre>{JSON.stringify(explanation.output, null, 2)}</pre>
                  </div>
                </div>

                <div className="metadata-grid">
                  <div className="metadata-item">
                    <ClockIcon className="metadata-icon" />
                    <div>
                      <div className="metadata-label">Processing Time</div>
                      <div className="metadata-value">{explanation.metadata.latency}ms</div>
                    </div>
                  </div>
                  <div className="metadata-item">
                    <ChartBarIcon className="metadata-icon" />
                    <div>
                      <div className="metadata-label">Training Data Size</div>
                      <div className="metadata-value">{explanation.metadata.trainingDataSize.toLocaleString()}</div>
                    </div>
                  </div>
                  <div className="metadata-item">
                    <CpuChipIcon className="metadata-icon" />
                    <div>
                      <div className="metadata-label">Cost</div>
                      <div className="metadata-value">${explanation.metadata.cost.toFixed(4)}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'features' && (
          <div className="features-section">
            <div className="section-header">
              <h4>Key Factors Influencing Decision</h4>
              <button
                className="expand-toggle"
                onClick={() => toggleSection('features')}
              >
                {expandedSections.has('features') ? 'Collapse' : 'Expand'}
              </button>
            </div>

            {expandedSections.has('features') && (
              <FeatureImportanceChart features={explanation.explanation.featureImportance} />
            )}
          </div>
        )}

        {activeTab === 'decision' && (
          <div className="decision-section">
            <div className="section-header">
              <h4>Decision-Making Process</h4>
              <button
                className="expand-toggle"
                onClick={() => toggleSection('decision')}
              >
                {expandedSections.has('decision') ? 'Collapse' : 'Expand'}
              </button>
            </div>

            {expandedSections.has('decision') && (
              <DecisionPath path={explanation.explanation.decisionPath} />
            )}
          </div>
        )}

        {activeTab === 'counterfactuals' && (
          <div className="counterfactuals-section">
            <div className="section-header">
              <h4>Alternative Scenarios</h4>
              <button
                className="expand-toggle"
                onClick={() => toggleSection('counterfactuals')}
              >
                {expandedSections.has('counterfactuals') ? 'Collapse' : 'Expand'}
              </button>
            </div>

            {expandedSections.has('counterfactuals') && (
              <CounterfactualScenarios counterfactuals={explanation.explanation.counterfactuals} />
            )}
          </div>
        )}

        {activeTab === 'similar' && (
          <div className="similar-section">
            <div className="section-header">
              <h4>Similar Historical Cases</h4>
              <button
                className="expand-toggle"
                onClick={() => toggleSection('similar')}
              >
                {expandedSections.has('similar') ? 'Collapse' : 'Expand'}
              </button>
            </div>

            {expandedSections.has('similar') && (
              <SimilarCases cases={explanation.explanation.similarCases} />
            )}
          </div>
        )}
      </div>

      {showAdvanced && (
        <div className="advanced-section">
          <h4>Advanced Technical Details</h4>
          <div className="technical-details">
            <div className="detail-item">
              <strong>Model Architecture:</strong> {explanation.metadata.framework}
            </div>
            <div className="detail-item">
              <strong>Training Date:</strong> {new Date(explanation.metadata.lastTrained).toLocaleDateString()}
            </div>
            <div className="detail-item">
              <strong>Feature Count:</strong> {explanation.explanation.featureImportance.length}
            </div>
            <div className="detail-item">
              <strong>Decision Steps:</strong> {explanation.explanation.decisionPath.length}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIExplainabilityPanel;
