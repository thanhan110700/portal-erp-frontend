import type { LucideIcon } from "lucide-react"

import { PATHS } from "@/constants/paths"
import { LayoutDashboard, Code, History, Star, Settings } from "lucide-react"

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
    name: "Component Examples",
    href: PATHS.examples,
    icon: Code,
    items: [
      {
        name: "History",
        href: "#",
        icon: History,
      },
      {
        name: "Starred",
        href: "#",
        icon: Star,
      },
      {
        name: "Settings",
        href: "#",
        icon: Settings,
      },
    ],
  },
]
