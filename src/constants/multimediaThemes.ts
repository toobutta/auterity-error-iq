/**
 * Multimedia Processing Theme Extensions
 *
 * Extends existing theme system with multimedia-specific colors,
 * styles, and design tokens for video/image processing workflows
 */

import { StudioTheme } from '../types/studio';

// Multimedia-specific color palette
export const MULTIMEDIA_COLORS = {
  // Video processing colors
  videoPrimary: '#ff6b35',      // Vibrant orange for video
  videoSecondary: '#f7931e',    // Complementary orange
  videoAccent: '#00d4aa',       // Teal accent for video

  // Image processing colors
  imagePrimary: '#6366f1',      // Indigo for images
  imageSecondary: '#8b5cf6',    // Purple for image processing
  imageAccent: '#06b6d4',       // Cyan accent for images

  // Social media colors
  socialInstagram: '#e1306c',
  socialTikTok: '#000000',
  socialYouTube: '#ff0000',
  socialLinkedIn: '#0077b5',
  socialTwitter: '#1da1f2',
  socialFacebook: '#1877f2',

  // Processing states
  processing: '#fbbf24',        // Amber for processing
  completed: '#10b981',         // Green for completed
  failed: '#ef4444',            // Red for failed
  uploading: '#8b5cf6',         // Purple for uploading
};

// Extended light theme with multimedia support
export const MULTIMEDIA_LIGHT_THEME: Partial<StudioTheme> = {
  colors: {
    ...LIGHT_THEME.colors,
    // Multimedia processing colors
    videoPrimary: MULTIMEDIA_COLORS.videoPrimary,
    videoSecondary: MULTIMEDIA_COLORS.videoSecondary,
    videoAccent: MULTIMEDIA_COLORS.videoAccent,
    imagePrimary: MULTIMEDIA_COLORS.imagePrimary,
    imageSecondary: MULTIMEDIA_COLORS.imageSecondary,
    imageAccent: MULTIMEDIA_COLORS.imageAccent,

    // Social media colors
    socialInstagram: MULTIMEDIA_COLORS.socialInstagram,
    socialTikTok: MULTIMEDIA_COLORS.socialTikTok,
    socialYouTube: MULTIMEDIA_COLORS.socialYouTube,
    socialLinkedIn: MULTIMEDIA_COLORS.socialLinkedIn,
    socialTwitter: MULTIMEDIA_COLORS.socialTwitter,
    socialFacebook: MULTIMEDIA_COLORS.socialFacebook,

    // Processing states
    processing: MULTIMEDIA_COLORS.processing,
    completed: MULTIMEDIA_COLORS.completed,
    failed: MULTIMEDIA_COLORS.failed,
    uploading: MULTIMEDIA_COLORS.uploading,
  }
};

// Extended dark theme with multimedia support
export const MULTIMEDIA_DARK_THEME: Partial<StudioTheme> = {
  colors: {
    ...DARK_THEME.colors,
    // Multimedia processing colors
    videoPrimary: '#ff8c42',      // Lighter orange for dark theme
    videoSecondary: '#ffb366',    // Lighter complementary
    videoAccent: '#4ade80',       // Lighter teal for dark theme
    imagePrimary: '#818cf8',      // Lighter indigo for dark theme
    imageSecondary: '#a78bfa',    // Lighter purple for dark theme
    imageAccent: '#22d3ee',       // Lighter cyan for dark theme

    // Social media colors (same for dark theme)
    socialInstagram: MULTIMEDIA_COLORS.socialInstagram,
    socialTikTok: MULTIMEDIA_COLORS.socialTikTok,
    socialYouTube: MULTIMEDIA_COLORS.socialYouTube,
    socialLinkedIn: MULTIMEDIA_COLORS.socialLinkedIn,
    socialTwitter: MULTIMEDIA_COLORS.socialTwitter,
    socialFacebook: MULTIMEDIA_COLORS.socialFacebook,

    // Processing states with dark theme adjustments
    processing: '#fcd34d',        // Lighter amber for dark theme
    completed: '#34d399',         // Lighter green for dark theme
    failed: '#f87171',            // Lighter red for dark theme
    uploading: '#c4b5fd',         // Lighter purple for dark theme
  }
};

// Multimedia-specific node categories
export const MULTIMEDIA_NODE_CATEGORIES = [
  {
    id: 'video-processing',
    name: 'Video Processing',
    icon: '🎬',
    color: MULTIMEDIA_COLORS.videoPrimary,
    types: [
      'video-upload', 'video-analysis', 'video-editing', 'video-compression',
      'video-conversion', 'video-thumbnails', 'video-subtitles', 'video-trimming'
    ]
  },
  {
    id: 'image-processing',
    name: 'Image Processing',
    icon: '🖼️',
    color: MULTIMEDIA_COLORS.imagePrimary,
    types: [
      'image-upload', 'image-analysis', 'image-editing', 'image-resize',
      'image-filter', 'image-compression', 'image-conversion', 'image-optimization'
    ]
  },
  {
    id: 'social-media',
    name: 'Social Media',
    icon: '📱',
    color: '#6366f1',
    types: [
      'instagram-post', 'tiktok-video', 'youtube-upload', 'linkedin-post',
      'twitter-post', 'facebook-post', 'social-scheduler', 'social-analytics'
    ]
  },
  {
    id: 'content-creation',
    name: 'Content Creation',
    icon: '🎨',
    color: '#8b5cf6',
    types: [
      'text-to-video', 'image-to-video', 'video-montage', 'content-calendar',
      'brand-assets', 'content-templates', 'auto-captioning', 'voice-over'
    ]
  },
  {
    id: 'multimedia-ai',
    name: 'AI Multimedia',
    icon: '🤖',
    color: '#06b6d4',
    types: [
      'video-generation', 'image-generation', 'content-analysis', 'sentiment-analysis',
      'object-detection', 'face-recognition', 'scene-detection', 'content-moderation'
    ]
  },
  {
    id: 'media-storage',
    name: 'Media Storage',
    icon: '💾',
    color: '#10b981',
    types: [
      'cloud-upload', 'cdn-distribution', 'media-library', 'version-control',
      'backup-system', 'media-tagging', 'search-index', 'access-control'
    ]
  }
];

