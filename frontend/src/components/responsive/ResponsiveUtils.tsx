import React, { useState, useEffect } from "react";

// Enhanced responsive utilities for the AutoMatrix system
export interface BreakpointConfig {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  "2xl": number;
}

export const defaultBreakpoints: BreakpointConfig = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
};

export type BreakpointKey = keyof BreakpointConfig;

// Hook for responsive breakpoint detection
export const useBreakpoint = (
  breakpoints: BreakpointConfig = defaultBreakpoints,
) => {
  const [currentBreakpoint, setCurrentBreakpoint] =
    useState<BreakpointKey>("lg");
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 1024,
    height: typeof window !== "undefined" ? window.innerHeight : 768,
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      setWindowSize({ width, height });

      // Determine current breakpoint
      if (width >= breakpoints["2xl"]) {
        setCurrentBreakpoint("2xl");
      } else if (width >= breakpoints.xl) {
        setCurrentBreakpoint("xl");
      } else if (width >= breakpoints.lg) {
        setCurrentBreakpoint("lg");
      } else if (width >= breakpoints.md) {
        setCurrentBreakpoint("md");
      } else if (width >= breakpoints.sm) {
        setCurrentBreakpoint("sm");
      } else {
        setCurrentBreakpoint("xs");
      }
    };

    // Initial call
    handleResize();

    // Add event listener
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => window.removeEventListener("resize", handleResize);
  }, [breakpoints]);

  const isBreakpoint = (breakpoint: BreakpointKey) =>
    currentBreakpoint === breakpoint;
  const isBreakpointUp = (breakpoint: BreakpointKey) =>
    windowSize.width >= breakpoints[breakpoint];
  const isBreakpointDown = (breakpoint: BreakpointKey) =>
    windowSize.width < breakpoints[breakpoint];
  const isMobile = isBreakpointDown("md");
  const isTablet = isBreakpoint("md") || isBreakpoint("lg");
  const isDesktop = isBreakpointUp("lg");

  return {
    currentBreakpoint,
    windowSize,
    isBreakpoint,
    isBreakpointUp,
    isBreakpointDown,
    isMobile,
    isTablet,
    isDesktop,
  };
};

