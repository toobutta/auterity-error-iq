import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import {
  PhotoIcon,
  VideoCameraIcon,
  CpuChipIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  Squares2X2Icon,
  CloudArrowUpIcon,
  PaintBrushIcon
} from '@heroicons/react/24/outline';

// Import multimedia components
import { MediaUploadPanel } from '../../components/multimedia/MediaUploadPanel';
import { VideoTimelineEditor } from '../../components/multimedia/VideoTimelineEditor';
import { MultimediaAnalyticsDashboard } from '../../components/multimedia/MultimediaAnalyticsDashboard';

// Import existing components
import { EnhancedCanvas } from '../../components/canvas/EnhancedCanvas';
import { UnifiedNavigation } from '../../components/navigation/UnifiedNavigation';
import { CommandPalette } from '../../components/ui/CommandPalette';

// Types
interface MultimediaProject {
  id: string;
  name: string;
  type: 'video' | 'image' | 'social' | 'content';
  status: 'draft' | 'processing' | 'completed' | 'published';
  createdAt: Date;
  updatedAt: Date;
  thumbnail?: string;
  progress?: number;
}

interface StudioState {
  currentProject: MultimediaProject | null;
  projects: MultimediaProject[];
  activeTool: 'canvas' | 'editor' | 'analytics' | 'upload';
  sidebarCollapsed: boolean;
}

