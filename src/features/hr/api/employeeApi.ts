import { axiosInstance } from "@/shared/api/axios"
import type { ApiResponse } from "@/shared/types"
import type {
  AssignRolePayload,
  CreateEmployeePayload,
  Department,
  Employee,
  EmployeePaginatedResponse,
  UpdateEmployeePayload,
} from "../types/employee"

export interface ListEmployeesParams {
  search?: string
  department_id?: number | null
  per_page?: number
  page?: number
}

export const employeeApi = {
  /**
   * GET /v1/employees — paginated list with optional search + department filter
   */
  async list(params: ListEmployeesParams = {}): Promise<EmployeePaginatedResponse> {
    const response = await axiosInstance.get<EmployeePaginatedResponse>("/v1/employees", {
      params: {
        search: params.search || undefined,
        department_id: params.department_id || undefined,
        per_page: params.per_page ?? 20,
        page: params.page ?? 1,
      },
    })
    return response.data
  },

  /**
   * GET /v1/employees/:id — single employee detail
   */
  async get(id: number): Promise<Employee> {
    const response = await axiosInstance.get<ApiResponse<Employee>>(`/v1/employees/${id}`)
    return response.data.data
  },

  /**
   * POST /v1/employees — create new employee + account
   */
  async create(payload: CreateEmployeePayload): Promise<Employee> {
    const response = await axiosInstance.post<ApiResponse<Employee>>("/v1/employees", payload)
    return response.data.data
  },

  /**
   * PUT /v1/employees/:id — update employee info
   */
  async update(id: number, payload: UpdateEmployeePayload): Promise<Employee> {
    const response = await axiosInstance.put<ApiResponse<Employee>>(`/v1/employees/${id}`, payload)
    return response.data.data
  },

  /**
   * DELETE /v1/employees/:id — soft delete / deactivate (Admin only)
   */
  async delete(id: number): Promise<void> {
    await axiosInstance.delete(`/v1/employees/${id}`)
  },

  /**
   * POST /v1/employees/:id/roles — assign a role to employee
   */
  async assignRole(id: number, payload: AssignRolePayload): Promise<Employee> {
    const response = await axiosInstance.post<ApiResponse<Employee>>(
      `/v1/employees/${id}/roles`,
      payload,
    )
    return response.data.data
  },
}

export const departmentApi = {
  /**
   * GET /v1/options/departments — list all departments (reference data, no permission required)
   */
  async list(): Promise<Department[]> {
    const response = await axiosInstance.get<ApiResponse<Department[]>>("/v1/options/departments")
    return response.data.data
  },
}

export const roleApi = {
  /**
   * GET /v1/options/roles — list available roles
   */
  async list(): Promise<{ id: number; name: string }[]> {
    const response =
      await axiosInstance.get<ApiResponse<{ id: number; name: string }[]>>("/v1/options/roles")
    return response.data.data
  },
}
