import type { ReactNode } from "react"
import { hasPermission } from "@/constants/permissions"
import { useAuthStore } from "@/hooks/useAuthStore"

interface HasPermissionProps {
  permission: string | string[]
  children: ReactNode
  fallback?: ReactNode
}

export function HasPermission({ permission, children, fallback = null }: HasPermissionProps) {
  const user = useAuthStore((s) => s.user)

  const checkPermission = () => {
    if (Array.isArray(permission)) {
      return permission.some((p) => hasPermission(user?.permissions, p))
    }
    return hasPermission(user?.permissions, permission)
  }

  if (!checkPermission()) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
