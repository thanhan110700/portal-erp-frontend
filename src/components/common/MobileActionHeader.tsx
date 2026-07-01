import * as React from "react"
import { cn } from "@/lib/utils"
import { type LucideIcon } from "lucide-react"

export interface MobileActionHeaderProps {
  /** Icon shown next to the title */
  icon?: LucideIcon
  /** Page title */
  title: string
  /** Optional subtitle / count */
  subtitle?: React.ReactNode
  /** Action buttons rendered on the right (desktop) / below title (mobile) */
  actions?: React.ReactNode
  /** Extra className for the outer wrapper */
  className?: string
}

/**
 * `MobileActionHeader` — consistent responsive page header.
 *
 * - **Mobile**: title block full-width top, actions row below (flex-wrap)
 * - **Desktop**: title left, actions right on the same row
 *
 * @example
 * <MobileActionHeader
 *   icon={Users}
 *   title="Nhân viên"
 *   subtitle={`${total} nhân viên`}
 *   actions={
 *     <>
 *       <Button variant="outline" onClick={handleExport}>Xuất</Button>
 *       <Button onClick={() => setOpen(true)}>Thêm mới</Button>
 *     </>
 *   }
 * />
 */
export function MobileActionHeader({
  icon: Icon,
  title,
  subtitle,
  actions,
  className,
}: MobileActionHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      {/* Title block */}
      <div className="flex items-center gap-3 min-w-0">
        {Icon && (
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Icon className="size-5" />
          </div>
        )}
        <div className="min-w-0">
          <h1 className="truncate text-xl font-semibold leading-tight">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
      </div>

      {/* Actions: flex-wrap so they wrap gracefully on small screens */}
      {actions && (
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto sm:flex-nowrap sm:shrink-0">
          {actions}
        </div>
      )}
    </div>
  )
}
