export interface KpiUser {
  id: number
  full_name: string
  user_code: string
}

export interface EmployeeKpi {
  id: number
  user_id: number
  month: number
  year: number
  target_revenue: number | null
  actual_revenue: number
  kpi_percent: number | null // Actual / Target × 100
  quote_count: number
  contract_count: number
  conversion_rate: number | null // Contract / Quote × 100
  notes: string | null
  user: KpiUser | null
}

export interface KpiPaginatedResponse {
  data: EmployeeKpi[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
    from: number | null
    to: number | null
  }
}

export interface UpsertKpiPayload {
  user_id: number
  month: number
  year: number
  target_revenue: number
  actual_revenue?: number | null
  notes?: string | null
}

export interface ListKpisParams {
  user_id?: number | null
  month?: number | null
  year?: number | null
  per_page?: number
  page?: number
}
