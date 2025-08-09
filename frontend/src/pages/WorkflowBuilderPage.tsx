import React from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import WorkflowBuilder from '../components/WorkflowBuilder';
import { InteractiveWorkflowCanvas } from '../components/workflow-builder/InteractiveWorkflowCanvas';
import { WorkflowDefinition } from '../types/workflow';

const WorkflowBuilderPage: React.FC = () => {
  const navigate = useNavigate();

  const handleSave = (_workflow: WorkflowDefinition) => {
    // Navigate back to workflows page after saving
    navigate('/workflows');
  };

  return (
    <Layout>
      <div className="h-full space-y-8">
        <InteractiveWorkflowCanvas />
        <WorkflowBuilder onSave={handleSave} />
      </div>
    </Layout>
  );
};

export default WorkflowBuilderPage;