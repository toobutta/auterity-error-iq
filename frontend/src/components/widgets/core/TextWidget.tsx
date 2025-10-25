import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { TextWidgetProps } from './types';
import { WidgetHeader } from './WidgetHeader';
import { WidgetError } from './WidgetError';

export const TextWidget: React.FC<TextWidgetProps> = ({
  id,
  title,
  content,
  format,
  editable = false,
  onContentChange,
  error,
  onRefresh,
  className
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editableContent, setEditableContent] = useState(content);

  const handleEdit = () => {
    if (!editable) return;
    setIsEditing(true);
  };

  const handleSave = () => {
    setIsEditing(false);
    onContentChange?.(editableContent);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditableContent(content);
  };

  const renderContent = () => {
    if (isEditing) {
      return (
        <div className="p-4">
          <textarea
            value={editableContent}
            onChange={(e) => setEditableContent(e.target.value)}
            className="w-full h-32 p-2 border border-gray-300 rounded-md"
          />
          <div className="mt-2 flex justify-end space-x-2">
            <button
              onClick={handleCancel}
              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Save
            </button>
          </div>
        </div>
      );
    }

    const contentClass = 'p-4 ' + (editable ? 'cursor-pointer hover:bg-gray-50' : '');

    switch (format) {
      case 'markdown':
        return (
          <div className={contentClass} onClick={handleEdit}>
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        );
      case 'html':
        return (
          <div
            className={contentClass}
            onClick={handleEdit}
            dangerouslySetInnerHTML={{ __html: content }}
          />
        );
      default:
        return (
          <div className={contentClass} onClick={handleEdit}>
            {content}
          </div>
        );
    }
  };

  if (error) {
    return <WidgetError message={error} onRetry={onRefresh} />;
  }

  return (
    <div className={`widget text-widget ${className || ''}`}>
      <WidgetHeader
        title={title}
        actions={
          editable && !isEditing ? (
            <button
              onClick={handleEdit}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                />
              </svg>
            </button>
          ) : null
        }
      />
      {renderContent()}
    </div>
  );
};
