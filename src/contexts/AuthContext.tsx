import React, { createContext, useState, useEffect, useContext } from "react";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface LoginRequest {
  email: string;
  password: string;
}

interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  useEffect(() => {
    // Check for existing token and user data on app load
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem("access_token");
        const userData = localStorage.getItem("user");

        if (token && userData) {
          setUser(JSON.parse(userData));
          // Optionally verify token is still valid with your backend
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (credentials: LoginRequest) => {
    try {
      // Implement your login logic here
      const mockUser: User = {
        id: '1',
        name: 'Test User',
        email: credentials.email,
        role: 'user'
      };

      // Store token and user data
      localStorage.setItem("access_token", "mock_token");
      localStorage.setItem("user", JSON.stringify(mockUser));

      setUser(mockUser);
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  const register = async (userData: RegisterRequest) => {
    try {
      // Implement your registration logic here
      const mockUser: User = {
        id: '1',
        name: userData.name,
        email: userData.email,
        role: 'user'
      };

      // Store token and user data
      localStorage.setItem("access_token", "mock_token");
      localStorage.setItem("user", JSON.stringify(mockUser));

      setUser(mockUser);
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Implement your logout logic here
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Clear local storage and state
      localStorage.removeItem("access_token");
      localStorage.removeItem("user");
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
