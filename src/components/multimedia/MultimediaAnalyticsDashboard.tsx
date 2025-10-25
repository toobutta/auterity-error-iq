import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  Users,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  Clock,
  Target,
  Zap,
  Calendar,
  Filter,
  Download
} from '@heroicons/react/24/outline';
import { cn } from '../../utils/cn';
import { OptimizedImage } from '../ui/OptimizedImage';

interface MultimediaAnalytics {
  overview: {
    totalViews: number;
    totalEngagement: number;
    averageWatchTime: number;
    conversionRate: number;
    topPerformingContent: Array<{
      id: string;
      title: string;
      type: 'video' | 'image' | 'social';
      views: number;
      engagement: number;
      performance: number;
    }>;
  };
  contentMetrics: {
    videos: Array<{
      id: string;
      title: string;
      views: number;
      watchTime: number;
      completionRate: number;
      thumbnailClicks: number;
    }>;
    images: Array<{
      id: string;
      title: string;
      views: number;
      likes: number;
      shares: number;
      clicks: number;
    }>;
    socialPosts: Array<{
      id: string;
      platform: string;
      content: string;
      postedAt: string;
      reach: number;
      engagement: number;
      clicks: number;
    }>;
  };
  platformPerformance: Record<string, {
    reach: number;
    engagement: number;
    conversion: number;
    bestPostingTimes: string[];
    topContent: string[];
  }>;
  audienceInsights: {
    demographics: {
      age: Record<string, number>;
      gender: Record<string, number>;
      location: Record<string, number>;
      interests: string[];
    };
    behavior: {
      peakViewingTimes: string[];
      preferredContentTypes: string[];
      engagementPatterns: Record<string, number>;
    };
  };
  trends: {
    growth: number;
    seasonalPatterns: Array<{
      period: string;
      performance: number;
      contentType: string;
    }>;
    emergingTopics: string[];
    competitorAnalysis: Array<{
      competitor: string;
      performance: number;
      strategy: string;
    }>;
  };
}

interface MultimediaAnalyticsDashboardProps {
  data: MultimediaAnalytics;
  timeRange: '7d' | '30d' | '90d' | '1y';
  onTimeRangeChange: (range: '7d' | '30d' | '90d' | '1y') => void;
  filters: {
    platforms: string[];
    contentTypes: string[];
    dateRange: { start: Date; end: Date };
  };
  onFiltersChange: (filters: any) => void;
  className?: string;
}

