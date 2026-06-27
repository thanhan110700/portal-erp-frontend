import { NavLink } from "react-router-dom"
import { useIsMobile } from "@/hooks/useMobile"
import { NAVIGATION_ITEMS } from "@/constants/header"
import { cn } from "@/lib/utils"
import { useTranslation } from "react-i18next"

export function MobileBottomNav() {
  const isMobile = useIsMobile()
  const { t } = useTranslation()

  if (!isMobile) return null

  // Show top-level modules in bottom bar, max 5
  const bottomItems = NAVIGATION_ITEMS.slice(0, 5).map((item) => {
    // If the top-level item doesn't have an href, use the href of its first sub-item
    const targetHref = item.href || (item.items?.[0]?.href ?? "#")
    return { ...item, targetHref }
  })

  if (bottomItems.length === 0) return null

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-stretch border-t bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/85"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Mobile navigation"
    >
      {bottomItems.map((item) => {
        const Icon = item.icon
        return (
          <NavLink
            key={item.name}
            to={item.targetHref}
            end
            className={({ isActive }) =>
              cn(
                "relative flex flex-1 flex-col items-center justify-center gap-1 px-1 py-2 text-[10px] font-medium transition-colors",
                isActive
                  ? "text-red-600 dark:text-red-400"
                  : "text-muted-foreground hover:text-foreground",
              )
            }
          >
            {({ isActive }) => (
              <>
                {/* Active indicator pill */}
                {isActive && (
                  <span className="absolute top-0 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-red-600 dark:bg-red-400" />
                )}
                {Icon && (
                  <Icon
                    className={cn(
                      "size-5 shrink-0 transition-transform duration-150",
                      isActive && "scale-110",
                    )}
                  />
                )}
                <span className="truncate leading-none max-w-[56px] text-center">
                  {item.translationKey ? t(item.translationKey) : item.name}
                </span>
              </>
            )}
          </NavLink>
        )
      })}
    </nav>
  )
}
