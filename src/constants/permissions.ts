/**
 * Permission slugs mirror `App\Enums\Permission` (Laravel).
 */

export const PermissionSlugs = {
  FullAccess: "*",

  // Finance — Vouchers
  ViewVouchers: "view.vouchers",
  CreateVouchers: "create.vouchers",
  EditVouchers: "edit.vouchers",
  DeleteVouchers: "delete.vouchers",
  ApproveVouchers: "approve.vouchers",

  // Finance — Reports
  ViewFinanceReports: "view.finance-reports",

  // Project — Projects
  ViewProjects: "view.projects",
  CreateProjects: "create.projects",
  EditProjects: "edit.projects",
  DeleteProjects: "delete.projects",

  // Project — Members
  ViewProjectMembers: "view.project-members",
  CreateProjectMembers: "create.project-members",
  EditProjectMembers: "edit.project-members",
  DeleteProjectMembers: "delete.project-members",

  // Project — Expenses
  ViewProjectExpenses: "view.project-expenses",
  CreateProjectExpenses: "create.project-expenses",
  EditProjectExpenses: "edit.project-expenses",
  DeleteProjectExpenses: "delete.project-expenses",
  ApproveProjectExpenses: "approve.project-expenses",

  // Sales — Customers
  ViewCustomers: "view.customers",
  CreateCustomers: "create.customers",
  EditCustomers: "edit.customers",
  DeleteCustomers: "delete.customers",

  // Sales — Quotes
  ViewQuotes: "view.quotes",
  CreateQuotes: "create.quotes",
  EditQuotes: "edit.quotes",
  DeleteQuotes: "delete.quotes",

  // Sales — Contracts
  ViewContracts: "view.contracts",
  CreateContracts: "create.contracts",
  EditContracts: "edit.contracts",
  DeleteContracts: "delete.contracts",
  ApproveContracts: "approve.contracts",

  // HR — Departments
  ViewDepartments: "view.departments",
  CreateDepartments: "create.departments",
  EditDepartments: "edit.departments",
  DeleteDepartments: "delete.departments",

  // HR — Employees
  ViewEmployees: "view.employees",
  CreateEmployees: "create.employees",
  EditEmployees: "edit.employees",
  DeleteEmployees: "delete.employees",

  // HR — Timesheets
  ViewTimesheets: "view.timesheets",
  CreateTimesheets: "create.timesheets",
  EditTimesheets: "edit.timesheets",
  DeleteTimesheets: "delete.timesheets",
  ApproveTimesheets: "approve.timesheets",

  // HR — KPIs
  ViewKpis: "view.kpis",
  EditKpis: "edit.kpis",

  // HR — Permissions management
  ViewPermissions: "view.permissions",
  CreatePermissions: "create.permissions",
  EditPermissions: "edit.permissions",
  DeletePermissions: "delete.permissions",
} as const

export function allPermissionSlugs(): string[] {
  return Object.values(PermissionSlugs)
}

export function hasFullAccess(perms: string[] | null | undefined): boolean {
  if (!perms) return false
  return perms.includes(PermissionSlugs.FullAccess)
}

export function hasPermission(perms: string[] | null | undefined, slug: string): boolean {
  if (!perms) return false
  if (hasFullAccess(perms)) return true
  return perms.includes(slug)
}

export function countActivePermissions(perms: string[] | null | undefined): number {
  if (!perms) return 0
  if (hasFullAccess(perms)) return allPermissionSlugs().length
  return perms.length
}

export type PermissionDefinition = {
  key: keyof typeof PermissionSlugs
  slug: string
  label: string
}

export type PermissionCluster = {
  id: string
  label: string
  screens: {
    id: string
    label: string
    permissions: PermissionDefinition[]
  }[]
}

// Optional: You can expand this catalog later for UI settings pages.
export const PERMISSION_CATALOG: PermissionCluster[] = [
  {
    id: "system",
    label: "System Access",
    screens: [
      {
        id: "full-access",
        label: "Full Access",
        permissions: [
          { key: "FullAccess", slug: PermissionSlugs.FullAccess, label: "Full Access" },
        ],
      },
    ],
  },
]
