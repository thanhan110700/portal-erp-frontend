import { useTranslation } from "react-i18next"
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useIsMobile } from "@/hooks/useMobile"
import type { SalesPipelineData } from "../api/reportApi"

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

interface PipelineTabProps {
  pipelineData: SalesPipelineData | null
}

export function PipelineTab({ pipelineData }: PipelineTabProps) {
  const { t } = useTranslation(["reports", "common"])
  const isMobile = useIsMobile()

  if (!pipelineData) {
    return (
      <div className="text-center text-xs text-muted-foreground py-12">
        {t("reports:pipeline.no_data")}
      </div>
    )
  }

  return (
    <div className="space-y-6">
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
                      status: TRANSLATED_STATUSES[item.status.toLowerCase()] || item.status,
                    }))}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="45%"
                    outerRadius={isMobile ? 70 : 80}
                    label={isMobile ? false : ({ name, value }: any) => `$${name}: ${value}`}
                  >
                    {pipelineData.projects_by_status.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
                      status: TRANSLATED_STATUSES[item.status.toLowerCase()] || item.status,
                    }))}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="45%"
                    outerRadius={isMobile ? 70 : 80}
                    label={isMobile ? false : ({ name, value }: any) => `$${name}: ${value}`}
                  >
                    {pipelineData.quotes_by_status.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
    </div>
  )
}
