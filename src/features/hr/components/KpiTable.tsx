import { useMemo } from "react"
import { MantineReactTable, useMantineReactTable, type MRT_ColumnDef } from "mantine-react-table"
import { Edit } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { EmployeeKpi } from "../types/kpi"

// ── Helpers ────────────────────────────────────────────────────────────────

function formatCurrency(val: number | string | null): string {
  if (val == null) return "—"
  const n = typeof val === "string" ? parseFloat(val) : val
  if (isNaN(n)) return "—"
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)} tỷ`
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} triệu`
  return n.toLocaleString("vi-VN") + " đ"
}

function toNum(val: number | string | null | undefined): number | null {
  if (val == null) return null
  const n = typeof val === "string" ? parseFloat(val) : val
  return isNaN(n) ? null : n
}

function getKpiColor(pct: number | null): string {
  if (pct == null) return "bg-muted/50"
  if (pct >= 100) return "bg-success"
  if (pct >= 70) return "bg-warning"
  return "bg-destructive"
}

function getKpiBadgeVariant(pct: number | null): "success" | "warning" | "destructive" | "outline" {
  if (pct == null) return "outline"
  if (pct >= 100) return "success"
  if (pct >= 70) return "warning"
  return "destructive"
}

interface KpiTableProps {
  kpis: EmployeeKpi[]
  isLoading?: boolean
  onEdit?: (kpi: EmployeeKpi) => void
  isAdmin?: boolean
}

export function KpiTable({ kpis, isLoading = false, onEdit, isAdmin = false }: KpiTableProps) {
  const columns = useMemo<MRT_ColumnDef<EmployeeKpi>[]>(
    () => [
      {
        accessorKey: "user.full_name",
        header: "Nhân viên",
        size: 180,
        Cell: ({ row }) => (
          <div className="flex flex-col gap-0.5">
            <span className="font-semibold text-sm">
              {row.original.user?.full_name ?? `NV #${row.original.user_id}`}
            </span>
            <span className="font-mono text-xs text-muted-foreground">
              {row.original.user?.user_code}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "target_revenue",
        header: "Mục tiêu (Target)",
        size: 140,
        Cell: ({ cell }) => (
          <span className="text-sm font-medium">{formatCurrency(cell.getValue<string>())}</span>
        ),
      },
      {
        accessorKey: "actual_revenue",
        header: "Thực tế đạt",
        size: 140,
        Cell: ({ cell }) => (
          <span className="text-sm font-medium text-primary">
            {formatCurrency(cell.getValue<string>())}
          </span>
        ),
      },
      {
        accessorKey: "kpi_percent",
        header: "Tiến độ KPI",
        size: 220,
        Cell: ({ row }) => {
          const pct = toNum(row.original.kpi_percent)
          const barWidth = pct != null ? Math.min(pct, 100) : 0
          return (
            <div className="flex flex-col gap-1.5 w-full min-w-32 py-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-muted-foreground">
                  {pct != null ? `${pct.toFixed(1)}%` : "—"}
                </span>
                <Badge
                  variant={getKpiBadgeVariant(pct)}
                  className="text-[10px] py-0 font-bold shrink-0"
                >
                  {pct != null && pct >= 100
                    ? "Đạt"
                    : pct != null && pct >= 70
                      ? "Khá"
                      : "Chưa đạt"}
                </Badge>
              </div>
              <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ease-out ${getKpiColor(pct)}`}
                  style={{ width: `${barWidth}%` }}
                />
              </div>
            </div>
          )
        },
      },
      {
        accessorKey: "quote_count",
        header: "Báo giá",
        size: 90,
        Cell: ({ cell }) => (
          <span className="text-sm font-mono text-center block w-full">
            {cell.getValue<number>() ?? 0}
          </span>
        ),
      },
      {
        accessorKey: "contract_count",
        header: "Hợp đồng",
        size: 90,
        Cell: ({ cell }) => (
          <span className="text-sm font-mono text-center block w-full font-semibold">
            {cell.getValue<number>() ?? 0}
          </span>
        ),
      },
      {
        accessorKey: "notes",
        header: "Ghi chú",
        size: 180,
        Cell: ({ cell }) => (
          <span className="text-xs text-muted-foreground line-clamp-1">
            {cell.getValue<string>() || "—"}
          </span>
        ),
      },
      ...(isAdmin && onEdit
        ? [
            {
              id: "actions",
              header: "",
              size: 80,
              Cell: ({ row }: { row: { original: EmployeeKpi } }) => (
                <div className="flex items-center justify-end" onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-muted-foreground hover:text-foreground"
                    onClick={() => onEdit(row.original)}
                  >
                    <Edit className="size-4" />
                  </Button>
                </div>
              ),
            },
          ]
        : []),
    ],
    [isAdmin, onEdit],
  )

  const table = useMantineReactTable({
    columns,
    data: kpis,
    enableColumnActions: false,
    enableColumnFilters: false,
    enablePagination: false,
    enableSorting: true,
    enableBottomToolbar: false,
    enableTopToolbar: false,
    enableFullScreenToggle: false,
    state: {
      isLoading,
    },
    mantineTableProps: {
      striped: true,
      highlightOnHover: true,
      withBorder: false,
      withColumnBorders: false,
    },
    mantineTableContainerProps: {
      onScroll: (e: React.UIEvent<HTMLDivElement>) => {
        e.currentTarget.style.setProperty("--mrt-scroll-left", `${e.currentTarget.scrollLeft}px`)
      },
      sx: { overflowX: "auto", WebkitOverflowScrolling: "touch" },
    },
  })

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <MantineReactTable table={table} />
    </div>
  )
}
