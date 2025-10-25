/**
 * Multimedia Workflow Templates
 *
 * Pre-built workflow templates for common multimedia processing tasks,
 * integrating with the existing template system and extending it with
 * multimedia-specific capabilities
 */

import { WorkflowTemplateSchema } from '../services/templateGenerator';

// Multimedia workflow template categories
export const MULTIMEDIA_TEMPLATE_CATEGORIES = {
  VIDEO_PRODUCTION: 'Video Production',
  SOCIAL_MEDIA: 'Social Media',
  CONTENT_CREATION: 'Content Creation',
  IMAGE_PROCESSING: 'Image Processing',
  BRAND_MANAGEMENT: 'Brand Management',
  AUTOMATION: 'Automation'
};

// Social Media Campaign Template
export const SOCIAL_MEDIA_CAMPAIGN_TEMPLATE: WorkflowTemplateSchema = {
  id: 'multimedia-social-campaign',
  name: 'Social Media Content Campaign',
  description: 'Complete workflow for creating, optimizing, and scheduling social media content across multiple platforms',
  category: 'multimedia',
  difficulty: 'intermediate',
  estimatedTime: 45,
  vercelTemplate: {
    name: 'Social Media Campaign',
    description: 'Automated social media content creation and distribution',
    framework: 'nextjs',
    aiFeatures: ['content-generation', 'image-processing', 'social-optimization'],
    deployment: {
      platform: 'vercel',
      aiGateway: true,
      edgeFunctions: true
    },
    components: [
      {
        name: 'SocialContentGenerator',
        type: 'generative-ui',
        aiSdkPattern: 'generateObject',
        implementation: 'AI-powered content creation with platform optimization'
      },
      {
        name: 'MediaProcessor',
        type: 'tools',
        aiSdkPattern: 'tool calling',
        implementation: 'Image and video processing with AI enhancement'
      },
      {
        name: 'SocialScheduler',
        type: 'chatbot',
        aiSdkPattern: 'useChat',
        implementation: 'Intelligent scheduling based on audience analytics'
      }
    ],
    apiRoutes: [
      {
        path: '/api/social/generate-content',
        method: 'POST',
        aiFunction: 'generateObject',
        description: 'Generate optimized social media content'
      },
      {
        path: '/api/social/schedule',
        method: 'POST',
        aiFunction: 'generateObject',
        description: 'Schedule posts with optimal timing'
      },
      {
        path: '/api/media/process',
        method: 'POST',
        aiFunction: 'tool calling',
        description: 'Process and optimize media files'
      }
    ],
    environment: {
      OPENAI_API_KEY: 'your-openai-key',
      ANTHROPIC_API_KEY: 'your-anthropic-key',
      SOCIAL_PLATFORMS: 'instagram,tiktok,youtube'
    },
    dependencies: {
      '@ai-sdk/openai': '^2.0.23',
      '@ai-sdk/anthropic': '^2.0.9',
      'sharp': '^0.32.6',
      '@ffmpeg/ffmpeg': '^0.12.6'
    }
  },
  workflowSteps: [
    {
      id: 'content-generator',
      type: 'ai.content-generator',
      name: 'Content Generator',
      config: {
        platforms: ['instagram', 'tiktok', 'linkedin'],
        tone: 'professional',
        contentType: 'mixed',
        targetAudience: 'tech-professionals'
      },
      position: { x: 100, y: 100 }
    },
    {
      id: 'media-processor',
      type: 'multimedia.media-processor',
      name: 'Media Processor',
      config: {
        resizeImages: true,
        targetDimensions: '1080x1080',
        format: 'jpg',
        quality: 0.85
      },
      position: { x: 400, y: 100 }
    },
    {
      id: 'social-optimizer',
      type: 'multimedia.social-optimizer',
      name: 'Social Media Optimizer',
      config: {
        generateHashtags: true,
        optimizeCaptions: true,
        schedulePosts: true,
        bestTimeAnalysis: true
      },
      position: { x: 700, y: 100 }
    },
    {
      id: 'scheduler',
      type: 'multimedia.scheduler',
      name: 'Content Scheduler',
      config: {
        platforms: ['instagram', 'linkedin', 'twitter'],
        frequency: 'daily',
        timezone: 'America/New_York'
      },
      position: { x: 1000, y: 100 }
    }
  ],
  connections: [
    {
      id: 'content-to-media',
      source: 'content-generator',
      target: 'media-processor',
      label: 'Generated Content'
    },
    {
      id: 'media-to-optimizer',
      source: 'media-processor',
      target: 'social-optimizer',
      label: 'Processed Media'
    },
    {
      id: 'optimizer-to-scheduler',
      source: 'social-optimizer',
      target: 'scheduler',
      label: 'Optimized Content'
    }
  ],
  customizationOptions: [
    {
      name: 'Target Platforms',
      type: 'multiselect',
      required: true,
      default: ['instagram', 'linkedin'],
      options: [
        { value: 'instagram', label: 'Instagram' },
        { value: 'tiktok', label: 'TikTok' },
        { value: 'youtube', label: 'YouTube' },
        { value: 'linkedin', label: 'LinkedIn' },
        { value: 'twitter', label: 'Twitter' },
        { value: 'facebook', label: 'Facebook' }
      ],
      description: 'Select social media platforms for content distribution'
    },
    {
      name: 'Content Tone',
      type: 'select',
      required: false,
      default: 'professional',
      options: [
        { value: 'professional', label: 'Professional' },
        { value: 'casual', label: 'Casual' },
        { value: 'inspirational', label: 'Inspirational' },
        { value: 'educational', label: 'Educational' },
        { value: 'entertaining', label: 'Entertaining' }
      ],
      description: 'Tone of voice for generated content'
    },
    {
      name: 'Posting Frequency',
      type: 'select',
      required: false,
      default: 'daily',
      options: [
        { value: 'multiple-daily', label: 'Multiple posts per day' },
        { value: 'daily', label: 'Once per day' },
        { value: 'weekly', label: 'Weekly' },
        { value: 'bi-weekly', label: 'Bi-weekly' }
      ],
      description: 'How often to post content'
    }
  ]
};

