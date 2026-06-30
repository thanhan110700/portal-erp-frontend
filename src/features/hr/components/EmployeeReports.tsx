import { useEffect, useState, useMemo } from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { MantineReactTable, useMantineReactTable } from "mantine-react-table"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FilterPanel, type FilterFieldDef } from "@/components/common/FilterPanel"
import type { MRT_ColumnDef } from "mantine-react-table"
import {
  employeeReportApi,
  type EmployeeProjectProfitRow,
  type EmployeeReceivableRow,
} from "@/features/reports/api/reportApi"
import { useTranslation } from "react-i18next"

interface EmployeeReportsProps {
  employeeId: number
}

const formatCurrency = (value: number | string) => {
  const num = Number(value)
  if (isNaN(num)) return "0 ₫"
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(num)
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border rounded-lg shadow-lg p-3 text-sm">
        <p className="font-semibold mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 mb-1">
            <div className="size-3 rounded-sm" style={{ backgroundColor: entry.color }} />
            <span className="text-muted-foreground">{entry.name}:</span>
            <span className="font-medium">{formatCurrency(entry.value)}</span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

export function EmployeeReports({ employeeId }: EmployeeReportsProps) {
  const { t } = useTranslation(["hr", "common"])
  const [incomeData, setIncomeData] = useState<any[]>([])
  const [projectProfitData, setProjectProfitData] = useState<EmployeeProjectProfitRow[]>([])
  const [receivablesData, setReceivablesData] = useState<EmployeeReceivableRow[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [dateFrom, setDateFrom] = useState<string>("")
  const [dateTo, setDateTo] = useState<string>("")

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const params = {
          date_from: dateFrom || undefined,
          date_to: dateTo || undefined,
        }
        const [inc, proj, rec] = await Promise.all([
          employeeReportApi.getIncomeExpense(employeeId, params),
          employeeReportApi.getProjectProfit(employeeId, params),
          employeeReportApi.getReceivables(employeeId, params),
        ])

        // Format for Recharts
        const formattedInc = inc.map((row) => ({
          name: t("hr:employees.reports.income_expense.month_format", {
            month: row.month,
            year: row.year,
          }),
          [t("hr:employees.reports.income_expense.income")]: Number(row.income),
          [t("hr:employees.reports.income_expense.expense")]: Number(row.expense),
          [t("hr:employees.reports.income_expense.net")]: Number(row.net),
        }))
        setIncomeData(formattedInc)
        setProjectProfitData(proj)
        setReceivablesData(rec)
      } catch (error) {
        console.error("Failed to fetch employee reports", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (employeeId) {
      fetchData()
    }
  }, [employeeId, dateFrom, dateTo, t])

  const filterFields = useMemo<FilterFieldDef[]>(
    () => [
      {
        field: "date_from",
        label: t("reports:filters.dateFrom", { defaultValue: "Từ ngày" }),
        type: "datepicker",
        value: dateFrom || null,
      },
      {
        field: "date_to",
        label: t("reports:filters.dateTo", { defaultValue: "Đến ngày" }),
        type: "datepicker",
        value: dateTo || null,
      },
    ],
    [dateFrom, dateTo, t],
  )

  const handleApplyFilters = (values: Record<string, unknown>) => {
    setDateFrom((values.date_from as string | null) ?? "")
    setDateTo((values.date_to as string | null) ?? "")
  }

  const handleResetFilters = () => {
    setDateFrom("")
    setDateTo("")
  }

  const projectColumns = useMemo<MRT_ColumnDef<EmployeeProjectProfitRow>[]>(
    () => [
      {
        accessorKey: "project_code",
        header: t("hr:employees.reports.projects.project_code"),
        size: 100,
      },
      {
        accessorKey: "project_name",
        header: t("hr:employees.reports.projects.project_name"),
        size: 200,
      },
      {
        accessorKey: "contract_value",
        header: t("hr:employees.reports.projects.contract_value"),
        Cell: ({ cell }: any) => formatCurrency(cell.getValue()),
      },
      {
        accessorKey: "total_received",
        header: t("hr:employees.reports.projects.total_received"),
        Cell: ({ cell }: any) => formatCurrency(cell.getValue()),
      },
      {
        accessorKey: "total_spent",
        header: t("hr:employees.reports.projects.total_spent"),
        Cell: ({ cell }: any) => formatCurrency(cell.getValue()),
      },
      {
        accessorKey: "profit",
        header: t("hr:employees.reports.projects.profit"),
        Cell: ({ cell }: any) => (
          <span
            className={
              Number(cell.getValue()) >= 0
                ? "text-green-600 font-medium"
                : "text-red-600 font-medium"
            }
          >
            {formatCurrency(cell.getValue())}
          </span>
        ),
      },
    ],
    [t],
  )

  const receivablesColumns = useMemo<MRT_ColumnDef<EmployeeReceivableRow>[]>(
    () => [
      {
        accessorKey: "contract_code",
        header: t("hr:employees.reports.receivables.contract_code"),
        size: 100,
      },
      {
        accessorKey: "customer_name",
        header: t("hr:employees.reports.receivables.customer_name"),
        size: 180,
      },
      {
        accessorKey: "contract_value",
        header: t("hr:employees.reports.receivables.contract_value"),
        Cell: ({ cell }: any) => formatCurrency(cell.getValue()),
      },
      {
        accessorKey: "payment_received",
        header: t("hr:employees.reports.receivables.payment_received"),
        Cell: ({ cell }: any) => formatCurrency(cell.getValue()),
      },
      {
        accessorKey: "payment_outstanding",
        header: t("hr:employees.reports.receivables.payment_outstanding"),
        Cell: ({ cell }: any) => (
          <span
            className={
              Number(cell.getValue()) > 0 ? "text-orange-600 font-medium" : "text-muted-foreground"
            }
          >
            {formatCurrency(cell.getValue())}
          </span>
        ),
      },
    ],
    [t],
  )

  const projectTable = useMantineReactTable({
    renderEmptyRowsFallback: () => (
      <div className="p-8 text-center text-muted-foreground">
        {t("common:table.noData", { defaultValue: "Không có dữ liệu" })}
      </div>
    ),
    columns: projectColumns,
    data: projectProfitData,
    enableColumnActions: false,
    enableColumnFilters: false,
    enablePagination: false,
    enableSorting: true,
    enableBottomToolbar: false,
    enableTopToolbar: false,
    state: { isLoading },
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

  const receivablesTable = useMantineReactTable({
    renderEmptyRowsFallback: () => (
      <div className="p-8 text-center text-muted-foreground">
        {t("common:table.noData", { defaultValue: "Không có dữ liệu" })}
      </div>
    ),
    columns: receivablesColumns,
    data: receivablesData,
    enableColumnActions: false,
    enableColumnFilters: false,
    enablePagination: false,
    enableSorting: true,
    enableBottomToolbar: false,
    enableTopToolbar: false,
    state: { isLoading },
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
    <Card className="rounded-xl border bg-card w-full">
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-semibold">{t("hr:employees.reports.title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <FilterPanel
          applyMode
          fields={filterFields}
          onApply={handleApplyFilters}
          onReset={handleResetFilters}
          title={t("common:actions.filter", { defaultValue: "Bộ lọc" })}
          className="mb-4"
        />

        <Tabs defaultValue="income" className="w-full">
          <TabsList className="mb-4 w-full justify-start h-auto p-1 flex overflow-x-auto [&::-webkit-scrollbar]:hidden">
            <TabsTrigger value="income" className="min-h-11 md:min-h-9 whitespace-nowrap px-4">
              {t("hr:employees.reports.tabs.income")}
            </TabsTrigger>
            <TabsTrigger value="projects" className="min-h-11 md:min-h-9 whitespace-nowrap px-4">
              {t("hr:employees.reports.tabs.projects")}
            </TabsTrigger>
            <TabsTrigger value="receivables" className="min-h-11 md:min-h-9 whitespace-nowrap px-4">
              {t("hr:employees.reports.tabs.receivables")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="income" className="mt-0">
            {isLoading ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                {t("common:table.loading")}
              </div>
            ) : incomeData.length > 0 ? (
              <div className="h-[350px] w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={incomeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#6b7280", fontSize: 12 }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#6b7280", fontSize: 12 }}
                      tickFormatter={(val) => {
                        if (val >= 1000000000) return `${(val / 1000000000).toFixed(1)}B`
                        if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`
                        return val
                      }}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(0,0,0,0.05)" }} />
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: "20px" }} />
                    <Bar
                      dataKey={t("hr:employees.reports.income_expense.income")}
                      fill="#3b82f6"
                      radius={[4, 4, 0, 0]}
                      barSize={32}
                    />
                    <Bar
                      dataKey={t("hr:employees.reports.income_expense.expense")}
                      fill="#ef4444"
                      radius={[4, 4, 0, 0]}
                      barSize={32}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                {t("hr:employees.reports.income_expense.no_data")}
              </div>
            )}
          </TabsContent>

          <TabsContent value="projects" className="mt-0">
            <div className="rounded-xl border overflow-hidden">
              <MantineReactTable table={projectTable} />
            </div>
          </TabsContent>

          <TabsContent value="receivables" className="mt-0">
            <div className="rounded-xl border overflow-hidden">
              <MantineReactTable table={receivablesTable} />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
