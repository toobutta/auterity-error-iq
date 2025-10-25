import React, { useState } from 'react';

interface Comment {
  id: string;
  nodeId: string;
  content: string;
  author: string;
  timestamp: Date;
  position: { x: number; y: number };
}

interface CollaborationToolbarProps {
  onAddComment: (nodeId: string, content: string) => void;
  selectedNodeId: string | null;
  comments: Comment[];
}

export const CollaborationToolbar: React.FC<CollaborationToolbarProps> = ({
  onAddComment,
  selectedNodeId,
  comments
}) => {
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [commentText, setCommentText] = useState('');

  const handleAddComment = () => {
    if (selectedNodeId && commentText.trim()) {
      onAddComment(selectedNodeId, commentText.trim());
      setCommentText('');
      setShowCommentInput(false);
    }
  };

  const selectedNodeComments = comments.filter(comment => comment.nodeId === selectedNodeId);

  return (
    <div className="flex items-center space-x-2">
      {/* Comment Button */}
      <button
        onClick={() => setShowCommentInput(!showCommentInput)}
        className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
          selectedNodeId
            ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
        }`}
        disabled={!selectedNodeId}
        title={selectedNodeId ? 'Add comment to selected node' : 'Select a node first'}
      >
        💬 Comment
        {selectedNodeComments.length > 0 && (
          <span className="ml-1 bg-blue-500 text-white text-xs px-1 rounded">
            {selectedNodeComments.length}
          </span>
        )}
      </button>

      {/* Comment Input */}
      {showCommentInput && selectedNodeId && (
        <div className="flex items-center space-x-2 bg-white border rounded shadow-lg p-2">
          <input
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
            placeholder="Add a comment..."
            className="flex-1 px-2 py-1 text-sm border rounded outline-none focus:border-blue-500"
            autoFocus
          />
          <button
            onClick={handleAddComment}
            className="px-2 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
          >
            Add
          </button>
          <button
            onClick={() => {
              setShowCommentInput(false);
              setCommentText('');
            }}
            className="px-2 py-1 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Collaboration Stats */}
      <div className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
        {comments.length} comment{comments.length !== 1 ? 's' : ''} total
      </div>
    </div>
  );
};


