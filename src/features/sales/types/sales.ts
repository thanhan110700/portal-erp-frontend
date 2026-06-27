import type { PaginatedResponse } from "@/shared/types"

// ── Customer ───────────────────────────────────────────────────────────────
export interface Customer {
  id: number
  customer_code: string
  name?: string
  customer_name?: string
  tax_code?: string | null
  tax_number?: string | null
  address: string | null
  phone: string
  email: string | null
  classification: "vip" | "regular" | "new" | "inactive" | (string & {}) | null
  sales_rep_id: number
  sales_rep?: { id: number; full_name: string }
  notes: string | null
  created_at: string
  updated_at: string
}

export type CustomerPaginatedResponse = PaginatedResponse<Customer>

export interface CreateCustomerPayload {
  customer_name: string
  tax_number: string | null
  address: string | null
  phone: string
  email: string | null
  classification: string | null
  sales_rep_id: number
  notes: string | null
}

export type UpdateCustomerPayload = Partial<CreateCustomerPayload>

// ── Contact ────────────────────────────────────────────────────────────────
export interface Contact {
  id: number
  customer_id: number
  contact_name: string
  position: string | null
  phone: string | null
  email: string | null
  is_primary: boolean
}

export interface CreateContactPayload {
  contact_name: string
  position?: string
  phone?: string
  email?: string
  is_primary?: boolean
}

export type UpdateContactPayload = Partial<CreateContactPayload>

// ── Interaction ────────────────────────────────────────────────────────────
export interface Interaction {
  id: number
  customer_id: number
  type: string // Call, Email, Meeting, Other
  interaction_date: string
  content: string | null
  user_id: number
  user?: { id: number; full_name: string }
  next_followup_date: string | null
  created_at: string
}

export interface CreateInteractionPayload {
  type: string
  interaction_date: string
  content?: string
  user_id: number
  next_followup_date?: string
}

// ── Quote ──────────────────────────────────────────────────────────────────
export interface Quote {
  id: number
  quote_code: string
  status: "draft" | "sent" | "waiting" | "accepted" | "rejected" | "cancelled" | (string & {})
  status_label: string
  quote_date: string
  quote_value: string | number
  description: string | null
  notes: string | null
  sent_date: string | null
  response_date: string | null
  customer: { id: number; customer_name: string; customer_code: string } | null
  creator: { id: number; full_name: string } | null
  contract: { id: number; contract_code: string } | null
  files: { id: number; name: string; url: string }[]
  created_at: string
  updated_at: string
}

export type QuotePaginatedResponse = PaginatedResponse<Quote>

export interface CreateQuotePayload {
  customer_id: number
  quote_date: string
  quote_value: number
  description?: string | null
  notes?: string | null
}

export type UpdateQuotePayload = Partial<CreateQuotePayload>

// ── Contract ───────────────────────────────────────────────────────────────
export interface Contract {
  id: number
  contract_code: string
  customer_id: number
  customer?: Customer
  quote_id: number | null
  quote?: Quote
  contract_date: string
  contract_value: number
  signed_date: string | null
  status: "Draft" | "Signed" | "Ongoing" | "Completed" | (string & {})
  sales_rep_id: number
  sales_rep?: { id: number; full_name: string }
  content: string | null
  terms: string | null
  files?: { id: number; name: string; url: string }[]
  created_at: string
  updated_at: string
}

export type ContractPaginatedResponse = PaginatedResponse<Contract>

export interface CreateContractPayload {
  customer_id: number
  quote_id?: number
  contract_date: string
  contract_value: number
  sales_rep_id: number
  signed_date?: string | null
  status?: string
  content?: string
  terms?: string
}

export type UpdateContractPayload = Partial<CreateContractPayload>
