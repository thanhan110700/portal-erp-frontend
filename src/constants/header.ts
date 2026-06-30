import type { LucideIcon } from "lucide-react"

import { PATHS } from "@/constants/paths"
import {
  LayoutDashboard,
  Users,
  TrendingUp,
  Briefcase,
  FileText,
  FileSignature,
  FolderKanban,
  Receipt,
  BarChart3,
  Building2,
  PieChart,
} from "lucide-react"

import { PermissionSlugs } from "@/constants/permissions"

export type NavSubItem = {
  name: string
  translationKey?: string
  href: string
  icon?: LucideIcon
  requiredPermission?: string
  adminOnly?: boolean
  mainSystemOnly?: boolean
}

export type NavItem = {
  name: string
  translationKey?: string
  href?: string
  icon?: LucideIcon
  items?: NavSubItem[]
  navSection?: string
}

export const NAVIGATION_ITEMS: NavItem[] = [
  {
    name: "Dashboard",
    translationKey: "dashboard:title",
    href: PATHS.dashboard,
    icon: LayoutDashboard,
  },
  {
    name: "Nhân sự",
    translationKey: "hr:title",
    icon: Users,
    navSection: "hr",
    items: [
      {
        name: "Phòng ban",
        translationKey: "hr:department.title",
        href: PATHS.hrDepartments,
        icon: Building2,
        requiredPermission: PermissionSlugs.ViewDepartments,
      },
      {
        name: "Nhân viên",
        translationKey: "hr:employee",
        href: PATHS.hrEmployees,
        icon: Users,
        requiredPermission: PermissionSlugs.ViewEmployees,
      },
      // {
      //   name: "Chấm công",
      //   translationKey: "hr:timesheet.title",
      //   href: PATHS.hrTimesheets,
      //   icon: Clock,
      //   requiredPermission: PermissionSlugs.ViewTimesheets,
      // },
      {
        name: "KPI",
        translationKey: "hr:kpi.title",
        href: PATHS.hrKpi,
        icon: TrendingUp,
        requiredPermission: PermissionSlugs.ViewKpis,
      },
    ],
  },
  {
    name: "Kinh doanh",
    translationKey: "sales:title",
    icon: Briefcase,
    navSection: "sales",
    items: [
      {
        name: "Khách hàng",
        translationKey: "sales:customer",
        href: PATHS.salesCustomers,
        icon: Users,
        requiredPermission: PermissionSlugs.ViewCustomers,
      },
      {
        name: "Báo giá",
        translationKey: "sales:quote.title",
        href: PATHS.salesQuotes,
        icon: FileText,
        requiredPermission: PermissionSlugs.ViewQuotes,
      },
      {
        name: "Hợp đồng",
        translationKey: "sales:contract.title",
        href: PATHS.salesContracts,
        icon: FileSignature,
        requiredPermission: PermissionSlugs.ViewContracts,
      },
    ],
  },
  {
    name: "Dự án",
    translationKey: "projects:title",
    icon: FolderKanban,
    navSection: "projects",
    items: [
      {
        name: "Quản lý Dự án",
        translationKey: "projects:project",
        href: PATHS.projects,
        icon: FolderKanban,
        requiredPermission: PermissionSlugs.ViewProjects,
      },
    ],
  },
  {
    name: "Tài chính",
    translationKey: "finance:title",
    icon: Receipt,
    navSection: "finance",
    items: [
      {
        name: "Dashboard",
        translationKey: "finance:dashboard.title",
        href: PATHS.financeDashboard,
        icon: LayoutDashboard,
        requiredPermission: PermissionSlugs.ViewVouchers,
      },
      {
        name: "Chứng từ Thu/Chi",
        translationKey: "finance:vouchers",
        href: PATHS.financeVouchers,
        icon: Receipt,
        requiredPermission: PermissionSlugs.ViewVouchers,
      },
      {
        name: "Chi phí theo Dự án",
        translationKey: "finance:project_expenses.nav_title",
        href: PATHS.financeProjectExpenses,
        icon: PieChart,
        requiredPermission: PermissionSlugs.ViewVouchers,
      },
      {
        name: "Báo cáo quản trị",
        translationKey: "reports:title",
        href: PATHS.reports,
        icon: BarChart3,
        requiredPermission: PermissionSlugs.ViewFinanceReports,
      },
    ],
  },
]
