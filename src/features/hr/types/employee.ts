export interface Department {
  id: number
  name: string
  code: string
  label?: string
  description?: string | null
}

export interface EmployeeManager {
  id: number
  full_name: string
}

export interface Employee {
  id: number
  user_code: string
  full_name: string
  email: string
  phone: string | null
  position: string | null
  address: string | null
  social_insurance: string | null
  national_id: string | null
  hire_date: string | null
  resign_date: string | null
  is_active: boolean
  department: Department | null
  manager: EmployeeManager | null
  roles: string[]
}

export interface EmployeePaginationMeta {
  current_page: number
  last_page: number
  per_page: number
  total: number
  from: number | null
  to: number | null
}

export interface EmployeePaginatedResponse {
  data: Employee[]
  meta: EmployeePaginationMeta
}

export interface CreateEmployeePayload {
  full_name: string
  email: string
  phone?: string | null
  department_id: number
  position: string
  hire_date: string
  resign_date?: string | null
  address?: string | null
  social_insurance?: string | null
  national_id?: string | null
  manager_id?: number | null
  password?: string | null
}

export type UpdateEmployeePayload = Partial<CreateEmployeePayload>

export interface AssignRolePayload {
  role: string
}
