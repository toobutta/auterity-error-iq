import React from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { NodeData } from "../../types/workflow";

export const StartNode: React.FC<NodeProps> = ({
  data,
  isConnectable,
}) => {
  const nodeData = data as NodeData;
  return (
    <div className="bg-green-100 border-2 border-green-300 rounded-lg p-3 shadow-md min-w-[120px]">
      <div className="text-center">
        <div className="w-8 h-8 bg-green-500 rounded-full mx-auto mb-2 flex items-center justify-center">
          <span className="text-white text-sm font-bold">▶</span>
        </div>
        <h3 className="font-bold text-green-800">{nodeData.label}</h3>
        {nodeData.description && (
          <p className="text-xs text-green-600 mt-1">{nodeData.description}</p>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
        className="w-3 h-3 bg-green-500"
      />
    </div>
  );
};


