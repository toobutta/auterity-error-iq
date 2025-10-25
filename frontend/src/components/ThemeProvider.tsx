import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

// Theme types
export type ThemeMode = "light" | "dark" | "auto";

export interface ThemeConfig {
  mode: ThemeMode;
  automotive: {
    primary: string;
    accent: string;
    surface: string;
  };
  glassmorphism: {
    enabled: boolean;
    intensity: "subtle" | "medium" | "strong";
  };
  animations: {
    enabled: boolean;
    duration: "fast" | "normal" | "slow";
  };
  extended?: {
    colors: {
      error: string;
      warning: string;
      success: string;
      info: string;
      secondary: string;
    };
    sizing: {
      component: string;
      button: string;
      input: string;
      modal: string;
    };
    layout: {
      density: string;
      gridGap: number;
      maxWidth: string;
      sidebarWidth: string;
    };
    typography: {
      fontFamily: string;
      fontSize: string;
      lineHeight: string;
      letterSpacing: string;
    };
    accessibility: {
      highContrast: boolean;
      reducedMotion: boolean;
      focusVisible: boolean;
    };
    dashboard: {
      layout: string;
      chartTheme: string;
      metricCardVariant: string;
      statusIndicatorSize: string;
    };
    forms: {
      layout: string;
      inputVariant: string;
      labelPosition: string;
      validationStyle: string;
    };
    notifications: {
      toastPosition: string;
      toastDuration: number;
      notificationVariant: string;
      loadingSpinnerVariant: string;
    };
    responsive: {
      sm: string;
      md: string;
      lg: string;
      xl: string;
    };
    features: {
      rippleEffects: boolean;
      hoverLift: boolean;
      focusRings: boolean;
      gradientBackgrounds: boolean;
    };
  };
}

interface ThemeContextType {
  // Current theme state
  isDark: boolean;
  mode: ThemeMode;
  config: ThemeConfig;

  // Theme actions
  setMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  updateConfig: (config: Partial<ThemeConfig>) => void;

  // System preferences
  systemPreference: "light" | "dark";
  isSystemMode: boolean;
}

