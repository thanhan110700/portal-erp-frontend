export interface User {
  id: number
  name: string
  email: string
  avatar_url: string | null
  permissions: string[]
  is_admin: boolean
  is_main_system: boolean
  can_view_accounts_unscoped: boolean
  can_view_ads_report_unscoped: boolean
  roles: UserRole[]
}

export interface Role {
  id: number
  name: string
  permissions: string[]
  created_at: string | null
  updated_at: string | null
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
