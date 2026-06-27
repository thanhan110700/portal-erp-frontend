import { axiosInstance } from "@/shared/api/axios"
import type { ApiResponse } from "@/shared/types"

export interface IncomeExpenseRow {
  year: number
  month: number
  income: string | number
  expense: string | number
  net: string | number
}

export interface ReceivableRow {
  contract_id: number
  contract_code: string
  customer_name: string
  sales_rep_name: string
  contract_value: string | number
  payment_received: string | number
  payment_outstanding: string | number
  contract_date: string
}

export interface ProjectProfitRow {
  project_id: number
  project_code: string
  project_name: string
  contract_value: string | number
  total_received: string | number
  total_spent: string | number
  profit: string | number
  status: string
  start_date: string | null
  end_date: string | null
}

export interface SalesRevenueRow {
  sales_rep: { id: number; full_name: string }
  contract_count: number
  total_contract_value: string | number
  total_payment_received: string | number
}

export interface QuoteConversionData {
  quote_count: number
  converted_count: number
  conversion_rate: number
  period: { year: number | null; month: number | null }
}

export interface SalesPipelineData {
  projects_by_status: Array<{ status: string; count: number }>
  quotes_by_status: Array<{ status: string; count: number }>
  totals: {
    active_projects: number
    pending_quotes: number
    signed_contracts: number
  }
}

export const reportApi = {
  async getIncomeExpense(
    params: {
      date_from?: string
      date_to?: string
      voucher_type?: string
      group_by?: string
    } = {},
  ): Promise<IncomeExpenseRow[]> {
    const response = await axiosInstance.get<ApiResponse<{ rows: IncomeExpenseRow[] }>>(
      "/v1/reports/income-expense",
      { params },
    )
    return response.data.data.rows
  },

  async getReceivables(
    params: {
      sales_rep_id?: number
      customer_id?: number
      date_from?: string
      date_to?: string
    } = {},
  ): Promise<ReceivableRow[]> {
    const response = await axiosInstance.get<ApiResponse<{ rows: ReceivableRow[] }>>(
      "/v1/reports/receivables",
      { params },
    )
    return response.data.data.rows
  },

  async getProjectProfit(
    params: {
      status?: string
      date_from?: string
      date_to?: string
      per_page?: number
      page?: number
    } = {},
  ): Promise<any> {
    const response = await axiosInstance.get<ApiResponse<any>>("/v1/reports/project-profit", {
      params,
    })
    return response.data.data
  },

  async getSalesRevenue(
    params: {
      year?: number
      month?: number
      sales_rep_id?: number
    } = {},
  ): Promise<SalesRevenueRow[]> {
    const response = await axiosInstance.get<ApiResponse<{ rows: SalesRevenueRow[] }>>(
      "/v1/reports/sales-revenue",
      { params },
    )
    return response.data.data.rows
  },

  async getQuoteConversion(
    params: {
      year?: number
      month?: number
      sales_rep_id?: number
    } = {},
  ): Promise<QuoteConversionData> {
    const response = await axiosInstance.get<ApiResponse<QuoteConversionData>>(
      "/v1/reports/quote-conversion",
      { params },
    )
    return response.data.data
  },

  async getSalesPipeline(): Promise<SalesPipelineData> {
    const response = await axiosInstance.get<ApiResponse<SalesPipelineData>>(
      "/v1/reports/sales-pipeline",
    )
    return response.data.data
  },
}
