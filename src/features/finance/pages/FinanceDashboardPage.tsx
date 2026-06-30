import { useEffect, useState, useMemo } from "react"
import { MantineReactTable, useMantineReactTable, type MRT_ColumnDef } from "mantine-react-table"
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from "recharts"
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Building2,
  AlertCircle,
  AlertTriangle,
  BarChart3,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageLoader } from "@/components/common/PageLoader"
import { reportApi, type IncomeExpenseRow } from "@/features/reports/api/reportApi"
import { voucherApi } from "../api/voucherApi"
import type { Voucher } from "../types/voucher"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { PATHS } from "@/constants/paths"
import dayjs from "dayjs"

export function FinanceDashboardPage() {
  const { t } = useTranslation(["finance", "common"])
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)

  const [incomeExpenseData, setIncomeExpenseData] = useState<IncomeExpenseRow[]>([])
  const [pendingVouchers, setPendingVouchers] = useState<Voucher[]>([])
  const [overdueVouchers, setOverdueVouchers] = useState<Voucher[]>([])
  const [topDepartments, setTopDepartments] = useState<{ name: string; total: number }[]>([])
  const [projectExpenses, setProjectExpenses] = useState<{ name: string; total: number }[]>([])

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true)

        const [incomeExpenseRows, pendingRes, recentPaymentsRes] = await Promise.all([
          reportApi.getIncomeExpense(),
          voucherApi.list({ status: "pending", per_page: 5 }),
          voucherApi.list({ voucher_type: "payment", per_page: 100 }), // Fetch recent payments to compute top departments (max 100)
        ])

        // 1. Chart Data (last 6 months)
        const sortedIE = [...incomeExpenseRows].sort((a, b) => a.year - b.year || a.month - b.month)
        setIncomeExpenseData(sortedIE.slice(-6))

        // 2. Pending vouchers
        setPendingVouchers(pendingRes.data || [])

        // 3. Top departments computing
        const deptTotals: Record<string, number> = {}
        const payments = recentPaymentsRes.data || []
        payments.forEach((p) => {
          if (p.department) {
            const name = p.department.name
            deptTotals[name] = (deptTotals[name] || 0) + Number(p.amount)
          }
        })

        const sortedDepts = Object.entries(deptTotals)
          .map(([name, total]) => ({ name, total }))
          .sort((a, b) => b.total - a.total)
          .slice(0, 5)

        setTopDepartments(sortedDepts)

        // 4. Project expenses
        const projTotals: Record<string, number> = {}
        payments.forEach((p) => {
          if (p.project) {
            const name = p.project.name
            projTotals[name] = (projTotals[name] || 0) + Number(p.amount)
          }
        })
        const sortedProjs = Object.entries(projTotals)
          .map(([name, total]) => ({ name, total }))
          .sort((a, b) => b.total - a.total)
          .slice(0, 10)
        setProjectExpenses(sortedProjs)

        // 5. Overdue vouchers (pending for more than 7 days)
        const allPending = pendingRes.data || []
        const sevenDaysAgo = dayjs().subtract(7, "day")
        const overdue = allPending.filter((v) => {
          const createdDate = dayjs(v.created_at)
          return createdDate.isBefore(sevenDaysAgo)
        })
        setOverdueVouchers(overdue)
      } catch {
        toast.error(t("finance:dashboard.fetch_error"))
      } finally {
        setLoading(false)
      }
    }

    void loadDashboardData()
  }, [t])

  const currentMonthData = incomeExpenseData[incomeExpenseData.length - 1] || {
    income: 0,
    expense: 0,
    net: 0,
  }
  const totalIncome = Number(currentMonthData.income)
  const totalExpense = Number(currentMonthData.expense)
  const netIncome = Number(currentMonthData.net)

  const formatCurrency = (val: string | number) => {
    return Number(val).toLocaleString("vi-VN") + " ₫"
  }

  const deptColumns = useMemo<MRT_ColumnDef<{ name: string; total: number }>[]>(
    () => [
      {
        accessorKey: "name",
        header: t("finance:dashboard.department"),
      },
      {
        accessorKey: "total",
        header: t("finance:dashboard.total_expense"),
        Cell: ({ cell }) => (
          <div className="text-right font-mono font-semibold text-rose-600">
            {Number(cell.getValue<number>()).toLocaleString("vi-VN")} ₫
          </div>
        ),
      },
    ],
    [t],
  )

  const deptTable = useMantineReactTable({
    columns: deptColumns,
    data: topDepartments,
    enableColumnActions: false,
    enableColumnFilters: false,
    enablePagination: false,
    enableSorting: false,
    enableBottomToolbar: false,
    enableTopToolbar: false,
    mantineTableProps: {
      striped: true,
      highlightOnHover: true,
    },
    renderEmptyRowsFallback: () => (
      <div className="p-8 text-center text-muted-foreground">{t("common:table.noData")}</div>
    ),
  })

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-100px)] items-center justify-center">
        <PageLoader />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("finance:dashboard.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("finance:dashboard.subtitle")}</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("finance:dashboard.cards.total_income")}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-emerald-600">
              {formatCurrency(totalIncome)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{dayjs().format("MM/YYYY")}</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("finance:dashboard.cards.total_expense")}
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-rose-600">
              {formatCurrency(totalExpense)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{dayjs().format("MM/YYYY")}</p>
          </CardContent>
        </Card>

        <Card
          className={`shadow-sm ${netIncome >= 0 ? "bg-blue-50/50 dark:bg-blue-900/10" : "bg-orange-50/50 dark:bg-orange-900/10"}`}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("finance:dashboard.cards.profit_loss")}
            </CardTitle>
            <Wallet className={`h-4 w-4 ${netIncome >= 0 ? "text-blue-500" : "text-orange-500"}`} />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold font-mono ${netIncome >= 0 ? "text-blue-600" : "text-orange-600"}`}
            >
              {formatCurrency(netIncome)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{dayjs().format("MM/YYYY")}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <Card className="col-span-1 lg:col-span-2 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              {t("finance:dashboard.chart_title")}
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[350px]">
            {incomeExpenseData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                {t("common:table.noData")}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={incomeExpenseData.map((row) => ({
                    name: `${row.month}/${row.year}`,
                    Thu: Number(row.income),
                    Chi: Number(row.expense),
                  }))}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" fontSize={11} />
                  <YAxis tickFormatter={(v) => (v / 1e6).toLocaleString() + "M"} fontSize={11} />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Legend verticalAlign="top" height={36} iconType="circle" />
                  <Area
                    type="monotone"
                    dataKey="Thu"
                    stroke="#10b981"
                    fill="#10b981"
                    fillOpacity={0.1}
                  />
                  <Area
                    type="monotone"
                    dataKey="Chi"
                    stroke="#ef4444"
                    fill="#ef4444"
                    fillOpacity={0.1}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Pending Alerts */}
        <Card className="col-span-1 shadow-sm border-orange-200">
          <CardHeader className="bg-orange-50/50 dark:bg-orange-950/20 border-b border-orange-100 dark:border-orange-900/50 pb-4">
            <CardTitle className="text-base font-semibold text-orange-700 dark:text-orange-400 flex items-center gap-2">
              <AlertCircle className="size-5" />
              {t("finance:dashboard.pending_alerts")}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {pendingVouchers.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">
                {t("finance:dashboard.no_pending")}
              </div>
            ) : (
              <div className="divide-y divide-border">
                {pendingVouchers.map((v) => (
                  <div
                    key={v.id}
                    className="p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => navigate(`${PATHS.financeVouchers}?status=pending`)}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <div className="font-semibold text-sm">{v.voucher_code}</div>
                      <div className="text-xs font-mono font-bold text-rose-600">
                        {formatCurrency(v.amount)}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground line-clamp-1">
                      {v.description}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {pendingVouchers.length === 5 && (
              <div
                className="p-3 text-center text-xs font-medium text-primary hover:bg-muted cursor-pointer"
                onClick={() => navigate(`${PATHS.financeVouchers}?status=pending`)}
              >
                {t("finance:dashboard.view_all_pending")}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Building2 className="size-5 text-primary" />
              {t("finance:dashboard.top_departments")}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <MantineReactTable table={deptTable} />
          </CardContent>
        </Card>

        {/* Project Expenses Bar Chart */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <BarChart3 className="size-5 text-primary" />
              {t("finance:dashboard.project_expenses_title")}
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[350px]">
            {projectExpenses.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                {t("common:table.noData")}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={projectExpenses}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
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
                    width={120}
                    fontSize={11}
                    tick={{ fill: "currentColor" }}
                  />
                  <Tooltip
                    formatter={(value) => [
                      formatCurrency(Number(value)),
                      t("finance:dashboard.total_expense"),
                    ]}
                  />
                  <Bar dataKey="total" radius={[0, 4, 4, 0]} barSize={20}>
                    {projectExpenses.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          [
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
                          ][index % 10]
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Overdue Alerts */}
      {overdueVouchers.length > 0 && (
        <Card className="shadow-sm border-rose-200">
          <CardHeader className="bg-rose-50/50 dark:bg-rose-950/20 border-b border-rose-100 dark:border-rose-900/50 pb-4">
            <CardTitle className="text-base font-semibold text-rose-700 dark:text-rose-400 flex items-center gap-2">
              <AlertTriangle className="size-5" />
              {t("finance:dashboard.overdue_alerts")}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {overdueVouchers.map((v) => (
                <div
                  key={v.id}
                  className="p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => navigate(`${PATHS.financeVouchers}?status=pending`)}
                >
                  <div className="flex items-start justify-between mb-1">
                    <div className="font-semibold text-sm">{v.voucher_code}</div>
                    <div className="text-xs font-mono font-bold text-rose-600">
                      {formatCurrency(v.amount)}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {t("finance:dashboard.pending_since", {
                      days: dayjs().diff(dayjs(v.created_at), "day"),
                    })}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
