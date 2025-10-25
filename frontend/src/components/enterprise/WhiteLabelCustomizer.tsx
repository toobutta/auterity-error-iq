/**
 * White-Label Theme Customization Component
 */

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Alert, AlertDescription } from "../ui/alert";

interface ThemeConfig {
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
  };
  typography: {
    fontFamily: string;
  };
}

interface BrandAssets {
  logo: {
    light: string;
    dark: string;
    favicon: string;
  };
  companyName: string;
  supportEmail: string;
}

export const WhiteLabelCustomizer: React.FC = () => {
  const [themes, setThemes] = useState<ThemeConfig[]>([]);
  const [selectedTheme, setSelectedTheme] = useState<ThemeConfig | null>(null);
  const [brandAssets, setBrandAssets] = useState<BrandAssets>({
    logo: { light: "", dark: "", favicon: "" },
    companyName: "",
    supportEmail: "",
  });
  const [previewMode, setPreviewMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadThemes();
    loadBrandAssets();
  }, []);

  const loadThemes = async () => {
    try {
      // Mock predefined themes
      const mockThemes: ThemeConfig[] = [
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
          },
          typography: {
            fontFamily: '"Inter", sans-serif',
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
          },
          typography: {
            fontFamily: '"Poppins", sans-serif',
          },
        },
        {
          id: "emerald-green",
          name: "Emerald Green",
          description: "Fresh green theme for eco-friendly brands",
          colors: {
            primary: "#10b981",
            secondary: "#6b7280",
            accent: "#34d399",
            background: "#ffffff",
            surface: "#f0fdf4",
            text: "#1f2937",
            textSecondary: "#6b7280",
            border: "#d1fae5",
          },
          typography: {
            fontFamily: '"Roboto", sans-serif',
          },
        },
      ];

      setThemes(mockThemes);
      setSelectedTheme(mockThemes[0]);
    } catch (error) {

    } finally {
      setLoading(false);
    }
  };

  const loadBrandAssets = () => {
    // Load saved brand assets from localStorage or API
    const saved = localStorage.getItem("brandAssets");
    if (saved) {
      setBrandAssets(JSON.parse(saved));
    }
  };

  const handleThemeSelect = (theme: ThemeConfig) => {
    setSelectedTheme(theme);
    applyThemePreview(theme);
  };

  const applyThemePreview = (theme: ThemeConfig) => {
    if (!previewMode) return;

    const root = document.documentElement;
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(
        `--color-${key.replace(/([A-Z])/g, "-$1").toLowerCase()}`,
        value,
      );
    });
    root.style.setProperty("--font-family", theme.typography.fontFamily);
  };

  const handleBrandAssetChange = (
    field: string,
    value: string,
    subField?: string,
  ) => {
    setBrandAssets((prev) => {
      if (subField) {
        return {
          ...prev,
          [field]: {
            ...(prev[field as keyof BrandAssets] as any),
            [subField]: value,
          },
        };
      }
      return {
        ...prev,
        [field]: value,
      };
    });
  };

  const handleFileUpload = (
    field: string,
    subField: string,
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        handleBrandAssetChange(field, base64, subField);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const configuration = {
        theme: selectedTheme,
        assets: brandAssets,
        timestamp: new Date().toISOString(),
      };

      // Save to localStorage (in production, save to API)
      localStorage.setItem("whiteLabelConfig", JSON.stringify(configuration));
      localStorage.setItem("brandAssets", JSON.stringify(brandAssets));

      // Apply theme permanently
      if (selectedTheme) {
        applyThemePreview(selectedTheme);
      }

      alert("White-label configuration saved successfully!");
    } catch (error) {

      alert("Error saving configuration. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const togglePreview = () => {
    setPreviewMode(!previewMode);
    if (!previewMode && selectedTheme) {
      applyThemePreview(selectedTheme);
    } else {
      // Reset to default theme
      location.reload();
    }
  };

  const exportConfiguration = () => {
    const configuration = {
      theme: selectedTheme,
      assets: brandAssets,
      timestamp: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(configuration, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `whitelabel-config-${selectedTheme?.id || "custom"}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading themes...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">
          White-Label Customization
        </h1>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={togglePreview}>
            {previewMode ? "Exit Preview" : "Preview Mode"}
          </Button>
          <Button variant="outline" onClick={exportConfiguration}>
            Export Config
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      {previewMode && (
        <Alert>
          <AlertDescription>
            Preview mode is active. Changes are applied temporarily. Click "Save
            Changes" to make them permanent.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Theme Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Theme Selection</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {themes.map((theme) => (
                <div
                  key={theme.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedTheme?.id === theme.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => handleThemeSelect(theme)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{theme.name}</h3>
                      <p className="text-sm text-gray-500">
                        {theme.description}
                      </p>
                    </div>
                    {selectedTheme?.id === theme.id && (
                      <Badge className="bg-blue-100 text-blue-800">
                        Selected
                      </Badge>
                    )}
                  </div>
                  <div className="flex space-x-2 mt-3">
                    {Object.entries(theme.colors)
                      .slice(0, 6)
                      .map(([key, color]) => (
                        <div
                          key={key}
                          className="w-6 h-6 rounded-full border border-gray-300"
                          style={{ backgroundColor: color }}
                          title={key}
                        />
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Brand Assets */}
        <Card>
          <CardHeader>
            <CardTitle>Brand Assets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Name
                </label>
                <input
                  type="text"
                  value={brandAssets.companyName}
                  onChange={(e) =>
                    handleBrandAssetChange("companyName", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter company name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Support Email
                </label>
                <input
                  type="email"
                  value={brandAssets.supportEmail}
                  onChange={(e) =>
                    handleBrandAssetChange("supportEmail", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="support@company.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Light Logo
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload("logo", "light", e)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {brandAssets.logo.light && (
                  <img
                    src={brandAssets.logo.light}
                    alt="Light logo preview"
                    className="mt-2 max-h-16 object-contain"
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dark Logo
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload("logo", "dark", e)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {brandAssets.logo.dark && (
                  <img
                    src={brandAssets.logo.dark}
                    alt="Dark logo preview"
                    className="mt-2 max-h-16 object-contain bg-gray-900 p-2 rounded"
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Favicon
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload("logo", "favicon", e)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {brandAssets.logo.favicon && (
                  <img
                    src={brandAssets.logo.favicon}
                    alt="Favicon preview"
                    className="mt-2 w-8 h-8 object-contain"
                  />
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Color Customization */}
      {selectedTheme && (
        <Card>
          <CardHeader>
            <CardTitle>Color Customization</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(selectedTheme.colors).map(([key, color]) => (
                <div key={key} className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 capitalize">
                    {key.replace(/([A-Z])/g, " $1")}
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => {
                        const updatedTheme = {
                          ...selectedTheme,
                          colors: {
                            ...selectedTheme.colors,
                            [key]: e.target.value,
                          },
                        };
                        setSelectedTheme(updatedTheme);
                        if (previewMode) {
                          applyThemePreview(updatedTheme);
                        }
                      }}
                      className="w-12 h-8 border border-gray-300 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={color}
                      onChange={(e) => {
                        const updatedTheme = {
                          ...selectedTheme,
                          colors: {
                            ...selectedTheme.colors,
                            [key]: e.target.value,
                          },
                        };
                        setSelectedTheme(updatedTheme);
                        if (previewMode) {
                          applyThemePreview(updatedTheme);
                        }
                      }}
                      className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};


