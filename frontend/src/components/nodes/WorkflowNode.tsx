import React from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";

export const WorkflowNode: React.FC<NodeProps> = ({ data, isConnectable }) => {
  return (
    <div className="bg-white border rounded p-2 shadow-sm">
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        className="w-3 h-3"
      />

      <div className="p-2">
        <h3 className="font-bold">{data.label || "Workflow Node"}</h3>
        <p className="text-sm text-gray-500">{data.description}</p>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
        className="w-3 h-3"
      />
    </div>
  );
};


