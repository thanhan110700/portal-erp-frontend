import { useTranslation } from "react-i18next"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { Users } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useIsMobile } from "@/hooks/useMobile"
import type { SalesRevenueRow, QuoteConversionData } from "../api/reportApi"

interface SalesPerformanceTabProps {
  salesRevenueData: SalesRevenueRow[]
  quoteConversionData: QuoteConversionData | null
  formatCurrency: (val: string | number) => string
}

export function SalesPerformanceTab({
  salesRevenueData,
  quoteConversionData,
  formatCurrency,
}: SalesPerformanceTabProps) {
  const { t } = useTranslation(["reports", "common"])
  const isMobile = useIsMobile()

  return (
    <div className="space-y-6">
      {salesRevenueData.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...salesRevenueData]
            .sort((a, b) => Number(b.total_contract_value) - Number(a.total_contract_value))
            .slice(0, 3)
            .map((row, index) => (
              <div key={row.sales_rep.id} className="rounded-xl border bg-card p-5">
                <p className="text-xs font-semibold text-muted-foreground">
                  {t("reports:salesPerformance.top_performer", {
                    rank: index + 1,
                    defaultValue: `Top performer #${index + 1}`,
                  })}
                </p>
                <p className="mt-1 font-semibold">{row.sales_rep.full_name}</p>
                <p className="mt-2 font-mono text-lg font-bold text-primary">
                  {Number(row.total_contract_value).toLocaleString("vi-VN")} ₫
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("reports:salesPerformance.contract_count", {
                    count: row.contract_count,
                    defaultValue: `$${row.contract_count} hợp đồng`,
                  })}
                </p>
              </div>
            ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-y-6 md:gap-6">
        {/* Rep Revenue Chart */}
        <Card className="col-span-2 shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
              <Users className="size-4 text-primary" /> {t("reports:salesPerformance.chart.title")}
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[250px] md:h-[300px]">
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
                    [t("reports:salesPerformance.chart.signed")]: Number(row.total_contract_value),
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
    </div>
  )
}
