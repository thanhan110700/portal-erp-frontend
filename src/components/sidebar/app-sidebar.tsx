import * as React from "react"
import { memo } from "react"

import { NavMain } from "@/components/sidebar/nav-main"
import { NavUser } from "@/components/sidebar/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenuButton,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"
import { useAuthStore } from "@/hooks/useAuthStore"
import { NAVIGATION_ITEMS } from "@/constants/header"
import { hasPermission } from "@/constants/permissions"

// Filter navigation items based on user permissions and roles
function filterNavItemsForUser(
  items: typeof NAVIGATION_ITEMS,
  userPermissions: string[] | undefined,
) {
  return items
    .map((item) => {
      if (!item.items?.length) {
        return item
      }
      const filteredItems = item.items.filter((sub) => {
        return !sub.requiredPermission || hasPermission(userPermissions, sub.requiredPermission)
      })
      return { ...item, items: filteredItems }
    })
    .filter((item) => {
      if (item.items?.length) {
        return item.items.length > 0
      }
      return true
    })
}

function AppSidebarInner({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const user = useAuthStore((s) => s.user)
  const { state, isMobile } = useSidebar()
  const isCollapsed = state === "collapsed" && !isMobile

  // Map user details to the structure NavUser expects
  // Priority: full_name (from login) → name (from /me) → username → email prefix
  const sidebarUser = React.useMemo(() => {
    const displayName =
      user?.full_name ?? user?.name ?? user?.username ?? user?.email?.split("@")[0] ?? "ERP User"
    return {
      name: displayName,
      email: user?.email ?? "",
      avatar: user?.avatar_url ?? "",
    }
  }, [user])

  // Filter main navigation items
  const filteredNavItems = React.useMemo(() => {
    const rawItems = filterNavItemsForUser(NAVIGATION_ITEMS, user?.permissions)
    return rawItems.map((item) => ({
      title: item.name,
      url: item.href ?? "#",
      icon: item.icon ? React.createElement(item.icon, { className: "size-4" }) : undefined,
      items: item.items?.map((sub) => ({
        title: sub.name,
        url: sub.href,
        icon: sub.icon ? React.createElement(sub.icon, { className: "size-4" }) : undefined,
      })),
    }))
  }, [user])

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenuButton
          size="lg"
          className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
        >
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground font-semibold text-xs shrink-0">
            ERP
          </div>
          {!isCollapsed && (
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">Portal ERP</span>
            </div>
          )}
        </SidebarMenuButton>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={filteredNavItems} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={sidebarUser} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

export const AppSidebar = memo(AppSidebarInner)
