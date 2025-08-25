/**
 * White-Label Theming Engine
 * Provides dynamic theming and brand customization capabilities
 */

import fs from "fs/promises";
import path from "path";

export interface ThemeConfig {
  id: string;
  name: string;
  description: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    error: string;
    warning: string;
    success: string;
    info: string;
  };
  typography: {
    fontFamily: string;
    fontSize: {
      xs: string;
      sm: string;
      base: string;
      lg: string;
      xl: string;
      "2xl": string;
      "3xl": string;
    };
    fontWeight: {
      light: string;
      normal: string;
      medium: string;
      semibold: string;
      bold: string;
    };
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  borderRadius: {
    none: string;
    sm: string;
    md: string;
    lg: string;
    full: string;
  };
  shadows: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
}

export interface BrandAssets {
  logo: {
    light: string; // URL or base64
    dark: string; // URL or base64
    favicon: string;
  };
  images: {
    [key: string]: string; // key: URL or base64
  };
  customCSS?: string;
}

export interface WhiteLabelConfig {
  theme: ThemeConfig;
  assets: BrandAssets;
  customization: {
    companyName: string;
    supportEmail: string;
    helpUrl?: string;
    termsUrl?: string;
    privacyUrl?: string;
  };
}

export class WhiteLabelEngine {
  private themesDir: string;
  private assetsDir: string;
  private outputDir: string;

  constructor(
    themesDir: string = "./themes",
    assetsDir: string = "./assets",
    outputDir: string = "./dist",
  ) {
    this.themesDir = themesDir;
    this.assetsDir = assetsDir;
    this.outputDir = outputDir;
  }

  async createTheme(config: ThemeConfig): Promise<void> {
    const themeDir = path.join(this.themesDir, config.id);
    await fs.mkdir(themeDir, { recursive: true });

    // Save theme configuration
    await fs.writeFile(
      path.join(themeDir, "config.json"),
      JSON.stringify(config, null, 2),
    );

    // Generate CSS variables
    const cssVariables = this.generateCSSVariables(config);
    await fs.writeFile(path.join(themeDir, "variables.css"), cssVariables);

    // Generate Tailwind config
    const tailwindConfig = this.generateTailwindConfig(config);
    await fs.writeFile(
      path.join(themeDir, "tailwind.config.js"),
      tailwindConfig,
    );
  }

  private generateCSSVariables(config: ThemeConfig): string {
    const variables = [
      ":root {",
      "  /* Colors */",
      ...Object.entries(config.colors).map(
        ([key, value]) => `  --color-${this.kebabCase(key)}: ${value};`,
      ),
      "",
      "  /* Typography */",
      `  --font-family: ${config.typography.fontFamily};`,
      ...Object.entries(config.typography.fontSize).map(
        ([key, value]) => `  --font-size-${key}: ${value};`,
      ),
      ...Object.entries(config.typography.fontWeight).map(
        ([key, value]) => `  --font-weight-${key}: ${value};`,
      ),
      "",
      "  /* Spacing */",
      ...Object.entries(config.spacing).map(
        ([key, value]) => `  --spacing-${key}: ${value};`,
      ),
      "",
      "  /* Border Radius */",
      ...Object.entries(config.borderRadius).map(
        ([key, value]) =>
          `  --border-radius-${key === "none" ? "0" : key}: ${value};`,
      ),
      "",
      "  /* Shadows */",
      ...Object.entries(config.shadows).map(
        ([key, value]) => `  --shadow-${key}: ${value};`,
      ),
      "}",
      "",
      "/* Utility Classes */",
      ".bg-primary { background-color: var(--color-primary); }",
      ".bg-secondary { background-color: var(--color-secondary); }",
      ".bg-accent { background-color: var(--color-accent); }",
      ".text-primary { color: var(--color-text); }",
      ".text-secondary { color: var(--color-text-secondary); }",
      ".border-default { border-color: var(--color-border); }",
      ".shadow-theme { box-shadow: var(--shadow-md); }",
    ].join("\n");

    return variables;
  }

