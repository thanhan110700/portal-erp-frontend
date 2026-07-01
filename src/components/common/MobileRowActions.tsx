import * as React from "react"
import { MoreHorizontal } from "lucide-react"
import { useIsMobile } from "@/hooks/useMobile"
import { CommonDrawer } from "@/components/common/CommonDrawer"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

export interface RowAction {
  /** Displayed label */
  label: string
  /** Lucide icon node */
  icon?: React.ReactNode
  /** Click handler */
  onClick: () => void
  /** Button variant — destructive turns red */
  variant?: "default" | "destructive"
  /** Disable this action */
  disabled?: boolean
  /** If true, a separator is rendered BEFORE this action */
  separator?: boolean
  /** Extra className for the action button/item */
  className?: string
}

interface MobileRowActionsProps {
  /** The list of available actions */
  actions: RowAction[]
  /** Label for the trigger button (accessibility) */
  triggerLabel?: string
  /** Extra className on the trigger button */
  className?: string
  /** Bottom-sheet title (mobile only) */
  drawerTitle?: string
}

/**
 * `MobileRowActions` — adaptive row action menu.
 *
 * - **Mobile** (`< 768px`): 3-dot button → bottom sheet with full-height tappable items
 * - **Desktop**: 3-dot button → dropdown menu
 *
 * Replaces the old `RowActions` inline buttons to prevent overflow on mobile.
 *
 * @example
 * <MobileRowActions
 *   actions={[
 *     { label: "Chỉnh sửa", icon: <Pencil className="size-4" />, onClick: () => onEdit(row) },
 *     { label: "Xóa", icon: <Trash2 className="size-4" />, onClick: () => onDelete(row.id), variant: "destructive", separator: true },
 *   ]}
 * />
 */
export function MobileRowActions({
  actions,
  triggerLabel = "Thao tác",
  className,
  drawerTitle,
}: MobileRowActionsProps) {
  const isMobile = useIsMobile()
  const [drawerOpen, setDrawerOpen] = React.useState(false)

  if (actions.length === 0) return null

  const trigger = (
    <Button
      variant="ghost"
      size="icon"
      aria-label={triggerLabel}
      className={cn("size-9 shrink-0", className)}
      onClick={
        isMobile
          ? (e) => {
              e.stopPropagation()
              setDrawerOpen(true)
            }
          : undefined
      }
    >
      <MoreHorizontal className="size-4" />
    </Button>
  )

  // ── Mobile: bottom-sheet ──────────────────────────────────────────────────
  if (isMobile) {
    return (
      <>
        {trigger}
        <CommonDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          title={drawerTitle ?? triggerLabel}
          direction="bottom"
          cancelAction={false}
          contentClassName="max-h-[70dvh]"
        >
          <div className="flex flex-col divide-y divide-border">
            {actions.map((action, idx) => (
              <React.Fragment key={idx}>
                {action.separator && idx > 0 && <div className="h-2 bg-muted/40" />}
                <button
                  type="button"
                  disabled={action.disabled}
                  onClick={() => {
                    setDrawerOpen(false)
                    // Small delay to let drawer close before potentially opening another modal
                    setTimeout(() => action.onClick(), 150)
                  }}
                  className={cn(
                    "flex w-full items-center gap-4 px-4 py-4 text-left text-sm font-medium",
                    "transition-colors active:bg-muted",
                    "disabled:pointer-events-none disabled:opacity-50",
                    action.variant === "destructive" ? "text-destructive" : "text-foreground",
                  )}
                >
                  {action.icon && (
                    <span
                      className={cn(
                        "size-5 shrink-0",
                        action.variant === "destructive"
                          ? "text-destructive"
                          : "text-muted-foreground",
                      )}
                    >
                      {action.icon}
                    </span>
                  )}
                  {action.label}
                </button>
              </React.Fragment>
            ))}
          </div>
        </CommonDrawer>
      </>
    )
  }

  // ── Desktop: dropdown menu ────────────────────────────────────────────────
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        {actions.map((action, idx) => (
          <React.Fragment key={idx}>
            {action.separator && idx > 0 && <DropdownMenuSeparator />}
            <DropdownMenuItem
              disabled={action.disabled}
              onClick={(e) => {
                e.stopPropagation()
                action.onClick()
              }}
              className={cn(
                "gap-2 cursor-pointer",
                action.variant === "destructive" &&
                  "text-destructive focus:text-destructive focus:bg-destructive/10",
              )}
            >
              {action.icon && <span className="size-4 shrink-0">{action.icon}</span>}
              {action.label}
            </DropdownMenuItem>
          </React.Fragment>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