// Video Production Pipeline Template
export const VIDEO_PRODUCTION_TEMPLATE: WorkflowTemplateSchema = {
  id: 'multimedia-video-production',
  name: 'Professional Video Production Pipeline',
  description: 'Complete video editing, processing, and publishing workflow with AI assistance',
  category: 'multimedia',
  difficulty: 'advanced',
  estimatedTime: 90,
  vercelTemplate: {
    name: 'Video Production Pipeline',
    description: 'Professional video editing and publishing with AI',
    framework: 'nextjs',
    aiFeatures: ['video-analysis', 'content-generation', 'automation'],
    deployment: {
      platform: 'vercel',
      aiGateway: true,
      edgeFunctions: true
    },
    components: [
      {
        name: 'VideoEditor',
        type: 'generative-ui',
        aiSdkPattern: 'generateObject',
        implementation: 'AI-powered video editing interface'
      },
      {
        name: 'VideoProcessor',
        type: 'tools',
        aiSdkPattern: 'tool calling',
        implementation: 'Advanced video processing and compression'
      },
      {
        name: 'ContentAnalyzer',
        type: 'rag',
        aiSdkPattern: 'generateEmbeddings',
        implementation: 'Video content analysis and insights'
      }
    ],
    apiRoutes: [
      {
        path: '/api/video/edit',
        method: 'POST',
        aiFunction: 'tool calling',
        description: 'AI-powered video editing operations'
      },
      {
        path: '/api/video/analyze',
        method: 'POST',
        aiFunction: 'generateEmbeddings',
        description: 'Analyze video content and generate insights'
      },
      {
        path: '/api/video/publish',
        method: 'POST',
        aiFunction: 'generateObject',
        description: 'Publish video to multiple platforms'
      }
    ],
    environment: {
      OPENAI_API_KEY: 'your-openai-key',
      FFMPEG_WASM: 'true',
      VIDEO_STORAGE: 'cloudflare-stream'
    },
    dependencies: {
      '@ai-sdk/openai': '^2.0.23',
      '@ffmpeg/ffmpeg': '^0.12.6',
      'sharp': '^0.32.6',
      'react-player': '^2.13.0'
    }
  },
  workflowSteps: [
    {
      id: 'video-upload',
      type: 'multimedia.video-upload',
      name: 'Video Upload',
      config: {
        acceptedFormats: ['mp4', 'mov', 'avi', 'webm'],
        maxFileSize: 2000,
        allowMultiple: true,
        autoProcess: true
      },
      position: { x: 100, y: 100 }
    },
    {
      id: 'video-analyzer',
      type: 'multimedia.video-analyzer',
      name: 'Video Analyzer',
      config: {
        extractThumbnails: true,
        generateTranscript: true,
        detectScenes: true,
        analyzeQuality: true
      },
      position: { x: 400, y: 100 }
    },
    {
      id: 'video-editor',
      type: 'multimedia.video-editor',
      name: 'Video Editor',
      config: {
        enableTimeline: true,
        allowEffects: true,
        autoCaptions: true,
        qualityPresets: ['web', 'social', 'professional']
      },
      position: { x: 700, y: 100 }
    },
    {
      id: 'video-processor',
      type: 'multimedia.video-processor',
      name: 'Video Processor',
      config: {
        compressionEnabled: true,
        targetFormats: ['mp4', 'webm'],
        qualityOptimization: true,
        thumbnailGeneration: true
      },
      position: { x: 1000, y: 100 }
    },
    {
      id: 'content-publisher',
      type: 'multimedia.content-publisher',
      name: 'Content Publisher',
      config: {
        platforms: ['youtube', 'vimeo', 'social-media'],
        autoSchedule: true,
        generateMetadata: true
      },
      position: { x: 1300, y: 100 }
    }
  ],
  connections: [
    {
      id: 'upload-to-analyzer',
      source: 'video-upload',
      target: 'video-analyzer',
      label: 'Raw Video'
    },
    {
      id: 'analyzer-to-editor',
      source: 'video-analyzer',
      target: 'video-editor',
      label: 'Analyzed Video'
    },
    {
      id: 'editor-to-processor',
      source: 'video-editor',
      target: 'video-processor',
      label: 'Edited Video'
    },
    {
      id: 'processor-to-publisher',
      source: 'video-processor',
      target: 'content-publisher',
      label: 'Processed Video'
    }
  ],
  customizationOptions: [
    {
      name: 'Video Quality',
      type: 'select',
      required: true,
      default: 'professional',
      options: [
        { value: 'web', label: 'Web Optimized' },
        { value: 'social', label: 'Social Media' },
        { value: 'professional', label: 'Professional' },
        { value: 'cinematic', label: 'Cinematic' }
      ],
      description: 'Target quality and format for final video'
    },
    {
      name: 'Auto Features',
      type: 'multiselect',
      required: false,
      default: ['captions', 'thumbnails'],
      options: [
        { value: 'captions', label: 'Auto Captions' },
        { value: 'thumbnails', label: 'Auto Thumbnails' },
        { value: 'music', label: 'Background Music' },
        { value: 'effects', label: 'Video Effects' },
        { value: 'transitions', label: 'Smooth Transitions' }
      ],
      description: 'Enable AI-powered automation features'
    },
    {
      name: 'Publishing Platforms',
      type: 'multiselect',
      required: true,
      default: ['youtube'],
      options: [
        { value: 'youtube', label: 'YouTube' },
        { value: 'vimeo', label: 'Vimeo' },
        { value: 'instagram', label: 'Instagram' },
        { value: 'tiktok', label: 'TikTok' },
        { value: 'linkedin', label: 'LinkedIn' }
      ],
      description: 'Platforms to publish the final video'
    }
  ]
};