// Default theme configuration
const defaultThemeConfig: ThemeConfig = {
  mode: "auto",
  automotive: {
    primary: process.env.VITE_THEME_PRIMARY || "#2563eb",
    accent: process.env.VITE_THEME_ACCENT || "#f59e0b",
    surface: process.env.VITE_THEME_SURFACE || "#f8fafc",
  },
  glassmorphism: {
    enabled: process.env.VITE_GLASSMORPHISM_ENABLED === 'true',
    intensity: (process.env.VITE_GLASSMORPHISM_INTENSITY as "subtle" | "medium" | "strong") || "medium",
  },
  animations: {
    enabled: process.env.VITE_ANIMATIONS_ENABLED === 'true',
    duration: (process.env.VITE_ANIMATIONS_DURATION as "fast" | "normal" | "slow") || "normal",
  },
  // Extended theme configuration from environment variables
  extended: {
    colors: {
      error: process.env.VITE_THEME_ERROR || "#dc2626",
      warning: process.env.VITE_THEME_WARNING || "#f59e0b",
      success: process.env.VITE_THEME_SUCCESS || "#16a34a",
      info: process.env.VITE_THEME_INFO || "#0284c7",
      secondary: process.env.VITE_THEME_SECONDARY || "#64748b",
    },
    sizing: {
      component: process.env.VITE_COMPONENT_SIZE_DEFAULT || "md",
      button: process.env.VITE_BUTTON_SIZE_DEFAULT || "md",
      input: process.env.VITE_INPUT_SIZE_DEFAULT || "md",
      modal: process.env.VITE_MODAL_SIZE_DEFAULT || "md",
    },
    layout: {
      density: process.env.VITE_LAYOUT_DENSITY || "comfortable",
      gridGap: parseInt(process.env.VITE_GRID_GAP || "4"),
      maxWidth: process.env.VITE_CONTAINER_MAX_WIDTH || "xl",
      sidebarWidth: process.env.VITE_SIDEBAR_WIDTH || "280px",
    },
    typography: {
      fontFamily: process.env.VITE_FONT_FAMILY || "sans",
      fontSize: process.env.VITE_FONT_SIZE_BASE || "base",
      lineHeight: process.env.VITE_LINE_HEIGHT || "normal",
      letterSpacing: process.env.VITE_LETTER_SPACING || "normal",
    },
    accessibility: {
      highContrast: process.env.VITE_ACCESSIBILITY_HIGH_CONTRAST === 'true',
      reducedMotion: process.env.VITE_ACCESSIBILITY_REDUCED_MOTION === 'true',
      focusVisible: process.env.VITE_ACCESSIBILITY_FOCUS_VISIBLE !== 'false',
    },
    dashboard: {
      layout: process.env.VITE_DASHBOARD_LAYOUT || "grid",
      chartTheme: process.env.VITE_CHART_THEME || "default",
      metricCardVariant: process.env.VITE_METRIC_CARD_VARIANT || "glass",
      statusIndicatorSize: process.env.VITE_STATUS_INDICATOR_SIZE || "md",
    },
    forms: {
      layout: process.env.VITE_FORM_LAYOUT || "vertical",
      inputVariant: process.env.VITE_INPUT_VARIANT || "outlined",
      labelPosition: process.env.VITE_LABEL_POSITION || "top",
      validationStyle: process.env.VITE_VALIDATION_STYLE || "inline",
    },
    notifications: {
      toastPosition: process.env.VITE_TOAST_POSITION || "top-right",
      toastDuration: parseInt(process.env.VITE_TOAST_DURATION || "5000"),
      notificationVariant: process.env.VITE_NOTIFICATION_VARIANT || "glass",
      loadingSpinnerVariant: process.env.VITE_LOADING_SPINNER_VARIANT || "pulse",
    },
    responsive: {
      sm: process.env.VITE_RESPONSIVE_BREAKPOINT_SM || "640px",
      md: process.env.VITE_RESPONSIVE_BREAKPOINT_MD || "768px",
      lg: process.env.VITE_RESPONSIVE_BREAKPOINT_LG || "1024px",
      xl: process.env.VITE_RESPONSIVE_BREAKPOINT_XL || "1280px",
    },
    features: {
      rippleEffects: process.env.VITE_ENABLE_RIPPLE_EFFECTS !== 'false',
      hoverLift: process.env.VITE_ENABLE_HOVER_LIFT !== 'false',
      focusRings: process.env.VITE_ENABLE_FOCUS_RINGS !== 'false',
      gradientBackgrounds: process.env.VITE_ENABLE_GRADIENT_BACKGROUNDS !== 'false',
    },
  },
};

