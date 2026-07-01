import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useTranslation } from "react-i18next"

interface TablePaginationProps {
  page: number
  totalPages: number
  total: number
  perPage: number
  onPageChange: (page: number) => void
  className?: string
}

/** Generate array of page numbers + ellipsis markers to render */
function buildPages(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

  const pages: (number | "...")[] = []

  if (current <= 4) {
    // Near start: 1 2 3 4 5 … last
    for (let i = 1; i <= 5; i++) pages.push(i)
    pages.push("...")
    pages.push(total)
  } else if (current >= total - 3) {
    // Near end: 1 … last-4 last-3 last-2 last-1 last
    pages.push(1)
    pages.push("...")
    for (let i = total - 4; i <= total; i++) pages.push(i)
  } else {
    // Middle: 1 … prev current next … last
    pages.push(1)
    pages.push("...")
    for (let i = current - 1; i <= current + 1; i++) pages.push(i)
    pages.push("...")
    pages.push(total)
  }

  return pages
}

export function TablePagination({
  page,
  totalPages,
  total,
  perPage,
  onPageChange,
  className,
}: TablePaginationProps) {
  const { t } = useTranslation()

  if (totalPages <= 1) return null

  const pages = buildPages(page, totalPages)
  const from = (page - 1) * perPage + 1
  const to = Math.min(page * perPage, total)

  return (
    <div
      className={cn("flex flex-col items-center gap-3 sm:flex-row sm:justify-between", className)}
    >
      {/* Info text */}
      <p className="text-xs text-muted-foreground">
        {t("common:pagination.results_count", { from, to, total })}
      </p>

      {/* Page buttons */}
      <div className="flex items-center gap-1">
        {/* Prev — size-9 = 36px, but with p-0 it's clickable. Add min-h-11 on mobile via Tailwind */}
        <Button
          variant="outline"
          size="icon-sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label={t("common:pagination.prev_page")}
          className="size-9 md:size-7"
        >
          <ChevronLeft className="size-4 md:size-3.5" />
        </Button>

        {/* Mobile: show only current page indicator */}
        <span className="flex sm:hidden items-center justify-center px-3 text-sm font-medium text-muted-foreground">
          {page} / {totalPages}
        </span>

        {/* Desktop: full numbered pages */}
        <div className="hidden sm:flex items-center gap-1">
          {pages.map((p, idx) =>
            p === "..." ? (
              <span
                key={`ellipsis-${idx}`}
                className="flex size-7 items-center justify-center text-xs text-muted-foreground select-none"
              >
                …
              </span>
            ) : (
              <Button
                key={p}
                variant={p === page ? "default" : "outline"}
                size="icon-sm"
                onClick={() => onPageChange(p)}
                aria-label={t("common:pagination.page_n", { page: p })}
                aria-current={p === page ? "page" : undefined}
                className={cn("size-7 text-xs font-medium", p === page && "pointer-events-none")}
              >
                {p}
              </Button>
            ),
          )}
        </div>

        {/* Next */}
        <Button
          variant="outline"
          size="icon-sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label={t("common:pagination.next_page")}
          className="size-9 md:size-7"
        >
          <ChevronRight className="size-4 md:size-3.5" />
        </Button>
      </div>
    </div>
  )
}