export const MultimediaAnalyticsDashboard: React.FC<MultimediaAnalyticsDashboardProps> = ({
  data,
  timeRange,
  onTimeRangeChange,
  filters,
  onFiltersChange,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'content' | 'platforms' | 'audience' | 'trends'>('overview');
  const [selectedMetric, setSelectedMetric] = useState<string>('views');

  // Calculate key performance indicators
  const kpis = useMemo(() => {
    const { overview } = data;
    return {
      totalViews: {
        value: overview.totalViews.toLocaleString(),
        change: 12.5,
        trend: 'up'
      },
      engagement: {
        value: `${overview.totalEngagement.toLocaleString()}%`,
        change: 8.2,
        trend: 'up'
      },
      watchTime: {
        value: `${Math.round(overview.averageWatchTime)}m`,
        change: -2.1,
        trend: 'down'
      },
      conversion: {
        value: `${overview.conversionRate.toFixed(1)}%`,
        change: 15.7,
        trend: 'up'
      }
    };
  }, [data]);

  const MetricCard: React.FC<{
    title: string;
    value: string;
    change: number;
    trend: 'up' | 'down' | 'neutral';
    icon: React.ReactNode;
  }> = ({ title, value, change, trend, icon }) => (
    <div className="metric-card">
      <div className="metric-header">
        <div className="metric-icon">{icon}</div>
        <div className="metric-change" data-trend={trend}>
          {trend === 'up' && '+'}{change.toFixed(1)}%
        </div>
      </div>
      <div className="metric-value">{value}</div>
      <div className="metric-title">{title}</div>
    </div>
  );

  const renderOverviewTab = () => (
    <div className="analytics-overview">
      {/* KPI Cards */}
      <div className="kpi-grid">
        <MetricCard
          title="Total Views"
          value={kpis.totalViews.value}
          change={kpis.totalViews.change}
          trend={kpis.totalViews.trend}
          icon={<Eye className="w-6 h-6" />}
        />
        <MetricCard
          title="Engagement Rate"
          value={kpis.engagement.value}
          change={kpis.engagement.change}
          trend={kpis.engagement.trend}
          icon={<Heart className="w-6 h-6" />}
        />
        <MetricCard
          title="Avg Watch Time"
          value={kpis.watchTime.value}
          change={kpis.watchTime.change}
          trend={kpis.watchTime.trend}
          icon={<Clock className="w-6 h-6" />}
        />
        <MetricCard
          title="Conversion Rate"
          value={kpis.conversion.value}
          change={kpis.conversion.change}
          trend={kpis.conversion.trend}
          icon={<Target className="w-6 h-6" />}
        />
      </div>

      {/* Top Performing Content */}
      <div className="top-content-section">
        <h3 className="section-title">Top Performing Content</h3>
        <div className="content-list">
          {data.overview.topPerformingContent.map((content, index) => (
            <div key={content.id} className="content-item">
              <div className="content-rank">{index + 1}</div>
              <div className="content-info">
                <div className="content-title">{content.title}</div>
                <div className="content-meta">
                  <span className="content-type">{content.type}</span>
                  <span className="content-views">{content.views.toLocaleString()} views</span>
                  <span className="content-engagement">{content.engagement.toFixed(1)}% engagement</span>
                </div>
              </div>
              <div className="content-performance">
                <div className="performance-bar">
                  <div
                    className="performance-fill"
                    style={{ width: `${content.performance}%` }}
                  />
                </div>
                <span className="performance-score">{content.performance.toFixed(0)}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Insights */}
      <div className="insights-section">
        <h3 className="section-title">AI Insights</h3>
        <div className="insights-grid">
          <div className="insight-card">
            <div className="insight-icon">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div className="insight-content">
              <h4>Content Strategy</h4>
              <p>Video content is performing 40% better than images. Consider increasing video production.</p>
            </div>
          </div>
          <div className="insight-card">
            <div className="insight-icon">
              <Clock className="w-5 h-5" />
            </div>
            <div className="insight-content">
              <h4>Optimal Posting Time</h4>
              <p>Best engagement occurs between 2-4 PM EST. Schedule high-value content during this window.</p>
            </div>
          </div>
          <div className="insight-card">
            <div className="insight-icon">
              <Users className="w-5 h-5" />
            </div>
            <div className="insight-content">
              <h4>Audience Growth</h4>
              <p>Audience has grown 25% this month. Focus on retaining new viewers with follow-up content.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderContentTab = () => (
    <div className="analytics-content">
      {/* Content Type Selector */}
      <div className="content-type-selector">
        <button
          className={cn('content-type-btn', { active: selectedMetric === 'videos' })}
          onClick={() => setSelectedMetric('videos')}
        >
          Videos ({data.contentMetrics.videos.length})
        </button>
        <button
          className={cn('content-type-btn', { active: selectedMetric === 'images' })}
          onClick={() => setSelectedMetric('images')}
        >
          Images ({data.contentMetrics.images.length})
        </button>
        <button
          className={cn('content-type-btn', { active: selectedMetric === 'social' })}
          onClick={() => setSelectedMetric('social')}
        >
          Social Posts ({data.contentMetrics.socialPosts.length})
        </button>
      </div>

      {/* Content Performance Table */}
      <div className="content-performance-table">
        {selectedMetric === 'videos' && (
          <div className="video-metrics">
            <div className="table-header">
              <span>Title</span>
              <span>Views</span>
              <span>Watch Time</span>
              <span>Completion</span>
              <span>CTR</span>
            </div>
            {data.contentMetrics.videos.map(video => (
              <div key={video.id} className="table-row">
                <div className="video-title">{video.title}</div>
                <div className="metric">{video.views.toLocaleString()}</div>
                <div className="metric">{Math.round(video.watchTime)}m</div>
                <div className="metric">{video.completionRate.toFixed(1)}%</div>
                <div className="metric">{(video.thumbnailClicks / video.views * 100).toFixed(1)}%</div>
              </div>
            ))}
          </div>
        )}

        {selectedMetric === 'images' && (
          <div className="image-metrics">
            <div className="table-header">
              <span>Title</span>
              <span>Views</span>
              <span>Likes</span>
              <span>Shares</span>
              <span>Clicks</span>
            </div>
            {data.contentMetrics.images.map(image => (
              <div key={image.id} className="table-row">
                <div className="image-title">{image.title}</div>
                <div className="metric">{image.views.toLocaleString()}</div>
                <div className="metric">{image.likes.toLocaleString()}</div>
                <div className="metric">{image.shares.toLocaleString()}</div>
                <div className="metric">{image.clicks.toLocaleString()}</div>
              </div>
            ))}
          </div>
        )}

        {selectedMetric === 'social' && (
          <div className="social-metrics">
            <div className="table-header">
              <span>Content</span>
              <span>Platform</span>
              <span>Reach</span>
              <span>Engagement</span>
              <span>Clicks</span>
            </div>
            {data.contentMetrics.socialPosts.map(post => (
              <div key={post.id} className="table-row">
                <div className="post-content">{post.content.substring(0, 50)}...</div>
                <div className="platform">{post.platform}</div>
                <div className="metric">{post.reach.toLocaleString()}</div>
                <div className="metric">{post.engagement.toLocaleString()}</div>
                <div className="metric">{post.clicks.toLocaleString()}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderPlatformsTab = () => (
    <div className="analytics-platforms">
      <div className="platforms-grid">
        {Object.entries(data.platformPerformance).map(([platform, metrics]) => (
          <div key={platform} className="platform-card">
            <div className="platform-header">
              <div className="platform-icon">
                {platform === 'instagram' && '📷'}
                {platform === 'tiktok' && '🎵'}
                {platform === 'youtube' && '📺'}
                {platform === 'linkedin' && '💼'}
                {platform === 'twitter' && '🐦'}
                {platform === 'facebook' && '👥'}
              </div>
              <div className="platform-name">{platform}</div>
            </div>

            <div className="platform-metrics">
              <div className="metric">
                <span className="metric-label">Reach</span>
                <span className="metric-value">{metrics.reach.toLocaleString()}</span>
              </div>
              <div className="metric">
                <span className="metric-label">Engagement</span>
                <span className="metric-value">{metrics.engagement.toLocaleString()}</span>
              </div>
              <div className="metric">
                <span className="metric-label">Conversion</span>
                <span className="metric-value">{metrics.conversion.toFixed(1)}%</span>
              </div>
            </div>

            <div className="platform-insights">
              <h4>Best Posting Times</h4>
              <div className="posting-times">
                {metrics.bestPostingTimes.map(time => (
                  <span key={time} className="posting-time">{time}</span>
                ))}
              </div>

              <h4>Top Content Types</h4>
              <div className="top-content">
                {metrics.topContent.slice(0, 3).map(content => (
                  <span key={content} className="content-type">{content}</span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderAudienceTab = () => (
    <div className="analytics-audience">
      {/* Demographics */}
      <div className="demographics-section">
        <h3 className="section-title">Audience Demographics</h3>
        <div className="demographics-grid">
          <div className="demographic-card">
            <h4>Age Distribution</h4>
            <div className="age-chart">
              {Object.entries(data.audienceInsights.demographics.age).map(([age, percentage]) => (
                <div key={age} className="age-bar">
                  <span className="age-label">{age}</span>
                  <div className="bar">
                    <div className="fill" style={{ width: `${percentage}%` }} />
                  </div>
                  <span className="percentage">{percentage.toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="demographic-card">
            <h4>Gender Distribution</h4>
            <div className="gender-chart">
              {Object.entries(data.audienceInsights.demographics.gender).map(([gender, percentage]) => (
                <div key={gender} className="gender-segment">
                  <span className="gender-label">{gender}</span>
                  <span className="percentage">{percentage.toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="demographic-card">
            <h4>Top Locations</h4>
            <div className="location-list">
              {Object.entries(data.audienceInsights.demographics.location)
                .slice(0, 5)
                .map(([location, percentage]) => (
                <div key={location} className="location-item">
                  <span className="location">{location}</span>
                  <span className="percentage">{percentage.toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Interests */}
      <div className="interests-section">
        <h3 className="section-title">Audience Interests</h3>
        <div className="interests-cloud">
          {data.audienceInsights.demographics.interests.map(interest => (
            <span key={interest} className="interest-tag">{interest}</span>
          ))}
        </div>
      </div>

      {/* Behavior */}
      <div className="behavior-section">
        <h3 className="section-title">Viewing Behavior</h3>
        <div className="behavior-grid">
          <div className="behavior-card">
            <h4>Peak Viewing Times</h4>
            <div className="peak-times">
              {data.audienceInsights.behavior.peakViewingTimes.map(time => (
                <span key={time} className="peak-time">{time}</span>
              ))}
            </div>
          </div>

          <div className="behavior-card">
            <h4>Preferred Content Types</h4>
            <div className="content-preferences">
              {data.audienceInsights.behavior.preferredContentTypes.map(type => (
                <span key={type} className="content-type">{type}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTrendsTab = () => (
    <div className="analytics-trends">
      {/* Growth Trends */}
      <div className="growth-section">
        <h3 className="section-title">Growth Trends</h3>
        <div className="growth-metric">
          <div className="growth-value">
            <span className="percentage">{data.trends.growth > 0 ? '+' : ''}{data.trends.growth.toFixed(1)}%</span>
            <span className="period">vs last period</span>
          </div>
          <div className="growth-chart">
            {/* Placeholder for growth chart */}
            <div className="chart-placeholder">Growth Trend Chart</div>
          </div>
        </div>
      </div>

      {/* Seasonal Patterns */}
      <div className="seasonal-section">
        <h3 className="section-title">Seasonal Patterns</h3>
        <div className="seasonal-patterns">
          {data.trends.seasonalPatterns.map(pattern => (
            <div key={pattern.period} className="pattern-card">
              <div className="pattern-period">{pattern.period}</div>
              <div className="pattern-performance">
                <div className="performance-bar">
                  <div
                    className="performance-fill"
                    style={{ width: `${pattern.performance}%` }}
                  />
                </div>
                <span className="performance-value">{pattern.performance.toFixed(0)}%</span>
              </div>
              <div className="pattern-type">{pattern.contentType}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Emerging Topics */}
      <div className="topics-section">
        <h3 className="section-title">Emerging Topics</h3>
        <div className="topics-list">
          {data.trends.emergingTopics.map(topic => (
            <span key={topic} className="topic-tag">{topic}</span>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className={cn('multimedia-analytics-dashboard', className)}>
      {/* Header */}
      <div className="analytics-header">
        <div className="header-left">
          <h1 className="analytics-title">Multimedia Analytics</h1>
          <div className="time-range-selector">
            {(['7d', '30d', '90d', '1y'] as const).map(range => (
              <button
                key={range}
                className={cn('time-range-btn', { active: timeRange === range })}
                onClick={() => onTimeRangeChange(range)}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        <div className="header-actions">
          <button className="action-btn">
            <Filter className="w-4 h-4" />
            Filters
          </button>
          <button className="action-btn">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="analytics-tabs">
        <button
          className={cn('tab-btn', { active: activeTab === 'overview' })}
          onClick={() => setActiveTab('overview')}
        >
          <BarChart3 className="w-4 h-4" />
          Overview
        </button>
        <button
          className={cn('tab-btn', { active: activeTab === 'content' })}
          onClick={() => setActiveTab('content')}
        >
          <Eye className="w-4 h-4" />
          Content
        </button>
        <button
          className={cn('tab-btn', { active: activeTab === 'platforms' })}
          onClick={() => setActiveTab('platforms')}
        >
          <Share2 className="w-4 h-4" />
          Platforms
        </button>
        <button
          className={cn('tab-btn', { active: activeTab === 'audience' })}
          onClick={() => setActiveTab('audience')}
        >
          <Users className="w-4 h-4" />
          Audience
        </button>
        <button
          className={cn('tab-btn', { active: activeTab === 'trends' })}
          onClick={() => setActiveTab('trends')}
        >
          <TrendingUp className="w-4 h-4" />
          Trends
        </button>
      </div>

      {/* Tab Content */}
      <div className="analytics-content">
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'content' && renderContentTab()}
        {activeTab === 'platforms' && renderPlatformsTab()}
        {activeTab === 'audience' && renderAudienceTab()}
        {activeTab === 'trends' && renderTrendsTab()}
      </div>
    </div>
  );
};
