import type { PaginatedResponse } from "@/shared/types"

// ── Project ────────────────────────────────────────────────────────────────
export interface Project {
  id: number
  project_code: string
  project_name: string
  customer_id: number
  customer?: { id: number; name: string } | null
  contract_id: number | null
  contract?: { id: number; name: string } | null
  start_date: string | null
  end_date: string | null
  contract_value: number | string
  status: string
  progress_percent: number
  total_received: number | string
  total_spent: number | string
  profit: number | string
  description: string | null
  members?: ProjectMember[]
  expenses?: ProjectExpense[]
  milestones?: ProjectMilestone[]
  files?: ProjectFile[]
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
  user?: { id: number; full_name: string } | null
  role: string | null
  start_date: string | null
  end_date: string | null
  labor_cost: number | string | null
  notes: string | null
}

export interface CreateProjectMemberPayload {
  user_id: number
  role: string
  start_date?: string | null
  end_date?: string | null
  labor_cost?: number | null
  notes?: string | null
}

export type UpdateProjectMemberPayload = Partial<Omit<CreateProjectMemberPayload, "user_id">>

// ── Project Milestone ──────────────────────────────────────────────────────
export interface ProjectMilestone {
  id: number
  project_id: number
  milestone_name: string
  milestone_date: string
  status: "planned" | "in_progress" | "completed" | "delayed" | (string & {}) | null
  notes: string | null
  created_at: string
}

export interface CreateProjectMilestonePayload {
  milestone_name: string
  milestone_date: string
  status?: string | null
  notes?: string | null
}

export type UpdateProjectMilestonePayload = Partial<CreateProjectMilestonePayload>

// ── Project Expense ────────────────────────────────────────────────────────
export interface ProjectExpense {
  id: number
  project_id: number
  expense_type: string
  amount: number | string
  expense_date: string
  status: "pending" | "approved" | "paid" | "rejected" | (string & {})
  description: string | null
  user?: { id: number; full_name: string } | null
  approver?: { id: number; full_name: string } | null
  created_at: string
  updated_at: string
}

export interface CreateProjectExpensePayload {
  expense_type: string
  amount: number
  expense_date: string
  description: string
}

export interface UpdateProjectExpenseStatusPayload {
  status: string
  notes?: string
}

// ── Project File ───────────────────────────────────────────────────────────
export interface ProjectFile {
  id: number
  file_name: string
  original_name: string
  file_path: string
  file_size: number
  file_type: string | null
  mime_type: string | null
  category: string | null
  url: string
  uploaded_by: number
  uploaded_at: string
  pivot?: {
    file_category?: string | null
    notes?: string | null
    added_at?: string | null
  } | null
}
