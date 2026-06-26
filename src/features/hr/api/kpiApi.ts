import { axiosInstance } from "@/shared/api/axios"
import type { ApiResponse } from "@/shared/types"
import type {
  EmployeeKpi,
  KpiPaginatedResponse,
  ListKpisParams,
  UpsertKpiPayload,
} from "../types/kpi"

export const kpiApi = {
  /**
   * GET /v1/kpi — paginated list, filterable by user/month/year
   */
  async list(params: ListKpisParams = {}): Promise<KpiPaginatedResponse> {
    const response = await axiosInstance.get<KpiPaginatedResponse>("/v1/kpi", {
      params: {
        user_id: params.user_id || undefined,
        month: params.month || undefined,
        year: params.year || undefined,
        per_page: params.per_page ?? 50,
        page: params.page ?? 1,
      },
    })
    return response.data
  },

  /**
   * POST /v1/kpi — create or update KPI record (Admin only)
   */
  async upsert(payload: UpsertKpiPayload): Promise<EmployeeKpi> {
    const response = await axiosInstance.post<ApiResponse<EmployeeKpi>>("/v1/kpi", payload)
    return response.data.data
  },

  /**
   * GET /v1/kpi/top-performers?month=&year=&limit=
   */
  async topPerformers(month: number, year: number, limit = 10): Promise<EmployeeKpi[]> {
    const response = await axiosInstance.get<ApiResponse<EmployeeKpi[]>>("/v1/kpi/top-performers", {
      params: { month, year, limit },
    })
    return response.data.data
  },
}
