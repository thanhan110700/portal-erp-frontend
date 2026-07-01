import * as React from "react"
import { useIsMobile } from "@/hooks/useMobile"
import { cn } from "@/lib/utils"
import { EmptyState } from "@/components/common/EmptyState"
import { useTranslation } from "react-i18next"
import type { LucideIcon } from "lucide-react"

// ─── Skeleton ──────────────────────────────────────────────────────────────────

function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse rounded-xl border bg-card p-4 space-y-3", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2 flex-1">
          <div className="h-4 rounded bg-muted w-2/3" />
          <div className="h-3 rounded bg-muted w-1/2" />
        </div>
        <div className="h-6 w-16 rounded-full bg-muted" />
      </div>
      <div className="flex gap-4">
        <div className="h-3 rounded bg-muted w-24" />
        <div className="h-3 rounded bg-muted w-20" />
      </div>
    </div>
  )
}

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface MobileCardListProps<T> {
  /** Data items to render */
  data: T[]
  /** Loading state — shows skeleton cards */
  isLoading?: boolean
  /** Number of skeleton cards to display while loading */
  skeletonCount?: number

  // ── Mobile card renderer ───────────────────────────────────────────────────
  /** Render a single card item (mobile) — receives the item and its index */
  renderCard: (item: T, index: number) => React.ReactNode
  /** Key extractor (defaults to index if not provided) */
  keyExtractor?: (item: T, index: number) => string | number

  // ── Desktop table (pass-through) ───────────────────────────────────────────
  /** Desktop table component — rendered as-is when isMobile is false */
  desktopTable?: React.ReactNode

  // ── Empty state ────────────────────────────────────────────────────────────
  emptyIcon?: LucideIcon
  emptyTitle?: string
  emptyDescription?: string
  emptyAction?: {
    label: string
    onClick: () => void
    icon?: LucideIcon
  }

  // ── Layout ─────────────────────────────────────────────────────────────────
  /** Gap between cards (default: gap-3) */
  cardGap?: string
  /** Extra className on the card list wrapper */
  className?: string
  /** Card container className (mobile only) */
  cardClassName?: string
}

/**
 * `MobileCardList` — the core responsive list primitive.
 *
 * Automatically switches between:
 * - **Mobile**: vertical list of `renderCard()` items
 * - **Desktop**: renders `desktopTable` as-is
 *
 * If `desktopTable` is not provided, card layout is used on both viewports.
 *
 * @example
 * <MobileCardList
 *   data={employees}
 *   isLoading={isLoading}
 *   keyExtractor={(e) => e.id}
 *   renderCard={(employee) => (
 *     <EmployeeCard employee={employee} onEdit={handleEdit} onDelete={handleDelete} />
 *   )}
 *   desktopTable={<EmployeeTable employees={employees} ... />}
 *   emptyIcon={Users}
 *   emptyTitle="Chưa có nhân viên"
 *   emptyDescription="Thêm nhân viên đầu tiên để bắt đầu"
 * />
 */
export function MobileCardList<T>({
  data,
  isLoading = false,
  skeletonCount = 5,
  renderCard,
  keyExtractor,
  desktopTable,
  emptyIcon,
  emptyTitle,
  emptyDescription,
  emptyAction,
  cardGap = "gap-3",
  className,
  cardClassName,
}: MobileCardListProps<T>) {
  const { t } = useTranslation()
  const isMobile = useIsMobile()

  // ── Desktop fallback ─────────────────────────────────────────────────────
  if (!isMobile && desktopTable) {
    return <>{desktopTable}</>
  }

  // ── Loading state ─────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className={cn("flex flex-col", cardGap, className)}>
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <CardSkeleton key={i} className={cardClassName} />
        ))}
      </div>
    )
  }

  // ── Empty state ───────────────────────────────────────────────────────────
  if (data.length === 0) {
    return (
      <EmptyState
        icon={emptyIcon}
        title={emptyTitle ?? t("common:table.noData")}
        description={emptyDescription}
        action={emptyAction}
        className={className}
      />
    )
  }

  // ── Card list ─────────────────────────────────────────────────────────────
  return (
    <div className={cn("flex flex-col", cardGap, className)}>
      {data.map((item, index) => (
        <React.Fragment key={keyExtractor ? keyExtractor(item, index) : index}>
          {renderCard(item, index)}
        </React.Fragment>
      ))}
    </div>
  )
}
