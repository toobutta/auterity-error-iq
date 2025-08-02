import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { NodeData } from '../../../types/workflow';

const CustomerInquiryNode: React.FC<NodeProps<NodeData>> = ({ data, isConnectable }) => {
  const hasErrors = data.validationErrors && data.validationErrors.length > 0;
  
  return (
    <div className={`bg-yellow-100 border-2 ${hasErrors ? 'border-red-400' : 'border-yellow-300'} rounded-lg p-3 shadow-md min-w-[160px]`}>
      <div className="text-center">
        <div className="w-8 h-8 bg-yellow-500 rounded-full mx-auto mb-2 flex items-center justify-center">
          <span className="text-white text-sm font-bold">📧</span>
        </div>
        <h3 className="font-bold text-yellow-800">{data.label}</h3>
        {data.description && (
          <p className="text-xs text-yellow-600 mt-1">{data.description}</p>
        )}
        {(data.config as any).customerInquiry?.sources && (
          <p className="text-xs text-gray-500 mt-1">
            Sources: {(data.config as any).customerInquiry.sources.join(', ')}
          </p>
        )}
      </div>

      {hasErrors && (
        <div className="mt-2 p-1 bg-red-100 border border-red-300 rounded text-xs text-red-600">
          {data.validationErrors![0]}
        </div>
      )}
      
      <Handle 
        type="source" 
        position={Position.Bottom} 
        isConnectable={isConnectable} 
        className="w-3 h-3 bg-yellow-500" 
      />
    </div>
  );
};

export default CustomerInquiryNode;