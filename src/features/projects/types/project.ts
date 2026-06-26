import type { PaginatedResponse } from "@/shared/types"
import type { Customer, Contract } from "@/features/sales/types/sales"
import type { Employee } from "@/features/hr/types/employee"

// ── Project ────────────────────────────────────────────────────────────────
export interface Project {
  id: number
  project_code: string
  project_name: string
  customer_id: number
  customer?: Customer | null
  contract_id: number | null
  contract?: Contract | null
  start_date: string | null
  end_date: string | null
  contract_value: number
  status: string
  description: string | null
  created_at: string
  updated_at: string
}

export type ProjectPaginatedResponse = PaginatedResponse<Project>

export interface CreateProjectPayload {
  project_name: string
  customer_id: number
  contract_id?: number | null
  start_date: string
  end_date?: string | null
  contract_value: number
  status?: string | null
  description?: string | null
}

export type UpdateProjectPayload = Partial<CreateProjectPayload>

// ── Project Member ─────────────────────────────────────────────────────────
export interface ProjectMember {
  id: number
  project_id: number
  employee_id: number
  employee?: Employee
  role: string // e.g., Developer, Tester, BA
  joined_date: string
  left_date: string | null
  created_at: string
}

export interface CreateProjectMemberPayload {
  employee_id: number
  role: string
  joined_date: string
}

// ── Project Milestone ──────────────────────────────────────────────────────
export interface ProjectMilestone {
  id: number
  project_id: number
  title: string
  description: string | null
  due_date: string
  status: "Pending" | "In Progress" | "Completed" | (string & {})
  created_at: string
}

export interface CreateProjectMilestonePayload {
  title: string
  description?: string | null
  due_date: string
  status?: string
}

// ── Project Expense ────────────────────────────────────────────────────────
export interface ProjectExpense {
  id: number
  project_id: number
  title: string
  amount: number
  expense_date: string
  type: string
  status: "Pending" | "Approved" | "Rejected" | (string & {})
  description: string | null
  approved_by: number | null
  approver?: Employee | null
  created_by: number
  creator?: Employee | null
  created_at: string
}

export interface CreateProjectExpensePayload {
  title: string
  amount: number
  expense_date: string
  type: string
  description?: string | null
}

export interface UpdateProjectExpenseStatusPayload {
  status: string
  notes?: string
}
