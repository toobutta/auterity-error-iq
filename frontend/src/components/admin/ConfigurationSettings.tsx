import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Alert, AlertDescription } from "../ui/alert";
import {
  Eye,
  EyeOff,
  Save,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";

interface ConfigurationItem {
  key: string;
  label: string;
  value: string;
  category: string;
  isSecret: boolean;
  placeholder: string;
  description: string;
}

interface ConfigurationSettingsProps {
  onSave?: (config: Record<string, string>) => void;
  onTest?: (config: Record<string, string>) => Promise<boolean>;
  readonly?: boolean;
}

export const ConfigurationSettings: React.FC<ConfigurationSettingsProps> = ({
  onSave,
  onTest,
  readonly = false,
}) => {
  const [configurations, setConfigurations] = useState<ConfigurationItem[]>([
    // Database Configuration
    {
      key: "POSTGRES_PASSWORD",
      label: "Database Password",
      value: "",
      category: "Database",
      isSecret: true,
      placeholder: "Enter secure database password",
      description: "PostgreSQL database password for production environment",
    },
    {
      key: "DATABASE_URL",
      label: "Database URL",
      value: "",
      category: "Database",
      isSecret: true,
      placeholder: "postgresql://username:${PASSWORD}@hostname:5432/database", // pragma: allowlist secret
      description: "Complete database connection string",
    },

    // Security Configuration
    {
      key: "SECRET_KEY",
      label: "Application Secret Key",
      value: "",
      category: "Security",
      isSecret: true,
      placeholder: "Generate 256-bit secure secret key",
      description: "Main application secret key for encryption and signing",
    },
    {
      key: "JWT_SECRET_KEY",
      label: "JWT Secret Key",
      value: "",
      category: "Security",
      isSecret: true,
      placeholder: "Generate JWT-specific secret key",
      description: "Secret key used for JWT token signing and verification",
    },

    // AI Service Configuration
    {
      key: "OPENAI_API_KEY",
      label: "OpenAI API Key",
      value: "",
      category: "AI Services",
      isSecret: true,
      placeholder: "sk-...",
      description: "OpenAI API key for GPT model access",
    },
    {
      key: "ANTHROPIC_API_KEY",
      label: "Anthropic API Key",
      value: "",
      category: "AI Services",
      isSecret: true,
      placeholder: "sk-ant-...",
      description: "Anthropic API key for Claude model access",
    },
    {
      key: "CLAUDE_API_KEY",
      label: "Claude API Key",
      value: "",
      category: "AI Services",
      isSecret: true,
      placeholder: "Claude API key",
      description: "Additional Claude API configuration",
    },
  ]);

  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResults, setTestResults] = useState<Record<string, boolean>>({});
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">(
    "idle",
  );

  // Group configurations by category
  const groupedConfigs = configurations.reduce(
    (acc, config) => {
      if (!acc[config.category]) {
        acc[config.category] = [];
      }
      acc[config.category].push(config);
      return acc;
    },
    {} as Record<string, ConfigurationItem[]>,
  );

  const handleInputChange = (key: string, value: string): void => {
    setConfigurations((prev) =>
      prev.map((config) =>
        config.key === key ? { ...config, value } : config,
      ),
    );
  };

  const toggleSecretVisibility = (key: string): void => {
    setShowSecrets((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const generateSecretKey = (length = 64): string => {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    let result = "";
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleGenerateSecret = (key: string): void => {
    const secretLength = key.includes("JWT") ? 64 : 32;
    const generatedSecret = generateSecretKey(secretLength);
    handleInputChange(key, generatedSecret);
  };

  const handleSave = async (): Promise<void> => {
    setSaving(true);
    setSaveStatus("idle");

    try {
      const configObject = configurations.reduce(
        (acc, config) => {
          if (config.value.trim()) {
            acc[config.key] = config.value;
          }
          return acc;
        },
        {} as Record<string, string>,
      );

      if (onSave) {
        await onSave(configObject);
      }

      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch (error) {
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 5000);
    } finally {
      setSaving(false);
    }
  };

  const handleTestConfiguration = async (): Promise<void> => {
    if (!onTest) return;

    setTesting(true);
    setTestResults({});

    try {
      const configObject = configurations.reduce(
        (acc, config) => {
          if (config.value.trim()) {
            acc[config.key] = config.value;
          }
          return acc;
        },
        {} as Record<string, string>,
      );

      const isValid = await onTest(configObject);
      setTestResults({ overall: isValid });
    } catch (error) {
      setTestResults({ overall: false });
    } finally {
      setTesting(false);
    }
  };

  const hasUnsavedChanges = configurations.some(
    (config) => config.value.trim() !== "",
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Configuration Settings
          </h2>
          <p className="text-gray-600 mt-1">
            Configure production environment settings and API keys
          </p>
        </div>

        <div className="flex space-x-2">
          {onTest && (
            <Button
              onClick={handleTestConfiguration}
              disabled={testing || !hasUnsavedChanges}
              variant="outline"
              className="flex items-center"
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${testing ? "animate-spin" : ""}`}
              />
              Test Configuration
            </Button>
          )}

          <Button
            onClick={handleSave}
            disabled={saving || !hasUnsavedChanges || readonly}
            className="flex items-center"
          >
            <Save className={`h-4 w-4 mr-2 ${saving ? "animate-pulse" : ""}`} />
            {saving ? "Saving..." : "Save Configuration"}
          </Button>
        </div>
      </div>

      {/* Status Alerts */}
      {saveStatus === "success" && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Configuration saved successfully!
          </AlertDescription>
        </Alert>
      )}

      {saveStatus === "error" && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            Failed to save configuration. Please try again.
          </AlertDescription>
        </Alert>
      )}

      {/* Configuration Categories */}
      {Object.entries(groupedConfigs).map(([category, configs]) => (
        <Card key={category}>
          <CardHeader>
            <CardTitle className="text-lg">{category}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {configs.map((config) => (
              <div key={config.key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">
                    {config.label}
                  </label>
                  {config.isSecret && (
                    <div className="flex space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleGenerateSecret(config.key)}
                        disabled={readonly}
                      >
                        Generate
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleSecretVisibility(config.key)}
                      >
                        {showSecrets[config.key] ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  )}
                </div>

                <input
                  type={
                    config.isSecret && !showSecrets[config.key]
                      ? "password"
                      : "text"
                  }
                  value={config.value}
                  onChange={(e) =>
                    handleInputChange(config.key, e.target.value)
                  }
                  placeholder={config.placeholder}
                  disabled={readonly}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                />

                <p className="text-xs text-gray-500">{config.description}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      {/* Test Results */}
      {Object.keys(testResults).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Configuration Test Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              {testResults.overall ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-green-800">Configuration is valid</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <span className="text-red-800">Configuration has issues</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ConfigurationSettings;


