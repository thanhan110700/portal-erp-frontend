import { axiosInstance } from "@/shared/api/axios"
import type { ApiResponse } from "@/shared/types"
import type { Department } from "../types/employee"

export interface CreateDepartmentPayload {
  name: string
  code: string
  description?: string | null
}

export type UpdateDepartmentPayload = Partial<CreateDepartmentPayload>

export const departmentApi = {
  async list(): Promise<Department[]> {
    const response = await axiosInstance.get<ApiResponse<Department[]>>("/v1/departments")
    return response.data.data
  },

  async get(id: number): Promise<Department> {
    const response = await axiosInstance.get<ApiResponse<Department>>(`/v1/departments/${id}`)
    return response.data.data
  },

  async create(payload: CreateDepartmentPayload): Promise<Department> {
    const response = await axiosInstance.post<ApiResponse<Department>>("/v1/departments", payload)
    return response.data.data
  },

  async update(id: number, payload: UpdateDepartmentPayload): Promise<Department> {
    const response = await axiosInstance.put<ApiResponse<Department>>(
      `/v1/departments/${id}`,
      payload,
    )
    return response.data.data
  },

  async delete(id: number): Promise<void> {
    await axiosInstance.delete(`/v1/departments/${id}`)
  },
}
