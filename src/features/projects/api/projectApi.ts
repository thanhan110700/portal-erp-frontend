import { axiosInstance } from "@/shared/api/axios"
import type { ApiResponse } from "@/shared/types"
import type {
  Project,
  ProjectPaginatedResponse,
  CreateProjectPayload,
  UpdateProjectPayload,
  ProjectMember,
  CreateProjectMemberPayload,
  ProjectMilestone,
  CreateProjectMilestonePayload,
  ProjectExpense,
  CreateProjectExpensePayload,
  UpdateProjectExpenseStatusPayload,
} from "../types/project"

export interface ListProjectsParams {
  search?: string
  status?: string
  customer_id?: number
  manager_id?: number
  per_page?: number
  page?: number
}

export const projectApi = {
  // ── Project CRUD ─────────────────────────────────────────────────────────
  async list(params: ListProjectsParams = {}): Promise<ProjectPaginatedResponse> {
    const response = await axiosInstance.get<ProjectPaginatedResponse>("/v1/projects", { params })
    return response.data
  },

  async get(id: number): Promise<Project> {
    const response = await axiosInstance.get<ApiResponse<Project>>(`/v1/projects/${id}`)
    return response.data.data
  },

  async create(payload: CreateProjectPayload): Promise<Project> {
    const response = await axiosInstance.post<ApiResponse<Project>>("/v1/projects", payload)
    return response.data.data
  },

  async update(id: number, payload: UpdateProjectPayload): Promise<Project> {
    const response = await axiosInstance.put<ApiResponse<Project>>(`/v1/projects/${id}`, payload)
    return response.data.data
  },

  async delete(id: number): Promise<void> {
    await axiosInstance.delete(`/v1/projects/${id}`)
  },

  async updateStatus(id: number, status: string): Promise<Project> {
    const response = await axiosInstance.patch<ApiResponse<Project>>(`/v1/projects/${id}/status`, {
      status,
    })
    return response.data.data
  },

  // ── Members ──────────────────────────────────────────────────────────────
  async getMembers(projectId: number): Promise<ProjectMember[]> {
    const response = await axiosInstance.get<ApiResponse<ProjectMember[]>>(
      `/v1/projects/${projectId}/members`,
    )
    return response.data.data
  },

  async addMember(projectId: number, payload: CreateProjectMemberPayload): Promise<ProjectMember> {
    const response = await axiosInstance.post<ApiResponse<ProjectMember>>(
      `/v1/projects/${projectId}/members`,
      payload,
    )
    return response.data.data
  },

  async removeMember(projectId: number, memberId: number): Promise<void> {
    await axiosInstance.delete(`/v1/projects/${projectId}/members/${memberId}`)
  },

  // ── Milestones ───────────────────────────────────────────────────────────
  async getMilestones(projectId: number): Promise<ProjectMilestone[]> {
    const response = await axiosInstance.get<ApiResponse<ProjectMilestone[]>>(
      `/v1/projects/${projectId}/milestones`,
    )
    return response.data.data
  },

  async addMilestone(
    projectId: number,
    payload: CreateProjectMilestonePayload,
  ): Promise<ProjectMilestone> {
    const response = await axiosInstance.post<ApiResponse<ProjectMilestone>>(
      `/v1/projects/${projectId}/milestones`,
      payload,
    )
    return response.data.data
  },

  async removeMilestone(projectId: number, milestoneId: number): Promise<void> {
    await axiosInstance.delete(`/v1/projects/${projectId}/milestones/${milestoneId}`)
  },

  // ── Expenses ─────────────────────────────────────────────────────────────
  async getExpenses(projectId: number): Promise<ProjectExpense[]> {
    const response = await axiosInstance.get<ApiResponse<ProjectExpense[]>>(
      `/v1/projects/${projectId}/expenses`,
    )
    return response.data.data
  },

  async addExpense(
    projectId: number,
    payload: CreateProjectExpensePayload,
  ): Promise<ProjectExpense> {
    const response = await axiosInstance.post<ApiResponse<ProjectExpense>>(
      `/v1/projects/${projectId}/expenses`,
      payload,
    )
    return response.data.data
  },

  async updateExpenseStatus(
    projectId: number,
    expenseId: number,
    payload: UpdateProjectExpenseStatusPayload,
  ): Promise<ProjectExpense> {
    const response = await axiosInstance.patch<ApiResponse<ProjectExpense>>(
      `/v1/projects/${projectId}/expenses/${expenseId}/approve`,
      payload,
    )
    return response.data.data
  },

  async removeExpense(projectId: number, expenseId: number): Promise<void> {
    await axiosInstance.delete(`/v1/projects/${projectId}/expenses/${expenseId}`)
  },
}
