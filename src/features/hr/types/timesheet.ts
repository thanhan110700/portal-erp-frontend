export type TimesheetStatus = "pending" | "approved" | "rejected"

export interface TimesheetUser {
  id: number
  full_name: string
  user_code: string
}

export interface TimesheetApprover {
  id: number
  full_name: string
}

export interface Timesheet {
  id: number
  user_id: number
  timesheet_date: string // ISO date: "2026-06-24"
  check_in_time: string | null // "2026-06-24 08:00:00"
  check_out_time: string | null // "2026-06-24 17:30:00"
  working_hours: number | null
  status: TimesheetStatus
  notes: string | null
  user: TimesheetUser | null
  approver: TimesheetApprover | null
  created_at: string | null
}

export interface TimesheetPaginationMeta {
  current_page: number
  last_page: number
  per_page: number
  total: number
  from: number | null
  to: number | null
}

export interface TimesheetPaginatedResponse {
  data: Timesheet[]
  meta: TimesheetPaginationMeta
}

export interface SubmitTimesheetPayload {
  timesheet_date: string // "YYYY-MM-DD"
  check_in_time?: string | null // "YYYY-MM-DD HH:mm:ss"
  check_out_time?: string | null // "YYYY-MM-DD HH:mm:ss"
  notes?: string | null
}

export interface ListTimesheetsParams {
  user_id?: number | null
  status?: TimesheetStatus | "all" | null
  from_date?: string | null
  to_date?: string | null
  per_page?: number
  page?: number
}
