import { apiClient } from './client';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface User {
  id: string;
  email: string;
  name: string;
  created_at: string;
  is_active: boolean;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export class AuthApi {
  static async login(credentials: LoginRequest): Promise<LoginResponse> {
    const formData = new FormData();
    formData.append('username', credentials.email);
    formData.append('password', credentials.password);
    
    return apiClient.post('/api/auth/login', formData);
  }

  static async register(userData: RegisterRequest): Promise<LoginResponse> {
    return apiClient.post('/api/auth/register', userData);
  }

  static async getCurrentUser(): Promise<User> {
    return apiClient.get('/api/auth/me');
  }

  static async logout(): Promise<void> {
    return apiClient.post('/api/auth/logout');
  }
}