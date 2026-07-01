import { useEffect, useState, useMemo, useCallback } from "react"
import { MantineReactTable, useMantineReactTable, type MRT_ColumnDef } from "mantine-react-table"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageLoader } from "@/components/common/PageLoader"
import { StatusBadge } from "@/components/common/StatusBadge"
import { FilterPanel, type FilterFieldDef } from "@/components/common/FilterPanel"
import { TablePagination } from "@/components/common/TablePagination"
import { MobileCardList } from "@/components/common/MobileCardList"
import { MobileActionHeader } from "@/components/common/MobileActionHeader"
import { Receipt } from "lucide-react"
import { voucherApi } from "../api/voucherApi"
import type { Voucher, ListVouchersParams } from "../types/voucher"
import { optionApi, type OptionItem } from "@/shared/api/optionApi"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"
import { BarChart3, TrendingDown } from "lucide-react"

interface ProjectExpenseAgg {
  name: string
  total: number
}

const CHART_COLORS = [
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#eab308",
  "#84cc16",
  "#22c55e",
  "#14b8a6",
  "#06b6d4",
  "#3b82f6",
  "#6366f1",
]

export function ProjectExpenseReportPage() {
  const { t } = useTranslation(["finance", "common"])
  const [loading, setLoading] = useState(true)
  const [vouchers, setVouchers] = useState<Voucher[]>([])
  const [totalItems, setTotalItems] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(15)

  const [projects, setProjects] = useState<OptionItem[]>([])

  const [filters, setFilters] = useState<Record<string, unknown>>({
    project_id: "",
    date_from: "",
    date_to: "",
  })

  // Aggregation data for bar chart
  const [chartData, setChartData] = useState<ProjectExpenseAgg[]>([])
  const [chartLoading, setChartLoading] = useState(true)

  useEffect(() => {
    optionApi.getProjects().then(setProjects).catch(console.error)
  }, [])

  // Fetch chart data (all payment vouchers with project links — up to 200 for aggregation)
  const fetchChartData = useCallback(async () => {
    setChartLoading(true)
    try {
      const params: ListVouchersParams = {
        voucher_type: "payment",
        per_page: 100,
        date_from: (filters.date_from as string) || undefined,
        date_to: (filters.date_to as string) || undefined,
      }
      const data = await voucherApi.list(params)
      const items = data.data || []

      // Aggregate by project
      const totals: Record<string, number> = {}
      items.forEach((v) => {
        if (v.project?.name) {
          totals[v.project.name] = (totals[v.project.name] || 0) + Number(v.amount)
        }
      })

      const sorted = Object.entries(totals)
        .map(([name, total]) => ({ name, total }))
        .sort((a, b) => b.total - a.total)

      setChartData(sorted)
    } catch {
      toast.error(t("finance:project_expenses.fetch_error"))
    } finally {
      setChartLoading(false)
    }
  }, [filters.date_from, filters.date_to, t])

  // Fetch detail table data
  const fetchVouchers = useCallback(async () => {
    setLoading(true)
    try {
      const params: ListVouchersParams = {
        voucher_type: "payment",
        page: currentPage,
        per_page: pageSize,
        project_id: filters.project_id ? parseInt(filters.project_id as string, 10) : undefined,
        date_from: (filters.date_from as string) || undefined,
        date_to: (filters.date_to as string) || undefined,
      }
      const data = await voucherApi.list(params)
      // Only show vouchers that have a linked project
      const projectVouchers = (data.data || []).filter((v) => v.project)
      setVouchers(projectVouchers)
      setTotalItems(data.meta?.total || 0)
    } catch {
      toast.error(t("finance:project_expenses.fetch_error"))
    } finally {
      setLoading(false)
    }
  }, [currentPage, pageSize, filters, t])

  useEffect(() => {
    void fetchChartData()
  }, [fetchChartData])

  useEffect(() => {
    void fetchVouchers()
  }, [fetchVouchers])

  const formatCurrency = (val: number | string) => {
    return Number(val).toLocaleString("vi-VN") + " ₫"
  }

  const handleFilterSubmit = (newFilters: Record<string, unknown>) => {
    setFilters(newFilters)
    setCurrentPage(1)
  }

  const filterFields = useMemo<FilterFieldDef[]>(
    () => [
      {
        field: "project_id",
        label: t("finance:project_expenses.filters.project"),
        type: "select",
        placeholder: t("common:filter.all"),
        value: (filters.project_id as string) || "",
        options: projects.map((p) => ({
          label: p.label,
          value: p.value?.toString() || p.id?.toString() || "",
        })),
      },
      {
        field: "date_from",
        label: t("finance:project_expenses.filters.date_from"),
        type: "datepicker",
        value: (filters.date_from as string) || null,
      },
      {
        field: "date_to",
        label: t("finance:project_expenses.filters.date_to"),
        type: "datepicker",
        value: (filters.date_to as string) || null,
      },
    ],
    [filters, t, projects],
  )

  const totalExpenseAmount = useMemo(() => {
    return chartData.reduce((sum, d) => sum + d.total, 0)
  }, [chartData])

  const columns = useMemo<MRT_ColumnDef<Voucher>[]>(
    () => [
      {
        accessorFn: (row) => row.project?.name || "—",
        id: "project_name",
        header: t("finance:project_expenses.col_project"),
        size: 200,
        Cell: ({ cell }) => (
          <span className="font-semibold text-foreground">{cell.getValue<string>()}</span>
        ),
      },
      {
        accessorKey: "voucher_code",
        header: t("finance:list.columns.code"),
        size: 140,
        Cell: ({ cell }) => (
          <span className="font-mono text-sm text-foreground">{cell.getValue<string>()}</span>
        ),
      },
      {
        accessorKey: "voucher_date",
        header: t("finance:list.columns.date"),
        size: 120,
        Cell: ({ cell }) => (
          <span className="text-muted-foreground whitespace-nowrap">{cell.getValue<string>()}</span>
        ),
      },
      {
        accessorKey: "amount",
        header: t("finance:list.columns.amount"),
        size: 160,
        Cell: ({ row }) => (
          <div className="text-right font-mono font-bold text-rose-600 whitespace-nowrap">
            -{Number(row.original.amount).toLocaleString("vi-VN")} VNĐ
          </div>
        ),
      },
      {
        accessorKey: "description",
        header: t("finance:project_expenses.col_description"),
        size: 300,
        Cell: ({ cell }) => (
          <div className="text-foreground truncate max-w-xs" title={cell.getValue<string>() || ""}>
            {cell.getValue<string>() || "—"}
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: t("finance:list.columns.status"),
        size: 120,
        Cell: ({ cell }) => {
          const status = cell.getValue<string>()
          return (
            <div className="flex justify-center">
              <StatusBadge status={status} />
            </div>
          )
        },
      },
    ],
    [t],
  )

  const table = useMantineReactTable({
    renderEmptyRowsFallback: () => (
      <div className="p-8 text-center text-muted-foreground">{t("common:table.noData")}</div>
    ),
    columns,
    data: vouchers,
    enableColumnActions: false,
    enableColumnFilters: false,
    enablePagination: false,
    enableSorting: false,
    enableBottomToolbar: false,
    enableTopToolbar: false,
    enableFullScreenToggle: false,
    state: {
      isLoading: loading,
    },
    mantineTableProps: {
      striped: true,
      highlightOnHover: true,
      withBorder: false,
      withColumnBorders: false,
    },
  })

  if (chartLoading && loading) {
    return (
      <div className="flex h-[calc(100vh-100px)] items-center justify-center">
        <PageLoader />
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-20 md:pb-0 animate-in fade-in duration-500">
      <MobileActionHeader
        title={t("finance:project_expenses.title")}
        subtitle={t("finance:project_expenses.subtitle")}
      />

      <FilterPanel
        applyMode
        fields={filterFields}
        onApply={handleFilterSubmit}
        onReset={() => {
          setFilters({
            project_id: "",
            date_from: "",
            date_to: "",
          })
          setCurrentPage(1)
        }}
      />

      {/* Summary + Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Summary Card */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("finance:project_expenses.total_expense")}
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-rose-600">
              {formatCurrency(totalExpenseAmount)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t("finance:project_expenses.projects_count", { count: chartData.length })}
            </p>
          </CardContent>
        </Card>

        {/* Bar Chart */}
        <Card className="col-span-1 lg:col-span-2 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <BarChart3 className="size-5 text-primary" />
              {t("finance:project_expenses.chart_title")}
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[250px] md:h-[350px]">
            {chartData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                {t("common:table.noData")}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis
                    type="number"
                    tickFormatter={(v) => (v / 1e6).toLocaleString() + "M"}
                    fontSize={11}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={150}
                    fontSize={11}
                    tick={{ fill: "currentColor" }}
                  />
                  <Tooltip
                    formatter={(value) => [
                      formatCurrency(Number(value)),
                      t("finance:project_expenses.total_expense"),
                    ]}
                  />
                  <Bar dataKey="total" radius={[0, 4, 4, 0]} barSize={24}>
                    {chartData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="hidden sm:block">
          <CardTitle className="text-base font-semibold">
            {t("finance:project_expenses.table_title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 sm:p-6 sm:pt-0">
          <MobileCardList
            data={vouchers}
            isLoading={loading}
            keyExtractor={(item) => item.id.toString()}
            className="p-4 sm:p-0"
            renderCard={(voucher) => (
              <div className="bg-card rounded-xl border p-4 shadow-sm flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="font-semibold text-foreground flex items-center gap-2">
                    <span className="truncate max-w-[200px]">{voucher.project?.name || "—"}</span>
                    <StatusBadge status={voucher.status} />
                  </div>
                  <div className="font-mono text-sm text-muted-foreground">
                    {voucher.voucher_code}
                  </div>
                </div>

                <div className="text-sm text-muted-foreground line-clamp-2">
                  {voucher.description || "—"}
                </div>

                <div className="flex items-end justify-between mt-2 pt-2 border-t">
                  <div className="text-xs text-muted-foreground">{voucher.voucher_date}</div>
                  <div className="font-mono font-bold text-rose-600">
                    -{Number(voucher.amount).toLocaleString("vi-VN")} ₫
                  </div>
                </div>
              </div>
            )}
            desktopTable={
              <div className="rounded-xl overflow-hidden hidden sm:block border">
                <MantineReactTable table={table} />
              </div>
            }
            emptyIcon={Receipt}
            emptyTitle={t("common:table.noData")}
          />
        </CardContent>
      </Card>

      <TablePagination
        total={totalItems}
        perPage={pageSize}
        page={currentPage}
        totalPages={Math.ceil(totalItems / pageSize)}
        onPageChange={setCurrentPage}
      />
    </div>
  )
}