// Create theme context
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Theme provider props
interface ThemeProviderProps {
  children: ReactNode;
  defaultMode?: ThemeMode;
  storageKey?: string;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  defaultMode = "auto",
  storageKey = process.env.VITE_THEME_STORAGE_KEY || "autmatrix-theme",
}) => {
  // System preference detection
  const [systemPreference, setSystemPreference] = useState<"light" | "dark">(
    () => {
      if (typeof window === "undefined") return "light";
      return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    },
  );

  // Theme configuration state
  const [config, setConfig] = useState<ThemeConfig>(() => {
    if (typeof window === "undefined") return defaultThemeConfig;

    try {
      const stored = localStorage.getItem(`${storageKey}-config`);
      return stored
        ? { ...defaultThemeConfig, ...JSON.parse(stored) }
        : defaultThemeConfig;
    } catch {
      return defaultThemeConfig;
    }
  });

  // Current theme mode
  const [mode, setModeState] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") return defaultMode;

    try {
      const stored = localStorage.getItem(storageKey);
      return (stored as ThemeMode) || defaultMode;
    } catch {
      return defaultMode;
    }
  });

  // Computed dark mode state
  const isDark =
    mode === "dark" || (mode === "auto" && systemPreference === "dark");
  const isSystemMode = mode === "auto";

  // Listen for system preference changes
  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = (e: MediaQueryListEvent) => {
      setSystemPreference(e.matches ? "dark" : "light");
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  // Apply theme to document
  useEffect(() => {
    if (typeof window === "undefined") return;

    const root = document.documentElement;
    const body = document.body;

    // Apply dark/light mode
    if (isDark) {
      root.classList.add("dark");
      body.classList.add("dark");
    } else {
      root.classList.remove("dark");
      body.classList.remove("dark");
    }

    // Apply automotive theme variables
    root.style.setProperty("--automotive-primary", config.automotive.primary);
    root.style.setProperty("--automotive-accent", config.automotive.accent);
    root.style.setProperty("--automotive-surface", config.automotive.surface);

    // Apply glassmorphism settings
    if (config.glassmorphism.enabled) {
      root.classList.add("glassmorphism-enabled");
      root.setAttribute("data-glass-intensity", config.glassmorphism.intensity);
    } else {
      root.classList.remove("glassmorphism-enabled");
    }

    // Apply animation settings
    if (config.animations.enabled) {
      root.classList.add("animations-enabled");
      root.setAttribute("data-animation-duration", config.animations.duration);
    } else {
      root.classList.remove("animations-enabled");
    }

    // Store theme preference
    try {
      localStorage.setItem(storageKey, mode);
      localStorage.setItem(`${storageKey}-config`, JSON.stringify(config));
    } catch {
      // Handle storage errors silently
    }
  }, [isDark, mode, config, storageKey]);

  // Theme actions
  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
  };

  const toggleTheme = () => {
    if (mode === "auto") {
      setMode(systemPreference === "dark" ? "light" : "dark");
    } else {
      setMode(mode === "dark" ? "light" : "dark");
    }
  };

  const updateConfig = (newConfig: Partial<ThemeConfig>) => {
    setConfig((prev) => ({ ...prev, ...newConfig }));
  };

  // Context value
  const contextValue: ThemeContextType = {
    isDark,
    mode,
    config,
    setMode,
    toggleTheme,
    updateConfig,
    systemPreference,
    isSystemMode,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use theme context
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);

  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }

  return context;
};

// Theme utility hooks
export const useColorScheme = () => {
  const { isDark } = useTheme();
  return isDark ? "dark" : "light";
};

export const useAutomotiveColors = () => {
  const { config } = useTheme();
  return config.automotive;
};

export const useGlassmorphism = () => {
  const { config } = useTheme();
  return config.glassmorphism;
};

export const useAnimations = () => {
  const { config } = useTheme();
  return config.animations;
};

// Theme preference persistence utilities
export const getStoredTheme = (
  storageKey = process.env.VITE_THEME_STORAGE_KEY || "autmatrix-theme",
): ThemeMode | null => {
  if (typeof window === "undefined") return null;

  try {
    return localStorage.getItem(storageKey) as ThemeMode;
  } catch {
    return null;
  }
};

export const clearStoredTheme = (
  storageKey = process.env.VITE_THEME_STORAGE_KEY || "autmatrix-theme",
): void => {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(storageKey);
    localStorage.removeItem(`${storageKey}-config`);
  } catch {
    // Handle errors silently
  }
};

// Theme detection utilities
export const getSystemThemePreference = (): "light" | "dark" => {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

export const supportsColorScheme = (): boolean => {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-color-scheme)").matches;
};

// CSS-in-JS utilities for theme-aware styling
export const themeAware = (lightValue: string, darkValue: string) => {
  return `light-dark(${lightValue}, ${darkValue})`;
};

export const glassmorphismCSS = (
  intensity: "subtle" | "medium" | "strong" = "medium",
) => {
  const intensityMap = {
    subtle: {
      background: "rgba(255, 255, 255, 0.08)",
      border: "rgba(255, 255, 255, 0.12)",
      backdrop: "blur(12px)",
    },
    medium: {
      background: "rgba(255, 255, 255, 0.12)",
      border: "rgba(255, 255, 255, 0.18)",
      backdrop: "blur(20px)",
    },
    strong: {
      background: "rgba(255, 255, 255, 0.20)",
      border: "rgba(255, 255, 255, 0.30)",
      backdrop: "blur(32px)",
    },
  };

  const config = intensityMap[intensity];

  return {
    background: config.background,
    backdropFilter: config.backdrop,
    WebkitBackdropFilter: config.backdrop,
    border: `1px solid ${config.border}`,
    borderRadius: "12px",
    boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.37)",
  };
};

// Export theme types for consumption
// export type { ThemeMode, ThemeConfig }; // Already exported at top

// Default export for convenience
export default ThemeProvider;