  private generateTailwindConfig(config: ThemeConfig): string {
    const tailwindConfig = `module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary)',
        secondary: 'var(--color-secondary)',
        accent: 'var(--color-accent)',
        background: 'var(--color-background)',
        surface: 'var(--color-surface)',
        text: {
          DEFAULT: 'var(--color-text)',
          secondary: 'var(--color-text-secondary)',
        },
        border: 'var(--color-border)',
        error: 'var(--color-error)',
        warning: 'var(--color-warning)',
        success: 'var(--color-success)',
        info: 'var(--color-info)',
      },
      fontFamily: {
        sans: ['var(--font-family)', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        ${Object.entries(config.typography.fontSize)
          .map(([key, value]) => `'${key}': 'var(--font-size-${key})'`)
          .join(",\n        ")},
      },
      fontWeight: {
        ${Object.entries(config.typography.fontWeight)
          .map(([key, value]) => `'${key}': 'var(--font-weight-${key})'`)
          .join(",\n        ")},
      },
      spacing: {
        ${Object.entries(config.spacing)
          .map(([key, value]) => `'${key}': 'var(--spacing-${key})'`)
          .join(",\n        ")},
      },
      borderRadius: {
        ${Object.entries(config.borderRadius)
          .map(
            ([key, value]) =>
              `'${key === "none" ? "0" : key}': 'var(--border-radius-${key === "none" ? "0" : key})'`,
          )
          .join(",\n        ")},
      },
      boxShadow: {
        ${Object.entries(config.shadows)
          .map(([key, value]) => `'${key}': 'var(--shadow-${key})'`)
          .join(",\n        ")},
      },
    },
  },
  plugins: [],
};`;

    return tailwindConfig;
  }

  async loadTheme(themeId: string): Promise<ThemeConfig> {
    const configPath = path.join(this.themesDir, themeId, "config.json");
    const configContent = await fs.readFile(configPath, "utf-8");
    return JSON.parse(configContent);
  }

  async listThemes(): Promise<ThemeConfig[]> {
    const themes: ThemeConfig[] = [];

    try {
      const themeDirectories = await fs.readdir(this.themesDir);

      for (const dir of themeDirectories) {
        try {
          const theme = await this.loadTheme(dir);
          themes.push(theme);
        } catch (error) {
          console.warn(`Failed to load theme ${dir}:`, error);
        }
      }
    } catch (error) {
      console.warn("Failed to read themes directory:", error);
    }

    return themes;
  }

  async generateWhiteLabelBundle(config: WhiteLabelConfig): Promise<string> {
    const bundleDir = path.join(this.outputDir, `${config.theme.id}-bundle`);
    await fs.mkdir(bundleDir, { recursive: true });

    // Generate theme files
    await this.createTheme(config.theme);

    // Copy theme files to bundle
    const themeDir = path.join(this.themesDir, config.theme.id);
    await this.copyDirectory(themeDir, path.join(bundleDir, "theme"));

    // Process brand assets
    const assetsDir = path.join(bundleDir, "assets");
    await fs.mkdir(assetsDir, { recursive: true });

    // Save assets configuration
    await fs.writeFile(
      path.join(assetsDir, "config.json"),
      JSON.stringify(config.assets, null, 2),
    );

    // Generate customization files
    await this.generateCustomizationFiles(config, bundleDir);

    // Generate deployment instructions
    await this.generateDeploymentInstructions(config, bundleDir);

    return bundleDir;
  }

  private async generateCustomizationFiles(
    config: WhiteLabelConfig,
    bundleDir: string,
  ): Promise<void> {
    // Generate environment configuration
    const envConfig = `# White-Label Configuration
COMPANY_NAME="${config.customization.companyName}"
SUPPORT_EMAIL="${config.customization.supportEmail}"
HELP_URL="${config.customization.helpUrl || ""}"
TERMS_URL="${config.customization.termsUrl || ""}"
PRIVACY_URL="${config.customization.privacyUrl || ""}"
THEME_ID="${config.theme.id}"
`;

    await fs.writeFile(path.join(bundleDir, ".env.whitelabel"), envConfig);

    // Generate branding configuration
    const brandingConfig = {
      company: config.customization,
      theme: config.theme.id,
      assets: config.assets,
      generatedAt: new Date().toISOString(),
    };

    await fs.writeFile(
      path.join(bundleDir, "branding.json"),
      JSON.stringify(brandingConfig, null, 2),
    );
  }

