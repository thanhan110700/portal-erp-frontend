import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { MantineReactTable, useMantineReactTable, type MRT_ColumnDef } from "mantine-react-table"
import { AlertCircle } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { MobileCardList } from "@/components/common/MobileCardList"
import type { ReceivableRow } from "../api/reportApi"

interface ReceivablesTabProps {
  data: ReceivableRow[]
}

export function ReceivablesTab({ data }: ReceivablesTabProps) {
  const { t } = useTranslation(["reports", "common"])

  const columns = useMemo<MRT_ColumnDef<ReceivableRow>[]>(
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

  const totalOutstanding = data.reduce((acc, c) => acc + Number(c.payment_outstanding), 0)
  const totalContract = data.reduce((acc, c) => acc + Number(c.contract_value), 0)
  const totalReceived = totalContract - totalOutstanding

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <div className="rounded-xl border bg-card p-5 flex flex-col items-center justify-center text-center space-y-2">
          <div className="text-xs text-muted-foreground font-semibold">
            {t("reports:receivables.summary.outstanding")}
          </div>
          <p className="text-xl font-bold font-mono">{totalContract.toLocaleString("vi-VN")} ₫</p>
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
            <AlertCircle className="size-4" /> {t("reports:receivables.summary.unpaid")}
          </div>
          <p className="text-xl font-bold font-mono text-orange-600">
            {totalOutstanding.toLocaleString("vi-VN")} ₫
          </p>
        </div>
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-0 sm:p-6 sm:pt-0">
          <MobileCardList
            data={data}
            isLoading={false}
            keyExtractor={(item) => item.contract_code}
            className="p-4 sm:p-0"
            renderCard={(row) => (
              <div className="flex flex-col gap-2 rounded-xl border p-4 shadow-sm">
                <div className="flex justify-between items-start">
                  <div className="font-semibold text-sm">{row.contract_code}</div>
                  <div className="text-xs text-muted-foreground">{row.contract_date}</div>
                </div>
                <div className="text-sm">{row.customer_name}</div>
                <div className="text-xs text-muted-foreground">{row.sales_rep_name}</div>

                <div className="grid grid-cols-2 gap-2 text-sm mt-2">
                  <div>
                    <div className="text-muted-foreground text-xs">
                      {t("reports:receivables.columns.value")}
                    </div>
                    <div className="font-mono font-medium">
                      {Number(row.contract_value).toLocaleString("vi-VN")} ₫
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-xs">
                      {t("reports:receivables.columns.received")}
                    </div>
                    <div className="font-mono text-emerald-600 font-medium">
                      {Number(row.payment_received).toLocaleString("vi-VN")} ₫
                    </div>
                  </div>
                </div>
                <div className="pt-2 mt-1 border-t flex justify-between items-center">
                  <div className="text-muted-foreground text-xs">
                    {t("reports:receivables.columns.outstanding")}
                  </div>
                  <div className="font-mono font-bold text-orange-600">
                    {Number(row.payment_outstanding).toLocaleString("vi-VN")} ₫
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
