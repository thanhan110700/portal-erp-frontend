import { lazy } from "react"
import { createBrowserRouter, Navigate } from "react-router-dom"

import { AppErrorPage } from "@/features/errors/pages/AppErrorPage"
import { DashboardLayout } from "@/layouts/DashboardLayout"
import { PATHS, routeSegment } from "@/constants/paths"
import { PageLoader } from "@/components/common/PageLoader"
import { ProtectedRoute } from "@/app/router/ProtectedRoute"

const AuthLayout = lazy(() => import("@/layouts/AuthLayout"))
const LoginPage = lazy(() =>
  import("@/features/auth/pages/LoginPage").then((m) => ({ default: m.LoginPage })),
)

// Projects
const ProjectListPage = lazy(() =>
  import("@/features/projects/pages/ProjectListPage").then((m) => ({ default: m.ProjectListPage })),
)
const ProjectDetailPage = lazy(() =>
  import("@/features/projects/pages/ProjectDetailPage").then((m) => ({
    default: m.ProjectDetailPage,
  })),
)

// function withPermission(Page: ComponentType, permission?: string): ComponentType {
//   if (!permission) return Page
//   function PermissionGuard() {
//     return (
//       <RequirePermission permission={permission!}>
//         <Page />
//       </RequirePermission>
//     )
//   }
//   return PermissionGuard
// }

export const router = createBrowserRouter([
  {
    errorElement: <AppErrorPage />,
    children: [
      {
        path: PATHS.root,
        element: <Navigate to={PATHS.dashboard} replace />,
      },
      {
        path: PATHS.root,
        element: <AuthLayout />,
        children: [
          {
            path: routeSegment(PATHS.login),
            element: <LoginPage />,
            handle: { title: "common:routes.login" },
          },
        ],
      },
      {
        path: "*",
        lazy: async () => {
          const { NotFoundPage } = await import("@/features/errors/pages/NotFoundPage")
          return { Component: NotFoundPage }
        },
      },
      {
        path: PATHS.root,
        element: <ProtectedRoute />,
        HydrateFallback: PageLoader,
        children: [
          {
            path: PATHS.root,
            element: <DashboardLayout />,
            children: [
              {
                path: routeSegment(PATHS.dashboard),
                lazy: async () => {
                  const { DashboardPage } = await import("@/features/dashboard/pages/DashboardPage")
                  return { Component: DashboardPage }
                },
                handle: { title: "common:routes.dashboard" },
              },
              {
                path: routeSegment(PATHS.projects),
                element: <ProjectListPage />,
                handle: { title: "common:routes.projects" },
              },
              {
                path: `${routeSegment(PATHS.projects)}/:id`,
                element: <ProjectDetailPage />,
                handle: { title: "common:routes.project_detail" },
              },
              {
                path: routeSegment(PATHS.examples),
                lazy: async () => {
                  const { ComponentExamplesPage } =
                    await import("@/features/examples/pages/ComponentExamplesPage")
                  return { Component: ComponentExamplesPage }
                },
                handle: { title: "common:routes.component_examples" },
              },
              // ── HR Module ──────────────────────────────────────────────
              {
                path: routeSegment(PATHS.hrEmployees),
                lazy: async () => {
                  const { EmployeeListPage } = await import("@/features/hr/pages/EmployeeListPage")
                  return { Component: EmployeeListPage }
                },
                handle: { title: "common:routes.hr_employees" },
              },
              {
                path: "hr/employees/:id",
                lazy: async () => {
                  const { EmployeeDetailPage } =
                    await import("@/features/hr/pages/EmployeeDetailPage")
                  return { Component: EmployeeDetailPage }
                },
                handle: { title: "common:routes.hr_employee_detail" },
              },
              {
                path: routeSegment(PATHS.hrDepartments),
                lazy: async () => {
                  const { DepartmentListPage } =
                    await import("@/features/hr/pages/DepartmentListPage")
                  return { Component: DepartmentListPage }
                },
                handle: { title: "common:routes.hr_departments" },
              },
              {
                path: routeSegment(PATHS.hrTimesheets),
                lazy: async () => {
                  const { TimesheetListPage } =
                    await import("@/features/hr/pages/TimesheetListPage")
                  return { Component: TimesheetListPage }
                },
                handle: { title: "common:routes.hr_timesheets" },
              },
              {
                path: routeSegment(PATHS.hrKpi),
                lazy: async () => {
                  const { KpiDashboardPage } = await import("@/features/hr/pages/KpiDashboardPage")
                  return { Component: KpiDashboardPage }
                },
                handle: { title: "common:routes.hr_kpi" },
              },
              // ── Sales Module ───────────────────────────────────────────
              {
                path: routeSegment(PATHS.salesCustomers),
                lazy: async () => {
                  const { CustomerListPage } =
                    await import("@/features/sales/pages/CustomerListPage")
                  return { Component: CustomerListPage }
                },
                handle: { title: "common:routes.sales_customers" },
              },
              {
                path: "sales/customers/:id",
                lazy: async () => {
                  const { CustomerDetailPage } =
                    await import("@/features/sales/pages/CustomerDetailPage")
                  return { Component: CustomerDetailPage }
                },
                handle: { title: "common:routes.sales_customer_detail" },
              },
              {
                path: routeSegment(PATHS.salesQuotes),
                lazy: async () => {
                  const { QuoteListPage } = await import("@/features/sales/pages/QuoteListPage")
                  return { Component: QuoteListPage }
                },
                handle: { title: "common:routes.sales_quotes" },
              },
              {
                path: routeSegment(PATHS.salesContracts),
                lazy: async () => {
                  const { ContractListPage } =
                    await import("@/features/sales/pages/ContractListPage")
                  return { Component: ContractListPage }
                },
                handle: { title: "common:routes.sales_contracts" },
              },
              // ── Finance Module ──────────────────────────────────────────
              {
                path: routeSegment(PATHS.financeVouchers),
                lazy: async () => {
                  const { VoucherListPage } =
                    await import("@/features/finance/pages/VoucherListPage")
                  return { Component: VoucherListPage }
                },
                handle: { title: "common:routes.finance_vouchers" },
              },
              // ── Reports Module ──────────────────────────────────────────
              {
                path: routeSegment(PATHS.reports),
                lazy: async () => {
                  const { ReportDashboardPage } =
                    await import("@/features/reports/pages/ReportDashboardPage")
                  return { Component: ReportDashboardPage }
                },
                handle: { title: "common:routes.reports" },
              },
            ],
          },
        ],
      },
    ],
  },
])
