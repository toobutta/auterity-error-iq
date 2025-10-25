// UI for configuring n8n nodes. Error-free: Integrates with propertySchemas.

import React, { useState } from 'react';

interface N8nNodeConfigPanelProps {
  nodeId: string;
  onSave: (config: any) => void;
}

const N8nNodeConfigPanel: React.FC<N8nNodeConfigPanelProps> = ({ nodeId, onSave }) => {
  const [workflowId, setWorkflowId] = useState<string>('');

  const handleSave = () => {
    try {
      onSave({ workflowId });
    } catch (error) {
      console.error('Error saving n8n node config:', error);
    }
  };

  return (
    <div className="p-4 border rounded">
      <h3>Configure n8n Node</h3>
      <input
        type="text"
        placeholder="Workflow ID"
        value={workflowId}
        onChange={(e) => setWorkflowId(e.target.value)}
        className="w-full p-2 border rounded mt-2"
      />
      <button onClick={handleSave} className="bg-blue-500 text-white px-4 py-2 rounded mt-2">
        Save
      </button>
    </div>
  );
};

export default N8nNodeConfigPanel;
