import { create } from "zustand"
import { persist } from "zustand/middleware"

interface SessionStore {
  token: string | null
  setToken: (token: string | null) => void
  clearSession: () => void
}

export const useSessionStore = create<SessionStore>()(
  persist(
    (set) => ({
      token: null,
      setToken: (token) => set({ token }),
      clearSession: () => set({ token: null }),
    }),
    { name: "session-store" },
  ),
)
