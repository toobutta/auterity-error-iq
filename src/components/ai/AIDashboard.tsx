/**
 * AI Dashboard Panel
 * 
 * Integrated AI management dashboard for the workflow studio
 * Combines provider status, cost monitoring, and AI assistant
 */

import React, { useState } from 'react';
import { AIProviderStatus } from './AIProviderStatus.js';
import { AICostMonitor } from './AICostMonitor.js';
import { WorkflowAIAssistant } from './WorkflowAIAssistant.js';

interface AIDashboardProps {
  width: number;
  collapsed: boolean;
  onResize: (width: number) => void;
  onToggleCollapse: () => void;
}

type DashboardTab = 'status' | 'cost' | 'assistant';

export const AIDashboard: React.FC<AIDashboardProps> = ({
  width,
  collapsed,
  onResize,
  onToggleCollapse
}) => {
  const [activeTab, setActiveTab] = useState<DashboardTab>('status');

  const tabs = [
    {
      id: 'status' as DashboardTab,
      label: 'Provider Status',
      icon: '🔧',
      tooltip: 'Monitor AI provider status and health'
    },
    {
      id: 'cost' as DashboardTab,
      label: 'Cost Monitor',
      icon: '💰',
      tooltip: 'Track AI usage costs and savings'
    },
    {
      id: 'assistant' as DashboardTab,
      label: 'AI Assistant',
      icon: '🤖',
      tooltip: 'AI-powered workflow optimization'
    }
  ];

  const renderTabContent = () => {
    if (collapsed) return null;

    switch (activeTab) {
      case 'status':
        return <AIProviderStatus />;
      case 'cost':
        return <AICostMonitor showOptimizationTips={true} />;
      case 'assistant':
        return <WorkflowAIAssistant />;
      default:
        return <AIProviderStatus />;
    }
  };

  return (
    <div 
      className={`ai-dashboard ${collapsed ? 'collapsed' : ''}`}
      style={{ width: collapsed ? 60 : width }}
    >
      {/* Header */}
      <div className="ai-dashboard-header">
        <div className="ai-dashboard-title">
          {!collapsed && (
            <>
              <span className="ai-dashboard-icon">🚀</span>
              <h3>AI Control Center</h3>
            </>
          )}
          <button
            onClick={onToggleCollapse}
            className="collapse-toggle"
            title={collapsed ? 'Expand AI Dashboard' : 'Collapse AI Dashboard'}
          >
            {collapsed ? '→' : '←'}
          </button>
        </div>
        
        {!collapsed && (
          <div className="ai-dashboard-tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
                title={tab.tooltip}
              >
                <span className="tab-icon">{tab.icon}</span>
                <span className="tab-label">{tab.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="ai-dashboard-content">
        {collapsed ? (
          <div className="collapsed-indicators">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  onToggleCollapse();
                }}
                className="collapsed-tab"
                title={tab.tooltip}
              >
                {tab.icon}
              </button>
            ))}
          </div>
        ) : (
          renderTabContent()
        )}
      </div>

      {/* Resize Handle */}
      {!collapsed && (
        <div 
          className="resize-handle"
          onMouseDown={(e) => {
            e.preventDefault();
            const startX = e.clientX;
            const startWidth = width;

            const handleMouseMove = (e: MouseEvent) => {
              const deltaX = startX - e.clientX; // Drag left to increase width
              const newWidth = Math.max(300, Math.min(600, startWidth + deltaX));
              onResize(newWidth);
            };

            const handleMouseUp = () => {
              document.removeEventListener('mousemove', handleMouseMove);
              document.removeEventListener('mouseup', handleMouseUp);
            };

            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
          }}
        />
      )}

      <style dangerouslySetInnerHTML={{
        __html: `
        .ai-dashboard {
          height: 100%;
          background: white;
          border-left: 1px solid #e5e7eb;
          display: flex;
          flex-direction: column;
          position: relative;
          transition: width 0.3s ease;
        }

        .ai-dashboard.collapsed {
          min-width: 60px;
        }

        .ai-dashboard-header {
          padding: 16px;
          border-bottom: 1px solid #e5e7eb;
          background: #f9fafb;
        }

        .ai-dashboard-title {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }

        .ai-dashboard-title h3 {
          margin: 0;
          font-size: 14px;
          font-weight: 600;
          color: #374151;
        }

        .ai-dashboard-icon {
          font-size: 16px;
          margin-right: 8px;
        }

        .collapse-toggle {
          background: none;
          border: none;
          font-size: 16px;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          color: #6b7280;
          transition: all 0.2s;
        }

        .collapse-toggle:hover {
          background: #e5e7eb;
          color: #374151;
        }

        .ai-dashboard-tabs {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .tab-button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          border: none;
          background: none;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
          text-align: left;
          font-size: 12px;
        }

        .tab-button:hover {
          background: #e5e7eb;
        }

        .tab-button.active {
          background: #3b82f6;
          color: white;
        }

        .tab-icon {
          font-size: 14px;
          flex-shrink: 0;
        }

        .tab-label {
          font-weight: 500;
        }

        .ai-dashboard-content {
          flex: 1;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .collapsed-indicators {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          padding: 16px 8px;
        }

        .collapsed-tab {
          background: none;
          border: none;
          font-size: 20px;
          padding: 8px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .collapsed-tab:hover {
          background: #e5e7eb;
          transform: scale(1.1);
        }

        .resize-handle {
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 4px;
          cursor: ew-resize;
          background: transparent;
          transition: background 0.2s;
        }

        .resize-handle:hover {
          background: #3b82f6;
        }

        @media (max-width: 1200px) {
          .ai-dashboard {
            min-width: 300px;
          }
          
          .tab-button {
            font-size: 11px;
            padding: 6px 10px;
          }
        }
        `
      }} />
    </div>
  );
};

export default AIDashboard;
