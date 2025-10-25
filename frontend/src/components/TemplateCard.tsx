import React from "react";
import { Template } from "../types/template";
import { Button } from "../../../shared/components/Button";

interface TemplateCardProps {
  template: Template;
  onSelect: (template: Template) => void;
  onPreview: (template: Template) => void;
  onAddToComparison?: (template: Template) => void;
  isInComparison?: boolean;
}

const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  onSelect,
  onPreview,
  onAddToComparison,
  isInComparison = false,
}) => {
  const getCategoryColor = (category: string) => {
    switch (category) {
      case "sales":
        return "bg-blue-100 text-blue-800";
      case "service":
        return "bg-green-100 text-green-800";
      case "parts":
        return "bg-yellow-100 text-yellow-800";
      case "general":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 border border-gray-200">
      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900 truncate flex-1 mr-2">
            {template.name}
          </h3>
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(template.category)}`}
          >
            {template.category}
          </span>
        </div>

        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
          {template.description || "No description available"}
        </p>

        <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
          <span>Created: {formatDate(template.createdAt)}</span>
          <span>{template.parameters.length} parameters</span>
        </div>

        <div className="space-y-2">
          <div className="flex space-x-2">
            <Button
              onClick={() => onPreview(template)}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              Preview
            </Button>
            <Button
              onClick={() => onSelect(template)}
              variant="primary"
              size="sm"
              className="flex-1"
            >
              Use Template
            </Button>
          </div>
          {onAddToComparison && (
            <Button
              onClick={() => onAddToComparison(template)}
              disabled={isInComparison}
              variant={isInComparison ? "ghost" : "outline"}
              size="sm"
              fullWidth
              leftIcon={
                isInComparison ? (
                  <svg
                    className="h-3 w-3"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <svg
                    className="h-3 w-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                )
              }
            >
              {isInComparison ? "In Comparison" : "Add to Compare"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TemplateCard;


