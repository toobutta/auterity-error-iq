import React, { useState, useMemo } from "react";
import { useDrag } from "react-dnd";
import {
  NodePaletteProps,
  NodeTemplate,
  NodeCategory,
  DragItem,
} from "../../types/workflow-builder";

interface NodePaletteItemProps {
  template: NodeTemplate;
  onDragStart?: () => void;
}

const NodePaletteItem: React.FC<NodePaletteItemProps> = ({
  template,
  onDragStart,
}) => {
  const [{ isDragging }, drag] = useDrag<
    DragItem,
    void,
    { isDragging: boolean }
  >({
    type: "workflow-node",
    item: () => {
      onDragStart?.();
      return {
        type: "workflow-node",
        nodeType: template.type,
        template,
      };
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "triggers":
        return "bg-yellow-100 border-yellow-300 hover:bg-yellow-200 text-yellow-800";
      case "actions":
        return "bg-blue-100 border-blue-300 hover:bg-blue-200 text-blue-800";
      case "conditions":
        return "bg-purple-100 border-purple-300 hover:bg-purple-200 text-purple-800";
      case "ai_powered":
        return "bg-green-100 border-green-300 hover:bg-green-200 text-green-800";
      case "integrations":
        return "bg-orange-100 border-orange-300 hover:bg-orange-200 text-orange-800";
      default:
        return "bg-gray-100 border-gray-300 hover:bg-gray-200 text-gray-800";
    }
  };

  return (
    <div
      ref={drag}
      className={`
        w-full p-3 border-2 rounded-lg cursor-grab transition-all duration-200 mb-2
        ${getCategoryColor(template.category)}
        ${isDragging ? "opacity-50 scale-95 cursor-grabbing" : "opacity-100 scale-100"}
        hover:shadow-md active:scale-95
      `}
      title={template.description}
    >
      <div className="flex items-center space-x-3">
        <div className="text-2xl flex-shrink-0">{template.icon}</div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate">{template.label}</div>
          <div className="text-xs opacity-75 truncate">
            {template.description}
          </div>
        </div>
      </div>

      {/* Connection indicators */}
      <div className="flex justify-between items-center mt-2 text-xs opacity-60">
        <div className="flex items-center space-x-1">
          <span>📥</span>
          <span>{template.inputs.length}</span>
        </div>
        <div className="flex items-center space-x-1">
          <span>📤</span>
          <span>{template.outputs.length}</span>
        </div>
      </div>
    </div>
  );
};

interface CategorySectionProps {
  category: NodeCategory;
  isExpanded: boolean;
  onToggle: () => void;
  searchTerm: string;
  onNodeDragStart?: () => void;
}

const CategorySection: React.FC<CategorySectionProps> = ({
  category,
  isExpanded,
  onToggle,
  searchTerm,
  onNodeDragStart,
}) => {
  const filteredNodes = useMemo(() => {
    if (!searchTerm) return category.nodes;

    return category.nodes.filter(
      (node) =>
        node.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        node.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        node.type.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [category.nodes, searchTerm]);

  if (filteredNodes.length === 0 && searchTerm) {
    return null;
  }

  const getCategoryHeaderColor = (categoryId: string) => {
    switch (categoryId) {
      case "triggers":
        return "bg-yellow-50 border-yellow-200 text-yellow-800";
      case "actions":
        return "bg-blue-50 border-blue-200 text-blue-800";
      case "conditions":
        return "bg-purple-50 border-purple-200 text-purple-800";
      case "ai_powered":
        return "bg-green-50 border-green-200 text-green-800";
      case "integrations":
        return "bg-orange-50 border-orange-200 text-orange-800";
      default:
        return "bg-gray-50 border-gray-200 text-gray-800";
    }
  };

  return (
    <div className="mb-4">
      <button
        onClick={onToggle}
        className={`
          w-full p-3 border rounded-lg transition-all duration-200 flex items-center justify-between
          ${getCategoryHeaderColor(category.id)}
          hover:shadow-sm
        `}
      >
        <div className="flex items-center space-x-3">
          <span className="text-xl">{category.icon}</span>
          <span className="font-medium">{category.name}</span>
          <span className="text-xs bg-white bg-opacity-50 px-2 py-1 rounded-full">
            {filteredNodes.length}
          </span>
        </div>
        <svg
          className={`w-5 h-5 transition-transform duration-200 ${
            isExpanded ? "rotate-180" : "rotate-0"
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isExpanded && (
        <div className="mt-2 pl-2">
          {filteredNodes.map((template) => (
            <NodePaletteItem
              key={template.type}
              template={template}
              onDragStart={onNodeDragStart}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const NodePalette: React.FC<NodePaletteProps> = ({
  categories,
  onNodeDrag,
  searchTerm = "",
  onSearchChange,
}) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(["triggers", "actions"]), // Default expanded categories
  );

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const handleNodeDragStart = () => {
    onNodeDrag("node-drag-started");
  };

  const totalNodes = useMemo(() => {
    return categories.reduce(
      (total, category) => total + category.nodes.length,
      0,
    );
  }, [categories]);

  const filteredTotalNodes = useMemo(() => {
    if (!searchTerm) return totalNodes;

    return categories.reduce((total, category) => {
      const filtered = category.nodes.filter(
        (node) =>
          node.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
          node.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          node.type.toLowerCase().includes(searchTerm.toLowerCase()),
      );
      return total + filtered.length;
    }, 0);
  }, [categories, searchTerm, totalNodes]);

  return (
    <div className="w-80 bg-gray-50 border-r border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-gray-900 flex items-center">
            <span className="text-xl mr-2">🧩</span>
            Node Palette
          </h3>
          <span className="text-xs bg-gray-100 px-2 py-1 rounded-full text-gray-600">
            {filteredTotalNodes} nodes
          </span>
        </div>

        {/* Search */}
        {onSearchChange && (
          <div className="relative">
            <input
              type="text"
              placeholder="Search nodes..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <svg
              className="absolute left-3 top-2.5 w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Categories */}
      <div className="flex-1 overflow-y-auto p-4">
        {searchTerm && filteredTotalNodes === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <svg
              className="w-12 h-12 mx-auto mb-3 text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <p className="text-sm">
              No nodes found for &quot;{searchTerm}&quot;
            </p>
            <p className="text-xs mt-1">Try a different search term</p>
          </div>
        ) : (
          categories.map((category) => (
            <CategorySection
              key={category.id}
              category={category}
              isExpanded={expandedCategories.has(category.id)}
              onToggle={() => toggleCategory(category.id)}
              searchTerm={searchTerm}
              onNodeDragStart={handleNodeDragStart}
            />
          ))
        )}
      </div>

      {/* Footer with drag instructions */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <div className="text-xs text-gray-500 text-center">
          <div className="flex items-center justify-center space-x-2 mb-1">
            <span>🖱️</span>
            <span>Drag nodes to canvas</span>
          </div>
          <div className="text-gray-400">
            Click category headers to expand/collapse
          </div>
        </div>
      </div>
    </div>
  );
};

export default NodePalette;


