import { axiosInstance } from "./axios"
import type { ApiResponse } from "../types"

export interface OptionItem {
  value: string | number
  label: string
  [key: string]: unknown
}

// Helper to fetch options endpoint
const fetchOptions = async <T = OptionItem[]>(endpoint: string): Promise<T> => {
  const response = await axiosInstance.get<ApiResponse<T>>(`/v1/options/${endpoint}`)
  const data = response.data.data
  return data
}

export const optionApi = {
  // ── Sales ────────────────────────────────────────────────────────────────
  getCustomers: () => fetchOptions("customers"),
  getCustomerClassifications: () => fetchOptions("customer-classifications"),
  getQuotes: () => fetchOptions("quotes"),
  getQuoteStatuses: () => fetchOptions("quote-statuses"),
  getContracts: () => fetchOptions("contracts"),
  getContractStatuses: () => fetchOptions("contract-statuses"),
  getInteractionTypes: () => fetchOptions("interaction-types"),

  // ── Projects ─────────────────────────────────────────────────────────────
  getProjects: () => fetchOptions("projects"),
  getProjectStatuses: () => fetchOptions("project-statuses"),
  getMilestoneStatuses: () => fetchOptions("milestone-statuses"),
  getExpenseTypes: () => fetchOptions("expense-types"),
  getExpenseStatuses: () => fetchOptions("expense-statuses"),

  // ── Finance ──────────────────────────────────────────────────────────────
  getVoucherTypes: () => fetchOptions("voucher-types"),
  getVoucherStatuses: () => fetchOptions("voucher-statuses"),

  // ── HR & System ──────────────────────────────────────────────────────────
  getEmployees: () => fetchOptions("employees"),
  getDepartments: () => fetchOptions("departments"),
  getRoles: () => fetchOptions("roles"),
  getPermissions: () => fetchOptions("permissions"),
  getFileCategories: () => fetchOptions("file-categories"),
}
