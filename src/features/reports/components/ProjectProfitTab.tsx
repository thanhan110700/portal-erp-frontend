import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { MantineReactTable, useMantineReactTable, type MRT_ColumnDef } from "mantine-react-table"
import { Card, CardContent } from "@/components/ui/card"
import { MobileCardList } from "@/components/common/MobileCardList"
import type { ProjectProfitRow } from "../api/reportApi"

interface ProjectProfitTabProps {
  data: ProjectProfitRow[]
}

export function ProjectProfitTab({ data }: ProjectProfitTabProps) {
  const { t } = useTranslation(["reports", "common"])

  const columns = useMemo<MRT_ColumnDef<ProjectProfitRow>[]>(
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

  return (
    <Card className="shadow-sm">
      <CardContent className="p-0 sm:p-6 sm:pt-0">
        <MobileCardList
          data={data}
          isLoading={false}
          keyExtractor={(item) => item.project_code}
          className="p-4 sm:p-0"
          renderCard={(row) => {
            const contract = Number(row.contract_value || 0)
            const profit = Number(row.profit || 0)
            const margin = contract > 0 ? (profit / contract) * 100 : 0
            const positive = profit >= 0

            return (
              <div className="flex flex-col gap-2 rounded-xl border p-4 shadow-sm">
                <div className="flex justify-between items-start gap-2">
                  <div className="font-semibold text-sm line-clamp-2">{row.project_name}</div>
                  <div className="font-mono text-xs font-semibold whitespace-nowrap">
                    {row.project_code}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm mt-2">
                  <div>
                    <div className="text-muted-foreground text-xs">
                      {t("reports:projectProfit.columns.received")}
                    </div>
                    <div className="font-mono text-emerald-600 font-medium">
                      {Number(row.total_received || 0).toLocaleString("vi-VN")} ₫
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-xs">
                      {t("reports:projectProfit.columns.spent")}
                    </div>
                    <div className="font-mono text-rose-600 font-medium">
                      {Number(row.total_spent || 0).toLocaleString("vi-VN")} ₫
                    </div>
                  </div>
                </div>

                <div className="pt-2 mt-1 border-t flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-xs">
                      {t("reports:projectProfit.columns.profit")}
                    </span>
                    <span
                      className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold ${positive ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}
                    >
                      {margin.toFixed(1)}%
                    </span>
                  </div>
                  <div
                    className={`font-mono font-bold ${positive ? "text-emerald-600" : "text-rose-600"}`}
                  >
                    {profit.toLocaleString("vi-VN")} ₫
                  </div>
                </div>
              </div>
            )
          }}
          desktopTable={
            <div className="rounded-xl overflow-hidden hidden sm:block border">
              <MantineReactTable table={table} />
            </div>
          }
        />
      </CardContent>
    </Card>
  )
}