export const MultimediaStudio: React.FC = () => {
  const location = useLocation();
  const [studioState, setStudioState] = useState<StudioState>({
    currentProject: null,
    projects: [],
    activeTool: 'canvas',
    sidebarCollapsed: false
  });

  const [showUploadPanel, setShowUploadPanel] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);

  // Navigation items for multimedia studio
  const navigationItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <Squares2X2Icon className="w-5 h-5" />,
      path: '/multimedia',
      active: location.pathname === '/multimedia'
    },
    {
      id: 'canvas',
      label: 'Workflow Canvas',
      icon: <PaintBrushIcon className="w-5 h-5" />,
      path: '/multimedia/canvas',
      active: location.pathname === '/multimedia/canvas'
    },
    {
      id: 'editor',
      label: 'Video Editor',
      icon: <VideoCameraIcon className="w-5 h-5" />,
      path: '/multimedia/editor',
      active: location.pathname === '/multimedia/editor'
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: <ChartBarIcon className="w-5 h-5" />,
      path: '/multimedia/analytics',
      active: location.pathname === '/multimedia/analytics'
    },
    {
      id: 'ai-tools',
      label: 'AI Tools',
      icon: <CpuChipIcon className="w-5 h-5" />,
      path: '/multimedia/ai',
      active: location.pathname.startsWith('/multimedia/ai')
    }
  ];

  // Quick actions for multimedia studio
  const quickActions = [
    {
      id: 'upload-media',
      label: 'Upload Media',
      icon: <CloudArrowUpIcon className="w-4 h-4" />,
      action: () => setShowUploadPanel(true),
      shortcut: 'Ctrl+Shift+U'
    },
    {
      id: 'new-project',
      label: 'New Project',
      icon: <PhotoIcon className="w-4 h-4" />,
      action: () => handleNewProject(),
      shortcut: 'Ctrl+N'
    },
    {
      id: 'command-palette',
      label: 'Command Palette',
      icon: <Cog6ToothIcon className="w-4 h-4" />,
      action: () => setShowCommandPalette(true),
      shortcut: 'Ctrl+K'
    }
  ];

  const handleNewProject = () => {
    const newProject: MultimediaProject = {
      id: `project_${Date.now()}`,
      name: 'New Multimedia Project',
      type: 'video',
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    setStudioState(prev => ({
      ...prev,
      projects: [newProject, ...prev.projects],
      currentProject: newProject
    }));
  };

  const handleProjectSelect = (project: MultimediaProject) => {
    setStudioState(prev => ({
      ...prev,
      currentProject: project
    }));
  };

  // Load projects on component mount
  useEffect(() => {
    // Simulate loading projects from API
    const mockProjects: MultimediaProject[] = [
      {
        id: 'project_1',
        name: 'Social Media Campaign - Q1',
        type: 'social',
        status: 'completed',
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-20'),
        thumbnail: '/thumbnails/social-campaign.jpg'
      },
      {
        id: 'project_2',
        name: 'Product Demo Video',
        type: 'video',
        status: 'processing',
        createdAt: new Date('2024-01-18'),
        updatedAt: new Date('2024-01-22'),
        thumbnail: '/thumbnails/product-demo.jpg',
        progress: 65
      },
      {
        id: 'project_3',
        name: 'Brand Image Collection',
        type: 'image',
        status: 'draft',
        createdAt: new Date('2024-01-20'),
        updatedAt: new Date('2024-01-20')
      }
    ];

    setStudioState(prev => ({
      ...prev,
      projects: mockProjects,
      currentProject: mockProjects[0]
    }));
  }, []);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey) {
        switch (event.key) {
          case 'U':
            event.preventDefault();
            setShowUploadPanel(true);
            break;
          case 'N':
            event.preventDefault();
            handleNewProject();
            break;
        }
      }

      if (event.ctrlKey && event.key === 'k') {
        event.preventDefault();
        setShowCommandPalette(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="multimedia-studio">
      {/* Navigation Header */}
      <UnifiedNavigation
        items={navigationItems}
        quickActions={quickActions}
        user={{
          name: 'Multimedia Creator',
          avatar: '/avatars/multimedia-user.jpg',
          role: 'Content Creator'
        }}
        notifications={[
          {
            id: '1',
            type: 'success',
            title: 'Video processing completed',
            message: 'Your product demo video is ready for review',
            timestamp: new Date(),
            read: false
          }
        ]}
      />

      {/* Main Content Area */}
      <div className="studio-main">
        {/* Sidebar */}
        <div className={`studio-sidebar ${studioState.sidebarCollapsed ? 'collapsed' : ''}`}>
          <div className="sidebar-header">
            <h3>Projects</h3>
            <button
              className="sidebar-toggle"
              onClick={() => setStudioState(prev => ({
                ...prev,
                sidebarCollapsed: !prev.sidebarCollapsed
              }))}
            >
              {studioState.sidebarCollapsed ? '→' : '←'}
            </button>
          </div>

          <div className="projects-list">
            {studioState.projects.map(project => (
              <div
                key={project.id}
                className={`project-item ${studioState.currentProject?.id === project.id ? 'active' : ''}`}
                onClick={() => handleProjectSelect(project)}
              >
                <div className="project-icon">
                  {project.type === 'video' && <VideoCameraIcon className="w-4 h-4" />}
                  {project.type === 'image' && <PhotoIcon className="w-4 h-4" />}
                  {project.type === 'social' && <ChartBarIcon className="w-4 h-4" />}
                </div>

                <div className="project-info">
                  <div className="project-name">{project.name}</div>
                  <div className="project-meta">
                    <span className={`project-status status-${project.status}`}>
                      {project.status}
                    </span>
                    {project.progress && (
                      <span className="project-progress">{project.progress}%</span>
                    )}
                  </div>
                </div>

                {project.thumbnail && (
                  <div className="project-thumbnail">
                    <img src={project.thumbnail} alt={project.name} />
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="sidebar-actions">
            <button className="action-btn primary" onClick={handleNewProject}>
              <PhotoIcon className="w-4 h-4" />
              New Project
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="studio-content">
          <Routes>
            <Route
              path="/"
              element={<MultimediaDashboard studioState={studioState} />}
            />
            <Route
              path="/canvas"
              element={<MultimediaCanvas studioState={studioState} />}
            />
            <Route
              path="/editor"
              element={<MultimediaEditor studioState={studioState} />}
            />
            <Route
              path="/analytics"
              element={<MultimediaAnalytics studioState={studioState} />}
            />
            <Route
              path="/ai/*"
              element={<MultimediaAITools studioState={studioState} />}
            />
            <Route
              path="*"
              element={<Navigate to="/multimedia" replace />}
            />
          </Routes>
        </div>
      </div>

      {/* Upload Panel */}
      {showUploadPanel && (
        <MediaUploadPanel
          isOpen={showUploadPanel}
          onClose={() => setShowUploadPanel(false)}
          onFilesUploaded={(files) => {
            console.log('Files uploaded:', files);
            setShowUploadPanel(false);
          }}
          acceptedTypes={['image/*', 'video/*']}
          maxFileSize={500}
          maxFiles={10}
          allowMultiple={true}
        />
      )}

      {/* Command Palette */}
      <CommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        currentContext={{
          page: 'multimedia-studio',
          workflowId: studioState.currentProject?.id,
          selectedItems: []
        }}
      />
    </div>
  );
};

// Dashboard Component
const MultimediaDashboard: React.FC<{ studioState: StudioState }> = ({ studioState }) => {
  return (
    <div className="multimedia-dashboard">
      <div className="dashboard-header">
        <h1>Multimedia Studio Dashboard</h1>
        <p>Create, edit, and manage your multimedia content</p>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <h3>Recent Projects</h3>
          <div className="projects-preview">
            {studioState.projects.slice(0, 3).map(project => (
              <div key={project.id} className="project-preview">
                <div className="project-preview-icon">
                  {project.type === 'video' && <VideoCameraIcon className="w-6 h-6" />}
                  {project.type === 'image' && <PhotoIcon className="w-6 h-6" />}
                </div>
                <div className="project-preview-info">
                  <h4>{project.name}</h4>
                  <span className={`status status-${project.status}`}>{project.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="dashboard-card">
          <h3>Quick Actions</h3>
          <div className="quick-actions">
            <button className="quick-action-btn">
              <CloudArrowUpIcon className="w-5 h-5" />
              Upload Media
            </button>
            <button className="quick-action-btn">
              <VideoCameraIcon className="w-5 h-5" />
              New Video
            </button>
            <button className="quick-action-btn">
              <PhotoIcon className="w-5 h-5" />
              New Image
            </button>
          </div>
        </div>

        <div className="dashboard-card">
          <h3>AI Tools</h3>
          <div className="ai-tools">
            <button className="ai-tool-btn">
              <CpuChipIcon className="w-5 h-5" />
              Generate Content
            </button>
            <button className="ai-tool-btn">
              <PaintBrushIcon className="w-5 h-5" />
              Enhance Media
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Canvas Component
const MultimediaCanvas: React.FC<{ studioState: StudioState }> = ({ studioState }) => {
  return (
    <div className="multimedia-canvas">
      <EnhancedCanvas />
    </div>
  );
};

// Editor Component
const MultimediaEditor: React.FC<{ studioState: StudioState }> = ({ studioState }) => {
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(120); // 2 minutes
  const [isPlaying, setIsPlaying] = useState(false);

  const mockClips = [
    {
      id: 'clip1',
      name: 'Intro Scene',
      startTime: 0,
      endTime: 15,
      duration: 15,
      type: 'video' as const,
      effects: []
    },
    {
      id: 'clip2',
      name: 'Main Content',
      startTime: 15,
      endTime: 90,
      duration: 75,
      type: 'video' as const,
      effects: []
    },
    {
      id: 'clip3',
      name: 'Outro',
      startTime: 90,
      endTime: 120,
      duration: 30,
      type: 'video' as const,
      effects: []
    }
  ];

  return (
    <div className="multimedia-editor">
      <VideoTimelineEditor
        videoClips={mockClips}
        onClipsChange={(clips) => console.log('Clips updated:', clips)}
        duration={duration}
        currentTime={currentTime}
        onTimeChange={setCurrentTime}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onStop={() => {
          setIsPlaying(false);
          setCurrentTime(0);
        }}
        isPlaying={isPlaying}
      />
    </div>
  );
};

// Analytics Component
const MultimediaAnalytics: React.FC<{ studioState: StudioState }> = ({ studioState }) => {
  // Mock analytics data
  const mockAnalytics = {
    overview: {
      totalViews: 125430,
      totalEngagement: 8.5,
      averageWatchTime: 4.2,
      conversionRate: 3.2,
      topPerformingContent: [
        {
          id: 'content1',
          title: 'Product Demo Video',
          type: 'video',
          views: 45230,
          engagement: 12.5,
          performance: 95
        },
        {
          id: 'content2',
          title: 'Brand Story Image',
          type: 'image',
          views: 32150,
          engagement: 8.2,
          performance: 87
        }
      ]
    },
    contentMetrics: {
      videos: [],
      images: [],
      socialPosts: []
    },
    platformPerformance: {},
    audienceInsights: {
      demographics: {
        age: { '18-24': 25, '25-34': 35, '35-44': 25, '45+': 15 },
        gender: { 'Male': 55, 'Female': 45 },
        location: { 'United States': 45, 'United Kingdom': 20, 'Canada': 15, 'Other': 20 },
        interests: ['Technology', 'Business', 'Design', 'Marketing']
      },
      behavior: {
        peakViewingTimes: ['2:00 PM', '7:00 PM', '9:00 PM'],
        preferredContentTypes: ['Educational', 'Product Demo', 'Tutorial'],
        engagementPatterns: {}
      }
    },
    trends: {
      growth: 15.7,
      seasonalPatterns: [],
      emergingTopics: ['AI Content Creation', 'Video Marketing', 'Social Commerce'],
      competitorAnalysis: []
    }
  };

  return (
    <MultimediaAnalyticsDashboard
      data={mockAnalytics}
      timeRange="30d"
      onTimeRangeChange={(range) => console.log('Time range changed:', range)}
      filters={{
        platforms: [],
        contentTypes: [],
        dateRange: { start: new Date(), end: new Date() }
      }}
      onFiltersChange={(filters) => console.log('Filters changed:', filters)}
    />
  );
};

// AI Tools Component
const MultimediaAITools: React.FC<{ studioState: StudioState }> = ({ studioState }) => {
  return (
    <div className="multimedia-ai-tools">
      <div className="ai-tools-header">
        <h1>AI Multimedia Tools</h1>
        <p>Leverage AI to enhance your multimedia content creation</p>
      </div>

      <div className="ai-tools-grid">
        <div className="ai-tool-card">
          <div className="tool-icon">
            <VideoCameraIcon className="w-8 h-8" />
          </div>
          <h3>Video Generation</h3>
          <p>Create videos from text descriptions using AI</p>
          <button className="tool-btn">Generate Video</button>
        </div>

        <div className="ai-tool-card">
          <div className="tool-icon">
            <PhotoIcon className="w-8 h-8" />
          </div>
          <h3>Image Enhancement</h3>
          <p>Enhance and optimize images with AI</p>
          <button className="tool-btn">Enhance Image</button>
        </div>

        <div className="ai-tool-card">
          <div className="tool-icon">
            <CpuChipIcon className="w-8 h-8" />
          </div>
          <h3>Content Analysis</h3>
          <p>Analyze multimedia content with AI insights</p>
          <button className="tool-btn">Analyze Content</button>
        </div>

        <div className="ai-tool-card">
          <div className="tool-icon">
            <ChartBarIcon className="w-8 h-8" />
          </div>
          <h3>Performance Prediction</h3>
          <p>Predict content performance with AI</p>
          <button className="tool-btn">Predict Performance</button>
        </div>
      </div>
    </div>
  );
};
