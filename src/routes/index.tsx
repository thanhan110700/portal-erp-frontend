import { lazy } from "react"
import { createBrowserRouter, Navigate } from "react-router-dom"

import { AppErrorPage } from "@/features/errors/pages/AppErrorPage"
import { DashboardLayout } from "@/layouts/DashboardLayout"
import { PATHS, routeSegment } from "@/constants/paths"
import { PageLoader } from "@/components/common/PageLoader"

const AuthLayout = lazy(() => import("@/layouts/AuthLayout"))
const LoginPage = lazy(() =>
  import("@/features/auth/pages/LoginPage").then((m) => ({ default: m.LoginPage })),
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
            handle: { title: "Login" },
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
        // element: <ProtectedRoute />,
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
                handle: { title: "Dashboard" },
              },
              {
                path: routeSegment(PATHS.examples),
                lazy: async () => {
                  const { ComponentExamplesPage } =
                    await import("@/features/examples/pages/ComponentExamplesPage")
                  return { Component: ComponentExamplesPage }
                },
                handle: { title: "Component Examples" },
              },
            ],
          },
        ],
      },
    ],
  },
])
