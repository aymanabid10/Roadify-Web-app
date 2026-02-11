"use client";

import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { authApi, AuthResponse, decodeJwt, extractRoles } from "@/lib/api";

interface User {
  id: string;
  username: string;
  roles: string[];
  role?: string; // Primary role for convenience
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  hasRole: (role: string) => boolean;
  isAdmin: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<string>;
  logout: () => Promise<void>;
  setAuthFromResponse: (response: AuthResponse) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Initialize user from localStorage synchronously
function getInitialUser(): User | null {
  if (typeof window === "undefined") return null;
  
  const accessToken = localStorage.getItem("accessToken");
  if (!accessToken) return null;
  
  const payload = decodeJwt(accessToken);
  if (!payload) return null;
  
  // Check if token is expired
  const expiryTime = payload.exp * 1000;
  if (expiryTime < Date.now()) return null;
  
  const roles = extractRoles(payload);
  return {
    id: payload.nameid,
    username: payload.unique_name,
    roles: roles,
    role: roles[0], // Primary role
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(getInitialUser);
  const [isLoading, setIsLoading] = useState(true);
  const hasInitialized = useRef(false);

  const clearAuth = useCallback(() => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    setUser(null);
  }, []);

  const setAuthFromResponse = useCallback((response: AuthResponse) => {
    localStorage.setItem("accessToken", response.accessToken);
    localStorage.setItem("refreshToken", response.refreshToken);
    
    // Decode JWT to get user info
    const payload = decodeJwt(response.accessToken);
    if (payload) {
      const roles = extractRoles(payload);
      setUser({ 
        id: payload.nameid,
        username: payload.unique_name,
        roles: roles,
        role: roles[0], // Primary role
      });
    }
  }, []);

  // Background validation and refresh
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const validateAuth = async () => {
      const accessToken = localStorage.getItem("accessToken");
      const refreshToken = localStorage.getItem("refreshToken");

      if (!accessToken || !refreshToken) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      const payload = decodeJwt(accessToken);
      if (!payload) {
        clearAuth();
        setIsLoading(false);
        return;
      }

      // Check if token is expired or about to expire (within 1 minute)
      const expiryTime = payload.exp * 1000;
      const needsRefresh = expiryTime - Date.now() < 60 * 1000;

      if (needsRefresh) {
        // Token expired or about to expire, try to refresh
        try {
          const response = await authApi.refresh(refreshToken);
          setAuthFromResponse(response);
        } catch {
          clearAuth();
        }
        setIsLoading(false);
        return;
      }

      // Validate current token with backend
      try {
        const result = await authApi.validate();
        const roles = extractRoles(payload);
        setUser({ 
          id: payload.nameid,
          username: result.username,
          roles: roles,
          role: roles[0], // Primary role
        });
      } catch {
        // Try to refresh if validation fails
        try {
          const response = await authApi.refresh(refreshToken);
          setAuthFromResponse(response);
        } catch {
          clearAuth();
        }
      }
      setIsLoading(false);
    };

    validateAuth();
  }, [clearAuth, setAuthFromResponse]);

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

  const hasRole = useCallback((role: string) => {
    if (!user) return false;
    return user.roles.some(r => r.toUpperCase() === role.toUpperCase());
  }, [user]);

  const isAdmin = user?.roles?.some(r => r.toUpperCase() === "ADMIN") ?? false;

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        hasRole,
        isAdmin,
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