// Content Creation Automation Template
export const CONTENT_AUTOMATION_TEMPLATE: WorkflowTemplateSchema = {
  id: 'multimedia-content-automation',
  name: 'AI Content Creation Automation',
  description: 'Fully automated content creation from ideas to published media using AI',
  category: 'multimedia',
  difficulty: 'advanced',
  estimatedTime: 60,
  vercelTemplate: {
    name: 'Content Automation Suite',
    description: 'AI-powered content creation and automation',
    framework: 'nextjs',
    aiFeatures: ['content-generation', 'image-generation', 'video-generation', 'automation'],
    deployment: {
      platform: 'vercel',
      aiGateway: true,
      edgeFunctions: true
    },
    components: [
      {
        name: 'IdeaGenerator',
        type: 'generative-ui',
        aiSdkPattern: 'generateObject',
        implementation: 'AI-powered content idea generation'
      },
      {
        name: 'ContentCreator',
        type: 'chatbot',
        aiSdkPattern: 'useChat',
        implementation: 'Multi-format content creation'
      },
      {
        name: 'MediaGenerator',
        type: 'tools',
        aiSdkPattern: 'tool calling',
        implementation: 'AI image and video generation'
      },
      {
        name: 'AutomationEngine',
        type: 'rag',
        aiSdkPattern: 'generateEmbeddings',
        implementation: 'Intelligent content automation'
      }
    ],
    apiRoutes: [
      {
        path: '/api/content/generate-ideas',
        method: 'POST',
        aiFunction: 'generateObject',
        description: 'Generate content ideas based on trends'
      },
      {
        path: '/api/content/create',
        method: 'POST',
        aiFunction: 'useChat',
        description: 'Create content in multiple formats'
      },
      {
        path: '/api/media/generate',
        method: 'POST',
        aiFunction: 'tool calling',
        description: 'Generate images and videos with AI'
      },
      {
        path: '/api/automation/schedule',
        method: 'POST',
        aiFunction: 'generateObject',
        description: 'Schedule automated content publishing'
      }
    ],
    environment: {
      OPENAI_API_KEY: 'your-openai-key',
      ANTHROPIC_API_KEY: 'your-anthropic-key',
      STABILITY_API_KEY: 'your-stability-key',
      CONTENT_PLATFORMS: 'wordpress,medium,linkedin'
    },
    dependencies: {
      '@ai-sdk/openai': '^2.0.23',
      '@ai-sdk/anthropic': '^2.0.9',
      'replicate': '^0.20.0',
      '@ffmpeg/ffmpeg': '^0.12.6'
    }
  },
  workflowSteps: [
    {
      id: 'trend-analyzer',
      type: 'ai.trend-analyzer',
      name: 'Trend Analyzer',
      config: {
        platforms: ['twitter', 'reddit', 'google-trends'],
        categories: ['technology', 'business', 'lifestyle'],
        updateFrequency: 'hourly'
      },
      position: { x: 100, y: 100 }
    },
    {
      id: 'idea-generator',
      type: 'ai.idea-generator',
      name: 'Content Idea Generator',
      config: {
        contentTypes: ['blog', 'video', 'social', 'podcast'],
        targetAudience: 'tech-professionals',
        creativityLevel: 'high'
      },
      position: { x: 400, y: 100 }
    },
    {
      id: 'content-writer',
      type: 'ai.content-writer',
      name: 'Content Writer',
      config: {
        formats: ['article', 'script', 'social-post'],
        tone: 'professional',
        length: 'medium',
        includeImages: true
      },
      position: { x: 700, y: 100 }
    },
    {
      id: 'media-generator',
      type: 'ai.media-generator',
      name: 'Media Generator',
      config: {
        generateImages: true,
        generateVideos: true,
        styleConsistency: true,
        brandColors: true
      },
      position: { x: 1000, y: 100 }
    },
    {
      id: 'content-optimizer',
      type: 'ai.content-optimizer',
      name: 'Content Optimizer',
      config: {
        seoOptimization: true,
        readabilityScore: true,
        engagementPrediction: true,
        platformAdaptation: true
      },
      position: { x: 1300, y: 100 }
    },
    {
      id: 'auto-publisher',
      type: 'automation.auto-publisher',
      name: 'Auto Publisher',
      config: {
        platforms: ['medium', 'linkedin', 'wordpress'],
        scheduleOptimization: true,
        performanceTracking: true
      },
      position: { x: 1600, y: 100 }
    }
  ],
  connections: [
    {
      id: 'trend-to-ideas',
      source: 'trend-analyzer',
      target: 'idea-generator',
      label: 'Trend Data'
    },
    {
      id: 'ideas-to-writer',
      source: 'idea-generator',
      target: 'content-writer',
      label: 'Content Ideas'
    },
    {
      id: 'writer-to-media',
      source: 'content-writer',
      target: 'media-generator',
      label: 'Content Draft'
    },
    {
      id: 'media-to-optimizer',
      source: 'media-generator',
      target: 'content-optimizer',
      label: 'Rich Content'
    },
    {
      id: 'optimizer-to-publisher',
      source: 'content-optimizer',
      target: 'auto-publisher',
      label: 'Optimized Content'
    }
  ],
  customizationOptions: [
    {
      name: 'Content Types',
      type: 'multiselect',
      required: true,
      default: ['blog', 'social'],
      options: [
        { value: 'blog', label: 'Blog Posts' },
        { value: 'social', label: 'Social Media' },
        { value: 'video', label: 'Videos' },
        { value: 'podcast', label: 'Podcasts' },
        { value: 'email', label: 'Email Newsletters' },
        { value: 'infographic', label: 'Infographics' }
      ],
      description: 'Types of content to generate'
    },
    {
      name: 'Automation Level',
      type: 'select',
      required: true,
      default: 'semi-automated',
      options: [
        { value: 'fully-automated', label: 'Fully Automated' },
        { value: 'semi-automated', label: 'Semi-Automated (with review)' },
        { value: 'manual', label: 'Manual (AI suggestions only)' }
      ],
      description: 'Level of automation for content creation'
    },
    {
      name: 'Publishing Platforms',
      type: 'multiselect',
      required: true,
      default: ['linkedin'],
      options: [
        { value: 'wordpress', label: 'WordPress' },
        { value: 'medium', label: 'Medium' },
        { value: 'linkedin', label: 'LinkedIn' },
        { value: 'twitter', label: 'Twitter' },
        { value: 'instagram', label: 'Instagram' },
        { value: 'youtube', label: 'YouTube' }
      ],
      description: 'Platforms to publish content to'
    },
    {
      name: 'Brand Consistency',
      type: 'boolean',
      required: false,
      default: true,
      description: 'Maintain brand voice and visual consistency'
    }
  ]
};

