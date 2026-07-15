"use client";

import { useAuthContext } from "@/lib/context/AuthContext";

export function useAuth() {
  const context = useAuthContext();

  return {
    user: context.user,
    loading: context.loading,
    error: context.error,
    isAuthenticated: context.isAuthenticated,
    isPhotographer: context.isPhotographer,
    isOrganizer: context.isOrganizer,
    isAdmin: context.isAdmin,
    isClient: context.isClient,
    register: context.register,
    login: context.login,
    logout: context.logout,
  };
}
