import type { LucideIcon } from "lucide-react"

import { PATHS } from "@/constants/paths"
import {
  LayoutDashboard,
  Users,
  Clock,
  TrendingUp,
  Briefcase,
  FileText,
  FileSignature,
  FolderKanban,
} from "lucide-react"

export type NavSubItem = {
  name: string
  href: string
  icon?: LucideIcon
  requiredPermission?: string
  adminOnly?: boolean
  mainSystemOnly?: boolean
}

export type NavItem = {
  name: string
  href?: string
  icon?: LucideIcon
  items?: NavSubItem[]
  navSection?: string
}

export const NAVIGATION_ITEMS: NavItem[] = [
  { name: "Dashboard", href: PATHS.dashboard, icon: LayoutDashboard },
  {
    name: "Nhân sự",
    icon: Users,
    navSection: "hr",
    items: [
      {
        name: "Nhân viên",
        href: PATHS.hrEmployees,
        icon: Users,
      },
      {
        name: "Chấm công",
        href: PATHS.hrTimesheets,
        icon: Clock,
      },
      {
        name: "KPI",
        href: PATHS.hrKpi,
        icon: TrendingUp,
      },
    ],
  },
  {
    name: "Kinh doanh",
    icon: Briefcase,
    navSection: "sales",
    items: [
      {
        name: "Khách hàng",
        href: PATHS.salesCustomers,
        icon: Users,
      },
      {
        name: "Báo giá",
        href: PATHS.salesQuotes,
        icon: FileText,
      },
      {
        name: "Hợp đồng",
        href: PATHS.salesContracts,
        icon: FileSignature,
      },
    ],
  },
  {
    name: "Dự án",
    icon: FolderKanban,
    navSection: "projects",
    items: [
      {
        name: "Quản lý Dự án",
        href: PATHS.projects,
        icon: FolderKanban,
      },
    ],
  },
]
