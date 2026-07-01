import { useLocation, NavLink } from "react-router-dom"
import { useIsMobile } from "@/hooks/useMobile"
import { NAVIGATION_ITEMS } from "@/constants/header"
import { cn } from "@/lib/utils"
import { useTranslation } from "react-i18next"
import { hasPermission } from "@/constants/permissions"
import { useAuthStore } from "@/hooks/useAuthStore"

export function MobileSubNav() {
  const isMobile = useIsMobile()
  const { pathname } = useLocation()
  const { t } = useTranslation()
  const user = useAuthStore((s) => s.user)

  if (!isMobile) return null

  // Find active top-level module based on pathname
  const activeModule = NAVIGATION_ITEMS.find((item) => {
    // If it has a navSection and matches the root path
    if (item.navSection && pathname.startsWith(`/${item.navSection}`)) {
      return true
    }
    // If any sub-item's href matches the pathname
    if (item.items?.some((sub) => pathname.startsWith(sub.href))) {
      return true
    }
    // If it directly matches
    return pathname === item.href
  })

  // Only render if the active module has sub-items
  if (!activeModule || !activeModule.items || activeModule.items.length === 0) {
    return null
  }

  // Filter sub-items by permission (same logic as AppSidebar)
  const availableSubItems = activeModule.items.filter((sub) => {
    return !sub.requiredPermission || hasPermission(user?.permissions, sub.requiredPermission)
  })

  if (availableSubItems.length === 0) {
    return null
  }

  return (
    <div className="sticky top-14 z-10 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85">
      {/* Gradient fade edges to indicate horizontal scroll */}
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-6 bg-gradient-to-r from-background/95 to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-6 bg-gradient-to-l from-background/95 to-transparent" />
        <div className="overflow-x-auto px-3 pb-2 pt-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div className="flex w-max space-x-2">
            {availableSubItems.map((subItem) => {
              // Exact match for root, prefix match for others to keep active state when viewing details
              const isActive =
                pathname === subItem.href ||
                (pathname.startsWith(subItem.href) && subItem.href !== "/")

              return (
                <NavLink
                  key={subItem.name}
                  to={subItem.href}
                  className={cn(
                    // min-h-11 ensures ≥44px touch target
                    "flex min-h-11 items-center gap-2 whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-medium transition-colors border",
                    isActive
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-muted-foreground border-border hover:bg-muted hover:text-foreground",
                  )}
                >
                  {subItem.icon && <subItem.icon className="size-4" />}
                  <span>{subItem.translationKey ? t(subItem.translationKey) : subItem.name}</span>
                </NavLink>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
