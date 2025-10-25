/**
 * PWA Status Component
 * Shows offline/online status, install prompt, and update notifications
 */

import React from 'react';
import { usePWA } from '../../hooks/usePWA';
import {
  WifiIcon,
  WifiSlashIcon,
  ArrowDownTrayIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

interface PWAStatusProps {
  className?: string;
}

export const PWAStatus: React.FC<PWAStatusProps> = ({ className = '' }) => {
  const {
    isOnline,
    isInstalled,
    canInstall,
    updateAvailable,
    install,
    update,
    checkForUpdates
  } = usePWA();

  const handleInstall = async () => {
    try {
      await install();
    } catch (error) {
      console.error('Failed to install PWA:', error);
    }
  };

  const handleUpdate = () => {
    update();
  };

  const handleCheckUpdates = async () => {
    try {
      await checkForUpdates();
    } catch (error) {
      console.error('Failed to check for updates:', error);
    }
  };

  return (
    <div className={`pwa-status ${className}`}>
      {/* Online/Offline Status */}
      <div className={`status-indicator ${isOnline ? 'online' : 'offline'}`}>
        {isOnline ? (
          <>
            <WifiIcon className="status-icon" />
            <span className="status-text">Online</span>
          </>
        ) : (
          <>
            <WifiSlashIcon className="status-icon" />
            <span className="status-text">Offline</span>
          </>
        )}
      </div>

      {/* Install Prompt */}
      {canInstall && !isInstalled && (
        <button
          className="pwa-action-button install"
          onClick={handleInstall}
          aria-label="Install Auterity as an app"
        >
          <ArrowDownTrayIcon className="action-icon" />
          <span>Install App</span>
        </button>
      )}

      {/* Update Available */}
      {updateAvailable && (
        <div className="pwa-update-notification">
          <div className="update-content">
            <ExclamationTriangleIcon className="update-icon" />
            <div className="update-text">
              <div className="update-title">Update Available</div>
              <div className="update-description">
                A new version is ready to install
              </div>
            </div>
          </div>
          <div className="update-actions">
            <button
              className="pwa-action-button update"
              onClick={handleUpdate}
            >
              <ArrowPathIcon className="action-icon" />
              <span>Update Now</span>
            </button>
            <button
              className="pwa-action-button dismiss"
              onClick={() => window.location.reload()}
            >
              <span>Later</span>
            </button>
          </div>
        </div>
      )}

      {/* App Installed Confirmation */}
      {isInstalled && !canInstall && !updateAvailable && (
        <div className="status-indicator installed">
          <CheckCircleIcon className="status-icon" />
          <span className="status-text">App Installed</span>
        </div>
      )}

      {/* Manual Update Check (for development/debugging) */}
      {process.env.NODE_ENV === 'development' && (
        <button
          className="pwa-action-button check-updates"
          onClick={handleCheckUpdates}
          aria-label="Check for updates"
        >
          <ArrowPathIcon className="action-icon" />
          <span>Check Updates</span>
        </button>
      )}
    </div>
  );
};

// Mini version for navigation bars
export const PWAStatusMini: React.FC<PWAStatusProps> = ({ className = '' }) => {
  const { isOnline, canInstall, updateAvailable, install } = usePWA();

  const handleQuickInstall = async () => {
    try {
      await install();
    } catch (error) {
      console.error('Quick install failed:', error);
    }
  };

  return (
    <div className={`pwa-status-mini ${className}`}>
      {/* Online indicator */}
      <div
        className={`online-indicator ${isOnline ? 'online' : 'offline'}`}
        title={isOnline ? 'Online' : 'Offline'}
        aria-label={isOnline ? 'Online' : 'Offline'}
      />

      {/* Install button (compact) */}
      {canInstall && (
        <button
          className="install-button-mini"
          onClick={handleQuickInstall}
          title="Install Auterity as an app"
          aria-label="Install Auterity as an app"
        >
          <ArrowDownTrayIcon className="mini-icon" />
        </button>
      )}

      {/* Update indicator */}
      {updateAvailable && (
        <div
          className="update-indicator"
          title="Update available"
          aria-label="Update available"
        >
          <ArrowPathIcon className="mini-icon" />
        </div>
      )}
    </div>
  );
};

export default PWAStatus;
