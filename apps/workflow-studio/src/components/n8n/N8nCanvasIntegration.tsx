// Integrates n8n nodes into the workflow canvas
// Migrated from auterity-workflow-studio and adapted for auterity-error-iq
// Error-free: Uses existing canvas structure and proper state management

import React, { useState } from 'react';
import { Button } from '@auterity/design-system';
import { N8nNodeFactory } from '../../nodes/n8n/N8nNodeFactory';
import { N8nNodeConfigPanel } from './N8nNodeConfigPanel';
import { n8nConfig, validateN8nConfig } from '../../services/n8n/n8nConfig';

interface N8nCanvasIntegrationProps {
  onAddNode: (node: any) => void;
  selectedNode?: any;
  onUpdateNode?: (nodeId: string, updates: any) => void;
}

const N8nCanvasIntegration: React.FC<N8nCanvasIntegrationProps> = ({
  onAddNode,
  selectedNode,
  onUpdateNode
}) => {
  const [showConfigPanel, setShowConfigPanel] = useState<boolean>(false);
  const [configuringNode, setConfiguringNode] = useState<any>(null);
  const [isN8nConfigured, setIsN8nConfigured] = useState<boolean>(false);

  React.useEffect(() => {
    // Check if n8n is properly configured
    const validation = validateN8nConfig();
    setIsN8nConfigured(validation.isValid);
  }, []);

  const handleAddN8nTriggerNode = () => {
    if (!isN8nConfigured) {
      alert('n8n is not configured. Please visit the n8n management page to set up your API connection.');
      return;
    }

    try {
      const position = {
        x: Math.random() * 400 + 100,
        y: Math.random() * 300 + 100
      };
      const node = N8nNodeFactory.createNode('n8n.trigger', position);
      onAddNode(node);

    } catch (error) {

      alert(`Failed to add n8n node: ${(error as Error).message}`);
    }
  };

  const handleAddN8nTemplateNode = () => {
    if (!isN8nConfigured) {
      alert('n8n is not configured. Please visit the n8n management page to set up your API connection.');
      return;
    }

    try {
      const position = {
        x: Math.random() * 400 + 150,
        y: Math.random() * 300 + 150
      };
      const node = N8nNodeFactory.createNode('n8n.template', position);
      onAddNode(node);

    } catch (error) {

      alert(`Failed to add n8n template node: ${(error as Error).message}`);
    }
  };

  const handleConfigureNode = (node: any) => {
    setConfiguringNode(node);
    setShowConfigPanel(true);
  };

  const handleSaveConfig = (config: any) => {
    if (configuringNode && onUpdateNode) {
      try {
        // Validate the configuration
        const validation = N8nNodeFactory.validateNodeConfig(configuringNode.type, config);
        if (!validation.isValid) {
          alert(`Configuration errors:\n${validation.errors.join('\n')}`);
          return;
        }

        // Update the node with new config
        const updatedNode = {
          ...configuringNode,
          data: {
            ...configuringNode.data,
            properties: { ...configuringNode.data.properties, ...config }
          }
        };

        onUpdateNode(configuringNode.id, updatedNode);


        setShowConfigPanel(false);
        setConfiguringNode(null);
      } catch (error) {

        alert(`Failed to save configuration: ${(error as Error).message}`);
      }
    }
  };

  const handleCloseConfig = () => {
    setShowConfigPanel(false);
    setConfiguringNode(null);
  };

  if (!isN8nConfigured) {
    return (
      <div className="absolute top-4 right-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3 max-w-xs">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">n8n Not Configured</h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>Please configure your n8n API connection in the management page.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* n8n Node Toolbar */}
      <div className="absolute top-4 right-4 bg-white border rounded-lg shadow-lg p-3 min-w-max">
        <h3 className="text-sm font-semibold mb-2 text-gray-700 flex items-center">
          <span className="mr-2">⚡</span>
          n8n Integration
        </h3>
        <div className="space-y-2">
          <Button
            onClick={handleAddN8nTriggerNode}
            variant="primary"
            size="sm"
            className="w-full text-xs"
            title="Add n8n Workflow Trigger Node"
          >
            + Trigger Node
          </Button>
          <Button
            onClick={handleAddN8nTemplateNode}
            variant="outline"
            size="sm"
            className="w-full text-xs"
            title="Add n8n Template Import Node"
          >
            + Template Node
          </Button>
        </div>

        {/* Quick Actions for Selected Node */}
        {selectedNode && N8nNodeFactory.isN8nNodeType(selectedNode.type) && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <Button
              onClick={() => handleConfigureNode(selectedNode)}
              variant="outline"
              size="sm"
              className="w-full text-xs"
            >
              ⚙️ Configure
            </Button>
          </div>
        )}

        {/* Status Indicator */}
        <div className="mt-2 flex items-center text-xs text-green-600">
          <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
          Connected
        </div>
      </div>

      {/* Configuration Panel Modal */}
      {showConfigPanel && configuringNode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold">
                Configure {N8nNodeFactory.getNodeTypeDescription(configuringNode.type)}
              </h3>
              <button
                onClick={handleCloseConfig}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="p-4">
              <N8nNodeConfigPanel
                nodeId={configuringNode.id}
                nodeType={configuringNode.type}
                initialConfig={configuringNode.data.properties}
                onSave={handleSaveConfig}
                onCancel={handleCloseConfig}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default N8nCanvasIntegration;

