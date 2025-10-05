import React, { useState } from 'react';

interface Comment {
  id: string;
  nodeId: string;
  content: string;
  author: string;
  // timestamps can come from server as ISO strings or as Date objects
  timestamp: string | Date;
  position: { x: number; y: number };
}

interface CommentPanelProps {
  comments: Comment[];
  onAddComment: (nodeId: string, content: string) => void;
  selectedNodeId: string | null;
}

export const CommentPanel: React.FC<CommentPanelProps> = ({
  comments,
  onAddComment,
  selectedNodeId
}) => {
  const [newComment, setNewComment] = useState('');
  const [isExpanded, setIsExpanded] = useState(true);

  const handleAddComment = () => {
    if (newComment.trim() && selectedNodeId) {
      onAddComment(selectedNodeId, newComment.trim());
      setNewComment('');
    }
  };

  const formatTimestamp = (timestamp: string | Date) => {
    // accept either a Date or an ISO string
    const ts = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    if (!(ts instanceof Date) || Number.isNaN(ts.getTime())) return 'Unknown time';

    const now = new Date();
    const diff = now.getTime() - ts.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Comments</h3>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-gray-400 hover:text-gray-600"
        >
          {isExpanded ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          )}
        </button>
      </div>

      {isExpanded && (
        <>
          {/* Add Comment */}
          {selectedNodeId && (
            <div className="p-4 border-b border-gray-200">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewComment(e.target.value)}
                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && handleAddComment()}
                  placeholder="Add a comment..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  aria-label="Add a comment for selected node"
                />
                <button
                  onClick={handleAddComment}
                  disabled={!newComment.trim()}
                  className="px-3 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  aria-label="Add comment"
                >
                  Add
                </button>
              </div>
            </div>
          )}
          {/* Comments List */}
          <div className="flex-1 overflow-y-auto">
            {/** show comments only for the selected node; when no node selected, prompt to select one */}
            {(!selectedNodeId || comments.filter(c => c.nodeId === selectedNodeId).length === 0) ? (
              <div className="p-4 text-center text-gray-500">
                <div className="text-4xl mb-2">💬</div>
                <p className="text-sm">
                  {selectedNodeId
                    ? 'No comments yet. Select a node and add the first comment!'
                    : 'Select a node to view or add comments'
                  }
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {comments
                  .filter((c) => c.nodeId === selectedNodeId)
                  .map((comment) => (
                    <div key={comment.id} className="p-4 hover:bg-gray-50">
                      <div className="flex items-start space-x-3">
                        {/* Avatar */}
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0" aria-hidden>
                          {(comment.author && comment.author.length > 0) ? comment.author.charAt(0).toUpperCase() : '?'}
                        </div>

                        {/* Comment Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-sm font-medium text-gray-900">
                              {comment.author || 'Unknown'}
                            </span>
                            <span className="text-xs text-gray-500">
                              {formatTimestamp(comment.timestamp)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 break-words">
                            {comment.content}
                          </p>

                          {/* Node Reference */}
                          <div className="mt-2 text-xs text-gray-500">
                            on node: {comment.nodeId}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex-shrink-0">
                          <button className="text-gray-400 hover:text-gray-600 p-1" aria-label="Comment actions">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <div className="text-xs text-gray-500 text-center">
              {selectedNodeId
                ? `${comments.filter(c => c.nodeId === selectedNodeId).length} comment${comments.filter(c => c.nodeId === selectedNodeId).length !== 1 ? 's' : ''} for node`
                : `${comments.length} comment${comments.length !== 1 ? 's' : ''} total`
              }
            </div>
          </div>
        </>
      )}
    </div>
  );
};


