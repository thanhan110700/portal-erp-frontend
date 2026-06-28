/** Shape returned by /v1/auth/login → data.user */
export interface User {
  id: number
  /** /me returns full display name (may be null), /login returns full_name */
  name: string | null
  /** /login returns username (login handle) */
  username?: string
  /** /login returns full_name as display name */
  full_name?: string
  email: string
  is_active?: boolean
  avatar_url?: string | null
  role?: string
  roles?: string[]
  permissions: string[]
}

export interface Role {
  id: number
  name: string
  permissions: string[]
  created_at: string | null
  updated_at: string | null
}

export interface PaginationMeta {
  current_page: number
  last_page: number
  per_page: number
  total: number
  from: number | null
  to: number | null
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: PaginationMeta
}

export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
  errors?: Record<string, string[]>
}

export const USER_ROLES = {
  Manager: "manager",
  Leader: "leader",
  Member: "member",
} as const

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES]

export type RBACRole = {
  isAdmin: boolean
  isManager: boolean
  isLeader: boolean
  isMember: boolean
}
