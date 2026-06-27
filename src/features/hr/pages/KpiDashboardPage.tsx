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
import { hasPermission, PermissionSlugs } from "@/constants/permissions"
import { kpiApi } from "../api/kpiApi"
import { employeeApi } from "../api/employeeApi"
import type { Employee } from "../types/employee"
import type { EmployeeKpi, UpsertKpiPayload } from "../types/kpi"
import { useTranslation } from "react-i18next"
import type { TFunction } from "i18next"
import { KpiTable } from "../components/KpiTable"

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
  t,
}: {
  performers: EmployeeKpi[]
  isLoading: boolean
  t: TFunction
}) {
  const medals = ["🥇", "🥈", "🥉"]

  return (
    <div className="rounded-xl border bg-card p-4 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Trophy className="size-4 text-warning" />
        <h3 className="font-semibold text-sm">{t("hr:kpi.dashboard.top_performers")}</h3>
      </div>

      {isLoading ? (
        <>
          <div className="flex flex-col gap-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 rounded-lg" />
            ))}
          </div>
          <p className="text-sm text-muted-foreground text-center py-4">
            {t("hr:kpi.dashboard.no_data")}
          </p>
        </>
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

const createUpsertKpiSchema = (t: TFunction) =>
  z.object({
    user_id: z
      .string()
      .min(
        1,
        t("hr:kpi.form.validation.user_required", { defaultValue: "Vui lòng chọn nhân viên" }),
      ),
    month: z
      .string()
      .min(1, t("hr:kpi.form.validation.month_required", { defaultValue: "Vui lòng nhập tháng" }))
      .refine(
        (v) => parseInt(v) >= 1 && parseInt(v) <= 12,
        t("hr:kpi.form.validation.month_invalid", { defaultValue: "Tháng phải từ 1 đến 12" }),
      ),
    year: z
      .string()
      .min(1, t("hr:kpi.form.validation.year_required", { defaultValue: "Vui lòng nhập năm" }))
      .refine(
        (v) => parseInt(v) >= 2020 && parseInt(v) <= 2100,
        t("hr:kpi.form.validation.year_invalid", { defaultValue: "Năm phải từ 2020 đến 2100" }),
      ),
    target_revenue: z
      .string()
      .min(
        1,
        t("hr:kpi.form.validation.target_required", { defaultValue: "Vui lòng nhập mục tiêu" }),
      )
      .refine(
        (v) => parseFloat(v) >= 0,
        t("hr:kpi.form.validation.target_min", { defaultValue: "Mục tiêu không được nhỏ hơn 0" }),
      ),
    actual_revenue: z
      .string()
      .optional()
      .nullable()
      .refine(
        (v) => !v || parseFloat(v) >= 0,
        t("hr:kpi.form.validation.actual_min", { defaultValue: "Thực tế không được nhỏ hơn 0" }),
      ),
    notes: z
      .string()
      .max(
        1000,
        t("hr:kpi.form.validation.notes_max", { defaultValue: "Ghi chú tối đa 1000 ký tự" }),
      )
      .optional()
      .nullable(),
  })

type UpsertKpiFormData = z.infer<ReturnType<typeof createUpsertKpiSchema>>

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
  const { t } = useTranslation(["hr", "common"])
  const isEditing = !!editData
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<UpsertKpiFormData>({
    resolver: zodResolver(createUpsertKpiSchema(t)),
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
      title={isEditing ? t("hr:kpi.form.update_title") : t("hr:kpi.form.create_title")}
      size="md"
      primaryAction={{
        label: isSubmitting ? t("common:table.loading") : t("hr:kpi.form.submit"),
        type: "submit",
        form: "kpi-form",
        disabled: isSubmitting,
      }}
      cancelAction={{
        label: t("common:actions.cancel"),
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
            {t("hr:kpi.form.employee")}
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
            placeholder={t("hr:kpi.form.employee_placeholder")}
            className={errors.user_id ? "border-destructive h-9" : "h-9"}
            disabled={isEditing}
          />
          {errors.user_id && <p className="text-xs text-destructive">{errors.user_id.message}</p>}
        </div>

        {/* Month + Year */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="kpi-month" className="text-sm font-medium">
              {t("hr:kpi.form.month")}
            </Label>
            <Input
              id="kpi-month"
              type="number"
              inputMode="decimal"
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
              {t("hr:kpi.form.year")}
            </Label>
            <Input
              id="kpi-year"
              type="number"
              inputMode="decimal"
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
            {t("hr:kpi.form.target")}
          </Label>
          <Input
            id="kpi-target"
            type="number"
            inputMode="decimal"
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
            {t("hr:kpi.form.actual")}
          </Label>
          <Input
            id="kpi-actual"
            type="number"
            inputMode="decimal"
            min={0}
            placeholder={t("hr:kpi.form.actual_placeholder")}
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
            {t("hr:kpi.form.notes")}
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
  const { t } = useTranslation(["hr", "common"])
  const user = useAuthStore((s) => s.user)
  const canEdit = hasPermission(user?.permissions, PermissionSlugs.EditKpis)

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
      toast.error(t("hr:kpi.dashboard.fetch_error"))
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
    if (canEdit) {
      employeeApi
        .list({ per_page: 100 })
        .then((r) => setEmployees(r.data))
        .catch(console.error)
    }
  }, [canEdit])

  const handleUpsert = async (payload: UpsertKpiPayload) => {
    try {
      await kpiApi.upsert(payload)
      toast.success(t("hr:kpi.dashboard.upsert_success"))
      setUpsertOpen(false)
      fetchKpis()
      fetchTop()
    } catch {
      toast.error(t("hr:kpi.dashboard.upsert_error"))
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
        label: t("hr:kpi.dashboard.month"),
        placeholder: t("hr:kpi.dashboard.select_month"),
        value: month.toString(),
        options: Array.from({ length: 12 }).map((_, i) => ({
          label: `${t("hr:kpi.dashboard.month")} ${i + 1}`,
          value: (i + 1).toString(),
        })),
      },
      {
        field: "year",
        type: "select",
        label: t("hr:kpi.dashboard.year"),
        placeholder: t("hr:kpi.dashboard.select_year"),
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
            <h1 className="text-xl font-semibold">{t("hr:kpi.dashboard.title")}</h1>
            <p className="text-sm text-muted-foreground">
              {t("hr:kpi.dashboard.subtitle", { count: kpis.length })}
            </p>
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
            {t("common:actions.refresh")}
          </Button>
          {canEdit && (
            <Button
              size="sm"
              onClick={() => {
                setEditKpi(null)
                setUpsertOpen(true)
              }}
              className="gap-2"
            >
              <Plus className="size-4" />
              {t("hr:kpi.dashboard.actions.set_target")}
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
        title={t("hr:kpi.dashboard.filter_time")}
      />

      {/* ── Summary Stats ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: t("hr:kpi.dashboard.stats.avg"),
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
          {
            label: t("hr:kpi.dashboard.stats.target"),
            value: formatCurrency(totalTarget),
            color: "text-foreground",
          },
          {
            label: t("hr:kpi.dashboard.stats.actual"),
            value: formatCurrency(totalActual),
            color: "text-primary",
          },
          {
            label: t("hr:kpi.dashboard.stats.achieved"),
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
            {t("hr:kpi.dashboard.table_title", { month, year })}
          </h2>
          <KpiTable
            kpis={kpis}
            isLoading={isLoading}
            isAdmin={canEdit}
            onEdit={(kpi) => {
              setEditKpi(kpi)
              setUpsertOpen(true)
            }}
          />
        </div>

        {/* ── Right sidebar ─────────────────────────────────────────────── */}
        <div className="flex flex-col gap-4">
          <TopPerformersCard performers={topPerformers} isLoading={isTopLoading} t={t} />
        </div>
      </div>

      {/* ── Upsert Modal ─────────────────────────────────────────────────── */}
      {canEdit && (
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
