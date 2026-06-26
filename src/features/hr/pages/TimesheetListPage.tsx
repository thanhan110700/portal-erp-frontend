import { useCallback, useEffect, useState, useMemo } from "react"
import { toast } from "sonner"
import { ClipboardList, Plus, Clock, CheckCircle2, XCircle, RefreshCw } from "lucide-react"

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
  value: number
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
  const [dateRange, setDateRange] = useState<DateRangeValue>({ from: null, to: null })
  const [page, setPage] = useState(1)

  // ── Modal state ─────────────────────────────────────────────────────────
  const [submitOpen, setSubmitOpen] = useState(false)

  // ── Summary counters ─────────────────────────────────────────────────────
  const pending = timesheets.filter((t) => t.status === "pending").length
  const approved = timesheets.filter((t) => t.status === "approved").length
  const rejected = timesheets.filter((t) => t.status === "rejected").length
  const totalHours = timesheets
    .filter((t) => t.status === "approved" && t.working_hours)
    .reduce((s, t) => s + (t.working_hours ?? 0), 0)

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
        from_date: dateRange.from || null,
        to_date: dateRange.to || null,
        page,
        per_page: 20,
      })
      setTimesheets(res.data)
      setTotalPages(res.meta.last_page)
      setTotal(res.meta.total)
    } catch {
      toast.error("Không thể tải dữ liệu chấm công")
    } finally {
      setIsLoading(false)
    }
  }, [isManager, userFilter, statusFilter, dateRange, page, user?.id])

  useEffect(() => {
    fetchTimesheets()
  }, [fetchTimesheets])

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleSubmit = async (payload: SubmitTimesheetPayload) => {
    try {
      await timesheetApi.submit(payload)
      toast.success("Đã khai báo chấm công — đang chờ quản lý duyệt")
      setSubmitOpen(false)
      fetchTimesheets()
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Ngày này đã có chấm công hoặc đã có lỗi xảy ra"
      toast.error(msg)
      throw err
    }
  }

  const handleApprove = async (ts: Timesheet) => {
    try {
      await timesheetApi.approve(ts.id)
      toast.success(`Đã duyệt chấm công của ${ts.user?.full_name}`)
      fetchTimesheets()
    } catch {
      toast.error("Không thể duyệt chấm công này")
    }
  }

  const handleReject = async (ts: Timesheet) => {
    try {
      await timesheetApi.reject(ts.id)
      toast.success(`Đã từ chối chấm công của ${ts.user?.full_name}`)
      fetchTimesheets()
    } catch {
      toast.error("Không thể từ chối chấm công này")
    }
  }

  const handleResetFilters = () => {
    setStatusFilter(null)
    setUserFilter(null)
    setDateRange({ from: null, to: null })
    setPage(1)
  }

  const handleApplyFilters = (values: Record<string, unknown>) => {
    setStatusFilter((values.status as string | null) ?? null)
    setUserFilter((values.user_id as string | null) ?? null)
    setDateRange((values.dateRange as DateRangeValue) ?? { from: null, to: null })
    setPage(1)
  }

  const filterFields = useMemo<FilterFieldDef[]>(() => {
    const fields: FilterFieldDef[] = [
      {
        field: "status",
        type: "select",
        label: "Trạng thái",
        placeholder: "Tất cả trạng thái",
        value: statusFilter || null,
        options: [
          { label: "Chờ duyệt", value: "pending" },
          { label: "Đã duyệt", value: "approved" },
          { label: "Từ chối", value: "rejected" },
        ],
      },
    ]

    if (isManager) {
      fields.push({
        field: "user_id",
        type: "select",
        label: "Nhân viên",
        placeholder: "Tất cả nhân viên",
        value: userFilter || null,
        options: employees.map((e) => ({
          label: `${e.full_name} (${e.user_code})`,
          value: e.id.toString(),
        })),
      })
    }

    fields.push({
      field: "dateRange",
      type: "daterange",
      label: "Thời gian",
      placeholder: "Chọn khoảng ngày",
      value: dateRange,
    })

    return fields
  }, [statusFilter, userFilter, dateRange, employees, isManager])

  return (
    <div className="flex flex-col gap-6">
      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ClipboardList className="size-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Chấm công</h1>
            <p className="text-sm text-muted-foreground">
              {isLoading ? "Đang tải..." : `${total} bản ghi`}
              {isManager ? " — Chế độ quản lý" : " — Của tôi"}
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
            Làm mới
          </Button>
          <Button
            id="btn-submit-timesheet"
            size="sm"
            onClick={() => setSubmitOpen(true)}
            className="gap-2"
          >
            <Plus className="size-4" />
            Khai báo
          </Button>
        </div>
      </div>

      {/* ── Stats row ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatsCard
          label="Chờ duyệt"
          value={pending}
          icon={Clock}
          colorClass="bg-warning/10 text-warning"
        />
        <StatsCard
          label="Đã duyệt"
          value={approved}
          icon={CheckCircle2}
          colorClass="bg-success/10 text-success"
        />
        <StatsCard
          label="Từ chối"
          value={rejected}
          icon={XCircle}
          colorClass="bg-destructive/10 text-destructive"
        />
        <StatsCard
          label="Tổng giờ"
          value={Math.round(totalHours * 10) / 10}
          icon={ClipboardList}
          colorClass="bg-primary/10 text-primary"
        />
      </div>

      {/* ── Filters ─────────────────────────────────────────────────────── */}
      <FilterPanel
        applyMode
        fields={filterFields}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
        title="Lọc chấm công"
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
