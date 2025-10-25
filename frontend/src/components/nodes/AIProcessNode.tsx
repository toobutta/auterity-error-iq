import React from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { NodeData } from "../../types/workflow";

export const AIProcessNode: React.FC<NodeProps> = ({
  data,
  isConnectable,
}) => {
  const nodeData = data as NodeData;
  const hasErrors =
    nodeData.validationErrors && nodeData.validationErrors.length > 0;

  return (
    <div
      className={`bg-blue-100 border-2 ${hasErrors ? "border-red-400" : "border-blue-300"} rounded-lg p-3 shadow-md min-w-[150px]`}
    >
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        className="w-3 h-3 bg-blue-500"
      />

      <div className="text-center">
        <div className="w-8 h-8 bg-blue-500 rounded-full mx-auto mb-2 flex items-center justify-center">
          <span className="text-white text-sm font-bold">AI</span>
        </div>
        <h3 className="font-bold text-blue-800">{nodeData.label}</h3>
        {nodeData.description && (
          <p className="text-xs text-blue-600 mt-1">{nodeData.description}</p>
        )}
        {nodeData.config.prompt ? (
          <p
            className="text-xs text-gray-500 mt-1 truncate"
            title={String(nodeData.config.prompt)}
          >
            {String(nodeData.config.prompt).substring(0, 30)}...
          </p>
        ) : null}
      </div>

      {hasErrors && (
        <div className="mt-2 p-1 bg-red-100 border border-red-300 rounded text-xs text-red-600">
          {nodeData.validationErrors?.[0]}
        </div>
      )}

      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
        className="w-3 h-3 bg-blue-500"
      />
    </div>
  );
};


