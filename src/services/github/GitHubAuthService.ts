import { createOAuthAppAuth, createOAuthUserAuth } from '@octokit/auth-oauth-app';
import { Octokit } from '@octokit/core';

export interface GitHubAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri?: string;
  scopes?: string[];
}

export interface GitHubToken {
  access_token: string;
  token_type: string;
  scope: string;
  expires_in?: number;
  refresh_token?: string;
  refresh_token_expires_in?: number;
}

export interface GitHubUser {
  id: number;
  login: string;
  name: string;
  email: string;
  avatar_url: string;
  html_url: string;
  company?: string;
  location?: string;
  bio?: string;
  public_repos: number;
  public_gists: number;
  followers: number;
  following: number;
  created_at: string;
  updated_at: string;
}

/**
 * GitHub Authentication Service
 * Handles OAuth flows and token management for GitHub integration
 */
export class GitHubAuthService {
  private config: GitHubAuthConfig;
  private tokenStore: Map<string, GitHubToken> = new Map();

  constructor(config: GitHubAuthConfig) {
    this.config = {
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      redirectUri: config.redirectUri || `${window.location.origin}/auth/github/callback`,
      scopes: config.scopes || ['repo', 'user', 'workflow']
    };
  }

  /**
   * Generate GitHub OAuth authorization URL
   */
  generateAuthUrl(state?: string): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri!,
      scope: this.config.scopes!.join(' '),
      response_type: 'code'
    });

    if (state) {
      params.set('state', state);
    }

    return `https://github.com/login/oauth/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code: string, state?: string): Promise<GitHubToken> {
    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        code,
        redirect_uri: this.config.redirectUri
      })
    });

    if (!response.ok) {
      throw new Error(`GitHub OAuth error: ${response.status} ${response.statusText}`);
    }

    const tokenData = await response.json();

    if (tokenData.error) {
      throw new Error(`GitHub OAuth error: ${tokenData.error_description}`);
    }

    // Store token
    const userId = await this.getUserIdFromToken(tokenData.access_token);
    this.tokenStore.set(userId, tokenData);

    return tokenData;
  }

  /**
   * Get authenticated user's information
   */
  async getAuthenticatedUser(accessToken: string): Promise<GitHubUser> {
    const octokit = new Octokit({ auth: accessToken });

    const response = await octokit.request('GET /user');
    return response.data;
  }

  /**
   * Refresh access token (if refresh token is available)
   */
  async refreshToken(refreshToken: string): Promise<GitHubToken> {
    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        grant_type: 'refresh_token',
        refresh_token: refreshToken
      })
    });

    if (!response.ok) {
      throw new Error(`GitHub token refresh error: ${response.status} ${response.statusText}`);
    }

    const tokenData = await response.json();

    if (tokenData.error) {
      throw new Error(`GitHub token refresh error: ${tokenData.error_description}`);
    }

    // Update stored token
    const userId = await this.getUserIdFromToken(tokenData.access_token);
    this.tokenStore.set(userId, tokenData);

    return tokenData;
  }

  /**
   * Validate access token
   */
  async validateToken(accessToken: string): Promise<boolean> {
    try {
      const octokit = new Octokit({ auth: accessToken });
      await octokit.request('GET /user');
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Revoke access token
   */
  async revokeToken(accessToken: string): Promise<void> {
    // GitHub doesn't provide a direct token revocation endpoint
    // Instead, we'll remove it from our local storage
    const userId = await this.getUserIdFromToken(accessToken);
    this.tokenStore.delete(userId);
  }

  /**
   * Get stored token for user
   */
  getStoredToken(userId: string): GitHubToken | null {
    return this.tokenStore.get(userId) || null;
  }

  /**
   * Store token for user
   */
  storeToken(userId: string, token: GitHubToken): void {
    this.tokenStore.set(userId, token);
  }

  /**
   * Remove stored token for user
   */
  removeStoredToken(userId: string): void {
    this.tokenStore.delete(userId);
  }

  /**
   * Get user ID from access token
   */
  private async getUserIdFromToken(accessToken: string): Promise<string> {
    const user = await this.getAuthenticatedUser(accessToken);
    return user.id.toString();
  }

  /**
   * Create GitHub App installation token
   */
  async createInstallationToken(installationId: number): Promise<string> {
    // This would typically be done server-side with a GitHub App private key
    // For now, return a placeholder
    throw new Error('GitHub App installation tokens require server-side implementation');
  }

  /**
   * Handle OAuth callback
   */
  async handleCallback(code: string, state?: string): Promise<{
    token: GitHubToken;
    user: GitHubUser;
  }> {
    const token = await this.exchangeCodeForToken(code, state);
    const user = await this.getAuthenticatedUser(token.access_token);

    return { token, user };
  }

  /**
   * Check if user has required scopes
   */
  hasRequiredScopes(token: GitHubToken, requiredScopes: string[]): boolean {
    const tokenScopes = token.scope.split(',').map(s => s.trim());
    return requiredScopes.every(scope => tokenScopes.includes(scope));
  }

  /**
   * Get missing scopes
   */
  getMissingScopes(token: GitHubToken, requiredScopes: string[]): string[] {
    const tokenScopes = token.scope.split(',').map(s => s.trim());
    return requiredScopes.filter(scope => !tokenScopes.includes(scope));
  }

  /**
   * Generate re-authorization URL for additional scopes
   */
  generateReAuthUrl(additionalScopes: string[], state?: string): string {
    const currentScopes = this.config.scopes || [];
    const allScopes = [...new Set([...currentScopes, ...additionalScopes])];

    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri!,
      scope: allScopes.join(' '),
      response_type: 'code'
    });

    if (state) {
      params.set('state', state);
    }

    return `https://github.com/login/oauth/authorize?${params.toString()}`;
  }
}

