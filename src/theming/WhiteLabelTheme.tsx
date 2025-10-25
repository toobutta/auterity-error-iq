/**
 * White-Label Theming System
 * Dynamic theme customization for enterprise tenants
 */

import React, { useEffect, useMemo } from 'react';
import { useTenant } from '../tenancy/TenantProvider';

export interface WhiteLabelTheme {
  brandColors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  logo: {
    light: string;
    dark: string;
    favicon: string;
  };
  typography: {
    fontFamily: string;
    headingFont: string;
  };
  customCSS?: string;
  customVariables?: Record<string, string>;
}

interface WhiteLabelProviderProps {
  children: React.ReactNode;
  fallbackTheme?: Partial<WhiteLabelTheme>;
}

export const WhiteLabelProvider: React.FC<WhiteLabelProviderProps> = ({
  children,
  fallbackTheme
}) => {
  const { tenant, isFeatureEnabled } = useTenant();

  // Generate white-label theme from tenant config
  const whiteLabelTheme = useMemo((): WhiteLabelTheme | null => {
    if (!tenant || !isFeatureEnabled('whiteLabel')) {
      return fallbackTheme ? { ...fallbackTheme } as WhiteLabelTheme : null;
    }

    return {
      brandColors: {
        primary: tenant.branding.primaryColor,
        secondary: tenant.branding.secondaryColor,
        accent: tenant.branding.accentColor
      },
      logo: tenant.logo,
      typography: {
        fontFamily: tenant.branding.fontFamily,
        headingFont: tenant.branding.fontFamily // Could be different
      },
      customVariables: {
        // Custom CSS variables for tenant-specific styling
        '--tenant-name': tenant.name,
        '--tenant-domain': tenant.domain
      }
    };
  }, [tenant, isFeatureEnabled, fallbackTheme]);

  // Apply white-label theme to document
  useEffect(() => {
    if (!whiteLabelTheme) return;

    const root = document.documentElement;

    // Apply brand colors
    Object.entries(whiteLabelTheme.brandColors).forEach(([key, value]) => {
      root.style.setProperty(`--wl-${key}`, value);
    });

    // Apply typography
    if (whiteLabelTheme.typography) {
      root.style.setProperty('--wl-font-family', whiteLabelTheme.typography.fontFamily);
      root.style.setProperty('--wl-heading-font', whiteLabelTheme.typography.headingFont);
    }

    // Apply custom variables
    if (whiteLabelTheme.customVariables) {
      Object.entries(whiteLabelTheme.customVariables).forEach(([key, value]) => {
        root.style.setProperty(key, value);
      });
    }

    // Update logos
    updateLogos(whiteLabelTheme.logo);

    // Apply custom CSS
    if (whiteLabelTheme.customCSS) {
      applyCustomCSS(whiteLabelTheme.customCSS);
    }

    // Cleanup function
    return () => {
      // Reset to defaults when component unmounts or theme changes
      resetTheme();
    };
  }, [whiteLabelTheme]);

  const updateLogos = (logos: WhiteLabelTheme['logo']) => {
    // Update main logo
    const logoElements = document.querySelectorAll('[data-wl-logo]');
    logoElements.forEach(element => {
      const img = element as HTMLImageElement;
      const currentSrc = img.src;
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

      if (logos) {
        img.src = isDark && logos.dark ? logos.dark : logos.light;
        img.alt = tenant?.name || 'Auterity';
      }
    });

    // Update favicon
    if (logos?.favicon) {
      const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
      if (favicon) {
        favicon.href = logos.favicon;
      }

      // Also update apple-touch-icon
      const appleIcon = document.querySelector('link[rel="apple-touch-icon"]') as HTMLLinkElement;
      if (appleIcon) {
        appleIcon.href = logos.favicon;
      }
    }
  };

  const applyCustomCSS = (customCSS: string) => {
    // Remove existing custom CSS
    const existingStyle = document.getElementById('wl-custom-css');
    if (existingStyle) {
      existingStyle.remove();
    }

    // Apply new custom CSS
    const style = document.createElement('style');
    style.id = 'wl-custom-css';
    style.textContent = customCSS;
    document.head.appendChild(style);
  };

  const resetTheme = () => {
    const root = document.documentElement;

    // Reset brand colors to defaults
    root.style.removeProperty('--wl-primary');
    root.style.removeProperty('--wl-secondary');
    root.style.removeProperty('--wl-accent');

    // Reset typography
    root.style.removeProperty('--wl-font-family');
    root.style.removeProperty('--wl-heading-font');

    // Reset custom variables
    root.style.removeProperty('--tenant-name');
    root.style.removeProperty('--tenant-domain');

    // Remove custom CSS
    const customStyle = document.getElementById('wl-custom-css');
    if (customStyle) {
      customStyle.remove();
    }

    // Reset logos to defaults
    const logoElements = document.querySelectorAll('[data-wl-logo]');
    logoElements.forEach(element => {
      const img = element as HTMLImageElement;
      img.src = '/logo.svg'; // Default logo
      img.alt = 'Auterity';
    });

    // Reset favicon
    const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
    if (favicon) {
      favicon.href = '/favicon.ico';
    }
  };

  return <>{children}</>;
};

// Hook for using white-label theme
export const useWhiteLabel = () => {
  const { tenant, isFeatureEnabled } = useTenant();

  const isWhiteLabelEnabled = isFeatureEnabled('whiteLabel');

  const getBrandedColor = (colorType: keyof WhiteLabelTheme['brandColors']) => {
    if (!isWhiteLabelEnabled || !tenant) return null;
    return tenant.branding.primaryColor; // Simplified
  };

  const getLogo = (variant: 'light' | 'dark' | 'favicon' = 'light') => {
    if (!isWhiteLabelEnabled || !tenant) return null;
    return tenant.logo[variant];
  };

  return {
    isWhiteLabelEnabled,
    getBrandedColor,
    getLogo,
    tenantName: tenant?.name,
    tenantDomain: tenant?.domain
  };
};

// Component for branded logo
export const BrandedLogo: React.FC<{
  variant?: 'light' | 'dark';
  className?: string;
  width?: number;
  height?: number;
}> = ({ variant = 'light', className = '', width = 120, height = 40 }) => {
  const { getLogo, tenantName } = useWhiteLabel();

  const logoSrc = getLogo(variant);
  const fallbackSrc = '/logo.svg';

  return (
    <img
      src={logoSrc || fallbackSrc}
      alt={`${tenantName || 'Auterity'} Logo`}
      className={className}
      width={width}
      height={height}
      data-wl-logo
    />
  );
};

export default WhiteLabelProvider;
