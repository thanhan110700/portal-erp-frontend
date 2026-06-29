import { axiosInstance } from "@/shared/api/axios"
import type { ApiResponse } from "@/shared/types"
import type {
  Project,
  ProjectPaginatedResponse,
  CreateProjectPayload,
  UpdateProjectPayload,
  ProjectMember,
  CreateProjectMemberPayload,
  UpdateProjectMemberPayload,
  ProjectMilestone,
  CreateProjectMilestonePayload,
  UpdateProjectMilestonePayload,
  ProjectExpense,
  CreateProjectExpensePayload,
  UpdateProjectExpenseStatusPayload,
  ProjectFile,
  ProjectVoucherPaginatedResponse,
} from "../types/project"

export interface ListProjectsParams {
  search?: string
  status?: string
  customer_id?: number
  date_from?: string
  date_to?: string
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

  async updateStatus(id: number, status: string, notes?: string): Promise<Project> {
    const payload: any = { status }
    if (notes !== undefined) {
      payload.notes = notes
    }
    const response = await axiosInstance.patch<ApiResponse<Project>>(
      `/v1/projects/${id}/status`,
      payload,
    )
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

  // ── Member Edit ──────────────────────────────────────────────────────────
  async updateMember(
    projectId: number,
    memberId: number,
    payload: UpdateProjectMemberPayload,
  ): Promise<ProjectMember> {
    const response = await axiosInstance.patch<ApiResponse<ProjectMember>>(
      `/v1/projects/${projectId}/members/${memberId}`,
      payload,
    )
    return response.data.data
  },

  // ── Milestone Edit ────────────────────────────────────────────────────────
  async updateMilestone(
    projectId: number,
    milestoneId: number,
    payload: UpdateProjectMilestonePayload,
  ): Promise<ProjectMilestone> {
    const response = await axiosInstance.patch<ApiResponse<ProjectMilestone>>(
      `/v1/projects/${projectId}/milestones/${milestoneId}`,
      payload,
    )
    return response.data.data
  },

  // ── Project Files ────────────────────────────────────────────────────────
  async uploadFile(
    projectId: number,
    file: File,
    category?: string,
    notes?: string,
  ): Promise<ProjectFile> {
    const formData = new FormData()
    formData.append("file", file)
    if (category) {
      formData.append("file_category", category)
    }
    if (notes) {
      formData.append("notes", notes)
    }
    const response = await axiosInstance.post<ApiResponse<ProjectFile>>(
      `/v1/projects/${projectId}/files`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    )
    return response.data.data
  },

  async deleteFile(projectId: number, fileId: number): Promise<void> {
    await axiosInstance.delete(`/v1/projects/${projectId}/files/${fileId}`)
  },

  // ── Project Vouchers ─────────────────────────────────────────────────────
  async listVouchers(
    projectId: number,
    params: Record<string, unknown> = {},
  ): Promise<ProjectVoucherPaginatedResponse> {
    const response = await axiosInstance.get<ProjectVoucherPaginatedResponse>(
      `/v1/projects/${projectId}/vouchers`,
      { params },
    )
    return response.data
  },
}
