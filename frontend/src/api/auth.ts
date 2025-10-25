import { apiClient } from "./client";

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
    formData.append("username", credentials.email);
    formData.append("password", credentials.password);

    // Request OAuth2 token
    const token = await apiClient.post("/api/auth/token", formData);

    // Persist token before fetching user info
    localStorage.setItem("access_token", token.access_token);

    // Fetch current user
    const user = await apiClient.get("/api/auth/me");

    return {
      access_token: token.access_token,
      token_type: token.token_type,
      user,
    };
  }

  static async register(userData: RegisterRequest): Promise<LoginResponse> {
    // Register user
    await apiClient.post("/api/auth/register", userData);

    // Login to obtain token and user info
    return this.login({ email: userData.email, password: userData.password });
  }

  static async getCurrentUser(): Promise<User> {
    return apiClient.get("/api/auth/me");
  }

  static async logout(): Promise<void> {
    return apiClient.post("/api/auth/logout");
  }
}


