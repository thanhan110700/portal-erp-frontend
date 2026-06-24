import type { ReactNode } from "react"
import { Navigate } from "react-router-dom"

import { PATHS } from "@/constants/paths"
import { useAuthStore } from "@/hooks/useAuthStore"

export function RequireMainSystemAdmin({ children }: { children: ReactNode }) {
  const user = useAuthStore((s) => s.user)

  // "admin" role is the equivalent of is_admin + is_main_system
  const isAdmin = user?.roles?.includes("admin") ?? false

  if (!isAdmin) {
    return <Navigate to={PATHS.dashboard} replace />
  }

  return <>{children}</>
}