  private async generateDeploymentInstructions(
    config: WhiteLabelConfig,
    bundleDir: string,
  ): Promise<void> {
    const instructions = `# White-Label Deployment Guide

## Overview
This bundle contains a complete white-label configuration for ${config.customization.companyName}.

## Files Included
- \`theme/\` - Theme configuration and CSS variables
- \`assets/\` - Brand assets and logos
- \`.env.whitelabel\` - Environment configuration
- \`branding.json\` - Complete branding configuration

## Deployment Steps

### 1. Environment Setup
Copy the \`.env.whitelabel\` file to your application root and rename it to \`.env.local\`:
\`\`\`bash
cp .env.whitelabel /path/to/your/app/.env.local
\`\`\`

### 2. Theme Integration
Copy the theme files to your application:
\`\`\`bash
cp -r theme/ /path/to/your/app/src/themes/${config.theme.id}/
\`\`\`

### 3. Asset Integration
Copy brand assets to your public directory:
\`\`\`bash
cp -r assets/ /path/to/your/app/public/branding/
\`\`\`

### 4. CSS Import
Add the theme CSS to your main CSS file:
\`\`\`css
@import './themes/${config.theme.id}/variables.css';
\`\`\`

### 5. Component Configuration
Update your app configuration to use the white-label settings:
\`\`\`typescript
import brandingConfig from './branding.json';

// Use branding configuration in your app
const appConfig = {
  companyName: brandingConfig.company.companyName,
  supportEmail: brandingConfig.company.supportEmail,
  // ... other configuration
};
\`\`\`

## Verification
After deployment, verify that:
- [ ] Company name appears correctly in the UI
- [ ] Brand colors are applied throughout the application
- [ ] Logo displays correctly in light and dark modes
- [ ] Custom CSS styles are applied
- [ ] Support links point to the correct URLs

## Support
For technical support, contact: ${config.customization.supportEmail}

Generated on: ${new Date().toISOString()}
`;

    await fs.writeFile(path.join(bundleDir, "DEPLOYMENT.md"), instructions);
  }

  private async copyDirectory(src: string, dest: string): Promise<void> {
    await fs.mkdir(dest, { recursive: true });

    const entries = await fs.readdir(src, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);

      if (entry.isDirectory()) {
        await this.copyDirectory(srcPath, destPath);
      } else {
        await fs.copyFile(srcPath, destPath);
      }
    }
  }

  private kebabCase(str: string): string {
    return str.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
  }

  // Predefined themes
  static getDefaultThemes(): ThemeConfig[] {
    return [
      {
        id: "corporate-blue",
        name: "Corporate Blue",
        description: "Professional blue theme for corporate environments",
        colors: {
          primary: "#1e40af",
          secondary: "#64748b",
          accent: "#3b82f6",
          background: "#ffffff",
          surface: "#f8fafc",
          text: "#1e293b",
          textSecondary: "#64748b",
          border: "#e2e8f0",
          error: "#dc2626",
          warning: "#d97706",
          success: "#16a34a",
          info: "#2563eb",
        },
        typography: {
          fontFamily: '"Inter", sans-serif',
          fontSize: {
            xs: "0.75rem",
            sm: "0.875rem",
            base: "1rem",
            lg: "1.125rem",
            xl: "1.25rem",
            "2xl": "1.5rem",
            "3xl": "1.875rem",
          },
          fontWeight: {
            light: "300",
            normal: "400",
            medium: "500",
            semibold: "600",
            bold: "700",
          },
        },
        spacing: {
          xs: "0.5rem",
          sm: "1rem",
          md: "1.5rem",
          lg: "2rem",
          xl: "3rem",
        },
        borderRadius: {
          none: "0",
          sm: "0.25rem",
          md: "0.375rem",
          lg: "0.5rem",
          full: "9999px",
        },
        shadows: {
          sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
          md: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
          lg: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
          xl: "0 20px 25px -5px rgb(0 0 0 / 0.1)",
        },
      },
      {
        id: "modern-dark",
        name: "Modern Dark",
        description: "Sleek dark theme for modern applications",
        colors: {
          primary: "#8b5cf6",
          secondary: "#6b7280",
          accent: "#a855f7",
          background: "#111827",
          surface: "#1f2937",
          text: "#f9fafb",
          textSecondary: "#d1d5db",
          border: "#374151",
          error: "#f87171",
          warning: "#fbbf24",
          success: "#34d399",
          info: "#60a5fa",
        },
        typography: {
          fontFamily: '"Poppins", sans-serif',
          fontSize: {
            xs: "0.75rem",
            sm: "0.875rem",
            base: "1rem",
            lg: "1.125rem",
            xl: "1.25rem",
            "2xl": "1.5rem",
            "3xl": "1.875rem",
          },
          fontWeight: {
            light: "300",
            normal: "400",
            medium: "500",
            semibold: "600",
            bold: "700",
          },
        },
        spacing: {
          xs: "0.5rem",
          sm: "1rem",
          md: "1.5rem",
          lg: "2rem",
          xl: "3rem",
        },
        borderRadius: {
          none: "0",
          sm: "0.25rem",
          md: "0.5rem",
          lg: "0.75rem",
          full: "9999px",
        },
        shadows: {
          sm: "0 1px 2px 0 rgb(0 0 0 / 0.1)",
          md: "0 4px 6px -1px rgb(0 0 0 / 0.2)",
          lg: "0 10px 15px -3px rgb(0 0 0 / 0.3)",
          xl: "0 20px 25px -5px rgb(0 0 0 / 0.4)",
        },
      },
    ];
  }
}
