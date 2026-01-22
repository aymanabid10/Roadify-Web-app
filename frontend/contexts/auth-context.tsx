"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { authApi, AuthResponse, ApiError } from "@/lib/api";

interface User {
  username: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<string>;
  logout: () => Promise<void>;
  setAuthFromResponse: (response: AuthResponse) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const clearAuth = useCallback(() => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("expiresAt");
    setUser(null);
  }, []);

  const setAuthFromResponse = useCallback((response: AuthResponse) => {
    localStorage.setItem("accessToken", response.accessToken);
    localStorage.setItem("refreshToken", response.refreshToken);
    localStorage.setItem("expiresAt", response.expiresAt);
    setUser({ username: response.username });
  }, []);

  const validateAndRefreshToken = useCallback(async () => {
    const accessToken = localStorage.getItem("accessToken");
    const refreshToken = localStorage.getItem("refreshToken");
    const expiresAt = localStorage.getItem("expiresAt");

    if (!accessToken || !refreshToken) {
      clearAuth();
      return;
    }

    // Check if token is expired or about to expire (within 1 minute)
    if (expiresAt) {
      const expiryTime = new Date(expiresAt).getTime();
      const now = Date.now();
      const oneMinute = 60 * 1000;

      if (expiryTime - now < oneMinute) {
        // Token expired or about to expire, try to refresh
        try {
          const response = await authApi.refresh(refreshToken);
          setAuthFromResponse(response);
          return;
        } catch {
          clearAuth();
          return;
        }
      }
    }

    // Validate current token
    try {
      const result = await authApi.validate();
      setUser({ username: result.username });
    } catch {
      // Try to refresh if validation fails
      try {
        const response = await authApi.refresh(refreshToken);
        setAuthFromResponse(response);
      } catch {
        clearAuth();
      }
    }
  }, [clearAuth, setAuthFromResponse]);

  useEffect(() => {
    validateAndRefreshToken().finally(() => setIsLoading(false));
  }, [validateAndRefreshToken]);

  const login = async (username: string, password: string) => {
    const response = await authApi.login({ username, password });
    setAuthFromResponse(response);
  };

  const register = async (username: string, email: string, password: string) => {
    const response = await authApi.register({ username, email, password });
    return response.message;
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem("refreshToken");
    if (refreshToken) {
      try {
        await authApi.logout(refreshToken);
      } catch {
        // Ignore logout errors, clear auth anyway
      }
    }
    clearAuth();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        setAuthFromResponse,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