// Multimedia-specific node styles
export const MULTIMEDIA_NODE_STYLES = {
  // Video Processing Nodes
  'video-upload': {
    backgroundColor: 0xff6b35,
    borderColor: 0xe55a2b,
    borderWidth: 2,
    borderRadius: 12,
    textColor: 0xffffff,
    fontSize: 14,
    fontWeight: 'bold',
    shadow: true,
    opacity: 1,
  },
  'video-analysis': {
    backgroundColor: 0xf7931e,
    borderColor: 0xde8309,
    borderWidth: 2,
    borderRadius: 12,
    textColor: 0xffffff,
    fontSize: 14,
    fontWeight: 'normal',
    shadow: true,
    opacity: 1,
  },
  'video-editing': {
    backgroundColor: 0x00d4aa,
    borderColor: 0x00b894,
    borderWidth: 2,
    borderRadius: 12,
    textColor: 0xffffff,
    fontSize: 14,
    fontWeight: 'normal',
    shadow: true,
    opacity: 1,
  },

  // Image Processing Nodes
  'image-upload': {
    backgroundColor: 0x6366f1,
    borderColor: 0x4f46e5,
    borderWidth: 2,
    borderRadius: 12,
    textColor: 0xffffff,
    fontSize: 14,
    fontWeight: 'bold',
    shadow: true,
    opacity: 1,
  },
  'image-analysis': {
    backgroundColor: 0x8b5cf6,
    borderColor: 0x7c3aed,
    borderWidth: 2,
    borderRadius: 12,
    textColor: 0xffffff,
    fontSize: 14,
    fontWeight: 'normal',
    shadow: true,
    opacity: 1,
  },
  'image-editing': {
    backgroundColor: 0x06b6d4,
    borderColor: 0x0891b2,
    borderWidth: 2,
    borderRadius: 12,
    textColor: 0xffffff,
    fontSize: 14,
    fontWeight: 'normal',
    shadow: true,
    opacity: 1,
  },

  // Social Media Nodes
  'instagram-post': {
    backgroundColor: 0xe1306c,
    borderColor: 0xc1355f,
    borderWidth: 2,
    borderRadius: 16,
    textColor: 0xffffff,
    fontSize: 14,
    fontWeight: 'normal',
    shadow: true,
    opacity: 1,
  },
  'tiktok-video': {
    backgroundColor: 0x000000,
    borderColor: 0x333333,
    borderWidth: 2,
    borderRadius: 16,
    textColor: 0xffffff,
    fontSize: 14,
    fontWeight: 'normal',
    shadow: true,
    opacity: 1,
  },
  'youtube-upload': {
    backgroundColor: 0xff0000,
    borderColor: 0xcc0000,
    borderWidth: 2,
    borderRadius: 16,
    textColor: 0xffffff,
    fontSize: 14,
    fontWeight: 'normal',
    shadow: true,
    opacity: 1,
  },

  // Content Creation Nodes
  'text-to-video': {
    backgroundColor: 0x8b5cf6,
    borderColor: 0x7c3aed,
    borderWidth: 2,
    borderRadius: 14,
    textColor: 0xffffff,
    fontSize: 14,
    fontWeight: 'normal',
    shadow: true,
    opacity: 1,
  },
  'video-montage': {
    backgroundColor: 0xf97316,
    borderColor: 0xea580c,
    borderWidth: 2,
    borderRadius: 14,
    textColor: 0xffffff,
    fontSize: 14,
    fontWeight: 'normal',
    shadow: true,
    opacity: 1,
  },

  // AI Multimedia Nodes
  'video-generation': {
    backgroundColor: 0x06b6d4,
    borderColor: 0x0891b2,
    borderWidth: 2,
    borderRadius: 14,
    textColor: 0xffffff,
    fontSize: 14,
    fontWeight: 'bold',
    shadow: true,
    opacity: 1,
  },
  'content-analysis': {
    backgroundColor: 0x10b981,
    borderColor: 0x059669,
    borderWidth: 2,
    borderRadius: 14,
    textColor: 0xffffff,
    fontSize: 14,
    fontWeight: 'normal',
    shadow: true,
    opacity: 1,
  }
};

// Multimedia-specific canvas configuration
export const MULTIMEDIA_CANVAS_CONFIG = {
  ...DEFAULT_CANVAS_CONFIG,
  width: 1400,  // Wider for multimedia workflows
  height: 900,  // Taller for timeline views
  gridSize: 25, // Larger grid for multimedia elements
  backgroundColor: 0xf8fafc,
  showRulers: true,
  showSafeAreas: true, // For video composition
  snapToSafeArea: true,
};

// Export combined theme
export const getMultimediaTheme = (baseTheme: StudioTheme, isDark: boolean = false) => {
  const multimediaTheme = isDark ? MULTIMEDIA_DARK_THEME : MULTIMEDIA_LIGHT_THEME;
  return {
    ...baseTheme,
    ...multimediaTheme,
  };
};
