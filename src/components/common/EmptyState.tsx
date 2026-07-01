import { type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export interface EmptyStateProps {
  /** Icon component to display */
  icon?: LucideIcon
  /** Main title */
  title: string
  /** Optional description text */
  description?: string
  /** Optional action button */
  action?: {
    label: string
    onClick: () => void
    icon?: LucideIcon
  }
  /** Extra class for the wrapper */
  className?: string
  /** Size variant */
  size?: "sm" | "md" | "lg"
}

/**
 * `EmptyState` — consistent empty data placeholder across the app.
 *
 * @example
 * <EmptyState
 *   icon={Briefcase}
 *   title="Chưa có dự án"
 *   description="Tạo dự án đầu tiên để bắt đầu"
 *   action={{ label: "Tạo dự án", onClick: handleCreate }}
 * />
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  size = "md",
}: EmptyStateProps) {
  const iconSizes = { sm: "size-8", md: "size-12", lg: "size-16" }
  const titleSizes = { sm: "text-sm", md: "text-base", lg: "text-lg" }
  const descSizes = { sm: "text-xs", md: "text-sm", lg: "text-sm" }
  const paddingSizes = { sm: "py-6", md: "py-10", lg: "py-14" }

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        paddingSizes[size],
        "rounded-xl border border-dashed bg-muted/20 px-4",
        className,
      )}
    >
      {Icon && (
        <div className="mb-3 flex items-center justify-center rounded-full bg-muted/50 p-3">
          <Icon className={cn(iconSizes[size], "text-muted-foreground/60")} />
        </div>
      )}

      <h3 className={cn("font-semibold text-foreground", titleSizes[size])}>{title}</h3>

      {description && (
        <p className={cn("mt-1.5 max-w-xs text-muted-foreground", descSizes[size])}>
          {description}
        </p>
      )}

      {action && (
        <div className="mt-4">
          <Button size="sm" onClick={action.onClick} className="gap-2 min-h-11 md:min-h-9">
            {action.icon && <action.icon className="size-4" />}
            {action.label}
          </Button>
        </div>
      )}
    </div>
  )
}