// Responsive Grid Component
interface ResponsiveGridProps {
  children: React.ReactNode;
  cols?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
    "2xl"?: number;
  };
  gap?: number;
  className?: string;
}

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  cols = { xs: 1, sm: 2, md: 3, lg: 4, xl: 5, "2xl": 6 },
  gap = 4,
  className = "",
}) => {
  const { currentBreakpoint } = useBreakpoint();

  const getCurrentCols = () => {
    const breakpointOrder: BreakpointKey[] = [
      "2xl",
      "xl",
      "lg",
      "md",
      "sm",
      "xs",
    ];

    for (const bp of breakpointOrder) {
      if (cols[bp] !== undefined && currentBreakpoint === bp) {
        return cols[bp];
      }
    }

    // Fallback logic
    const currentIndex = breakpointOrder.indexOf(currentBreakpoint);
    for (let i = currentIndex; i < breakpointOrder.length; i++) {
      if (cols[breakpointOrder[i]] !== undefined) {
        return cols[breakpointOrder[i]];
      }
    }

    return 1;
  };

  const gridCols = getCurrentCols();

  return (
    <div
      className={`grid gap-${gap} ${className}`}
      style={{
        gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))`,
      }}
    >
      {children}
    </div>
  );
};

// Responsive Container Component
interface ResponsiveContainerProps {
  children: React.ReactNode;
  maxWidth?: {
    xs?: string;
    sm?: string;
    md?: string;
    lg?: string;
    xl?: string;
    "2xl"?: string;
  };
  padding?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
    "2xl"?: number;
  };
  className?: string;
}

export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  maxWidth = {
    xs: "100%",
    sm: "640px",
    md: "768px",
    lg: "1024px",
    xl: "1280px",
    "2xl": "1536px",
  },
  padding = {
    xs: 4,
    sm: 6,
    md: 8,
    lg: 12,
    xl: 16,
    "2xl": 20,
  },
  className = "",
}) => {
  const { currentBreakpoint } = useBreakpoint();

  const getCurrentMaxWidth = () => {
    const breakpointOrder: BreakpointKey[] = [
      "2xl",
      "xl",
      "lg",
      "md",
      "sm",
      "xs",
    ];

    for (const bp of breakpointOrder) {
      if (
        maxWidth[bp] &&
        (currentBreakpoint === bp || currentBreakpoint === "xs")
      ) {
        return maxWidth[bp];
      }
    }

    return maxWidth.lg || "1024px";
  };

  const getCurrentPadding = () => {
    const breakpointOrder: BreakpointKey[] = [
      "2xl",
      "xl",
      "lg",
      "md",
      "sm",
      "xs",
    ];

    for (const bp of breakpointOrder) {
      if (padding[bp] !== undefined && currentBreakpoint === bp) {
        return padding[bp];
      }
    }

    return padding.md || 8;
  };

  return (
    <div
      className={`mx-auto ${className}`}
      style={{
        maxWidth: getCurrentMaxWidth(),
        padding: `${getCurrentPadding() * 0.25}rem`,
      }}
    >
      {children}
    </div>
  );
};

// Responsive Text Component
interface ResponsiveTextProps {
  children: React.ReactNode;
  size?: {
    xs?: string;
    sm?: string;
    md?: string;
    lg?: string;
    xl?: string;
    "2xl"?: string;
  };
  weight?: {
    xs?: string;
    sm?: string;
    md?: string;
    lg?: string;
    xl?: string;
    "2xl"?: string;
  };
  className?: string;
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "span" | "div";
}

export const ResponsiveText: React.FC<ResponsiveTextProps> = ({
  children,
  size = {
    xs: "text-sm",
    sm: "text-base",
    md: "text-lg",
    lg: "text-xl",
    xl: "text-2xl",
    "2xl": "text-3xl",
  },
  weight = {
    xs: "font-normal",
    sm: "font-medium",
    md: "font-semibold",
    lg: "font-bold",
  },
  className = "",
  as: Component = "div",
}) => {
  const { currentBreakpoint } = useBreakpoint();

  const getCurrentSize = () => {
    return size[currentBreakpoint] || size.md || "text-lg";
  };

  const getCurrentWeight = () => {
    return weight[currentBreakpoint] || weight.md || "font-semibold";
  };

  return (
    <Component
      className={`${getCurrentSize()} ${getCurrentWeight()} ${className}`}
    >
      {children}
    </Component>
  );
};

// Responsive Navigation Component
interface ResponsiveNavProps {
  children: React.ReactNode;
  mobileBreakpoint?: BreakpointKey;
  mobileLayout?: "bottom" | "slide" | "collapse";
  desktopLayout?: "sidebar" | "top" | "horizontal";
  className?: string;
}

export const ResponsiveNav: React.FC<ResponsiveNavProps> = ({
  children,
  mobileBreakpoint = "md",
  mobileLayout = "bottom",
  desktopLayout = "sidebar",
  className = "",
}) => {
  const { isBreakpointDown } = useBreakpoint();
  const isMobileView = isBreakpointDown(mobileBreakpoint);

  if (isMobileView) {
    switch (mobileLayout) {
      case "bottom":
        return (
          <nav
            className={`fixed bottom-0 left-0 right-0 z-50 glass-card-strong border-t ${className}`}
          >
            <div className="flex justify-around items-center h-16">
              {children}
            </div>
          </nav>
        );
      case "slide":
        return (
          <nav
            className={`fixed top-0 left-0 h-full z-50 glass-card-strong transform transition-transform ${className}`}
          >
            {children}
          </nav>
        );
      case "collapse":
        return (
          <nav className={`w-full glass-card border-b ${className}`}>
            {children}
          </nav>
        );
      default:
        return <nav className={className}>{children}</nav>;
    }
  }

  // Desktop layout
  switch (desktopLayout) {
    case "sidebar":
      return (
        <nav
          className={`fixed left-0 top-0 h-full w-64 glass-card-strong border-r ${className}`}
        >
          {children}
        </nav>
      );
    case "top":
      return (
        <nav className={`w-full glass-card border-b ${className}`}>
          {children}
        </nav>
      );
    case "horizontal":
      return (
        <nav
          className={`flex items-center justify-between glass-card ${className}`}
        >
          {children}
        </nav>
      );
    default:
      return <nav className={className}>{children}</nav>;
  }
};

// Device orientation hook
export const useOrientation = () => {
  const [orientation, setOrientation] = useState<"portrait" | "landscape">(
    "portrait",
  );

  useEffect(() => {
    const handleOrientationChange = () => {
      if (typeof window !== "undefined") {
        setOrientation(
          window.innerHeight > window.innerWidth ? "portrait" : "landscape",
        );
      }
    };

    handleOrientationChange();
    window.addEventListener("resize", handleOrientationChange);

    return () => window.removeEventListener("resize", handleOrientationChange);
  }, []);

  return orientation;
};

// Touch device detection
export const useTouchDevice = () => {
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    setIsTouchDevice(
      "ontouchstart" in window ||
        navigator.maxTouchPoints > 0 ||
        navigator.maxTouchPoints > 0,
    );
  }, []);

  return isTouchDevice;
};


