import { useState, useMemo } from "react"
import { CheckCircle2, XCircle, Clock } from "lucide-react"
import { MantineReactTable, useMantineReactTable, type MRT_ColumnDef } from "mantine-react-table"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import type { Timesheet, TimesheetStatus } from "../types/timesheet"

// ── Helpers ────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  TimesheetStatus,
  { label: string; variant: "warning" | "success" | "destructive"; icon: React.ElementType }
> = {
  pending: { label: "Chờ duyệt", variant: "warning", icon: Clock },
  approved: { label: "Đã duyệt", variant: "success", icon: CheckCircle2 },
  rejected: { label: "Từ chối", variant: "destructive", icon: XCircle },
}

function StatusBadge({ status }: { status: TimesheetStatus }) {
  const cfg = STATUS_CONFIG[status]
  const Icon = cfg.icon
  return (
    <Badge variant={cfg.variant} className="gap-1 text-[11px] py-0.5">
      <Icon className="size-3" />
      {cfg.label}
    </Badge>
  )
}

function formatTime(dt: string | null): string {
  if (!dt) return "—"
  const time = dt.split(" ")[1] ?? dt
  return time.substring(0, 5)
}

function formatDate(d: string | null): string {
  if (!d) return "—"
  const [year, month, day] = d.split("-")
  return `${day}/${month}/${year}`
}

// ── Component ──────────────────────────────────────────────────────────────

interface TimesheetTableProps {
  timesheets: Timesheet[]
  isLoading?: boolean
  canApprove?: boolean
  showEmployee?: boolean // show user column for manager view
  onApprove: (timesheet: Timesheet) => void
  onReject: (timesheet: Timesheet) => void
}

export function TimesheetTable({
  timesheets,
  isLoading = false,
  canApprove = false,
  showEmployee = false,
  onApprove,
  onReject,
}: TimesheetTableProps) {
  const [confirmTarget, setConfirmTarget] = useState<{
    timesheet: Timesheet
    action: "approve" | "reject"
  } | null>(null)

  const handleConfirm = () => {
    if (!confirmTarget) return
    if (confirmTarget.action === "approve") {
      onApprove(confirmTarget.timesheet)
    } else {
      onReject(confirmTarget.timesheet)
    }
    setConfirmTarget(null)
  }

  const columns = useMemo<MRT_ColumnDef<Timesheet>[]>(
    () => [
      {
        accessorKey: "user.full_name",
        header: "Nhân viên",
        size: 180,
        Cell: ({ row }) => (
          <div className="flex flex-col gap-0.5">
            <span className="font-medium text-sm">{row.original.user?.full_name ?? "—"}</span>
            <span className="font-mono text-xs text-muted-foreground">
              {row.original.user?.user_code}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "timesheet_date",
        header: "Ngày",
        size: 110,
        Cell: ({ cell }) => (
          <span className="text-sm font-medium">{formatDate(cell.getValue<string>())}</span>
        ),
      },
      {
        accessorKey: "check_in_time",
        header: "Giờ vào",
        size: 100,
        Cell: ({ cell }) => (
          <span className="text-sm font-mono text-muted-foreground">
            {formatTime(cell.getValue<string>())}
          </span>
        ),
      },
      {
        accessorKey: "check_out_time",
        header: "Giờ ra",
        size: 100,
        Cell: ({ cell }) => (
          <span className="text-sm font-mono text-muted-foreground">
            {formatTime(cell.getValue<string>())}
          </span>
        ),
      },
      {
        accessorKey: "working_hours",
        header: "Số giờ",
        size: 100,
        Cell: ({ cell }) => (
          <span className="text-sm font-medium">
            {cell.getValue<number>() != null ? `${cell.getValue<number>()}h` : "—"}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Trạng thái",
        size: 150,
        Cell: ({ row }) => (
          <div className="flex flex-col gap-1 align-baseline items-start">
            <StatusBadge status={row.original.status} />
            {row.original.approver && (
              <span className="text-[10px] text-muted-foreground">
                bởi {row.original.approver.full_name}
              </span>
            )}
          </div>
        ),
      },
      {
        accessorKey: "notes",
        header: "Ghi chú",
        size: 200,
        Cell: ({ cell }) => (
          <span className="text-xs text-muted-foreground line-clamp-2">
            {cell.getValue<string>() || "—"}
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
        size: 160,
        Cell: ({ row }) => {
          const ts = row.original
          if (ts.status !== "pending") {
            return <span className="text-xs text-muted-foreground">—</span>
          }
          return (
            <div
              className="flex items-center justify-end gap-1.5"
              onClick={(e) => e.stopPropagation()}
            >
              <Button
                variant="ghost"
                size="xs"
                className="gap-1 text-success hover:text-success hover:bg-success/10"
                onClick={() => setConfirmTarget({ timesheet: ts, action: "approve" })}
              >
                <CheckCircle2 className="size-3.5" />
                Duyệt
              </Button>
              <Button
                variant="ghost"
                size="xs"
                className="gap-1 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => setConfirmTarget({ timesheet: ts, action: "reject" })}
              >
                <XCircle className="size-3.5" />
                Từ chối
              </Button>
            </div>
          )
        },
      },
    ],
    [onApprove, onReject],
  )

  const table = useMantineReactTable({
    columns,
    data: timesheets,
    enableColumnActions: false,
    enableColumnFilters: false,
    enablePagination: false,
    enableSorting: true,
    enableBottomToolbar: false,
    enableTopToolbar: false,
    enableFullScreenToggle: false,
    state: {
      isLoading,
      columnVisibility: {
        "user.full_name": showEmployee,
        actions: canApprove,
      },
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
    <>
      <div className="rounded-xl border bg-card overflow-hidden">
        <MantineReactTable table={table} />
      </div>

      {/* Confirm Dialog */}
      <AlertDialog open={!!confirmTarget} onOpenChange={(open) => !open && setConfirmTarget(null)}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmTarget?.action === "approve" ? "Xác nhận duyệt?" : "Xác nhận từ chối?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmTarget?.action === "approve"
                ? `Duyệt chấm công ngày ${formatDate(confirmTarget.timesheet.timesheet_date)} của ${confirmTarget.timesheet.user?.full_name}?`
                : `Từ chối chấm công ngày ${formatDate(confirmTarget?.timesheet.timesheet_date ?? null)} của ${confirmTarget?.timesheet.user?.full_name}?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              variant={confirmTarget?.action === "approve" ? "default" : "destructive"}
              onClick={handleConfirm}
            >
              {confirmTarget?.action === "approve" ? "Duyệt" : "Từ chối"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
