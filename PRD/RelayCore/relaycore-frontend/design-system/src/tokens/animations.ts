export const transitions = {
  duration: {
    fastest: '50ms',
    faster: '100ms',
    fast: '150ms',
    normal: '200ms',
    slow: '300ms',
    slower: '400ms',
    slowest: '500ms',
  },
  timing: {
    ease: 'ease',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
    linear: 'linear',
    // Custom cubic bezier curves
    emphasized: 'cubic-bezier(0.2, 0.0, 0, 1.0)',
    emphasizedDecelerate: 'cubic-bezier(0.05, 0.7, 0.1, 1.0)',
    emphasizedAccelerate: 'cubic-bezier(0.3, 0.0, 0.8, 0.15)',
    standard: 'cubic-bezier(0.2, 0.0, 0.0, 1.0)',
  },
};

// Semantic transition presets
export const semanticTransitions = {
  hover: `${transitions.duration.fast} ${transitions.timing.easeOut}`,
  click: `${transitions.duration.faster} ${transitions.timing.easeOut}`,
  expand: `${transitions.duration.normal} ${transitions.timing.emphasizedDecelerate}`,
  collapse: `${transitions.duration.normal} ${transitions.timing.emphasizedAccelerate}`,
  fade: `${transitions.duration.normal} ${transitions.timing.easeInOut}`,
  slide: `${transitions.duration.normal} ${transitions.timing.emphasized}`,
  scale: `${transitions.duration.normal} ${transitions.timing.standard}`,
};

// Keyframe animations
export const keyframes = {
  fadeIn: `
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
  `,
  fadeOut: `
    @keyframes fadeOut {
      from { opacity: 1; }
      to { opacity: 0; }
    }
  `,
  slideInFromRight: `
    @keyframes slideInFromRight {
      from { transform: translateX(100%); }
      to { transform: translateX(0); }
    }
  `,
  slideOutToRight: `
    @keyframes slideOutToRight {
      from { transform: translateX(0); }
      to { transform: translateX(100%); }
    }
  `,
  slideInFromLeft: `
    @keyframes slideInFromLeft {
      from { transform: translateX(-100%); }
      to { transform: translateX(0); }
    }
  `,
  slideOutToLeft: `
    @keyframes slideOutToLeft {
      from { transform: translateX(0); }
      to { transform: translateX(-100%); }
    }
  `,
  slideInFromTop: `
    @keyframes slideInFromTop {
      from { transform: translateY(-100%); }
      to { transform: translateY(0); }
    }
  `,
  slideOutToTop: `
    @keyframes slideOutToTop {
      from { transform: translateY(0); }
      to { transform: translateY(-100%); }
    }
  `,
  slideInFromBottom: `
    @keyframes slideInFromBottom {
      from { transform: translateY(100%); }
      to { transform: translateY(0); }
    }
  `,
  slideOutToBottom: `
    @keyframes slideOutToBottom {
      from { transform: translateY(0); }
      to { transform: translateY(100%); }
    }
  `,
  scaleIn: `
    @keyframes scaleIn {
      from { transform: scale(0.8); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
  `,
  scaleOut: `
    @keyframes scaleOut {
      from { transform: scale(1); opacity: 1; }
      to { transform: scale(0.8); opacity: 0; }
    }
  `,
  pulse: `
    @keyframes pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.05); }
      100% { transform: scale(1); }
    }
  `,
  spin: `
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `,
};

// Animation presets
export const animations = {
  fadeIn: `fadeIn ${transitions.duration.normal} ${transitions.timing.easeOut} forwards`,
  fadeOut: `fadeOut ${transitions.duration.normal} ${transitions.timing.easeIn} forwards`,
  slideInRight: `slideInFromRight ${transitions.duration.normal} ${transitions.timing.emphasizedDecelerate} forwards`,
  slideOutRight: `slideOutToRight ${transitions.duration.normal} ${transitions.timing.emphasizedAccelerate} forwards`,
  slideInLeft: `slideInFromLeft ${transitions.duration.normal} ${transitions.timing.emphasizedDecelerate} forwards`,
  slideOutLeft: `slideOutToLeft ${transitions.duration.normal} ${transitions.timing.emphasizedAccelerate} forwards`,
  slideInTop: `slideInFromTop ${transitions.duration.normal} ${transitions.timing.emphasizedDecelerate} forwards`,
  slideOutTop: `slideOutToTop ${transitions.duration.normal} ${transitions.timing.emphasizedAccelerate} forwards`,
  slideInBottom: `slideInFromBottom ${transitions.duration.normal} ${transitions.timing.emphasizedDecelerate} forwards`,
  slideOutBottom: `slideOutToBottom ${transitions.duration.normal} ${transitions.timing.emphasizedAccelerate} forwards`,
  scaleIn: `scaleIn ${transitions.duration.normal} ${transitions.timing.emphasizedDecelerate} forwards`,
  scaleOut: `scaleOut ${transitions.duration.normal} ${transitions.timing.emphasizedAccelerate} forwards`,
  pulse: `pulse ${transitions.duration.slow} ${transitions.timing.easeInOut} infinite`,
  spin: `spin ${transitions.duration.slower} ${transitions.timing.linear} infinite`,
};