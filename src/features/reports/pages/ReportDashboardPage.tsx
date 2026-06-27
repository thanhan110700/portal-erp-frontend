import { useEffect, useState, useMemo } from "react"
import { MantineReactTable, useMantineReactTable, type MRT_ColumnDef } from "mantine-react-table"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { BarChart3, Users, AlertCircle } from "lucide-react"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FilterPanel, type FilterFieldDef } from "@/components/common/FilterPanel"
import { PageLoader } from "@/components/common/PageLoader"
import { optionApi, type OptionItem } from "@/shared/api/optionApi"
import {
  reportApi,
  type IncomeExpenseRow,
  type ReceivableRow,
  type ProjectProfitRow,
  type SalesRevenueRow,
  type QuoteConversionData,
  type SalesPipelineData,
} from "../api/reportApi"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"
import { useIsMobile } from "@/hooks/useMobile"

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6"]

const TRANSLATED_STATUSES: Record<string, string> = {
  planning: "Lên kế hoạch",
  quoting: "Đang báo giá",
  signed: "Đã ký",
  ongoing: "Đang thực hiện",
  testing: "Nghiệm thu",
  settled: "Quyết toán",
  completed: "Đã hoàn thành",
  on_hold: "Tạm dừng",
  cancelled: "Đã hủy",
  draft: "Lưu nháp",
  pending: "Chờ phản hồi",
  sent: "Đã gửi",
  waiting: "Đang chờ duyệt",
  accepted: "Đã chốt ký",
  rejected: "Từ chối",
}

