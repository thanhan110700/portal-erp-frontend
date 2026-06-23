import type { LoginCredentials } from "../types/login"

import { apiURL } from "@/config"
import { axiosInstance } from "@/shared/api/axios"
import type { ApiResponse, User } from "@/shared/types"

export const loginApi = {
  async getCsrfCookie() {
    const baseURL = apiURL.replace(/\/api$/, "")
    return axiosInstance.get(`${baseURL}/sanctum/csrf-cookie`)
  },

  async login(credentials: LoginCredentials): Promise<{ user: User; token: string }> {
    await this.getCsrfCookie()
    const response = await axiosInstance.post<{
      data: { token: string; token_type: string; user: User }
    }>("/v1/auth/login", credentials)
    const { token, user: u } = response.data.data
    return {
      user: {
        ...u,
        permissions: Array.isArray(u.permissions) ? u.permissions : [],
      },
      token,
    }
  },

  async logout(): Promise<void> {
    await axiosInstance.post("/auth/logout")
  },

  async uploadAvatar(file: File): Promise<User> {
    const form = new FormData()
    form.append("avatar", file)
    const response = await axiosInstance.post<ApiResponse<User>>("/auth/avatar", form, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    return response.data.data
  },

  async getMe(): Promise<User> {
    const response = await axiosInstance.get<ApiResponse<User>>("/v1/auth/me")
    const u = response.data.data
    return {
      ...u,
      permissions: Array.isArray(u.permissions) ? u.permissions : [],
      is_main_system: Boolean(u.is_main_system),
    }
  },
}
