/**
 * Application configuration and constants
 */

// Environment variables with defaults
export const config = {
  // API Configuration
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || '/api',
  API_TIMEOUT: parseInt(import.meta.env.VITE_API_TIMEOUT || '30000'),

  // Application Settings
  APP_NAME: 'Auterity Error-IQ',
  APP_VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0',
  APP_ENV: import.meta.env.MODE || 'development',

  // Feature Flags
  ENABLE_ANALYTICS: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
  ENABLE_ERROR_REPORTING: import.meta.env.VITE_ENABLE_ERROR_REPORTING === 'true',
  ENABLE_DEBUG_MODE: import.meta.env.VITE_ENABLE_DEBUG_MODE === 'true',

  // UI Configuration
  THEME: import.meta.env.VITE_THEME || 'light',
  LOCALE: import.meta.env.VITE_LOCALE || 'en-US',

  // Theme Customization
  THEME_PRIMARY: import.meta.env.VITE_THEME_PRIMARY || '#2563eb',
  THEME_ACCENT: import.meta.env.VITE_THEME_ACCENT || '#f59e0b',
  THEME_SURFACE: import.meta.env.VITE_THEME_SURFACE || '#f8fafc',
  THEME_STORAGE_KEY: import.meta.env.VITE_THEME_STORAGE_KEY || 'autmatrix-theme',

  // UI/UX Features
  GLASSMORPHISM_ENABLED: import.meta.env.VITE_GLASSMORPHISM_ENABLED === 'true',
  GLASSMORPHISM_INTENSITY: import.meta.env.VITE_GLASSMORPHISM_INTENSITY || 'medium',
  ANIMATIONS_ENABLED: import.meta.env.VITE_ANIMATIONS_ENABLED === 'true',
  ANIMATIONS_DURATION: import.meta.env.VITE_ANIMATIONS_DURATION || 'normal',

  // UI Component Variants
  BUTTON_VARIANT: import.meta.env.VITE_BUTTON_VARIANT || 'filled',
  CARD_VARIANT: import.meta.env.VITE_CARD_VARIANT || 'elevated',
  MODAL_VARIANT: import.meta.env.VITE_MODAL_VARIANT || 'glass',

  // Additional Theme Colors
  THEME_ERROR: import.meta.env.VITE_THEME_ERROR || '#dc2626',
  THEME_WARNING: import.meta.env.VITE_THEME_WARNING || '#f59e0b',
  THEME_SUCCESS: import.meta.env.VITE_THEME_SUCCESS || '#16a34a',
  THEME_INFO: import.meta.env.VITE_THEME_INFO || '#0284c7',
  THEME_SECONDARY: import.meta.env.VITE_THEME_SECONDARY || '#64748b',

  // Component Sizing
  COMPONENT_SIZE_DEFAULT: import.meta.env.VITE_COMPONENT_SIZE_DEFAULT || 'md',
  BUTTON_SIZE_DEFAULT: import.meta.env.VITE_BUTTON_SIZE_DEFAULT || 'md',
  INPUT_SIZE_DEFAULT: import.meta.env.VITE_INPUT_SIZE_DEFAULT || 'md',
  MODAL_SIZE_DEFAULT: import.meta.env.VITE_MODAL_SIZE_DEFAULT || 'md',

  // Layout & Spacing
  LAYOUT_DENSITY: import.meta.env.VITE_LAYOUT_DENSITY || 'comfortable',
  GRID_GAP: parseInt(import.meta.env.VITE_GRID_GAP || '4'),
  CONTAINER_MAX_WIDTH: import.meta.env.VITE_CONTAINER_MAX_WIDTH || 'xl',
  SIDEBAR_WIDTH: import.meta.env.VITE_SIDEBAR_WIDTH || '280px',

  // Typography
  FONT_FAMILY: import.meta.env.VITE_FONT_FAMILY || 'sans',
  FONT_SIZE_BASE: import.meta.env.VITE_FONT_SIZE_BASE || 'base',
  LINE_HEIGHT: import.meta.env.VITE_LINE_HEIGHT || 'normal',
  LETTER_SPACING: import.meta.env.VITE_LETTER_SPACING || 'normal',

  // Accessibility
  ACCESSIBILITY_HIGH_CONTRAST: import.meta.env.VITE_ACCESSIBILITY_HIGH_CONTRAST === 'true',
  ACCESSIBILITY_REDUCED_MOTION: import.meta.env.VITE_ACCESSIBILITY_REDUCED_MOTION === 'true',
  ACCESSIBILITY_FOCUS_VISIBLE: import.meta.env.VITE_ACCESSIBILITY_FOCUS_VISIBLE !== 'false',

  // Dashboard & Data Visualization
  DASHBOARD_LAYOUT: import.meta.env.VITE_DASHBOARD_LAYOUT || 'grid',
  CHART_THEME: import.meta.env.VITE_CHART_THEME || 'default',
  METRIC_CARD_VARIANT: import.meta.env.VITE_METRIC_CARD_VARIANT || 'glass',
  STATUS_INDICATOR_SIZE: import.meta.env.VITE_STATUS_INDICATOR_SIZE || 'md',

  // Forms & Inputs
  FORM_LAYOUT: import.meta.env.VITE_FORM_LAYOUT || 'vertical',
  INPUT_VARIANT: import.meta.env.VITE_INPUT_VARIANT || 'outlined',
  LABEL_POSITION: import.meta.env.VITE_LABEL_POSITION || 'top',
  VALIDATION_STYLE: import.meta.env.VITE_VALIDATION_STYLE || 'inline',

  // Notifications & Feedback
  TOAST_POSITION: import.meta.env.VITE_TOAST_POSITION || 'top-right',
  TOAST_DURATION: parseInt(import.meta.env.VITE_TOAST_DURATION || '5000'),
  NOTIFICATION_VARIANT: import.meta.env.VITE_NOTIFICATION_VARIANT || 'glass',
  LOADING_SPINNER_VARIANT: import.meta.env.VITE_LOADING_SPINNER_VARIANT || 'pulse',

  // Responsive Design
  RESPONSIVE_BREAKPOINT_SM: import.meta.env.VITE_RESPONSIVE_BREAKPOINT_SM || '640px',
  RESPONSIVE_BREAKPOINT_MD: import.meta.env.VITE_RESPONSIVE_BREAKPOINT_MD || '768px',
  RESPONSIVE_BREAKPOINT_LG: import.meta.env.VITE_RESPONSIVE_BREAKPOINT_LG || '1024px',
  RESPONSIVE_BREAKPOINT_XL: import.meta.env.VITE_RESPONSIVE_BREAKPOINT_XL || '1280px',

  // Advanced UI Features
  ENABLE_RIPPLE_EFFECTS: import.meta.env.VITE_ENABLE_RIPPLE_EFFECTS !== 'false',
  ENABLE_HOVER_LIFT: import.meta.env.VITE_ENABLE_HOVER_LIFT !== 'false',
  ENABLE_FOCUS_RINGS: import.meta.env.VITE_ENABLE_FOCUS_RINGS !== 'false',
  ENABLE_GRADIENT_BACKGROUNDS: import.meta.env.VITE_ENABLE_GRADIENT_BACKGROUNDS !== 'false',

  // External Services
  SENTRY_DSN: import.meta.env.VITE_SENTRY_DSN,
  ANALYTICS_ID: import.meta.env.VITE_ANALYTICS_ID,

  // Development
  DEV_MODE: import.meta.env.DEV,
  PROD_MODE: import.meta.env.PROD,
} as const;

