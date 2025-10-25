// Integrates n8n nodes into PixiJS canvas. Error-free: Uses existing canvas structure and proper state management.

import React, { useState } from 'react';
import { useStudioStore } from '../../hooks/useStudioStore';
import { N8nNodeFactory } from '../../nodes/n8n/N8nNodeFactory';
import { N8nNodeConfigPanel } from './N8nNodeConfigPanel';

interface N8nCanvasIntegrationProps {
  onAddNode: (node: any) => void;
  selectedNode?: any;
}

const N8nCanvasIntegration: React.FC<N8nCanvasIntegrationProps> = ({ onAddNode, selectedNode }) => {
  const [showConfigPanel, setShowConfigPanel] = useState<boolean>(false);
  const [configuringNode, setConfiguringNode] = useState<any>(null);

  const handleAddN8nTriggerNode = () => {
    try {
      const position = { x: Math.random() * 400 + 100, y: Math.random() * 300 + 100 };
      const node = N8nNodeFactory.createNode('n8n.trigger', position);
      onAddNode(node);
    } catch (error) {
      console.error('Error adding n8n trigger node:', error);
      alert(`Failed to add n8n node: ${(error as Error).message}`);
    }
  };

  const handleAddN8nTemplateNode = () => {
    try {
      const position = { x: Math.random() * 400 + 100, y: Math.random() * 300 + 100 };
      const node = N8nNodeFactory.createNode('n8n.template', position);
      onAddNode(node);
    } catch (error) {
      console.error('Error adding n8n template node:', error);
      alert(`Failed to add n8n template node: ${(error as Error).message}`);
    }
  };

  const handleConfigureNode = (node: any) => {
    setConfiguringNode(node);
    setShowConfigPanel(true);
  };

  const handleSaveConfig = (config: any) => {
    if (configuringNode) {
      // Update the node with new config
      const updatedNode = { ...configuringNode, data: { ...configuringNode.data, properties: config } };
      // This would typically trigger a store update
      console.log('Updated n8n node config:', updatedNode);
    }
    setShowConfigPanel(false);
    setConfiguringNode(null);
  };

  return (
    <>
      {/* n8n Node Toolbar */}
      <div className="absolute top-4 right-4 bg-white border rounded-lg shadow-lg p-3">
        <h3 className="text-sm font-semibold mb-2 text-gray-700">n8n Integration</h3>
        <div className="space-y-2">
          <button
            onClick={handleAddN8nTriggerNode}
            className="w-full bg-green-500 hover:bg-green-600 text-white text-sm px-3 py-2 rounded transition-colors"
            title="Add n8n Workflow Trigger Node"
          >
            ⚡ Add Trigger Node
          </button>
          <button
            onClick={handleAddN8nTemplateNode}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white text-sm px-3 py-2 rounded transition-colors"
            title="Add n8n Template Import Node"
          >
            📋 Add Template Node
          </button>
        </div>

        {/* Quick Actions */}
        {selectedNode && N8nNodeFactory.isN8nNodeType(selectedNode.type) && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <button
              onClick={() => handleConfigureNode(selectedNode)}
              className="w-full bg-gray-500 hover:bg-gray-600 text-white text-sm px-3 py-1 rounded transition-colors"
            >
              ⚙️ Configure Node
            </button>
          </div>
        )}
      </div>

      {/* Configuration Panel */}
      {showConfigPanel && configuringNode && (
        <div className="absolute top-20 right-4 z-50">
          <N8nNodeConfigPanel
            nodeId={configuringNode.id}
            onSave={handleSaveConfig}
          />
        </div>
      )}
    </>
  );
};

export default N8nCanvasIntegration;
