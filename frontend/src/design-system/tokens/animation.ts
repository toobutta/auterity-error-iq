/**
 * Auterity Animation System
 * Clean, professional animations inspired by Vercel's smooth transitions
 * and Anthropic's minimal, purposeful motion design
 */

export const animation = {
  // Duration values for consistent timing
  duration: {
    instant: '0ms',
    fast: '150ms',
    normal: '250ms',
    slow: '350ms',
    slower: '500ms',
  },

  // Easing functions for natural motion
  easing: {
    // Standard easing for most interactions
    default: 'cubic-bezier(0.4, 0, 0.2, 1)',
    // Quick start, slow end - for elements entering
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    // Slow start, quick end - for elements exiting
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    // Smooth both ends - for continuous animations
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    // Spring-like feel for playful elements
    spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  },

  // Predefined transitions for common use cases
  transitions: {
    // Base transitions
    all: 'all 250ms cubic-bezier(0.4, 0, 0.2, 1)',
    colors: 'background-color 250ms cubic-bezier(0.4, 0, 0.2, 1), border-color 250ms cubic-bezier(0.4, 0, 0.2, 1), color 250ms cubic-bezier(0.4, 0, 0.2, 1)',
    opacity: 'opacity 250ms cubic-bezier(0.4, 0, 0.2, 1)',
    transform: 'transform 250ms cubic-bezier(0.4, 0, 0.2, 1)',
    
    // Component-specific transitions
    button: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
    card: 'transform 250ms cubic-bezier(0.4, 0, 0.2, 1), box-shadow 250ms cubic-bezier(0.4, 0, 0.2, 1)',
    modal: 'opacity 350ms cubic-bezier(0.4, 0, 0.2, 1), transform 350ms cubic-bezier(0.4, 0, 0.2, 1)',
    dropdown: 'opacity 150ms cubic-bezier(0.4, 0, 0.2, 1), transform 150ms cubic-bezier(0, 0, 0.2, 1)',
    
    // Layout transitions
    layout: 'all 350ms cubic-bezier(0.4, 0, 0.2, 1)',
    height: 'height 350ms cubic-bezier(0.4, 0, 0.2, 1)',
    width: 'width 350ms cubic-bezier(0.4, 0, 0.2, 1)',
  },

  // Keyframe animations
  keyframes: {
    fadeIn: {
      from: { opacity: 0 },
      to: { opacity: 1 },
    },
    fadeOut: {
      from: { opacity: 1 },
      to: { opacity: 0 },
    },
    slideUp: {
      from: { transform: 'translateY(8px)', opacity: 0 },
      to: { transform: 'translateY(0)', opacity: 1 },
    },
    slideDown: {
      from: { transform: 'translateY(-8px)', opacity: 0 },
      to: { transform: 'translateY(0)', opacity: 1 },
    },
    scaleIn: {
      from: { transform: 'scale(0.95)', opacity: 0 },
      to: { transform: 'scale(1)', opacity: 1 },
    },
    scaleOut: {
      from: { transform: 'scale(1)', opacity: 1 },
      to: { transform: 'scale(0.95)', opacity: 0 },
    },
    // Vercel-inspired loading animation
    shimmer: {
      from: { backgroundPosition: '-200% 0' },
      to: { backgroundPosition: '200% 0' },
    },
    // Subtle pulse for focus states
    pulse: {
      '0%, 100%': { opacity: 1 },
      '50%': { opacity: 0.5 },
    },
    // Spinner animation
    spin: {
      from: { transform: 'rotate(0deg)' },
      to: { transform: 'rotate(360deg)' },
    },
  },

  // Animation classes
  animations: {
    fadeIn: 'fadeIn 250ms cubic-bezier(0.4, 0, 0.2, 1) forwards',
    fadeOut: 'fadeOut 250ms cubic-bezier(0.4, 0, 0.2, 1) forwards',
    slideUp: 'slideUp 350ms cubic-bezier(0, 0, 0.2, 1) forwards',
    slideDown: 'slideDown 350ms cubic-bezier(0, 0, 0.2, 1) forwards',
    scaleIn: 'scaleIn 250ms cubic-bezier(0.4, 0, 0.2, 1) forwards',
    scaleOut: 'scaleOut 250ms cubic-bezier(0.4, 0, 0.2, 1) forwards',
    shimmer: 'shimmer 2s linear infinite',
    pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
    spin: 'spin 1s linear infinite',
  },
} as const;

export type AnimationSystem = typeof animation;