// API Endpoints
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    PROFILE: '/auth/profile',
  },

  // Error Management
  ERRORS: {
    LIST: '/errors',
    DETAIL: '/errors/:id',
    CREATE: '/errors',
    UPDATE: '/errors/:id',
    DELETE: '/errors/:id',
    BATCH: '/errors/batch',
  },

  // Analytics
  ANALYTICS: {
    DASHBOARD: '/analytics/dashboard',
    REPORTS: '/analytics/reports',
    METRICS: '/analytics/metrics',
  },

  // User Management
  USERS: {
    LIST: '/users',
    DETAIL: '/users/:id',
    CREATE: '/users',
    UPDATE: '/users/:id',
    DELETE: '/users/:id',
  },

  // System
  SYSTEM: {
    HEALTH: '/health',
    INFO: '/info',
    METRICS: '/metrics',
  },
} as const;

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
} as const;

// Error Codes
export const ERROR_CODES = {
  // Network errors
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',

  // Authentication errors
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',

  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  REQUIRED_FIELD: 'REQUIRED_FIELD',
  INVALID_FORMAT: 'INVALID_FORMAT',

  // Business logic errors
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  OPERATION_FAILED: 'OPERATION_FAILED',

  // System errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
} as const;

// UI Constants
export const UI_CONSTANTS = {
  // Breakpoints (Tailwind CSS defaults)
  BREAKPOINTS: {
    SM: 640,
    MD: 768,
    LG: 1024,
    XL: 1280,
    '2XL': 1536,
  },

  // Spacing
  SPACING: {
    XS: 4,
    SM: 8,
    MD: 16,
    LG: 24,
    XL: 32,
    '2XL': 48,
  },

  // Colors (can be extended with theme colors)
  COLORS: {
    PRIMARY: '#3B82F6',
    SECONDARY: '#6B7280',
    SUCCESS: '#10B981',
    WARNING: '#F59E0B',
    ERROR: '#EF4444',
    INFO: '#06B6D4',
  },

  // Animation durations
  ANIMATIONS: {
    FAST: 150,
    NORMAL: 300,
    SLOW: 500,
  },

  // Z-index layers
  Z_INDEX: {
    DROPDOWN: 1000,
    MODAL: 1050,
    TOOLTIP: 1070,
    NOTIFICATION: 1100,
  },
} as const;

// Local Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_PREFERENCES: 'user_preferences',
  THEME: 'theme',
  LOCALE: 'locale',
  LAST_ACTIVITY: 'last_activity',
} as const;

// Validation Rules
export const VALIDATION_RULES = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD_MIN_LENGTH: 8,
  NAME_MAX_LENGTH: 50,
  DESCRIPTION_MAX_LENGTH: 500,
} as const;

// Date/Time Formats
export const DATE_FORMATS = {
  DISPLAY: 'MMM dd, yyyy',
  DISPLAY_WITH_TIME: 'MMM dd, yyyy HH:mm',
  ISO: 'yyyy-MM-ddTHH:mm:ssZ',
  API: 'yyyy-MM-dd HH:mm:ss',
} as const;

// Pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
} as const;

// File upload limits
export const FILE_UPLOAD = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
  MAX_FILES: 5,
} as const;



