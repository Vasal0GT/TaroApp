import { router } from "expo-router";
import { useEffect } from "react";
import { useAuth } from "./AuthContext";

export function useRequireAuth() {
  const { isBootstrapping, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isBootstrapping && !isAuthenticated) {
      router.replace("/auth/login");
    }
  }, [isBootstrapping, isAuthenticated]);

  return {
    isBootstrapping,
    isAuthenticated,
  };
}