import { axiosInstance } from "@/shared/api/axios"
import type { ApiResponse } from "@/shared/types"
import type {
  ListTimesheetsParams,
  SubmitTimesheetPayload,
  Timesheet,
  TimesheetPaginatedResponse,
} from "../types/timesheet"

export const timesheetApi = {
  /**
   * GET /v1/timesheets — paginated list
   * Filters: user_id, status, from_date, to_date
   */
  async list(params: ListTimesheetsParams = {}): Promise<TimesheetPaginatedResponse> {
    const response = await axiosInstance.get<TimesheetPaginatedResponse>("/v1/timesheets", {
      params: {
        user_id: params.user_id || undefined,
        status: params.status && params.status !== "all" ? params.status : undefined,
        from_date: params.from_date || undefined,
        to_date: params.to_date || undefined,
        per_page: params.per_page ?? 20,
        page: params.page ?? 1,
      },
    })
    return response.data
  },

  /**
   * POST /v1/timesheets — employee submit timesheet
   * Backend automatically uses auth user's ID
   */
  async submit(payload: SubmitTimesheetPayload): Promise<Timesheet> {
    const response = await axiosInstance.post<ApiResponse<Timesheet>>("/v1/timesheets", payload)
    return response.data.data
  },

  /**
   * PATCH /v1/timesheets/:id/approve — manager/admin approve
   */
  async approve(id: number): Promise<Timesheet> {
    const response = await axiosInstance.patch<ApiResponse<Timesheet>>(
      `/v1/timesheets/${id}/approve`,
    )
    return response.data.data
  },

  /**
   * PATCH /v1/timesheets/:id/reject — manager/admin reject
   */
  async reject(id: number): Promise<Timesheet> {
    const response = await axiosInstance.patch<ApiResponse<Timesheet>>(
      `/v1/timesheets/${id}/reject`,
    )
    return response.data.data
  },
}