// Export all multimedia templates
export const MULTIMEDIA_WORKFLOW_TEMPLATES = {
  'social-campaign': SOCIAL_MEDIA_CAMPAIGN_TEMPLATE,
  'video-production': VIDEO_PRODUCTION_TEMPLATE,
  'content-automation': CONTENT_AUTOMATION_TEMPLATE
};

// Template recommendations based on user context
export const getRecommendedMultimediaTemplates = (context: {
  userType?: 'marketer' | 'content-creator' | 'business-owner' | 'developer';
  platforms?: string[];
  contentTypes?: string[];
  experience?: 'beginner' | 'intermediate' | 'advanced';
}) => {
  const recommendations = [];

  if (context.contentTypes?.includes('social') || context.platforms?.includes('instagram')) {
    recommendations.push({
      template: SOCIAL_MEDIA_CAMPAIGN_TEMPLATE,
      score: 0.95,
      reason: 'Perfect for social media content creation and scheduling'
    });
  }

  if (context.contentTypes?.includes('video') || context.platforms?.includes('youtube')) {
    recommendations.push({
      template: VIDEO_PRODUCTION_TEMPLATE,
      score: 0.92,
      reason: 'Comprehensive video production and publishing workflow'
    });
  }

  if (context.userType === 'content-creator' || context.contentTypes?.includes('blog')) {
    recommendations.push({
      template: CONTENT_AUTOMATION_TEMPLATE,
      score: 0.88,
      reason: 'AI-powered content creation and automation'
    });
  }

  return recommendations.sort((a, b) => b.score - a.score);
};
