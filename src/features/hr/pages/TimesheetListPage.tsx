import { useCallback, useEffect, useState, useMemo } from "react"
import { toast } from "sonner"
import {
  ClipboardList,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Activity,
} from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { TablePagination } from "@/components/common/TablePagination"
import { FilterPanel, type FilterFieldDef } from "@/components/common/FilterPanel"
import type { DateRangeValue } from "@/components/ui/date-range-picker-presets"
import { useAuthStore } from "@/hooks/useAuthStore"
import { timesheetApi } from "../api/timesheetApi"
import { employeeApi } from "../api/employeeApi"
import { TimesheetTable } from "../components/TimesheetTable"
import { SubmitTimesheetModal } from "../components/SubmitTimesheetModal"
import type { Employee } from "../types/employee"
import type { SubmitTimesheetPayload, Timesheet, TimesheetStatus } from "../types/timesheet"

// ── Stats card ─────────────────────────────────────────────────────────────

function StatsCard({
  label,
  value,
  icon: Icon,
  colorClass,
}: {
  label: string
  value: string | number
  icon: React.ElementType
  colorClass: string
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3">
      <div className={`flex size-9 items-center justify-center rounded-lg ${colorClass}`}>
        <Icon className="size-4" />
      </div>
      <div>
        <p className="text-xl font-semibold leading-none">{value}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
      </div>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────

export function TimesheetListPage() {
  const { t } = useTranslation(["hr", "common"])
  const user = useAuthStore((s) => s.user)
  const isAdmin = user?.roles?.includes("admin") ?? false
  const isManager =
    isAdmin ||
    (user?.roles?.includes("director") ?? false) ||
    (user?.roles?.includes("hr") ?? false)
  const canApprove = isAdmin || user?.permissions?.includes("approve.timesheets") || false

  // ── Data state ──────────────────────────────────────────────────────────
  const [timesheets, setTimesheets] = useState<Timesheet[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  // ── Filter state ────────────────────────────────────────────────────────
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [userFilter, setUserFilter] = useState<string | null>(null)
  const [dateFrom, setDateFrom] = useState<string | null>(null)
  const [dateTo, setDateTo] = useState<string | null>(null)
  const [page, setPage] = useState(1)

  // ── Modal state ─────────────────────────────────────────────────────────
  const [submitOpen, setSubmitOpen] = useState(false)

  // ── Summary counters ─────────────────────────────────────────────────────
  const summary = useMemo(
    () => ({
      pending: timesheets.filter((t) => t.status === "pending").length,
      approved: timesheets.filter((t) => t.status === "approved").length,
      rejected: timesheets.filter((t) => t.status === "rejected").length,
      totalHours:
        Math.round(
          timesheets
            .filter((t) => t.status === "approved" && t.working_hours)
            .reduce((s, t) => s + (t.working_hours ?? 0), 0) * 10,
        ) / 10,
    }),
    [timesheets],
  )

  // ── Fetch employees for manager filter ──────────────────────────────────
  useEffect(() => {
    if (isManager) {
      employeeApi
        .list({ per_page: 100 })
        .then((res) => setEmployees(res.data))
        .catch(console.error)
    }
  }, [isManager])

  // ── Fetch timesheets ─────────────────────────────────────────────────────
  const fetchTimesheets = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await timesheetApi.list({
        user_id: isManager ? (userFilter ? parseInt(userFilter) : null) : (user?.id ?? null),
        status: (statusFilter as TimesheetStatus) || null,
        from_date: dateFrom || null,
        to_date: dateTo || null,
        page,
        per_page: 20,
      })
      setTimesheets(res.data)
      setTotalPages(res.meta.last_page)
      setTotal(res.meta.total)
    } catch {
      toast.error(t("hr:timesheet.fetch_error"))
    } finally {
      setIsLoading(false)
    }
  }, [isManager, userFilter, statusFilter, dateFrom, dateTo, page, user?.id, t])

  useEffect(() => {
    fetchTimesheets()
  }, [fetchTimesheets])

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleSubmit = async (payload: SubmitTimesheetPayload) => {
    try {
      await timesheetApi.submit(payload)
      toast.success(t("hr:timesheet.create_success"))
      setSubmitOpen(false)
      fetchTimesheets()
    } catch (err: any) {
      if (err.response?.status === 409) {
        toast.error(t("hr:timesheet.create_error"))
      } else {
        toast.error(t("common:messages.error"))
      }
      throw err
    }
  }

  const handleApprove = async (ts: Timesheet) => {
    try {
      await timesheetApi.approve(ts.id)
      toast.success(t("common:messages.success"))
      fetchTimesheets()
    } catch {
      toast.error(t("hr:timesheet.approve_error"))
    }
  }

  const handleReject = async (ts: Timesheet) => {
    try {
      await timesheetApi.reject(ts.id)
      toast.success(t("common:messages.success"))
      fetchTimesheets()
    } catch {
      toast.error(t("hr:timesheet.reject_error"))
    }
  }

  const filterFields = useMemo<FilterFieldDef[]>(() => {
    const fields: FilterFieldDef[] = [
      {
        field: "status",
        type: "select",
        label: t("hr:timesheet.filter_status"),
        placeholder: t("hr:timesheet.filter_status_all"),
        value: statusFilter || "",
        options: [
          { label: t("hr:timesheet.status.pending"), value: "pending" },
          { label: t("hr:timesheet.status.approved"), value: "approved" },
          { label: t("hr:timesheet.status.rejected"), value: "rejected" },
        ],
      },
    ]

    if (isManager) {
      fields.push({
        field: "user_id",
        type: "select",
        label: "Nhân viên",
        placeholder: "Tất cả nhân viên",
        value: userFilter || "",
        options: employees.map((e) => ({
          label: `${e.full_name} (${e.user_code})`,
          value: e.id.toString(),
        })),
      })
    }

    fields.push({
      field: "date_range",
      type: "daterange",
      label: t("hr:timesheet.filter_date_range"),
      placeholder: t("hr:timesheet.filter_date_range_placeholder"),
      value: { from: dateFrom, to: dateTo } as DateRangeValue,
    })

    return fields
  }, [statusFilter, userFilter, dateFrom, dateTo, employees, isManager, t])

  const handleApplyFilters = (values: Record<string, unknown>) => {
    setStatusFilter((values.status as string | null) ?? null)
    setUserFilter((values.user_id as string | null) ?? null)
    const range = values.date_range as DateRangeValue
    setDateFrom(range?.from ?? null)
    setDateTo(range?.to ?? null)
    setPage(1)
  }

  const handleResetFilters = () => {
    setStatusFilter(null)
    setUserFilter(null)
    setDateFrom(null)
    setDateTo(null)
    setPage(1)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ClipboardList className="size-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">{t("hr:timesheet.title")}</h1>
            <p className="text-sm text-muted-foreground">
              {isLoading ? t("common:table.loading") : total}
              {isManager
                ? ` — ${t("hr:timesheet.mode_manager")}`
                : ` — ${t("hr:timesheet.mode_my")}`}
            </p>
          </div>
        </div>

        <div className="flex gap-2 self-start sm:self-auto">
          <Button
            id="btn-refresh-timesheets"
            variant="outline"
            size="sm"
            onClick={fetchTimesheets}
            disabled={isLoading}
            className="gap-1.5"
          >
            <RefreshCw className={`size-3.5 ${isLoading ? "animate-spin" : ""}`} />
            {t("common:actions.refresh")}
          </Button>
          <Button
            id="btn-submit-timesheet"
            size="sm"
            onClick={() => setSubmitOpen(true)}
            className="gap-2"
          >
            <Plus className="size-4" />
            {t("hr:timesheet.create")}
          </Button>
        </div>
      </div>

      {/* ── Stats row ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatsCard
          label={t("hr:timesheet.status.pending")}
          value={summary.pending}
          icon={Clock}
          colorClass="bg-warning/10 text-warning"
        />
        <StatsCard
          label={t("hr:timesheet.status.approved")}
          value={summary.approved}
          icon={CheckCircle2}
          colorClass="bg-success/10 text-success"
        />
        <StatsCard
          label={t("hr:timesheet.status.rejected")}
          value={summary.rejected}
          icon={XCircle}
          colorClass="bg-destructive/10 text-destructive"
        />
        <StatsCard
          label={t("hr:timesheet.summary_hours")}
          value={`${summary.totalHours}h`}
          icon={Activity}
          colorClass="bg-primary/10 text-primary"
        />
      </div>

      {/* ── Filters ─────────────────────────────────────────────────────── */}
      <FilterPanel
        applyMode
        fields={filterFields}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
        title={t("hr:timesheet.filter_title")}
      />

      {/* ── Table ───────────────────────────────────────────────────────── */}
      <TimesheetTable
        timesheets={timesheets}
        isLoading={isLoading}
        canApprove={canApprove}
        showEmployee={isManager && !userFilter}
        onApprove={handleApprove}
        onReject={handleReject}
      />

      {/* ── Pagination ────────────────────────────────────────────────────── */}
      <TablePagination
        page={page}
        totalPages={totalPages}
        total={total}
        perPage={20}
        onPageChange={setPage}
      />

      {/* ── Submit Modal ────────────────────────────────────────────────── */}
      <SubmitTimesheetModal
        open={submitOpen}
        onClose={() => setSubmitOpen(false)}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
