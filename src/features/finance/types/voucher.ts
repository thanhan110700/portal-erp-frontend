import type { PaginatedResponse } from "@/shared/types"

export interface Voucher {
  id: number
  voucher_code: string
  voucher_type: "receipt" | "payment"
  type_label: string
  amount: number | string
  description: string | null
  voucher_date: string
  status: "draft" | "pending" | "approved" | "paid" | "rejected" | "cancelled"
  status_label: string
  notes: string | null
  creator?: { id: number; full_name: string } | null
  approver?: { id: number; full_name: string } | null
  project?: { id: number; name: string } | null
  contract?: { id: number; name: string } | null
  customer?: { id: number; name: string } | null
  department?: { id: number; name: string } | null
  employees?: Array<{ id: number; full_name: string }>
  files?: Array<{ id: number; name: string; url: string }>
  created_at: string
  updated_at: string
}

export type VoucherPaginatedResponse = PaginatedResponse<Voucher>

export interface CreateVoucherPayload {
  voucher_type: "receipt" | "payment"
  amount: number
  voucher_date: string
  description: string
  notes?: string | null
  project_id?: number | null
  contract_id?: number | null
  customer_id?: number | null
  department_id?: number | null
  employee_ids?: number[]
}

export type UpdateVoucherPayload = Partial<CreateVoucherPayload>

export interface ListVouchersParams {
  search?: string
  voucher_type?: string
  status?: string
  project_id?: number
  customer_id?: number
  date_from?: string
  date_to?: string
  per_page?: number
  page?: number
}

export interface VoucherAuditLog {
  id: number
  action: string
  action_label: string
  user: { id: number; full_name: string }
  changes: Record<string, unknown> | null
  notes: string | null
  created_at: string
}