export function ReportDashboardPage() {
  const { t } = useTranslation(["reports", "common"])
  const isMobile = useIsMobile()
  const [activeTab, setActiveTab] = useState("income-expense")
  const [loading, setLoading] = useState(true)

  // Options lists
  const [salesReps, setSalesReps] = useState<OptionItem[]>([])
  const [customers, setCustomers] = useState<OptionItem[]>([])

  // Global filters
  const [year, setYear] = useState<number>(new Date().getFullYear())
  const [month, setMonth] = useState<string>("all")
  const [salesRepId, setSalesRepId] = useState<string>("")
  const [customerId, setCustomerId] = useState<string>("")
  const [dateFrom, setDateFrom] = useState<string>("")
  const [dateTo, setDateTo] = useState<string>("")

  // Data states
  const [incomeExpenseData, setIncomeExpenseData] = useState<IncomeExpenseRow[]>([])
  const [receivablesData, setReceivablesData] = useState<ReceivableRow[]>([])
  const [projectProfitData, setProjectProfitData] = useState<ProjectProfitRow[]>([])
  const [salesRevenueData, setSalesRevenueData] = useState<SalesRevenueRow[]>([])
  const [quoteConversionData, setQuoteConversionData] = useState<QuoteConversionData | null>(null)
  const [pipelineData, setPipelineData] = useState<SalesPipelineData | null>(null)

  // Load static option items
  useEffect(() => {
    Promise.all([optionApi.getEmployees(), optionApi.getCustomers()])
      .then(([emp, cust]) => {
        setSalesReps(emp)
        setCustomers(cust)
      })
      .catch(console.error)
  }, [])

  const filterFields = useMemo<FilterFieldDef[]>(() => {
    if (activeTab === "income-expense" || activeTab === "project-profit") {
      return [
        {
          field: "date_from",
          label: t("reports:filters.dateFrom"),
          type: "datepicker",
          value: dateFrom || null,
        },
        {
          field: "date_to",
          label: t("reports:filters.dateTo"),
          type: "datepicker",
          value: dateTo || null,
        },
      ]
    }
    if (activeTab === "receivables") {
      return [
        {
          field: "date_from",
          label: t("reports:filters.dateFrom"),
          type: "datepicker",
          value: dateFrom || null,
        },
        {
          field: "date_to",
          label: t("reports:filters.dateTo"),
          type: "datepicker",
          value: dateTo || null,
        },
        {
          field: "customer_id",
          label: t("reports:filters.customer"),
          type: "select",
          value: customerId || "",
          options: customers.map((c) => ({
            label: c.label,
            value: c.value?.toString() || c.id?.toString() || "",
          })),
          placeholder: t("reports:filters.customer_placeholder"),
        },
        {
          field: "sales_rep_id",
          label: t("reports:filters.salesRep"),
          type: "select",
          value: salesRepId || "",
          options: salesReps.map((e) => ({
            label: e.label,
            value: e.value?.toString() || e.id?.toString() || "",
          })),
          placeholder: t("reports:filters.salesRep_placeholder"),
        },
      ]
    }
    if (activeTab === "sales-performance") {
      return [
        {
          field: "year",
          label: t("reports:filters.year"),
          type: "input",
          value: year ? String(year) : "",
          placeholder: t("reports:filters.year_placeholder"),
        },
        {
          field: "month",
          label: t("reports:filters.month"),
          type: "select",
          value: month || "",
          options: [
            { label: t("reports:filters.month_all"), value: "all" },
            ...Array.from({ length: 12 }, (_, i) => ({
              label: t("reports:filters.month") + ` ${i + 1}`,
              value: String(i + 1),
            })),
          ],
          placeholder: t("reports:filters.month_placeholder"),
        },
        {
          field: "sales_rep_id",
          label: t("reports:filters.salesRep"),
          type: "select",
          value: salesRepId || "",
          options: salesReps.map((e) => ({
            label: e.label,
            value: e.value?.toString() || e.id?.toString() || "",
          })),
          placeholder: t("reports:filters.salesRep_placeholder"),
        },
      ]
    }
    return []
  }, [activeTab, dateFrom, dateTo, customerId, salesRepId, year, month, customers, salesReps])

  const handleApplyFilters = (values: Record<string, unknown>) => {
    if (
      activeTab === "income-expense" ||
      activeTab === "receivables" ||
      activeTab === "project-profit"
    ) {
      setDateFrom((values.date_from as string | null) ?? "")
      setDateTo((values.date_to as string | null) ?? "")
    }
    if (activeTab === "receivables") {
      setCustomerId((values.customer_id as string | null) ?? "")
    }
    if (activeTab === "receivables" || activeTab === "sales-performance") {
      setSalesRepId((values.sales_rep_id as string | null) ?? "")
    }
    if (activeTab === "sales-performance") {
      setYear(parseInt(values.year as string) || new Date().getFullYear())
      setMonth((values.month as string | null) ?? "all")
    }
  }

  const handleResetFilters = () => {
    setDateFrom("")
    setDateTo("")
    setCustomerId("")
    setSalesRepId("")
    setMonth("all")
    setYear(new Date().getFullYear())
  }

  const incomeExpenseColumns = useMemo<MRT_ColumnDef<IncomeExpenseRow>[]>(
    () => [
      {
        accessorFn: (row) =>
          t("reports:incomeExpense.columns.month", { month: row.month, year: row.year }),
        id: "period",
        header: t("reports:incomeExpense.columns.period"),
        size: 200,
        Cell: ({ cell }) => <span className="font-semibold">{cell.getValue<string>()}</span>,
      },
      {
        accessorKey: "income",
        header: t("reports:incomeExpense.columns.income"),
        size: 150,
        Cell: ({ cell }) => (
          <div className="text-right font-mono text-emerald-600">
            {Number(cell.getValue<number>()).toLocaleString("vi-VN")} ₫
          </div>
        ),
      },
      {
        accessorKey: "expense",
        header: t("reports:incomeExpense.columns.expense"),
        size: 150,
        Cell: ({ cell }) => (
          <div className="text-right font-mono text-rose-600">
            {Number(cell.getValue<number>()).toLocaleString("vi-VN")} ₫
          </div>
        ),
      },
      {
        accessorKey: "net",
        header: t("reports:incomeExpense.columns.net"),
        size: 150,
        Cell: ({ cell }) => {
          const val = Number(cell.getValue<number>())
          return (
            <div
              className={`text-right font-mono font-semibold ${val >= 0 ? "text-blue-600" : "text-orange-600"}`}
            >
              {val.toLocaleString("vi-VN")} ₫
            </div>
          )
        },
      },
    ],
    [],
  )

  const receivablesColumns = useMemo<MRT_ColumnDef<ReceivableRow>[]>(
    () => [
      {
        accessorKey: "contract_code",
        header: t("reports:receivables.columns.contract"),
        size: 150,
        Cell: ({ cell }) => (
          <span className="font-semibold text-foreground">{cell.getValue<string>()}</span>
        ),
      },
      {
        accessorKey: "customer_name",
        header: t("reports:receivables.columns.customer"),
        size: 200,
      },
      {
        accessorKey: "sales_rep_name",
        header: t("reports:receivables.columns.salesRep"),
        size: 150,
        Cell: ({ cell }) => cell.getValue<string>() || "—",
      },
      {
        accessorKey: "contract_date",
        header: t("reports:receivables.columns.date"),
        size: 120,
        Cell: ({ cell }) => (
          <span className="text-muted-foreground">{cell.getValue<string>()}</span>
        ),
      },
      {
        accessorKey: "contract_value",
        header: t("reports:receivables.columns.value"),
        size: 150,
        Cell: ({ cell }) => (
          <div className="text-right font-mono">
            {Number(cell.getValue<number>()).toLocaleString("vi-VN")} ₫
          </div>
        ),
      },
      {
        accessorKey: "payment_received",
        header: t("reports:receivables.columns.received"),
        size: 150,
        Cell: ({ cell }) => (
          <div className="text-right font-mono text-emerald-600">
            {Number(cell.getValue<number>()).toLocaleString("vi-VN")} ₫
          </div>
        ),
      },
      {
        accessorKey: "payment_outstanding",
        header: t("reports:receivables.columns.outstanding"),
        size: 150,
        Cell: ({ cell }) => (
          <div className="text-right font-mono text-orange-600 font-bold">
            {Number(cell.getValue<number>()).toLocaleString("vi-VN")} ₫
          </div>
        ),
      },
    ],
    [],
  )

  const projectProfitColumns = useMemo<MRT_ColumnDef<ProjectProfitRow>[]>(
    () => [
      {
        accessorKey: "project_code",
        header: t("reports:projectProfit.columns.code"),
        size: 120,
        Cell: ({ cell }) => (
          <span className="font-mono font-semibold">{cell.getValue<string>()}</span>
        ),
      },
      {
        accessorKey: "project_name",
        header: t("reports:projectProfit.columns.name"),
        size: 200,
        Cell: ({ cell }) => (
          <span className="font-medium text-foreground">{cell.getValue<string>()}</span>
        ),
      },
      {
        accessorKey: "contract_value",
        header: t("reports:projectProfit.columns.contractValue"),
        size: 150,
        Cell: ({ cell }) => (
          <div className="text-right font-mono">
            {Number(cell.getValue<number>() || 0).toLocaleString("vi-VN")} ₫
          </div>
        ),
      },
      {
        accessorKey: "total_received",
        header: t("reports:projectProfit.columns.received"),
        size: 150,
        Cell: ({ cell }) => (
          <div className="text-right font-mono text-emerald-600">
            {Number(cell.getValue<number>() || 0).toLocaleString("vi-VN")} ₫
          </div>
        ),
      },
      {
        accessorKey: "total_spent",
        header: t("reports:projectProfit.columns.spent"),
        size: 150,
        Cell: ({ cell }) => (
          <div className="text-right font-mono text-rose-600">
            {Number(cell.getValue<number>() || 0).toLocaleString("vi-VN")} ₫
          </div>
        ),
      },
      {
        accessorKey: "profit",
        header: t("reports:projectProfit.columns.profit"),
        size: 150,
        Cell: ({ cell }) => {
          const profit = Number(cell.getValue<number>() || 0)
          return (
            <div
              className={`text-right font-mono font-semibold ${profit >= 0 ? "text-emerald-600" : "text-rose-600"}`}
            >
              {profit.toLocaleString("vi-VN")} ₫
            </div>
          )
        },
      },
      {
        id: "margin",
        header: t("reports:projectProfit.columns.margin"),
        size: 120,
        Cell: ({ row }) => {
          const contract = Number(row.original.contract_value || 0)
          const profit = Number(row.original.profit || 0)
          const margin = contract > 0 ? (profit / contract) * 100 : 0
          const positive = profit >= 0
          return (
            <div className="flex justify-center">
              <span
                className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${positive ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}
              >
                {margin.toFixed(1)}%
              </span>
            </div>
          )
        },
      },
    ],
    [],
  )

  const commonTableProps = {
    enableColumnActions: false,
    enableColumnFilters: false,
    enablePagination: false,
    enableSorting: false,
    enableBottomToolbar: false,
    enableTopToolbar: false,
    enableFullScreenToggle: false,
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
      sx: { overflowX: "auto" as const, WebkitOverflowScrolling: "touch" as const },
    },
  }

  const incomeExpenseTable = useMantineReactTable({
    columns: incomeExpenseColumns,
    data: incomeExpenseData,
    ...commonTableProps,
  })

  const receivablesTable = useMantineReactTable({
    columns: receivablesColumns,
    data: receivablesData,
    ...commonTableProps,
  })

  const projectProfitTable = useMantineReactTable({
    columns: projectProfitColumns,
    data: projectProfitData,
    ...commonTableProps,
  })

  // Load data depending on active tab and filters
  useEffect(() => {
    setLoading(true)
    const loadData = async () => {
      try {
        if (activeTab === "income-expense") {
          const data = await reportApi.getIncomeExpense({
            date_from: dateFrom || undefined,
            date_to: dateTo || undefined,
          })
          setIncomeExpenseData(data)
        } else if (activeTab === "receivables") {
          const data = await reportApi.getReceivables({
            sales_rep_id: salesRepId ? parseInt(salesRepId) : undefined,
            customer_id: customerId ? parseInt(customerId) : undefined,
            date_from: dateFrom || undefined,
            date_to: dateTo || undefined,
          })
          setReceivablesData(data)
        } else if (activeTab === "project-profit") {
          const data = await reportApi.getProjectProfit({
            date_from: dateFrom || undefined,
            date_to: dateTo || undefined,
          })
          setProjectProfitData(data.data || [])
        } else if (activeTab === "sales-performance") {
          const mVal = month === "all" ? undefined : parseInt(month)
          const [rev, conv] = await Promise.all([
            reportApi.getSalesRevenue({
              year,
              month: mVal,
              sales_rep_id: salesRepId ? parseInt(salesRepId) : undefined,
            }),
            reportApi.getQuoteConversion({
              year,
              month: mVal,
              sales_rep_id: salesRepId ? parseInt(salesRepId) : undefined,
            }),
          ])
          setSalesRevenueData(rev)
          setQuoteConversionData(conv)
        } else if (activeTab === "pipeline") {
          const data = await reportApi.getSalesPipeline()
          setPipelineData(data)
        }
      } catch {
        toast.error(t("reports:fetch_error"))
      } finally {
        setLoading(false)
      }
    }

    void loadData()
  }, [activeTab, year, month, salesRepId, customerId, dateFrom, dateTo])

  // Custom tooltips and formatters
  const formatCurrency = (val: string | number) => {
    return Number(val).toLocaleString("vi-VN") + " ₫"
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("reports:title")}</h1>
        <p className="text-sm text-muted-foreground">{t("reports:subtitle")}</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full flex justify-start overflow-x-auto no-scrollbar md:grid md:grid-cols-5 p-1 rounded-xl bg-muted/50 h-auto! gap-1 scroll-smooth">
          <TabsTrigger
            value="income-expense"
            className="rounded-lg py-2 px-3 min-h-11 flex-none w-auto text-xs md:text-sm"
          >
            {t("reports:tabs.incomeExpense")}
          </TabsTrigger>
          <TabsTrigger
            value="receivables"
            className="rounded-lg py-2 px-3 min-h-11 flex-none w-auto text-xs md:text-sm"
          >
            {t("reports:tabs.receivables")}
          </TabsTrigger>
          <TabsTrigger
            value="project-profit"
            className="rounded-lg py-2 px-3 min-h-11 flex-none w-auto text-xs md:text-sm"
          >
            {t("reports:tabs.projectProfit")}
          </TabsTrigger>
          <TabsTrigger
            value="sales-performance"
            className="rounded-lg py-2 px-3 min-h-11 flex-none w-auto text-xs md:text-sm"
          >
            {t("reports:tabs.salesPerformance")}
          </TabsTrigger>
          <TabsTrigger
            value="pipeline"
            className="rounded-lg py-2 px-3 min-h-11 flex-none w-auto text-xs md:text-sm"
          >
            {t("reports:tabs.pipeline")}
          </TabsTrigger>
        </TabsList>

        {/* ── Filter bar (Dynamic depending on Tab) ────────────────────────── */}
        {activeTab !== "pipeline" && (
          <FilterPanel
            applyMode
            fields={filterFields}
            onApply={handleApplyFilters}
            onReset={handleResetFilters}
            title={t("reports:filters.title")}
            className="mt-4"
          />
        )}

        {/* ── Main Loading Area ────────────────────────────────────────────── */}
        {loading ? (
          <div className="mt-6 flex h-64 items-center justify-center rounded-xl border bg-card">
            <PageLoader />
          </div>
        ) : (
          <div className="mt-6 animate-in fade-in duration-200">
            {/* ── TAB 1: Income vs Expense ─────────────────────────────────── */}
            <TabsContent
              value="income-expense"
              className="m-0 focus-visible:outline-none space-y-6"
            >
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-y-6 md:gap-6">
                <Card className="col-span-2 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                      <BarChart3 className="size-4 text-primary" />{" "}
                      {t("reports:incomeExpense.chart.title")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    {incomeExpenseData.length === 0 ? (
                      <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                        {t("reports:incomeExpense.chart.no_data")}
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={incomeExpenseData.map((row) => ({
                            name: t("reports:incomeExpense.chart.period", {
                              month: row.month,
                              year: row.year,
                            }),
                            [t("reports:incomeExpense.chart.income")]: Number(row.income),
                            [t("reports:incomeExpense.chart.expense")]: Number(row.expense),
                            [t("reports:incomeExpense.chart.net")]: Number(row.net),
                          }))}
                          margin={{ top: 10, right: 10, left: isMobile ? -5 : 0, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="name" fontSize={isMobile ? 9 : 11} />
                          <YAxis
                            tickFormatter={(v) => (v / 1e6).toLocaleString() + "M"}
                            fontSize={isMobile ? 9 : 11}
                          />
                          <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                          <Legend verticalAlign="top" height={36} iconType="circle" />
                          <Area
                            type="monotone"
                            dataKey={t("reports:incomeExpense.chart.income")}
                            stroke="#10b981"
                            fill="#10b981"
                            fillOpacity={0.08}
                          />
                          <Area
                            type="monotone"
                            dataKey={t("reports:incomeExpense.chart.expense")}
                            stroke="#ef4444"
                            fill="#ef4444"
                            fillOpacity={0.08}
                          />
                          <Area
                            type="monotone"
                            dataKey={t("reports:incomeExpense.chart.net")}
                            stroke="#3b82f6"
                            fill="#3b82f6"
                            fillOpacity={0.05}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>

                <Card className="col-span-1 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-sm font-semibold">
                      {t("reports:incomeExpense.summary.title")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {(() => {
                      const totalIn = incomeExpenseData.reduce(
                        (acc, curr) => acc + Number(curr.income),
                        0,
                      )
                      const totalOut = incomeExpenseData.reduce(
                        (acc, curr) => acc + Number(curr.expense),
                        0,
                      )
                      const totalNet = totalIn - totalOut

                      return (
                        <>
                          <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/20 p-4 flex flex-col items-center justify-center text-center space-y-1">
                            <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                              {t("reports:incomeExpense.summary.total_income")}
                            </div>
                            <div className="text-lg font-bold font-mono text-emerald-700 dark:text-emerald-300">
                              {totalIn.toLocaleString("vi-VN")} ₫
                            </div>
                          </div>
                          <div className="rounded-lg bg-rose-50 dark:bg-rose-950/20 p-4 flex flex-col items-center justify-center text-center space-y-1">
                            <div className="text-xs font-semibold text-rose-600 dark:text-rose-400">
                              {t("reports:incomeExpense.summary.total_expense")}
                            </div>
                            <div className="text-lg font-bold font-mono text-rose-700 dark:text-rose-300">
                              {totalOut.toLocaleString("vi-VN")} ₫
                            </div>
                          </div>
                          <div
                            className={`rounded-lg p-4 flex flex-col items-center justify-center text-center space-y-1 ${totalNet >= 0 ? "bg-blue-50 dark:bg-blue-950/20" : "bg-orange-50 dark:bg-orange-950/20"}`}
                          >
                            <div className="text-xs font-semibold text-muted-foreground">
                              {t("reports:incomeExpense.summary.total_net")}
                            </div>
                            <div
                              className={`text-lg font-bold font-mono ${totalNet >= 0 ? "text-blue-700 dark:text-blue-300" : "text-orange-700 dark:text-orange-300"}`}
                            >
                              {totalNet.toLocaleString("vi-VN")} ₫
                            </div>
                          </div>
                        </>
                      )
                    })()}
                  </CardContent>
                </Card>
              </div>

              {/* Data Table */}
              <div className="rounded-xl border bg-card overflow-x-auto">
                <MantineReactTable table={incomeExpenseTable} />
              </div>
            </TabsContent>

            {/* ── TAB 2: Receivables ───────────────────────────────────────── */}
            <TabsContent value="receivables" className="m-0 focus-visible:outline-none space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {(() => {
                  const totalOutstanding = receivablesData.reduce(
                    (acc, c) => acc + Number(c.payment_outstanding),
                    0,
                  )
                  const totalContract = receivablesData.reduce(
                    (acc, c) => acc + Number(c.contract_value),
                    0,
                  )
                  const totalReceived = totalContract - totalOutstanding

                  return (
                    <>
                      <div className="rounded-xl border bg-card p-5 flex flex-col items-center justify-center text-center space-y-2">
                        <div className="text-xs text-muted-foreground font-semibold">
                          {t("reports:receivables.summary.outstanding")}
                        </div>
                        <p className="text-xl font-bold font-mono">
                          {totalContract.toLocaleString("vi-VN")} ₫
                        </p>
                      </div>
                      <div className="rounded-xl border bg-card p-5 flex flex-col items-center justify-center text-center space-y-2">
                        <div className="text-xs text-muted-foreground font-semibold">
                          {t("reports:receivables.summary.received")}
                        </div>
                        <p className="text-xl font-bold font-mono text-emerald-600">
                          {totalReceived.toLocaleString("vi-VN")} ₫
                        </p>
                      </div>
                      <div className="rounded-xl border bg-card p-5 flex flex-col items-center justify-center text-center space-y-2 border-orange-200 bg-orange-50/20">
                        <div className="text-xs text-orange-600 font-semibold flex items-center justify-center gap-1">
                          <AlertCircle className="size-4" />{" "}
                          {t("reports:receivables.summary.unpaid")}
                        </div>
                        <p className="text-xl font-bold font-mono text-orange-600">
                          {totalOutstanding.toLocaleString("vi-VN")} ₫
                        </p>
                      </div>
                    </>
                  )
                })()}
              </div>

              <div className="rounded-xl border bg-card overflow-hidden">
                <MantineReactTable table={receivablesTable} />
              </div>
            </TabsContent>

            {/* ── TAB 3: Project Profitability ─────────────────────────────── */}
            <TabsContent
              value="project-profit"
              className="m-0 focus-visible:outline-none space-y-6"
            >
              <div className="rounded-xl border bg-card overflow-hidden">
                <MantineReactTable table={projectProfitTable} />
              </div>
            </TabsContent>

            {/* ── TAB 4: Sales Performance & Conversion ───────────────────── */}
            <TabsContent
              value="sales-performance"
              className="m-0 focus-visible:outline-none space-y-6"
            >
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-y-6 md:gap-6">
                {/* Rep Revenue Chart */}
                <Card className="col-span-2 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                      <Users className="size-4 text-primary" />{" "}
                      {t("reports:salesPerformance.chart.title")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    {salesRevenueData.length === 0 ? (
                      <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                        {t("reports:salesPerformance.chart.no_data")}
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={salesRevenueData.map((row) => ({
                            name:
                              row.sales_rep?.full_name ||
                              t("reports:salesPerformance.chart.rep_code", {
                                id: row.sales_rep?.id,
                              }),
                            [t("reports:salesPerformance.chart.signed")]: Number(
                              row.total_contract_value,
                            ),
                            [t("reports:salesPerformance.chart.received")]: Number(
                              row.total_payment_received,
                            ),
                          }))}
                          margin={{ top: 10, right: 10, left: isMobile ? -5 : 0, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="name" fontSize={isMobile ? 9 : 11} />
                          <YAxis
                            tickFormatter={(v) => (v / 1e6).toLocaleString() + "M"}
                            fontSize={isMobile ? 9 : 11}
                          />
                          <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                          <Legend verticalAlign="top" height={36} iconType="circle" />
                          <Bar
                            dataKey={t("reports:salesPerformance.chart.signed")}
                            fill="#3b82f6"
                            radius={[4, 4, 0, 0]}
                          />
                          <Bar
                            dataKey={t("reports:salesPerformance.chart.received")}
                            fill="#10b981"
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>

                {/* Conversion Rates */}
                <Card className="col-span-1 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-sm font-semibold">
                      {t("reports:salesPerformance.conversion.title")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {quoteConversionData ? (
                      <>
                        <div className="text-center py-4 space-y-2">
                          <div className="inline-flex size-24 items-center justify-center rounded-full border-8 border-primary bg-primary/5 text-primary text-xl font-bold font-mono">
                            {quoteConversionData.conversion_rate}%
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {t("reports:salesPerformance.conversion.description")}
                          </p>
                        </div>
                        <div className="space-y-2.5 text-sm">
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">
                              {t("reports:salesPerformance.conversion.quotes_created")}
                            </span>
                            <span className="font-semibold">{quoteConversionData.quote_count}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">
                              {t("reports:salesPerformance.conversion.quotes_signed")}
                            </span>
                            <span className="font-semibold text-emerald-600">
                              {quoteConversionData.converted_count}
                            </span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="text-center text-xs text-muted-foreground py-10">
                        {t("reports:salesPerformance.conversion.no_data")}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* ── TAB 5: Sales Pipeline ────────────────────────────────────── */}
            <TabsContent value="pipeline" className="m-0 focus-visible:outline-none space-y-6">
              {pipelineData ? (
                <>
                  {/* Totals Summary */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="rounded-xl border bg-card p-5 flex flex-col items-center justify-center text-center space-y-1.5 shadow-sm">
                      <div className="text-xs text-muted-foreground font-semibold">
                        {t("reports:pipeline.summary.active_projects")}
                      </div>
                      <p className="text-3xl font-bold font-mono text-primary">
                        {pipelineData.totals.active_projects}
                      </p>
                    </div>
                    <div className="rounded-xl border bg-card p-5 flex flex-col items-center justify-center text-center space-y-1.5 shadow-sm">
                      <div className="text-xs text-muted-foreground font-semibold">
                        {t("reports:pipeline.summary.pending_quotes")}
                      </div>
                      <p className="text-3xl font-bold font-mono text-warning">
                        {pipelineData.totals.pending_quotes}
                      </p>
                    </div>
                    <div className="rounded-xl border bg-card p-5 flex flex-col items-center justify-center text-center space-y-1.5 shadow-sm">
                      <div className="text-xs text-muted-foreground font-semibold">
                        {t("reports:pipeline.summary.signed_contracts")}
                      </div>
                      <p className="text-3xl font-bold font-mono text-success">
                        {pipelineData.totals.signed_contracts}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Project Status Pie Chart */}
                    <Card className="shadow-sm">
                      <CardHeader>
                        <CardTitle className="text-sm font-semibold">
                          {t("reports:pipeline.charts.project_title")}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="h-[250px] flex items-center justify-center">
                        {pipelineData.projects_by_status.length === 0 ? (
                          <div className="text-xs text-muted-foreground">
                            {t("reports:pipeline.charts.project_no_data")}
                          </div>
                        ) : (
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={pipelineData.projects_by_status.map((item) => ({
                                  ...item,
                                  status:
                                    TRANSLATED_STATUSES[item.status.toLowerCase()] || item.status,
                                }))}
                                dataKey="count"
                                nameKey="status"
                                cx="50%"
                                cy="45%"
                                outerRadius={isMobile ? 50 : 70}
                                label={
                                  isMobile ? false : ({ name, value }: any) => `${name}: ${value}`
                                }
                              >
                                {pipelineData.projects_by_status.map((_, index) => (
                                  <Cell
                                    key={`cell-${index}`}
                                    fill={COLORS[index % COLORS.length]}
                                  />
                                ))}
                              </Pie>
                              <Tooltip
                                formatter={(value) => [
                                  t("reports:pipeline.charts.project_tooltip", {
                                    count: String(value),
                                  }),
                                  t("reports:pipeline.charts.quantity"),
                                ]}
                              />
                              <Legend
                                verticalAlign="bottom"
                                height={36}
                                iconType="circle"
                                wrapperStyle={{ fontSize: isMobile ? 11 : 12 }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        )}
                      </CardContent>
                    </Card>

                    {/* Quote Status Pie Chart */}
                    <Card className="shadow-sm">
                      <CardHeader>
                        <CardTitle className="text-sm font-semibold">
                          {t("reports:pipeline.charts.quote_title")}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="h-[250px] flex items-center justify-center">
                        {pipelineData.quotes_by_status.length === 0 ? (
                          <div className="text-xs text-muted-foreground">
                            {t("reports:pipeline.charts.quote_no_data")}
                          </div>
                        ) : (
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={pipelineData.quotes_by_status.map((item) => ({
                                  ...item,
                                  status:
                                    TRANSLATED_STATUSES[item.status.toLowerCase()] || item.status,
                                }))}
                                dataKey="count"
                                nameKey="status"
                                cx="50%"
                                cy="45%"
                                outerRadius={isMobile ? 50 : 70}
                                label={
                                  isMobile ? false : ({ name, value }: any) => `${name}: ${value}`
                                }
                              >
                                {pipelineData.quotes_by_status.map((_, index) => (
                                  <Cell
                                    key={`cell-${index}`}
                                    fill={COLORS[index % COLORS.length]}
                                  />
                                ))}
                              </Pie>
                              <Tooltip
                                formatter={(value) => [
                                  t("reports:pipeline.charts.quote_tooltip", {
                                    count: String(value),
                                  }),
                                  t("reports:pipeline.charts.quantity"),
                                ]}
                              />
                              <Legend
                                verticalAlign="bottom"
                                height={36}
                                iconType="circle"
                                wrapperStyle={{ fontSize: isMobile ? 11 : 12 }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </>
              ) : (
                <div className="text-center text-xs text-muted-foreground py-12">
                  {t("reports:pipeline.no_data")}
                </div>
              )}
            </TabsContent>
          </div>
        )}
      </Tabs>
    </div>
  )
}
