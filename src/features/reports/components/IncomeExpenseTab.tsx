import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { MantineReactTable, useMantineReactTable, type MRT_ColumnDef } from "mantine-react-table"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { BarChart3 } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MobileCardList } from "@/components/common/MobileCardList"
import { useIsMobile } from "@/hooks/useMobile"
import type { IncomeExpenseRow } from "../api/reportApi"

interface IncomeExpenseTabProps {
  data: IncomeExpenseRow[]
  formatCurrency: (val: string | number) => string
}

export function IncomeExpenseTab({ data, formatCurrency }: IncomeExpenseTabProps) {
  const { t } = useTranslation(["reports", "common"])
  const isMobile = useIsMobile()

  const columns = useMemo<MRT_ColumnDef<IncomeExpenseRow>[]>(
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
    [t],
  )

  const table = useMantineReactTable({
    renderEmptyRowsFallback: () => (
      <div className="p-8 text-center text-muted-foreground">
        {t("common:table.noData", { defaultValue: "Không có dữ liệu" })}
      </div>
    ),
    columns,
    data,
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
  })

  const totalIn = data.reduce((acc, curr) => acc + Number(curr.income), 0)
  const totalOut = data.reduce((acc, curr) => acc + Number(curr.expense), 0)
  const totalNet = totalIn - totalOut

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-y-6 md:gap-6">
        <Card className="col-span-2 shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
              <BarChart3 className="size-4 text-primary" /> {t("reports:incomeExpense.chart.title")}
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[250px] md:h-[300px]">
            {data.length === 0 ? (
              <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                {t("reports:incomeExpense.chart.no_data")}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={data.map((row) => ({
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
            <div className="rounded-lg bg-emerald-50 p-4 flex flex-col items-center justify-center text-center space-y-1">
              <div className="text-xs font-semibold text-emerald-600">
                {t("reports:incomeExpense.summary.total_income")}
              </div>
              <div className="text-lg font-bold font-mono text-emerald-700">
                {totalIn.toLocaleString("vi-VN")} ₫
              </div>
            </div>
            <div className="rounded-lg bg-rose-50 p-4 flex flex-col items-center justify-center text-center space-y-1">
              <div className="text-xs font-semibold text-rose-600">
                {t("reports:incomeExpense.summary.total_expense")}
              </div>
              <div className="text-lg font-bold font-mono text-rose-700">
                {totalOut.toLocaleString("vi-VN")} ₫
              </div>
            </div>
            <div
              className={`rounded-lg p-4 flex flex-col items-center justify-center text-center space-y-1 ${totalNet >= 0 ? "bg-blue-50" : "bg-orange-50"}`}
            >
              <div className="text-xs font-semibold text-muted-foreground">
                {t("reports:incomeExpense.summary.total_net")}
              </div>
              <div
                className={`text-lg font-bold font-mono ${totalNet >= 0 ? "text-blue-700" : "text-orange-700"}`}
              >
                {totalNet.toLocaleString("vi-VN")} ₫
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-0 sm:p-6 sm:pt-0">
          <MobileCardList
            data={data}
            isLoading={false}
            keyExtractor={(item) => `$${item.month}-${item.year}`}
            className="p-4 sm:p-0"
            renderCard={(row) => (
              <div className="flex flex-col gap-2 rounded-xl border p-4 shadow-sm">
                <div className="font-semibold text-sm">
                  {t("reports:incomeExpense.columns.month", { month: row.month, year: row.year })}
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm mt-1">
                  <div>
                    <div className="text-muted-foreground text-xs">
                      {t("reports:incomeExpense.columns.income")}
                    </div>
                    <div className="font-mono text-emerald-600 font-medium">
                      {Number(row.income).toLocaleString("vi-VN")} ₫
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-xs">
                      {t("reports:incomeExpense.columns.expense")}
                    </div>
                    <div className="font-mono text-rose-600 font-medium">
                      {Number(row.expense).toLocaleString("vi-VN")} ₫
                    </div>
                  </div>
                </div>
                <div className="pt-2 mt-1 border-t flex justify-between items-center">
                  <div className="text-muted-foreground text-xs">
                    {t("reports:incomeExpense.columns.net")}
                  </div>
                  <div
                    className={`font-mono font-bold ${Number(row.net) >= 0 ? "text-blue-600" : "text-orange-600"}`}
                  >
                    {Number(row.net).toLocaleString("vi-VN")} ₫
                  </div>
                </div>
              </div>
            )}
            desktopTable={
              <div className="rounded-xl overflow-hidden hidden sm:block border">
                <MantineReactTable table={table} />
              </div>
            }
          />
        </CardContent>
      </Card>
    </div>
  )
}
