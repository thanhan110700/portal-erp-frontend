import { type LucideIcon, Plus } from "lucide-react"
import { cn } from "@/lib/utils"

export interface FabProps {
  /** Click handler */
  onClick: () => void
  /** Icon to display (defaults to Plus) */
  icon?: LucideIcon
  /** Accessible label */
  label?: string
  /** Whether the button is disabled */
  disabled?: boolean
  /** Extra className */
  className?: string
}

/**
 * `Fab` — Floating Action Button for primary create actions on mobile.
 * Renders fixed at bottom-right above the MobileBottomNav.
 *
 * Only renders on mobile (md:hidden). Desktop pages should use their own header buttons.
 *
 * @example
 * <Fab onClick={() => setFormOpen(true)} label="Tạo phiếu" />
 */
export function Fab({
  onClick,
  icon: Icon = Plus,
  label = "Thêm mới",
  disabled = false,
  className,
}: FabProps) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        // Position: above bottom nav (h-16) + safe area, right-aligned
        "fixed right-4 z-40 md:hidden",
        "bottom-[calc(4rem+env(safe-area-inset-bottom)+1rem)]",
        // Shape & size — 56px FAB
        "flex size-14 items-center justify-center rounded-full",
        // Colors & elevation
        "bg-primary text-primary-foreground shadow-lg",
        "transition-all duration-150",
        // States
        "hover:scale-105 hover:shadow-xl active:scale-95",
        "disabled:pointer-events-none disabled:opacity-50",
        // Focus ring for accessibility
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className,
      )}
    >
      <Icon className="size-6" />
    </button>
  )
}
