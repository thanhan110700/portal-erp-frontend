import { useCallback, useEffect, useState, useMemo } from "react"
import { toast } from "sonner"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { TrendingUp, Trophy, RefreshCw, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { FilterPanel, type FilterFieldDef } from "@/components/common/FilterPanel"
import { CommonDialog } from "@/components/common/CommonDialog"
import { SearchableSelect } from "@/components/common/SearchableSelect"
import { useAuthStore } from "@/hooks/useAuthStore"
import { kpiApi } from "../api/kpiApi"
import { employeeApi } from "../api/employeeApi"
import { KpiTable } from "../components/KpiTable"
import type { Employee } from "../types/employee"
import type { EmployeeKpi, UpsertKpiPayload } from "../types/kpi"

// ── Helpers ────────────────────────────────────────────────────────────────

function formatCurrency(val: number | string | null): string {
  if (val == null) return "—"
  const n = typeof val === "string" ? parseFloat(val) : val
  if (isNaN(n)) return "—"
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  return n.toLocaleString("vi-VN")
}

function toNum(val: number | string | null | undefined): number | null {
  if (val == null) return null
  const n = typeof val === "string" ? parseFloat(val) : val
  return isNaN(n) ? null : n
}

function getKpiBadgeVariant(pct: number | null): "success" | "warning" | "destructive" | "outline" {
  if (pct == null) return "outline"
  if (pct >= 100) return "success"
  if (pct >= 70) return "warning"
  return "destructive"
}

// ── Top Performers Card ────────────────────────────────────────────────────

function TopPerformersCard({
  performers,
  isLoading,
}: {
  performers: EmployeeKpi[]
  isLoading: boolean
}) {
  const medals = ["🥇", "🥈", "🥉"]

  return (
    <div className="rounded-xl border bg-card p-4 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Trophy className="size-4 text-warning" />
        <h3 className="font-semibold text-sm">Top Performers</h3>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 rounded-lg" />
          ))}
        </div>
      ) : performers.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">Chưa có dữ liệu</p>
      ) : (
        <div className="flex flex-col gap-2">
          {performers.slice(0, 5).map((kpi, idx) => (
            <div key={kpi.id} className="flex items-center gap-3 rounded-lg bg-muted/30 px-3 py-2">
              <span className="text-lg w-6 text-center">{medals[idx] ?? `#${idx + 1}`}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {kpi.user?.full_name ?? `User #${kpi.user_id}`}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(kpi.actual_revenue)}
                </p>
              </div>
              <Badge
                variant={getKpiBadgeVariant(toNum(kpi.kpi_percent))}
                className="text-xs shrink-0"
              >
                {toNum(kpi.kpi_percent) != null ? `${toNum(kpi.kpi_percent)!.toFixed(0)}%` : "—"}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Upsert KPI Modal (Admin only) ──────────────────────────────────────────

const upsertKpiSchema = z.object({
  user_id: z.string().min(1, "Vui lòng chọn nhân viên"),
  month: z
    .string()
    .min(1, "Vui lòng nhập tháng")
    .refine((val) => {
      const n = Number(val)
      return !isNaN(n) && Number.isInteger(n) && n >= 1 && n <= 12
    }, "Tháng phải từ 1 đến 12"),
  year: z
    .string()
    .min(1, "Vui lòng nhập năm")
    .refine((val) => {
      const n = Number(val)
      return !isNaN(n) && Number.isInteger(n) && n >= 2020 && n <= 2100
    }, "Năm phải từ 2020 đến 2100"),
  target_revenue: z
    .string()
    .min(1, "Vui lòng nhập doanh thu mục tiêu")
    .refine((val) => {
      const n = Number(val)
      return !isNaN(n) && n >= 0
    }, "Doanh thu mục tiêu phải lớn hơn hoặc bằng 0"),
  actual_revenue: z
    .string()
    .optional()
    .nullable()
    .refine((val) => {
      if (!val) return true
      const n = Number(val)
      return !isNaN(n) && n >= 0
    }, "Doanh thu thực tế phải lớn hơn hoặc bằng 0"),
  notes: z.string().max(1000, "Ghi chú không được vượt quá 1000 ký tự").optional().nullable(),
})

type UpsertKpiFormData = z.infer<typeof upsertKpiSchema>

function UpsertKpiModal({
  open,
  onClose,
  onSubmit,
  employees,
  defaultMonth,
  defaultYear,
  editData,
}: {
  open: boolean
  onClose: () => void
  onSubmit: (payload: UpsertKpiPayload) => Promise<void>
  employees: Employee[]
  defaultMonth: number
  defaultYear: number
  editData?: EmployeeKpi | null
}) {
  const isEditing = !!editData
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<UpsertKpiFormData>({
    resolver: zodResolver(upsertKpiSchema),
    defaultValues: {
      user_id: "",
      month: defaultMonth.toString(),
      year: defaultYear.toString(),
      target_revenue: "",
      actual_revenue: "",
      notes: "",
    },
  })

  const employeeValue = watch("user_id")

  useEffect(() => {
    if (open) {
      if (editData) {
        reset({
          user_id: editData.user_id.toString(),
          month: editData.month.toString(),
          year: editData.year.toString(),
          target_revenue: editData.target_revenue?.toString() ?? "",
          actual_revenue: editData.actual_revenue?.toString() ?? "",
          notes: editData.notes ?? "",
        })
      } else {
        reset({
          user_id: "",
          month: defaultMonth.toString(),
          year: defaultYear.toString(),
          target_revenue: "",
          actual_revenue: "",
          notes: "",
        })
      }
    }
  }, [open, editData, defaultMonth, defaultYear, reset])

  const onFormSubmit = async (data: UpsertKpiFormData) => {
    const payload: UpsertKpiPayload = {
      user_id: parseInt(data.user_id),
      month: parseInt(data.month),
      year: parseInt(data.year),
      target_revenue: parseFloat(data.target_revenue),
      actual_revenue: data.actual_revenue ? parseFloat(data.actual_revenue) : null,
      notes: data.notes || null,
    }
    await onSubmit(payload)
  }

  return (
    <CommonDialog
      open={open}
      onClose={onClose}
      title={isEditing ? "Cập nhật mục tiêu KPI" : "Đặt mục tiêu KPI"}
      size="md"
      primaryAction={{
        label: isSubmitting ? "Đang lưu..." : "Lưu KPI",
        type: "submit",
        form: "kpi-form",
        disabled: isSubmitting,
      }}
      cancelAction={{
        label: "Hủy",
        disabled: isSubmitting,
        onClick: onClose,
      }}
    >
      <form
        id="kpi-form"
        onSubmit={handleSubmit(onFormSubmit)}
        className="flex flex-col gap-4 py-2"
      >
        {/* Employee select */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="kpi-emp" className="text-sm font-medium">
            Nhân viên *
          </Label>
          <input type="hidden" {...register("user_id")} />
          <SearchableSelect
            value={employeeValue}
            onValueChange={(v) => {
              setValue("user_id", v)
            }}
            options={employees.map((e) => ({
              label: `${e.full_name} (${e.user_code})`,
              value: e.id.toString(),
            }))}
            placeholder="Chọn nhân viên kinh doanh..."
            className={errors.user_id ? "border-destructive h-9" : "h-9"}
            disabled={isEditing}
          />
          {errors.user_id && <p className="text-xs text-destructive">{errors.user_id.message}</p>}
        </div>

        {/* Month + Year */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="kpi-month" className="text-sm font-medium">
              Tháng *
            </Label>
            <Input
              id="kpi-month"
              type="number"
              min={1}
              max={12}
              {...register("month")}
              className="h-9"
              disabled={isEditing}
            />
            {errors.month && <p className="text-xs text-destructive">{errors.month.message}</p>}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="kpi-year" className="text-sm font-medium">
              Năm *
            </Label>
            <Input
              id="kpi-year"
              type="number"
              min={2020}
              max={2100}
              {...register("year")}
              className="h-9"
              disabled={isEditing}
            />
            {errors.year && <p className="text-xs text-destructive">{errors.year.message}</p>}
          </div>
        </div>

        {/* Target */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="kpi-target" className="text-sm font-medium">
            Doanh thu mục tiêu (VND) *
          </Label>
          <Input
            id="kpi-target"
            type="number"
            min={0}
            placeholder="50000000"
            {...register("target_revenue")}
            aria-invalid={!!errors.target_revenue}
            className="h-9"
          />
          {errors.target_revenue && (
            <p className="text-xs text-destructive">{errors.target_revenue.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="kpi-actual" className="text-sm font-medium">
            Doanh thu thực tế (VND)
          </Label>
          <Input
            id="kpi-actual"
            type="number"
            min={0}
            placeholder="Tự động tính từ hợp đồng"
            {...register("actual_revenue")}
            className="h-9"
            aria-invalid={!!errors.actual_revenue}
          />
          {errors.actual_revenue && (
            <p className="text-xs text-destructive">{errors.actual_revenue.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="kpi-notes" className="text-sm font-medium">
            Ghi chú
          </Label>
          <Textarea
            id="kpi-notes"
            rows={2}
            {...register("notes")}
            className="resize-none text-sm"
          />
          {errors.notes && <p className="text-xs text-destructive">{errors.notes.message}</p>}
        </div>
      </form>
    </CommonDialog>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────

export function KpiDashboardPage() {
  const user = useAuthStore((s) => s.user)
  const isAdmin = user?.roles?.includes("admin") ?? false

  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())

  const [kpis, setKpis] = useState<EmployeeKpi[]>([])
  const [topPerformers, setTopPerformers] = useState<EmployeeKpi[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isTopLoading, setIsTopLoading] = useState(true)
  const [upsertOpen, setUpsertOpen] = useState(false)
  const [editKpi, setEditKpi] = useState<EmployeeKpi | null>(null)

  // Fetch KPI list
  const fetchKpis = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await kpiApi.list({ month, year, per_page: 50 })
      setKpis(res.data)
    } catch {
      toast.error("Không thể tải dữ liệu KPI")
    } finally {
      setIsLoading(false)
    }
  }, [month, year])

  // Fetch top performers
  const fetchTop = useCallback(async () => {
    setIsTopLoading(true)
    try {
      const res = await kpiApi.topPerformers(month, year, 5)
      setTopPerformers(res)
    } catch {
      setTopPerformers([])
    } finally {
      setIsTopLoading(false)
    }
  }, [month, year])

  useEffect(() => {
    fetchKpis()
    fetchTop()
  }, [fetchKpis, fetchTop])

  // Load employees for upsert form
  useEffect(() => {
    if (isAdmin) {
      employeeApi
        .list({ per_page: 100 })
        .then((r) => setEmployees(r.data))
        .catch(console.error)
    }
  }, [isAdmin])

  const handleUpsert = async (payload: UpsertKpiPayload) => {
    try {
      await kpiApi.upsert(payload)
      toast.success("Đã cập nhật KPI thành công")
      setUpsertOpen(false)
      fetchKpis()
      fetchTop()
    } catch {
      toast.error("Không thể lưu KPI")
      throw new Error("Upsert failed")
    }
  }

  const handleApplyFilters = (values: Record<string, unknown>) => {
    if (values.month) setMonth(parseInt(values.month as string))
    if (values.year) setYear(parseInt(values.year as string))
  }

  const handleResetFilters = () => {
    const today = new Date()
    setMonth(today.getMonth() + 1)
    setYear(today.getFullYear())
  }

  const filterFields = useMemo<FilterFieldDef[]>(
    () => [
      {
        field: "month",
        type: "select",
        label: "Tháng",
        placeholder: "Chọn tháng",
        value: month.toString(),
        options: Array.from({ length: 12 }).map((_, i) => ({
          label: `Tháng ${i + 1}`,
          value: (i + 1).toString(),
        })),
      },
      {
        field: "year",
        type: "select",
        label: "Năm",
        placeholder: "Chọn năm",
        value: year.toString(),
        options: [
          { label: "2024", value: "2024" },
          { label: "2025", value: "2025" },
          { label: "2026", value: "2026" },
          { label: "2027", value: "2027" },
        ],
      },
    ],
    [month, year],
  )

  // Aggregated stats
  const kpisWithPct = kpis.map((k) => ({ ...k, kpi_percent: toNum(k.kpi_percent) }))
  const avgKpi =
    kpisWithPct.length > 0 && kpisWithPct.some((k) => k.kpi_percent != null)
      ? kpisWithPct
          .filter((k) => k.kpi_percent != null)
          .reduce((s, k) => s + (k.kpi_percent ?? 0), 0) /
        kpisWithPct.filter((k) => k.kpi_percent != null).length
      : null
  const totalTarget = kpis.reduce((s, k) => s + (toNum(k.target_revenue) ?? 0), 0)
  const totalActual = kpis.reduce((s, k) => s + (toNum(k.actual_revenue) ?? 0), 0)

  return (
    <div className="flex flex-col gap-6">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <TrendingUp className="size-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">KPI Kinh doanh</h1>
            <p className="text-sm text-muted-foreground">{kpis.length} nhân viên có dữ liệu</p>
          </div>
        </div>
        <div className="flex gap-2 self-start sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              fetchKpis()
              fetchTop()
            }}
            disabled={isLoading}
            className="gap-1.5"
          >
            <RefreshCw className={`size-3.5 ${isLoading ? "animate-spin" : ""}`} />
            Làm mới
          </Button>
          {isAdmin && (
            <Button
              size="sm"
              onClick={() => {
                setEditKpi(null)
                setUpsertOpen(true)
              }}
              className="gap-2"
            >
              <Plus className="size-4" />
              Đặt mục tiêu
            </Button>
          )}
        </div>
      </div>

      {/* ── Filters ─────────────────────────────────────────────────────── */}
      <FilterPanel
        applyMode
        fields={filterFields}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
        title="Lọc thời gian"
      />

      {/* ── Summary Stats ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: "TB KPI",
            value: avgKpi != null ? `${avgKpi.toFixed(1)}%` : "—",
            color:
              avgKpi != null
                ? avgKpi >= 100
                  ? "text-success"
                  : avgKpi >= 70
                    ? "text-warning"
                    : "text-destructive"
                : "text-muted-foreground",
          },
          { label: "Tổng target", value: formatCurrency(totalTarget), color: "text-foreground" },
          { label: "Thực tế", value: formatCurrency(totalActual), color: "text-primary" },
          {
            label: "Đạt mục tiêu",
            value: `${kpis.filter((k) => (k.kpi_percent ?? 0) >= 100).length}/${kpis.length}`,
            color: "text-success",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border bg-card px-4 py-3 flex flex-col gap-0.5"
          >
            <span className="text-xs text-muted-foreground">{stat.label}</span>
            <span className={`text-xl font-bold ${stat.color}`}>{stat.value}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── KPI Table ─────────────────────────────────────────────────── */}
        <div className="lg:col-span-2 flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Bảng KPI tháng {month}/{year}
          </h2>
          <KpiTable
            kpis={kpis}
            isLoading={isLoading}
            isAdmin={isAdmin}
            onEdit={(kpi) => {
              setEditKpi(kpi)
              setUpsertOpen(true)
            }}
          />
        </div>

        {/* ── Right sidebar ─────────────────────────────────────────────── */}
        <div className="flex flex-col gap-4">
          <TopPerformersCard performers={topPerformers} isLoading={isTopLoading} />
        </div>
      </div>

      {/* ── Upsert Modal ─────────────────────────────────────────────────── */}
      {isAdmin && (
        <UpsertKpiModal
          open={upsertOpen}
          onClose={() => {
            setUpsertOpen(false)
            setEditKpi(null)
          }}
          onSubmit={handleUpsert}
          employees={employees}
          defaultMonth={month}
          defaultYear={year}
          editData={editKpi}
        />
      )}
    </div>
  )
}
