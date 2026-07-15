"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { User, UserRole } from "@/lib/types";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  isPhotographer: boolean;
  isOrganizer: boolean;
  isAdmin: boolean;
  isClient: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (email: string, password: string, name: string, role: UserRole) => Promise<User>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize auth on mount
  useEffect(() => {
    const checkAuth = async () => {
      let lastError: any = null;
      let retryCount = 0;
      const maxRetries = 2;

      while (retryCount <= maxRetries) {
        try {
          const response = await fetch("/api/auth/me", {
            credentials: "include",
          });

          if (response.ok) {
            const { user } = await response.json();
            console.log("[AuthContext] Auth check passed, user:", user);
            setUser(user);
            setLoading(false);
            return;
          } else if (response.status === 401 && retryCount < maxRetries) {
            console.log(`[AuthContext] Auth check got 401, retrying (attempt ${retryCount + 1}/${maxRetries})...`);
            lastError = new Error(`Got 401 on attempt ${retryCount + 1}`);
            retryCount++;
            await new Promise(resolve => setTimeout(resolve, 100));
            continue;
          } else {
            console.log("[AuthContext] Auth check failed, status:", response.status);
            setUser(null);
            setLoading(false);
            return;
          }
        } catch (err) {
          console.log("[AuthContext] Auth check error:", err);
          lastError = err;
          if (retryCount < maxRetries) {
            retryCount++;
            await new Promise(resolve => setTimeout(resolve, 100));
            continue;
          }
          setUser(null);
          setLoading(false);
          return;
        }
      }

      console.log("[AuthContext] Auth check failed after retries:", lastError);
      setUser(null);
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const { error } = await response.json();
        throw new Error(error);
      }

      const { user } = await response.json();
      setUser(user);
      return user;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string, name: string, role: UserRole) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password, name, role }),
      });

      if (!response.ok) {
        const { error } = await response.json();
        throw new Error(error);
      }

      const { user } = await response.json();
      setUser(user);
      return user;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Registration failed";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    setError(null);

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      setUser(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Logout failed";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const isAuthenticated = !!user;
  const isPhotographer = user?.role === UserRole.PHOTOGRAPHER;
  const isOrganizer = user?.role === UserRole.ORGANIZER;
  const isAdmin = user?.role === UserRole.ADMIN;
  const isClient = isAuthenticated && !isPhotographer && !isOrganizer && !isAdmin;

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        isAuthenticated,
        isPhotographer,
        isOrganizer,
        isAdmin,
        isClient,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within AuthProvider");
  }
  return context;
}
