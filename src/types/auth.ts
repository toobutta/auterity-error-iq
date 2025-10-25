export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  roles: string[];
  organization: {
    id: string;
    name: string;
  };
  workspaces: Workspace[];
}

export interface Workspace {
  id: string;
  name: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  projects: Project[];
}

export interface Project {
  id: string;
  name: string;
  environment: 'dev' | 'stage' | 'prod';
}

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  error: string | null;
}

export interface OIDCTokens {
  access_token: string;
  refresh_token?: string;
  id_token?: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

export interface AuthConfig {
  authority: string;
  clientId: string;
  redirectUri: string;
  scopes: string[];
  responseType: string;
}

export interface AuthScopes {
  studio: {
    read: string;
    write: string;
    execute: string;
    manage: string;
  };
  ai: {
    call: string;
    manage: string;
  };
  workflows: {
    manage: string;
    execute: string;
  };
  observability: {
    read: string;
    write: string;
  };
}

export const DEFAULT_AUTH_SCOPES: AuthScopes = {
  studio: {
    read: 'studio.read',
    write: 'studio.write',
    execute: 'studio.execute',
    manage: 'studio.manage'
  },
  ai: {
    call: 'ai.call',
    manage: 'ai.manage'
  },
  workflows: {
    manage: 'workflows.manage',
    execute: 'workflows.execute'
  },
  observability: {
    read: 'observability.read',
    write: 'observability.write'
  }
};

export interface AuthActions {
  login: () => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  getToken: () => Promise<string | null>;
  hasScope: (scope: string) => boolean;
  switchWorkspace: (workspaceId: string) => Promise<void>;
  switchProject: (projectId: string) => Promise<void>;
}
