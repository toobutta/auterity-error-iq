export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

export const AuthApi = {
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    // Implementation would be replaced with actual API call
    return {
      access_token: "sample_token",
      user: {
        id: "1",
        email: credentials.email,
        firstName: "Sample",
        lastName: "User",
        role: "user",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };
  },

  register: async (userData: RegisterRequest): Promise<AuthResponse> => {
    // Implementation would be replaced with actual API call
    return {
      access_token: "sample_token",
      user: {
        id: "1",
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: "user",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };
  },

  logout: async (): Promise<void> => {
    // Implementation would be replaced with actual API call
    return Promise.resolve();
  },

  getCurrentUser: async (): Promise<User> => {
    // Implementation would be replaced with actual API call
    return {
      id: "1",
      email: "user@example.com",
      firstName: "Sample",
      lastName: "User",
      role: "user",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  },
};
