"use client";

import { useState, useEffect, useCallback } from "react";
import { User, UserRole } from "@/lib/types";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user is logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/me");

        if (response.ok) {
          const { user } = await response.json();
          setUser(user);
        } else {
          setUser(null);
        }
      } catch (err) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const register = useCallback(
    async (email: string, password: string, name: string, role: UserRole) => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
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
    },
    []
  );

  const login = useCallback(
    async (email: string, password: string) => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
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
    },
    []
  );

  const logout = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Logout failed";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const isAuthenticated = !!user;
  const isPhotographer = user?.role === UserRole.PHOTOGRAPHER;
  const isOrganizer = user?.role === UserRole.ORGANIZER;
  const isAdmin = user?.role === UserRole.ADMIN;
  const isClient = user?.role === UserRole.CLIENT;

  return {
    user,
    loading,
    error,
    isAuthenticated,
    isPhotographer,
    isOrganizer,
    isAdmin,
    isClient,
    register,
    login,
    logout,
  };
}
