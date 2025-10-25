import { AuthConfig, OIDCTokens, User, AuthScopes, DEFAULT_AUTH_SCOPES } from '../types/auth';

export class AuthService {
  private config: AuthConfig;
  private tokens: OIDCTokens | null = null;
  private user: User | null = null;
  private refreshPromise: Promise<OIDCTokens> | null = null;

  constructor(config: AuthConfig) {
    this.config = config;
    this.loadStoredTokens();
  }

  private loadStoredTokens(): void {
    try {
      const stored = localStorage.getItem('auterity_auth');
      if (stored) {
        const data = JSON.parse(stored);
        this.tokens = data.tokens;
        this.user = data.user;
      }
    } catch (error) {
      console.warn('Failed to load stored auth data:', error);
      this.clearStoredTokens();
    }
  }

  private saveStoredTokens(): void {
    if (this.tokens && this.user) {
      localStorage.setItem('auterity_auth', JSON.stringify({
        tokens: this.tokens,
        user: this.user,
        timestamp: Date.now()
      }));
    }
  }

  private clearStoredTokens(): void {
    localStorage.removeItem('auterity_auth');
    this.tokens = null;
    this.user = null;
  }

  private isTokenExpired(): boolean {
    if (!this.tokens) return true;
    const now = Date.now();
    const expiresAt = (this.tokens.expires_in * 1000) + (this.tokens.expires_in * 1000 * 0.1); // 10% buffer
    return now >= expiresAt;
  }

  private generateCodeVerifier(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode(...array))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  private async generateCodeChallenge(verifier: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const digest = await crypto.subtle.digest('SHA-256', data);
    const array = new Uint8Array(digest);
    return btoa(String.fromCharCode(...array))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  async login(): Promise<void> {
    const codeVerifier = this.generateCodeVerifier();
    const codeChallenge = await this.generateCodeChallenge(codeVerifier);

    sessionStorage.setItem('pkce_verifier', codeVerifier);

    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: this.config.responseType,
      scope: this.config.scopes.join(' '),
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      state: crypto.randomUUID()
    });

    const authUrl = `${this.config.authority}/oauth/authorize?${params.toString()}`;
    window.location.href = authUrl;
  }

  async handleCallback(code: string, state: string): Promise<void> {
    const codeVerifier = sessionStorage.getItem('pkce_verifier');
    if (!codeVerifier) {
      throw new Error('PKCE verifier not found');
    }

    const tokenResponse = await fetch(`${this.config.authority}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: this.config.clientId,
        code: code,
        redirect_uri: this.config.redirectUri,
        code_verifier: codeVerifier,
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange code for tokens');
    }

    this.tokens = await tokenResponse.json();
    await this.fetchUserInfo();
    this.saveStoredTokens();
    sessionStorage.removeItem('pkce_verifier');
  }

  private async fetchUserInfo(): Promise<void> {
    if (!this.tokens?.access_token) {
      throw new Error('No access token available');
    }

    const response = await fetch(`${this.config.authority}/userinfo`, {
      headers: {
        'Authorization': `Bearer ${this.tokens.access_token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user info');
    }

    const userInfo = await response.json();
    this.user = {
      id: userInfo.sub,
      email: userInfo.email,
      name: userInfo.name,
      avatar: userInfo.picture,
      roles: userInfo.roles || [],
      organization: userInfo.organization,
      workspaces: userInfo.workspaces || [],
    };
  }

  async refreshToken(): Promise<void> {
    if (this.refreshPromise) {
      return this.refreshPromise.then(() => {});
    }

    if (!this.tokens?.refresh_token) {
      throw new Error('No refresh token available');
    }

    this.refreshPromise = fetch(`${this.config.authority}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: this.config.clientId,
        refresh_token: this.tokens.refresh_token,
      }),
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to refresh token');
        }
        return response.json();
      })
      .then((newTokens: OIDCTokens) => {
        this.tokens = { ...this.tokens!, ...newTokens };
        this.saveStoredTokens();
        return newTokens;
      })
      .finally(() => {
        this.refreshPromise = null;
      });

    return this.refreshPromise.then(() => {});
  }

  async getToken(): Promise<string | null> {
    if (!this.tokens) return null;

    if (this.isTokenExpired()) {
      try {
        await this.refreshToken();
      } catch (error) {
        console.error('Token refresh failed:', error);
        this.logout();
        return null;
      }
    }

    return this.tokens.access_token;
  }

  hasScope(scope: string): boolean {
    if (!this.tokens?.scope) return false;
    return this.tokens.scope.split(' ').includes(scope);
  }

  async logout(): Promise<void> {
    try {
      // Call logout endpoint if available
      if (this.tokens?.id_token) {
        const logoutParams = new URLSearchParams({
          id_token_hint: this.tokens.id_token,
          post_logout_redirect_uri: window.location.origin,
        });
        window.location.href = `${this.config.authority}/logout?${logoutParams.toString()}`;
      }
    } catch (error) {
      console.warn('Logout endpoint call failed:', error);
    } finally {
      this.clearStoredTokens();
    }
  }

  getUser(): User | null {
    return this.user;
  }

  isAuthenticated(): boolean {
    return !!this.tokens && !!this.user && !this.isTokenExpired();
  }
}

// Default auth configuration - should be loaded from environment
export const DEFAULT_AUTH_CONFIG: AuthConfig = {
  authority: process.env.REACT_APP_AUTH_AUTHORITY || 'https://auth.auterity.com',
  clientId: process.env.REACT_APP_AUTH_CLIENT_ID || 'workflow-studio',
  redirectUri: `${window.location.origin}/auth/callback`,
  scopes: [
    DEFAULT_AUTH_SCOPES.studio.read,
    DEFAULT_AUTH_SCOPES.studio.write,
    DEFAULT_AUTH_SCOPES.studio.execute,
    DEFAULT_AUTH_SCOPES.ai.call,
    DEFAULT_AUTH_SCOPES.workflows.manage,
    DEFAULT_AUTH_SCOPES.observability.read,
  ],
  responseType: 'code',
};

export const authService = new AuthService(DEFAULT_AUTH_CONFIG);
