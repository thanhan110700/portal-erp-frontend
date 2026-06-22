import { useEffect } from "react";
import type { ReactNode } from "react";

import { loginApi } from "@/features/auth/api";
import { useAuthStore } from "@/hooks/useAuthStore";
import { useSessionStore } from "@/hooks/useSessionStore";
import { PATHS } from "@/constants/paths";

export function AuthProvider({ children }: { children: ReactNode }) {
  const setUser = useAuthStore((s) => s.setUser);
  const setLoading = useAuthStore((s) => s.setLoading);
  const logout = useAuthStore((s) => s.logout);

  const token = useSessionStore((s) => s.token);
  const clearSession = useSessionStore((s) => s.clearSession);

  useEffect(() => {
    const initAuth = async () => {
      try {
        setLoading(true);

        if (!token) {
          logout();
          return;
        }

        const user = await loginApi.getMe();
        setUser(user);
      } catch (err: unknown) {
        const status = (err as { response?: { status?: number } })?.response
          ?.status;
        if (status === 401) {
          clearSession();
          logout();
        } else {
          logout();
        }
      } finally {
        setLoading(false);
      }
    };

    void initAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    const handleUnauthorized = () => {
      clearSession();
      logout();
      window.location.href = PATHS.login;
    };

    window.addEventListener("unauthorized", handleUnauthorized);
    return () => window.removeEventListener("unauthorized", handleUnauthorized);
  }, [clearSession, logout]);

  return <>{children}</>;
}
