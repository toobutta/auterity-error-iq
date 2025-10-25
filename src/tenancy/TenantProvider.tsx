/**
 * Enterprise Multi-Tenancy Provider
 * Handles tenant isolation, white-labeling, and enterprise features
 */

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface TenantConfig {
  id: string;
  name: string;
  domain: string;
  logo: {
    light: string;
    dark: string;
    favicon: string;
  };
  branding: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    fontFamily: string;
  };
  features: {
    aiAssistant: boolean;
    collaboration: boolean;
    analytics: boolean;
    customWorkflows: boolean;
    apiAccess: boolean;
    whiteLabel: boolean;
    multiTenant: boolean;
    enterpriseSupport: boolean;
  };
  limits: {
    users: number;
    workflows: number;
    storage: number; // in GB
    apiCalls: number; // per month
  };
  security: {
    ssoEnabled: boolean;
    ssoProvider: 'saml' | 'oauth' | 'openid' | null;
    mfaRequired: boolean;
    passwordPolicy: {
      minLength: number;
      requireSpecialChars: boolean;
      requireNumbers: boolean;
      requireUppercase: boolean;
    };
    auditLogging: boolean;
    dataRetention: number; // in days
  };
  integrations: {
    slack: boolean;
    teams: boolean;
    jira: boolean;
    servicenow: boolean;
    customWebhooks: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

interface TenantContextType {
  tenant: TenantConfig | null;
  isLoading: boolean;
  error: string | null;
  setTenant: (tenant: TenantConfig) => void;
  updateTenant: (updates: Partial<TenantConfig>) => void;
  clearTenant: () => void;
  isFeatureEnabled: (feature: keyof TenantConfig['features']) => boolean;
  getLimit: (limit: keyof TenantConfig['limits']) => number;
  hasPermission: (permission: string) => boolean;
}

const TenantContext = createContext<TenantContextType>({
  tenant: null,
  isLoading: true,
  error: null,
  setTenant: () => {},
  updateTenant: () => {},
  clearTenant: () => {},
  isFeatureEnabled: () => false,
  getLimit: () => 0,
  hasPermission: () => false
});

export const useTenant = () => useContext(TenantContext);

interface TenantProviderProps {
  children: React.ReactNode;
  tenantId?: string;
  onTenantLoad?: (tenant: TenantConfig) => void;
  onTenantError?: (error: string) => void;
}

export const TenantProvider: React.FC<TenantProviderProps> = ({
  children,
  tenantId,
  onTenantLoad,
  onTenantError
}) => {
  const [tenant, setTenantState] = useState<TenantConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load tenant configuration
  const loadTenant = async (id: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // Try to get from localStorage first for offline support
      const cachedTenant = localStorage.getItem(`tenant_${id}`);
      if (cachedTenant) {
        const parsedTenant = JSON.parse(cachedTenant);
        setTenantState(parsedTenant);
        onTenantLoad?.(parsedTenant);
      }

      // Fetch from API
      const response = await fetch(`/api/tenants/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Tenant not found');
        }
        throw new Error('Failed to load tenant configuration');
      }

      const tenantData = await response.json();

      // Cache the tenant data
      localStorage.setItem(`tenant_${id}`, JSON.stringify(tenantData));

      setTenantState(tenantData);
      onTenantLoad?.(tenantData);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      onTenantError?.(errorMessage);

      // If we have cached data, keep using it
      if (!tenant) {
        console.warn('Using cached tenant data due to API error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize tenant on mount
  useEffect(() => {
    const initializeTenant = async () => {
      // Determine tenant ID
      let currentTenantId = tenantId;

      if (!currentTenantId) {
        // Try to get from URL subdomain
        const hostname = window.location.hostname;
        const subdomain = hostname.split('.')[0];

        if (subdomain && subdomain !== 'www' && subdomain !== 'app') {
          currentTenantId = subdomain;
        }

        // Try to get from localStorage
        if (!currentTenantId) {
          currentTenantId = localStorage.getItem('currentTenantId') || 'default';
        }
      }

      if (currentTenantId) {
        await loadTenant(currentTenantId);
      } else {
        setIsLoading(false);
      }
    };

    initializeTenant();
  }, [tenantId]);

  // Apply tenant branding to CSS custom properties
  useEffect(() => {
    if (!tenant) return;

    const root = document.documentElement;

    // Apply branding colors
    if (tenant.branding) {
      root.style.setProperty('--tenant-primary', tenant.branding.primaryColor);
      root.style.setProperty('--tenant-secondary', tenant.branding.secondaryColor);
      root.style.setProperty('--tenant-accent', tenant.branding.accentColor);

      // Update favicon
      if (tenant.logo.favicon) {
        const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
        if (favicon) {
          favicon.href = tenant.logo.favicon;
        }
      }

      // Update document title
      document.title = `${tenant.name} - Auterity`;
    }
  }, [tenant]);

  const setTenant = (newTenant: TenantConfig) => {
    setTenantState(newTenant);
    localStorage.setItem(`tenant_${newTenant.id}`, JSON.stringify(newTenant));
    localStorage.setItem('currentTenantId', newTenant.id);
  };

  const updateTenant = async (updates: Partial<TenantConfig>) => {
    if (!tenant) return;

    try {
      const response = await fetch(`/api/tenants/${tenant.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        throw new Error('Failed to update tenant');
      }

      const updatedTenant = await response.json();
      setTenant(updatedTenant);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Update failed';
      setError(errorMessage);
      console.error('Tenant update failed:', errorMessage);
    }
  };

  const clearTenant = () => {
    setTenantState(null);
    localStorage.removeItem('currentTenantId');
    if (tenant) {
      localStorage.removeItem(`tenant_${tenant.id}`);
    }
  };

  const isFeatureEnabled = (feature: keyof TenantConfig['features']): boolean => {
    return tenant?.features[feature] ?? false;
  };

  const getLimit = (limit: keyof TenantConfig['limits']): number => {
    return tenant?.limits[limit] ?? 0;
  };

  const hasPermission = (permission: string): boolean => {
    if (!tenant) return false;

    // Check feature-based permissions
    switch (permission) {
      case 'ai_assistant':
        return tenant.features.aiAssistant;
      case 'collaboration':
        return tenant.features.collaboration;
      case 'analytics':
        return tenant.features.analytics;
      case 'custom_workflows':
        return tenant.features.customWorkflows;
      case 'api_access':
        return tenant.features.apiAccess;
      case 'white_label':
        return tenant.features.whiteLabel;
      case 'enterprise_support':
        return tenant.features.enterpriseSupport;
      default:
        return false;
    }
  };

  const contextValue: TenantContextType = {
    tenant,
    isLoading,
    error,
    setTenant,
    updateTenant,
    clearTenant,
    isFeatureEnabled,
    getLimit,
    hasPermission
  };

  return (
    <TenantContext.Provider value={contextValue}>
      {children}
    </TenantContext.Provider>
  );
};

export default TenantProvider;
