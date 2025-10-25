/**
 * Customer Template Generator
 *
 * Allows customers to create custom workflow templates using Vercel AI SDK patterns
 * Provides natural language input and visual customization
 */

import React, { useState, useEffect } from 'react';
import { useChat } from '@ai-sdk/react';
import { templateGenerator } from '../../services/templateGenerator';
import { unifiedAIService } from '../../services/unifiedAIService';

interface GeneratedTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  difficulty: string;
  estimatedTime: number;
  workflowSteps: any[];
  connections: any[];
  customizationOptions: any[];
  vercelTemplate: any;
}

interface TemplateGeneratorProps {
  onTemplateGenerated?: (template: GeneratedTemplate) => void;
  initialPrompt?: string;
  className?: string;
}

export const TemplateGenerator: React.FC<TemplateGeneratorProps> = ({
  onTemplateGenerated,
  initialPrompt = '',
  className = ''
}) => {
  const [description, setDescription] = useState(initialPrompt);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedTemplate, setGeneratedTemplate] = useState<GeneratedTemplate | null>(null);
  const [customizationValues, setCustomizationValues] = useState<Record<string, any>>({});
  const [selectedPattern, setSelectedPattern] = useState<string>('');

  // AI chat for template generation assistance
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/template-assistance',
    initialMessages: [
      {
        id: 'system',
        role: 'system',
        content: `You are an expert template generator using Vercel AI SDK patterns.
        Help users create custom workflow templates with AI capabilities.`
      },
      {
        id: 'welcome',
        role: 'assistant',
        content: `Hi! I can help you create custom workflow templates using Vercel AI SDK patterns.
        Describe what you want to build, and I'll generate a complete, deployable template for you.`
      }
    ]
  });

  // Available Vercel patterns
  const availablePatterns = templateGenerator.getAvailablePatterns();

  const handleGenerateTemplate = async () => {
    if (!description.trim()) return;

    setIsGenerating(true);
    try {
      const template = await templateGenerator.generateTemplateFromDescription(
        description,
        selectedPattern || 'custom'
      );

      setGeneratedTemplate(template);
      onTemplateGenerated?.(template);
    } catch (error) {
      console.error('Template generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCustomizationChange = (optionName: string, value: any) => {
    setCustomizationValues(prev => ({
      ...prev,
      [optionName]: value
    }));
  };

  const handleCreateCustomTemplate = async () => {
    if (!generatedTemplate) return;

    try {
      const customizedTemplate = await templateGenerator.createCustomizableTemplate(
        generatedTemplate,
        { customizationValues }
      );

      // Generate deployment package
      const deploymentPackage = await templateGenerator.generateDeploymentPackage(
        customizedTemplate
      );

      // Download or deploy the template
      downloadDeploymentPackage(deploymentPackage);
    } catch (error) {
      console.error('Custom template creation failed:', error);
    }
  };

  const downloadDeploymentPackage = (deploymentPackage: any) => {
    const blob = new Blob([deploymentPackage.code], { type: 'application/zip' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vercel-template-${generatedTemplate?.name || 'custom'}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`template-generator ${className}`}>
      <div className="generator-header">
        <h2>AI Template Generator</h2>
        <p>Create custom workflow templates using Vercel AI SDK patterns</p>
      </div>

      <div className="generator-content">
        {/* Pattern Selection */}
        <div className="pattern-selection">
          <h3>Choose AI Pattern</h3>
          <div className="pattern-grid">
            {availablePatterns.map(pattern => {
              const details = templateGenerator.getPatternDetails(pattern);
              return (
                <div
                  key={pattern}
                  className={`pattern-card ${selectedPattern === pattern ? 'selected' : ''}`}
                  onClick={() => setSelectedPattern(pattern)}
                >
                  <h4>{pattern.charAt(0).toUpperCase() + pattern.slice(1)}</h4>
                  <p>{details.description}</p>
                  <div className="pattern-components">
                    {details.components?.map((comp: string) => (
                      <span key={comp} className="component-tag">{comp}</span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Description Input */}
        <div className="description-input">
          <h3>Describe Your Template</h3>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the workflow template you want to create...
Example: Create a chatbot that answers customer questions using my company's documentation"
            rows={4}
          />

          <button
            onClick={handleGenerateTemplate}
            disabled={isGenerating || !description.trim()}
            className="generate-button"
          >
            {isGenerating ? 'Generating...' : 'Generate Template'}
          </button>
        </div>

        {/* AI Assistance Chat */}
        <div className="ai-assistance">
          <h3>AI Template Assistant</h3>
          <div className="chat-messages">
            {messages.map(message => (
              <div key={message.id} className={`message ${message.role}`}>
                <div className="message-content">
                  {message.content}
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="chat-input-form">
            <input
              type="text"
              value={input}
              onChange={handleInputChange}
              placeholder="Ask for help with your template..."
              disabled={isLoading}
            />
            <button type="submit" disabled={isLoading || !input.trim()}>
              Send
            </button>
          </form>
        </div>

        {/* Generated Template Display */}
        {generatedTemplate && (
          <div className="generated-template">
            <h3>Generated Template</h3>

            <div className="template-overview">
              <h4>{generatedTemplate.name}</h4>
              <p>{generatedTemplate.description}</p>
              <div className="template-meta">
                <span className="difficulty">{generatedTemplate.difficulty}</span>
                <span className="time">{generatedTemplate.estimatedTime}min setup</span>
              </div>
            </div>

            {/* Customization Options */}
            {generatedTemplate.customizationOptions.length > 0 && (
              <div className="customization-section">
                <h4>Customize Your Template</h4>
                <div className="customization-grid">
                  {generatedTemplate.customizationOptions.map(option => (
                    <div key={option.name} className="customization-option">
                      <label>{option.name}</label>
                      {option.type === 'text' && (
                        <input
                          type="text"
                          value={customizationValues[option.name] || option.default || ''}
                          onChange={(e) => handleCustomizationChange(option.name, e.target.value)}
                          placeholder={option.description}
                        />
                      )}
                      {option.type === 'select' && (
                        <select
                          value={customizationValues[option.name] || option.default || ''}
                          onChange={(e) => handleCustomizationChange(option.name, e.target.value)}
                        >
                          {option.options?.map((opt: string) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      )}
                      {option.type === 'boolean' && (
                        <input
                          type="checkbox"
                          checked={customizationValues[option.name] || option.default || false}
                          onChange={(e) => handleCustomizationChange(option.name, e.target.checked)}
                        />
                      )}
                      <small>{option.description}</small>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Workflow Preview */}
            <div className="workflow-preview">
              <h4>Workflow Preview</h4>
              <div className="workflow-canvas">
                {/* Render workflow steps and connections */}
                {generatedTemplate.workflowSteps.map(step => (
                  <div
                    key={step.id}
                    className={`workflow-step ${step.type}`}
                    style={{
                      left: step.position.x,
                      top: step.position.y
                    }}
                  >
                    <div className="step-header">{step.name}</div>
                    <div className="step-type">{step.type}</div>
                  </div>
                ))}

                {/* Render connections */}
                <svg className="connections-layer">
                  {generatedTemplate.connections.map(connection => {
                    const sourceStep = generatedTemplate.workflowSteps.find(
                      s => s.id === connection.source
                    );
                    const targetStep = generatedTemplate.workflowSteps.find(
                      s => s.id === connection.target
                    );

                    if (!sourceStep || !targetStep) return null;

                    return (
                      <line
                        key={connection.id}
                        x1={sourceStep.position.x + 100}
                        y1={sourceStep.position.y + 25}
                        x2={targetStep.position.x}
                        y2={targetStep.position.y + 25}
                        stroke="#3b82f6"
                        strokeWidth="2"
                      />
                    );
                  })}
                </svg>
              </div>
            </div>

            {/* Vercel Configuration Preview */}
            <div className="vercel-config">
              <h4>Vercel Deployment Configuration</h4>
              <div className="config-details">
                <div className="config-item">
                  <strong>Framework:</strong> {generatedTemplate.vercelTemplate.framework}
                </div>
                <div className="config-item">
                  <strong>AI Gateway:</strong> {generatedTemplate.vercelTemplate.deployment.aiGateway ? 'Enabled' : 'Disabled'}
                </div>
                <div className="config-item">
                  <strong>Edge Functions:</strong> {generatedTemplate.vercelTemplate.deployment.edgeFunctions ? 'Enabled' : 'Disabled'}
                </div>
                <div className="config-item">
                  <strong>Components:</strong> {generatedTemplate.vercelTemplate.components.length}
                </div>
                <div className="config-item">
                  <strong>API Routes:</strong> {generatedTemplate.vercelTemplate.apiRoutes.length}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="template-actions">
              <button
                onClick={handleCreateCustomTemplate}
                className="create-custom-button"
              >
                Create Custom Template
              </button>
              <button
                onClick={() => setGeneratedTemplate(null)}
                className="start-over-button"
              >
                Start Over
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Pattern card component for better UX
const PatternCard: React.FC<{
  pattern: string;
  details: any;
  isSelected: boolean;
  onSelect: () => void;
}> = ({ pattern, details, isSelected, onSelect }) => (
  <div
    className={`pattern-card ${isSelected ? 'selected' : ''}`}
    onClick={onSelect}
  >
    <div className="pattern-icon">
      {/* Add appropriate icons for each pattern */}
      {pattern === 'chatbot' && '💬'}
      {pattern === 'rag' && '📚'}
      {pattern === 'streaming' && '⚡'}
      {pattern === 'generative-ui' && '🎨'}
      {pattern === 'tools' && '🔧'}
    </div>
    <h4>{pattern.charAt(0).toUpperCase() + pattern.slice(1)}</h4>
    <p>{details.description}</p>
    <div className="pattern-features">
      {details.components?.slice(0, 3).map((comp: string) => (
        <span key={comp} className="feature-tag">{comp}</span>
      ))}
    </div>
  </div>
);

export default TemplateGenerator;
