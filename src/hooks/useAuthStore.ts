import { create } from "zustand"

import type { User } from "@/shared/types"
import { PermissionSlugs } from "@/constants/permissions"

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  setUser: (user: User | null) => void
  setLoading: (isLoading: boolean) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true, // Initial loading state for checking session
  setUser: (user) => {
    // Grant full access permission if role is admin
    if (user && user.role === "admin") {
      const perms = user.permissions || []
      if (!perms.includes(PermissionSlugs.FullAccess)) {
        user.permissions = [...perms, PermissionSlugs.FullAccess]
      }
    }
    set({ user, isAuthenticated: !!user })
  },
  setLoading: (isLoading) => set({ isLoading }),
  logout: () => set({ user: null, isAuthenticated: false }),
}))
