import type { LoginCredentials } from "../types/login"

import { apiURL } from "@/config"
import { axiosInstance } from "@/shared/api/axios"
import type { ApiResponse, User } from "@/shared/types"

/** Raw shape from /v1/auth/login data.user */
interface LoginUserRaw {
  id: number
  username: string
  full_name: string
  email: string
  role?: string
  roles?: string[]
  permissions?: string[]
}

/** Raw shape from /v1/auth/me data */
interface MeUserRaw {
  id: number
  name: string | null
  email: string
  is_active: boolean
  role?: string
  roles?: string[]
  permissions: string[]
  avatar_url?: string | null
}

/** Normalize login user → consistent User shape */
function normalizeLoginUser(raw: LoginUserRaw): User {
  return {
    id: raw.id,
    username: raw.username,
    full_name: raw.full_name,
    name: raw.full_name ?? raw.username ?? null,
    email: raw.email,
    role: raw.role,
    roles: raw.roles ?? [],
    permissions: Array.isArray(raw.permissions) ? raw.permissions : [],
    avatar_url: null,
  }
}

/** Normalize /me user → consistent User shape */
function normalizeMeUser(raw: MeUserRaw): User {
  return {
    id: raw.id,
    name: raw.name,
    email: raw.email,
    is_active: raw.is_active,
    role: raw.role,
    roles: raw.roles ?? [],
    permissions: Array.isArray(raw.permissions) ? raw.permissions : [],
    avatar_url: raw.avatar_url ?? null,
  }
}

export const loginApi = {
  async getCsrfCookie() {
    const baseURL = apiURL.replace(/\/api$/, "")
    return axiosInstance.get(`${baseURL}/sanctum/csrf-cookie`)
  },

  async login(credentials: LoginCredentials): Promise<{ user: User; token: string }> {
    await this.getCsrfCookie()
    const response = await axiosInstance.post<{
      data: { token: string; token_type: string; user: LoginUserRaw }
    }>("/v1/auth/login", credentials)
    const { token, user: raw } = response.data.data
    return { user: normalizeLoginUser(raw), token }
  },

  async logout(): Promise<void> {
    await axiosInstance.post("/auth/logout")
  },

  async uploadAvatar(file: File): Promise<User> {
    const form = new FormData()
    form.append("avatar", file)
    const response = await axiosInstance.post<ApiResponse<MeUserRaw>>("/auth/avatar", form, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    return normalizeMeUser(response.data.data)
  },

  async getMe(): Promise<User> {
    const response = await axiosInstance.get<ApiResponse<MeUserRaw>>("/v1/auth/me")
    return normalizeMeUser(response.data.data)
  },
}
