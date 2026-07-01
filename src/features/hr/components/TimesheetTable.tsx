import { useState, useMemo, useCallback } from "react"
import { CheckCircle2, XCircle, CalendarDays, Clock3, Timer, ClipboardList } from "lucide-react"
import { MantineReactTable, useMantineReactTable, type MRT_ColumnDef } from "mantine-react-table"

import { MobileCardList } from "@/components/common/MobileCardList"
import { MobileRowActions, type RowAction } from "@/components/common/MobileRowActions"
import { StatusBadge } from "@/components/common/StatusBadge"
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
import type { Timesheet } from "../types/timesheet"
import { useTranslation } from "react-i18next"

// ── Helpers ────────────────────────────────────────────────────────────────

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
  const { t } = useTranslation(["hr", "common"])
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

  const buildActions = useCallback(
    (ts: Timesheet): RowAction[] => {
      if (ts.status !== "pending" || !canApprove) return []

      return [
        {
          label: t("hr:timesheet.actions.approve", { defaultValue: "Duyệt" }),
          icon: <CheckCircle2 className="size-4" />,
          onClick: () => setConfirmTarget({ timesheet: ts, action: "approve" }),
        },
        {
          label: t("hr:timesheet.actions.reject", { defaultValue: "Từ chối" }),
          icon: <XCircle className="size-4" />,
          onClick: () => setConfirmTarget({ timesheet: ts, action: "reject" }),
          variant: "destructive",
        },
      ]
    },
    [canApprove, t],
  )

  const columns = useMemo<MRT_ColumnDef<Timesheet>[]>(
    () => [
      {
        accessorKey: "user.full_name",
        header: t("hr:timesheet.columns.employee"),
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
        header: t("hr:timesheet.columns.date"),
        size: 110,
        Cell: ({ cell }) => (
          <span className="text-sm font-medium">{formatDate(cell.getValue<string>())}</span>
        ),
      },
      {
        accessorKey: "check_in_time",
        header: t("hr:timesheet.columns.check_in"),
        size: 100,
        Cell: ({ cell }) => (
          <span className="text-sm font-mono text-muted-foreground">
            {formatTime(cell.getValue<string>())}
          </span>
        ),
      },
      {
        accessorKey: "check_out_time",
        header: t("hr:timesheet.columns.check_out"),
        size: 100,
        Cell: ({ cell }) => (
          <span className="text-sm font-mono text-muted-foreground">
            {formatTime(cell.getValue<string>())}
          </span>
        ),
      },
      {
        accessorKey: "working_hours",
        header: t("hr:timesheet.columns.hours"),
        size: 100,
        Cell: ({ cell }) => (
          <span className="text-sm font-medium">
            {cell.getValue<number>() != null ? `${cell.getValue<number>()}h` : "—"}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: t("hr:timesheet.columns.status"),
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
        header: t("hr:timesheet.columns.notes"),
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
            <div onClick={(e) => e.stopPropagation()}>
              <MobileRowActions actions={buildActions(ts)} />
            </div>
          )
        },
      },
    ],
    [buildActions, t],
  )

  const table = useMantineReactTable({
    renderEmptyRowsFallback: () => (
      <div className="p-8 text-center text-muted-foreground">
        {t("common:table.noData", { defaultValue: "Không có dữ liệu" })}
      </div>
    ),
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
      <MobileCardList
        data={timesheets}
        isLoading={isLoading}
        keyExtractor={(timesheet) => timesheet.id}
        emptyIcon={ClipboardList}
        emptyTitle={t("common:table.noData", { defaultValue: "Không có dữ liệu" })}
        renderCard={(timesheet) => {
          const actions = buildActions(timesheet)

          return (
            <div className="relative rounded-xl border bg-card p-4 shadow-sm">
              <div className="absolute bottom-0 left-[1.4rem] top-0 w-px bg-border/70" />

              <div className="relative flex items-start gap-3">
                <div className="relative z-10 mt-1 flex size-6 shrink-0 items-center justify-center rounded-full border bg-background">
                  <div
                    className={`size-2.5 rounded-full ${
                      timesheet.status === "approved"
                        ? "bg-success"
                        : timesheet.status === "rejected"
                          ? "bg-destructive"
                          : "bg-warning"
                    }`}
                  />
                </div>

                <div className="min-w-0 flex-1 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      {showEmployee && (
                        <p className="truncate text-sm font-semibold">
                          {timesheet.user?.full_name ?? "—"}
                        </p>
                      )}
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1 text-sm font-medium">
                          <CalendarDays className="size-4 text-muted-foreground" />
                          {formatDate(timesheet.timesheet_date)}
                        </span>
                        <StatusBadge status={timesheet.status} />
                      </div>
                    </div>

                    {actions.length > 0 && (
                      <div className="-mr-2 -mt-1">
                        <MobileRowActions actions={actions} />
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm text-muted-foreground">
                    <div className="rounded-lg bg-muted/40 p-3">
                      <div className="flex items-center gap-1 text-xs">
                        <Clock3 className="size-3.5" />
                        {t("hr:timesheet.columns.check_in")}
                      </div>
                      <p className="mt-1 font-medium text-foreground">
                        {formatTime(timesheet.check_in_time)}
                      </p>
                    </div>
                    <div className="rounded-lg bg-muted/40 p-3">
                      <div className="flex items-center gap-1 text-xs">
                        <Clock3 className="size-3.5" />
                        {t("hr:timesheet.columns.check_out")}
                      </div>
                      <p className="mt-1 font-medium text-foreground">
                        {formatTime(timesheet.check_out_time)}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Timer className="size-4" />
                      {timesheet.working_hours != null ? `${timesheet.working_hours}h` : "—"}
                    </span>
                    {timesheet.approver && (
                      <span className="text-xs">bởi {timesheet.approver.full_name}</span>
                    )}
                  </div>

                  {timesheet.notes && (
                    <p className="text-sm text-muted-foreground">{timesheet.notes}</p>
                  )}
                </div>
              </div>
            </div>
          )
        }}
        desktopTable={
          <div className="rounded-xl border bg-card overflow-hidden">
            <MantineReactTable table={table} />
          </div>
        }
      />

      {/* Confirm Dialog */}
      <AlertDialog open={!!confirmTarget} onOpenChange={(open) => !open && setConfirmTarget(null)}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmTarget?.action === "approve"
                ? t("hr:timesheet.actions.approve_confirm_title")
                : t("hr:timesheet.actions.reject_confirm_title")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmTarget?.action === "approve"
                ? t("hr:timesheet.actions.approve_confirm_desc", {
                    date: formatDate(confirmTarget.timesheet.timesheet_date),
                    name: confirmTarget.timesheet.user?.full_name,
                    defaultValue: `Duyệt chấm công ngày ${formatDate(confirmTarget.timesheet.timesheet_date)} của ${confirmTarget.timesheet.user?.full_name}?`,
                  })
                : t("hr:timesheet.actions.reject_confirm_desc", {
                    date: formatDate(confirmTarget?.timesheet.timesheet_date ?? null),
                    name: confirmTarget?.timesheet.user?.full_name,
                    defaultValue: `Từ chối chấm công ngày ${formatDate(confirmTarget?.timesheet.timesheet_date ?? null)} của ${confirmTarget?.timesheet.user?.full_name}?`,
                  })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common:actions.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              variant={confirmTarget?.action === "approve" ? "default" : "destructive"}
              onClick={handleConfirm}
            >
              {confirmTarget?.action === "approve"
                ? t("hr:timesheet.actions.approve")
                : t("hr:timesheet.actions.reject")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
