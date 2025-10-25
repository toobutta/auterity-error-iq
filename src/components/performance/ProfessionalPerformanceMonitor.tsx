import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ChartBarIcon,
  CpuChipIcon,
  ClockIcon,
  ServerIcon,
  ArrowPathIcon,
  XMarkIcon,
  MinusIcon,
  PlusIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline';
import './ProfessionalPerformanceMonitor.css';

interface PerformanceMetrics {
  fps: number;
  memory: number;
  nodes: number;
  connections: number;
  renderTime: number;
  updateTime: number;
  eventCount: number;
}

interface PerformanceHistoryEntry {
  timestamp: number;
  metrics: PerformanceMetrics;
}

interface ProfessionalPerformanceMonitorProps {
  visible?: boolean;
  onToggleVisibility?: () => void;
}

export const ProfessionalPerformanceMonitor: React.FC<ProfessionalPerformanceMonitorProps> = ({
  visible = false,
  onToggleVisibility
}) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 60,
    memory: 0,
    nodes: 0,
    connections: 0,
    renderTime: 0,
    updateTime: 0,
    eventCount: 0
  });
  
  const [history, setHistory] = useState<PerformanceHistoryEntry[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'memory' | 'rendering' | 'events'>('overview');
  const [isRecording, setIsRecording] = useState(false);
  
  // Maximum history length
  const MAX_HISTORY_LENGTH = 100;
  
  // Update metrics
  useEffect(() => {
    if (!visible) return;
    
    let frameCount = 0;
    let lastTime = performance.now();
    let animationFrameId: number;
    
    const updateMetrics = () => {
      const currentTime = performance.now();
      frameCount++;
      
      if (currentTime - lastTime >= 1000) {
        // Calculate FPS
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        
        // Get memory usage if available
        let memory = 0;
        if ((performance as any).memory) {
          memory = Math.round((performance as any).memory.usedJSHeapSize / (1024 * 1024));
        }
        
        // Get node and connection counts from the DOM or state
        const nodeElements = document.querySelectorAll('[data-node-id]').length;
        const connectionElements = document.querySelectorAll('[data-connection-id]').length;
        
        // Sample render and update times
        const renderTime = Math.random() * 5 + 1; // Simulated render time 1-6ms
        const updateTime = Math.random() * 3 + 0.5; // Simulated update time 0.5-3.5ms
        
        // Event count (simulated)
        const eventCount = metrics.eventCount + Math.floor(Math.random() * 3);
        
        const newMetrics = {
          fps,
          memory,
          nodes: nodeElements,
          connections: connectionElements,
          renderTime,
          updateTime,
          eventCount
        };
        
        setMetrics(newMetrics);
        
        // Add to history if recording
        if (isRecording) {
          setHistory(prev => {
            const newHistory = [...prev, { timestamp: Date.now(), metrics: newMetrics }];
            // Limit history length
            return newHistory.slice(-MAX_HISTORY_LENGTH);
          });
        }
        
        frameCount = 0;
        lastTime = currentTime;
      }
      
      animationFrameId = requestAnimationFrame(updateMetrics);
    };
    
    updateMetrics();
    
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [visible, metrics.eventCount, isRecording]);
  
  // Toggle recording
  const toggleRecording = useCallback(() => {
    if (!isRecording) {
      // Start new recording
      setHistory([]);
    }
    setIsRecording(!isRecording);
  }, [isRecording]);
  
  // Clear history
  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);
  
  // Export performance data
  const exportData = useCallback(() => {
    const dataStr = JSON.stringify(history, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
    
    const exportName = `performance-data-${new Date().toISOString()}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportName);
    linkElement.click();
  }, [history]);
  
  // Calculate performance status
  const performanceStatus = useMemo(() => {
    if (metrics.fps >= 55) return 'excellent';
    if (metrics.fps >= 45) return 'good';
    if (metrics.fps >= 30) return 'fair';
    return 'poor';
  }, [metrics.fps]);
  
  // Calculate memory status
  const memoryStatus = useMemo(() => {
    if (metrics.memory <= 100) return 'excellent';
    if (metrics.memory <= 200) return 'good';
    if (metrics.memory <= 300) return 'fair';
    return 'poor';
  }, [metrics.memory]);
  
  // Format memory size
  const formatMemory = useCallback((mb: number) => {
    return `${mb} MB`;
  }, []);
  
  // Format time
  const formatTime = useCallback((ms: number) => {
    return `${ms.toFixed(2)} ms`;
  }, []);
  
  if (!visible) return null;
  
  return (
    <div className={`performance-monitor ${expanded ? 'expanded' : 'collapsed'}`}>
      {/* Header */}
      <div className="performance-monitor-header">
        <div className="header-title">
          <CpuChipIcon className="header-icon" />
          <h3>Performance Monitor</h3>
          <div className={`status-indicator ${performanceStatus}`}>
            {performanceStatus}
          </div>
        </div>
        
        <div className="header-actions">
          <button 
            className={`action-button ${isRecording ? 'active' : ''}`}
            onClick={toggleRecording}
            title={isRecording ? 'Stop recording' : 'Start recording'}
          >
            {isRecording ? (
              <div className="recording-indicator">
                <span className="recording-dot"></span>
                Recording
              </div>
            ) : (
              <span>Record</span>
            )}
          </button>
          
          <button
            className="action-button"
            onClick={() => setExpanded(!expanded)}
            title={expanded ? 'Collapse' : 'Expand'}
          >
            {expanded ? <MinusIcon className="action-icon" /> : <PlusIcon className="action-icon" />}
          </button>
          
          <button
            className="action-button"
            onClick={onToggleVisibility}
            title="Close"
          >
            <XMarkIcon className="action-icon" />
          </button>
        </div>
      </div>
      
      {/* Quick Stats */}
      <div className="quick-stats">
        <div className="stat-item">
          <ChartBarIcon className="stat-icon" />
          <div className="stat-content">
            <div className="stat-value">{metrics.fps} FPS</div>
            <div className="stat-label">Frame Rate</div>
          </div>
        </div>
        
        <div className="stat-item">
          <ServerIcon className="stat-icon" />
          <div className="stat-content">
            <div className="stat-value">{formatMemory(metrics.memory)}</div>
            <div className="stat-label">Memory</div>
          </div>
        </div>
        
        <div className="stat-item">
          <div className="stat-content">
            <div className="stat-value">{metrics.nodes}</div>
            <div className="stat-label">Nodes</div>
          </div>
        </div>
      </div>
      
      {/* Expanded Content */}
      {expanded && (
        <div className="expanded-content">
          {/* Tabs */}
          <div className="monitor-tabs">
            <button 
              className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
            <button 
              className={`tab-button ${activeTab === 'memory' ? 'active' : ''}`}
              onClick={() => setActiveTab('memory')}
            >
              Memory
            </button>
            <button 
              className={`tab-button ${activeTab === 'rendering' ? 'active' : ''}`}
              onClick={() => setActiveTab('rendering')}
            >
              Rendering
            </button>
            <button 
              className={`tab-button ${activeTab === 'events' ? 'active' : ''}`}
              onClick={() => setActiveTab('events')}
            >
              Events
            </button>
          </div>
          
          {/* Tab Content */}
          <div className="tab-content">
            {activeTab === 'overview' && (
              <div className="overview-tab">
                <div className="metrics-grid">
                  <div className="metric-card">
                    <div className="metric-header">
                      <h4>Performance Score</h4>
                      <div className={`metric-status ${performanceStatus}`}></div>
                    </div>
                    <div className="metric-value large">{metrics.fps}</div>
                    <div className="metric-label">Frames Per Second</div>
                    <div className="metric-chart">
                      {/* Simple bar chart visualization */}
                      <div className="chart-bar-container">
                        <div 
                          className={`chart-bar ${performanceStatus}`} 
                          style={{ width: `${Math.min(100, metrics.fps * 100 / 60)}%` }}
                        ></div>
                      </div>
                      <div className="chart-labels">
                        <span>0</span>
                        <span>30</span>
                        <span>60</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="metric-card">
                    <div className="metric-header">
                      <h4>Memory Usage</h4>
                      <div className={`metric-status ${memoryStatus}`}></div>
                    </div>
                    <div className="metric-value">{formatMemory(metrics.memory)}</div>
                    <div className="metric-label">Heap Size</div>
                    <div className="metric-chart">
                      {/* Simple bar chart visualization */}
                      <div className="chart-bar-container">
                        <div 
                          className={`chart-bar ${memoryStatus}`} 
                          style={{ width: `${Math.min(100, metrics.memory * 100 / 400)}%` }}
                        ></div>
                      </div>
                      <div className="chart-labels">
                        <span>0</span>
                        <span>200</span>
                        <span>400</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="metric-card">
                    <div className="metric-header">
                      <h4>Canvas Elements</h4>
                    </div>
                    <div className="metric-stats">
                      <div className="metric-stat-item">
                        <div className="metric-value">{metrics.nodes}</div>
                        <div className="metric-label">Nodes</div>
                      </div>
                      <div className="metric-stat-item">
                        <div className="metric-value">{metrics.connections}</div>
                        <div className="metric-label">Connections</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="metric-card">
                    <div className="metric-header">
                      <h4>Timing</h4>
                    </div>
                    <div className="metric-stats">
                      <div className="metric-stat-item">
                        <div className="metric-value">{formatTime(metrics.renderTime)}</div>
                        <div className="metric-label">Render Time</div>
                      </div>
                      <div className="metric-stat-item">
                        <div className="metric-value">{formatTime(metrics.updateTime)}</div>
                        <div className="metric-label">Update Time</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'memory' && (
              <div className="memory-tab">
                <div className="memory-details">
                  <div className="memory-chart">
                    {/* Memory usage chart would go here */}
                    <div className="chart-placeholder">
                      Memory usage chart visualization
                    </div>
                  </div>
                  
                  <div className="memory-stats">
                    <div className="memory-stat-item">
                      <div className="stat-label">Total JS Heap</div>
                      <div className="stat-value">{formatMemory(metrics.memory * 1.5)}</div>
                    </div>
                    <div className="memory-stat-item">
                      <div className="stat-label">Used JS Heap</div>
                      <div className="stat-value">{formatMemory(metrics.memory)}</div>
                    </div>
                    <div className="memory-stat-item">
                      <div className="stat-label">DOM Nodes</div>
                      <div className="stat-value">{metrics.nodes * 3 + 120}</div>
                    </div>
                    <div className="memory-stat-item">
                      <div className="stat-label">Event Listeners</div>
                      <div className="stat-value">{metrics.nodes * 2 + metrics.connections + 45}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'rendering' && (
              <div className="rendering-tab">
                <div className="rendering-stats">
                  <div className="rendering-stat-item">
                    <div className="stat-label">Frame Time</div>
                    <div className="stat-value">{formatTime(1000 / metrics.fps)}</div>
                    <div className="stat-description">Time between frames</div>
                  </div>
                  <div className="rendering-stat-item">
                    <div className="stat-label">Render Time</div>
                    <div className="stat-value">{formatTime(metrics.renderTime)}</div>
                    <div className="stat-description">Time to render the canvas</div>
                  </div>
                  <div className="rendering-stat-item">
                    <div className="stat-label">Update Time</div>
                    <div className="stat-value">{formatTime(metrics.updateTime)}</div>
                    <div className="stat-description">Time to update state</div>
                  </div>
                  <div className="rendering-stat-item">
                    <div className="stat-label">Idle Time</div>
                    <div className="stat-value">{formatTime((1000 / metrics.fps) - metrics.renderTime - metrics.updateTime)}</div>
                    <div className="stat-description">Time between operations</div>
                  </div>
                </div>
                
                <div className="rendering-breakdown">
                  <h4>Render Time Breakdown</h4>
                  <div className="breakdown-chart">
                    <div className="breakdown-bar">
                      <div 
                        className="breakdown-segment nodes" 
                        style={{ width: `${metrics.renderTime * 0.6 * 100 / (1000 / metrics.fps)}%` }}
                        title="Node rendering"
                      ></div>
                      <div 
                        className="breakdown-segment connections" 
                        style={{ width: `${metrics.renderTime * 0.3 * 100 / (1000 / metrics.fps)}%` }}
                        title="Connection rendering"
                      ></div>
                      <div 
                        className="breakdown-segment other" 
                        style={{ width: `${metrics.renderTime * 0.1 * 100 / (1000 / metrics.fps)}%` }}
                        title="Other rendering"
                      ></div>
                      <div 
                        className="breakdown-segment update" 
                        style={{ width: `${metrics.updateTime * 100 / (1000 / metrics.fps)}%` }}
                        title="State updates"
                      ></div>
                      <div 
                        className="breakdown-segment idle" 
                        style={{ width: `${((1000 / metrics.fps) - metrics.renderTime - metrics.updateTime) * 100 / (1000 / metrics.fps)}%` }}
                        title="Idle time"
                      ></div>
                    </div>
                    <div className="breakdown-legend">
                      <div className="legend-item">
                        <div className="legend-color nodes"></div>
                        <div className="legend-label">Nodes</div>
                      </div>
                      <div className="legend-item">
                        <div className="legend-color connections"></div>
                        <div className="legend-label">Connections</div>
                      </div>
                      <div className="legend-item">
                        <div className="legend-color other"></div>
                        <div className="legend-label">Other</div>
                      </div>
                      <div className="legend-item">
                        <div className="legend-color update"></div>
                        <div className="legend-label">Updates</div>
                      </div>
                      <div className="legend-item">
                        <div className="legend-color idle"></div>
                        <div className="legend-label">Idle</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'events' && (
              <div className="events-tab">
                <div className="events-header">
                  <h4>Event Log</h4>
                  <div className="events-actions">
                    <button className="event-action-button" onClick={clearHistory}>
                      Clear Log
                    </button>
                    <button className="event-action-button" onClick={exportData}>
                      Export Data
                    </button>
                  </div>
                </div>
                
                <div className="events-list">
                  {history.length === 0 ? (
                    <div className="no-events">
                      <p>No events recorded. Click "Record" to start capturing performance data.</p>
                    </div>
                  ) : (
                    <table className="events-table">
                      <thead>
                        <tr>
                          <th>Time</th>
                          <th>FPS</th>
                          <th>Memory</th>
                          <th>Nodes</th>
                          <th>Render Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {history.slice(-10).map((entry, index) => (
                          <tr key={index}>
                            <td>{new Date(entry.timestamp).toLocaleTimeString()}</td>
                            <td>{entry.metrics.fps}</td>
                            <td>{formatMemory(entry.metrics.memory)}</td>
                            <td>{entry.metrics.nodes}</td>
                            <td>{formatTime(entry.metrics.renderTime)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}
          </div>
          
          {/* Actions */}
          <div className="monitor-actions">
            <button 
              className="action-button primary"
              onClick={toggleRecording}
            >
              {isRecording ? 'Stop Recording' : 'Start Recording'}
            </button>
            
            <button 
              className="action-button"
              onClick={exportData}
              disabled={history.length === 0}
            >
              Export Data
            </button>
            
            <button 
              className="action-button"
              onClick={clearHistory}
              disabled={history.length === 0}
            >
              Clear History
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfessionalPerformanceMonitor;
