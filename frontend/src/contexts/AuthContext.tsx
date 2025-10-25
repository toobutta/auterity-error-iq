import React, { createContext, useState, useEffect, useContext } from "react";
import { AuthApi, LoginRequest, RegisterRequest, User } from "../api/auth";

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
          // Optionally verify token is still valid
          try {
            const currentUser = await AuthApi.getCurrentUser();
            setUser(currentUser);
            localStorage.setItem("user", JSON.stringify(currentUser));
          } catch (error) {
            // Token is invalid, clear storage
            localStorage.removeItem("access_token");
            localStorage.removeItem("user");
            setUser(null);
          }
        }
      } catch (error) {

      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (credentials: LoginRequest) => {
    try {
      const response = await AuthApi.login(credentials);

      // Store token and user data
      localStorage.setItem("access_token", response.access_token);
      localStorage.setItem("user", JSON.stringify(response.user));

      setUser(response.user);
    } catch (error) {

      throw error;
    }
  };

  const register = async (userData: RegisterRequest) => {
    try {
      const response = await AuthApi.register(userData);

      // Store token and user data
      localStorage.setItem("access_token", response.access_token);
      localStorage.setItem("user", JSON.stringify(response.user));

      setUser(response.user);
    } catch (error) {

      throw error;
    }
  };

  const logout = async () => {
    try {
      await AuthApi.logout();
    } catch (error) {

    } finally {
      // Clear local storage and state regardless of API call success
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


