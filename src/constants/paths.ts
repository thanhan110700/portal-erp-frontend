/**
 * Single source of truth for app pathnames (leading `/`).
 * Use for `<Link>`, `navigate()`, `<Navigate>`, and nav `href` in `header.ts`.
 */
export const PATHS = {
  root: "/",
  login: "/login",
  dashboard: "/dashboard",
  examples: "/examples",

  // HR Module
  hrEmployees: "/hr/employees",
  hrEmployeeDetail: "/hr/employees/:id",
  hrDepartments: "/hr/departments",
  hrTimesheets: "/hr/timesheets",
  hrKpi: "/hr/kpi",

  // Sales Module
  salesCustomers: "/sales/customers",
  salesCustomerDetail: "/sales/customers/:id",
  salesQuotes: "/sales/quotes",
  salesContracts: "/sales/contracts",

  // Projects
  projects: "/projects",

  // Finance
  financeVouchers: "/finance/vouchers",

  // Reports
  reports: "/reports",
} as const

export type AppPath = (typeof PATHS)[keyof typeof PATHS]

/**
 * React Router `path` for a child of a layout whose parent route is `path: '/'`.
 * (No leading slash; supports nested segments like `hr/employees`.)
 */
export function routeSegment(path: Exclude<AppPath, typeof PATHS.root>): string {
  return path.slice(1)
}

/** Build a detail path by replacing `:id` with the actual ID */
export function hrEmployeeDetailPath(id: number | string): string {
  return `/hr/employees/${id}`
}

/** Identifies a top-level nav group; set on route `handle.navSection` and optional `NavItem.navSection`. */
export const NAV_SECTIONS = {
  dashboard: "dashboard",
  hr: "hr",
  settings: "settings",
} as const

export type NavSectionId = (typeof NAV_SECTIONS)[keyof typeof NAV_SECTIONS]
