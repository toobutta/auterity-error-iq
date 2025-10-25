import React from 'react';
import { WebSocketConnectionStatus } from '../../hooks/useWebSocket';

interface UserPresence {
  userId: string;
  username: string;
  avatar?: string;
  cursor: { x: number; y: number };
  color: string;
  lastActivity: Date;
}

interface UserPresenceIndicatorProps {
  users: UserPresence[];
  connectionStatus: WebSocketConnectionStatus;
}

export const UserPresenceIndicator: React.FC<UserPresenceIndicatorProps> = ({
  users,
  connectionStatus
}) => {
  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'bg-green-500';
      case 'connecting':
        return 'bg-yellow-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Live';
      case 'connecting':
        return 'Connecting...';
      case 'error':
        return 'Connection Error';
      default:
        return 'Offline';
    }
  };

  return (
    <div className="flex items-center space-x-2">
      {/* Connection Status */}
      <div className="flex items-center space-x-1">
        <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
        <span className="text-xs text-gray-600">{getStatusText()}</span>
      </div>

      {/* User Avatars */}
      <div className="flex -space-x-1">
        {users.slice(0, 3).map((user) => (
          <div
            key={user.userId}
            className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-xs font-medium"
            style={{ backgroundColor: user.color }}
            title={user.username}
          >
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.username}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              user.username.charAt(0).toUpperCase()
            )}
          </div>
        ))}

        {users.length > 3 && (
          <div className="w-6 h-6 rounded-full bg-gray-300 border-2 border-white flex items-center justify-center text-xs font-medium text-gray-700">
            +{users.length - 3}
          </div>
        )}
      </div>

      {/* User Count */}
      {users.length > 0 && (
        <span className="text-xs text-gray-600">
          {users.length} user{users.length > 1 ? 's' : ''} online
        </span>
      )}
    </div>
  );
};