// React Hook for GitHub Authentication
export const useGitHubAuth = (config: GitHubAuthConfig) => {
  const [authService] = React.useState(() => new GitHubAuthService(config));
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [user, setUser] = React.useState<GitHubUser | null>(null);
  const [token, setToken] = React.useState<GitHubToken | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const login = React.useCallback(() => {
    const authUrl = authService.generateAuthUrl();
    window.location.href = authUrl;
  }, [authService]);

  const handleCallback = React.useCallback(async (code: string, state?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await authService.handleCallback(code, state);
      setToken(result.token);
      setUser(result.user);
      setIsAuthenticated(true);

      // Store in localStorage for persistence
      localStorage.setItem('github_token', JSON.stringify(result.token));
      localStorage.setItem('github_user', JSON.stringify(result.user));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  }, [authService]);

  const logout = React.useCallback(() => {
    if (token) {
      authService.revokeToken(token.access_token);
    }
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('github_token');
    localStorage.removeItem('github_user');
  }, [authService, token]);

  const refreshToken = React.useCallback(async () => {
    if (!token?.refresh_token) return;

    setIsLoading(true);
    setError(null);

    try {
      const newToken = await authService.refreshToken(token.refresh_token);
      setToken(newToken);
      localStorage.setItem('github_token', JSON.stringify(newToken));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Token refresh failed');
      logout(); // Logout if refresh fails
    } finally {
      setIsLoading(false);
    }
  }, [authService, token, logout]);

  // Load from localStorage on mount
  React.useEffect(() => {
    const storedToken = localStorage.getItem('github_token');
    const storedUser = localStorage.getItem('github_user');

    if (storedToken && storedUser) {
      try {
        const parsedToken = JSON.parse(storedToken);
        const parsedUser = JSON.parse(storedUser);

        // Validate token is still valid
        authService.validateToken(parsedToken.access_token).then(isValid => {
          if (isValid) {
            setToken(parsedToken);
            setUser(parsedUser);
            setIsAuthenticated(true);
          } else {
            // Token expired, try refresh if possible
            if (parsedToken.refresh_token) {
              refreshToken();
            } else {
              logout();
            }
          }
        });
      } catch (err) {
        console.error('Failed to parse stored auth data:', err);
        logout();
      }
    }
  }, [authService, refreshToken, logout]);

  return {
    isAuthenticated,
    user,
    token,
    isLoading,
    error,
    login,
    logout,
    handleCallback,
    refreshToken
  };
};
