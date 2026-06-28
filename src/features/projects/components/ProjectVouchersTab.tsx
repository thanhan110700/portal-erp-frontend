import { useEffect, useState } from "react"
import { MantineReactTable, useMantineReactTable, type MRT_ColumnDef } from "mantine-react-table"
import { useMemo } from "react"
import { Calendar, Receipt, Info } from "lucide-react"

import { projectApi } from "../api/projectApi"
import { toast } from "sonner"
import { StatusBadge } from "@/components/common/StatusBadge"
import { useTranslation } from "react-i18next"

interface ProjectVouchersTabProps {
  projectId: number
}

export function ProjectVouchersTab({ projectId }: ProjectVouchersTabProps) {
  const { t } = useTranslation(["projects", "common"])
  const [vouchers, setVouchers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    projectApi
      .listVouchers(projectId)
      .then((data) => {
        setVouchers(data || [])
      })
      .catch((err) => {
        console.error(err)
        toast.error(t("projects:vouchers.fetch_error"))
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [projectId, t])

  const columns = useMemo<MRT_ColumnDef<any>[]>(
    () => [
      {
        accessorKey: "voucher_code",
        header: t("projects:vouchers.columns.code"),
        size: 140,
        Cell: ({ cell }) => (
          <span className="font-semibold text-foreground">{cell.getValue<string>()}</span>
        ),
      },
      {
        accessorKey: "voucher_type",
        header: t("projects:vouchers.columns.type"),
        size: 130,
        Cell: ({ cell }) => {
          const type = cell.getValue<string>()
          const isReceipt = type === "receipt"
          return (
            <span
              className={`inline-flex items-center gap-1 text-xs font-semibold ${
                isReceipt ? "text-emerald-600" : "text-rose-600"
              }`}
            >
              <Receipt className="size-3.5" />
              {isReceipt
                ? t("projects:vouchers.types.receipt")
                : t("projects:vouchers.types.payment")}
            </span>
          )
        },
      },
      {
        accessorKey: "voucher_date",
        header: t("projects:vouchers.columns.date"),
        size: 150,
        Cell: ({ cell }) => (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Calendar className="size-4 shrink-0" />
            <span>{cell.getValue<string>()}</span>
          </div>
        ),
      },
      {
        accessorKey: "amount",
        header: t("projects:vouchers.columns.amount"),
        size: 160,
        Cell: ({ row }) => {
          const isReceipt = row.original.voucher_type === "receipt"
          return (
            <div
              className={`text-right font-mono font-semibold ${
                isReceipt ? "text-emerald-600" : "text-rose-600"
              }`}
            >
              {isReceipt ? "+" : "-"}
              {Number(row.original.amount).toLocaleString("vi-VN")} VNĐ
            </div>
          )
        },
      },
      {
        accessorKey: "status",
        header: t("projects:vouchers.columns.status"),
        size: 130,
        Cell: ({ cell }) => {
          const status = cell.getValue<string>()
          return (
            <div className="flex justify-center">
              <StatusBadge status={status} />
            </div>
          )
        },
      },
      {
        id: "description",
        header: t("projects:vouchers.columns.description"),
        size: 300,
        Cell: ({ row }) => (
          <span
            className="text-muted-foreground truncate"
            title={row.original.description || row.original.notes || ""}
          >
            {row.original.description || row.original.notes || "—"}
          </span>
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
    data: vouchers,
    enableColumnActions: false,
    enableColumnFilters: false,
    enablePagination: false,
    enableSorting: false,
    enableBottomToolbar: false,
    enableTopToolbar: false,
    enableFullScreenToggle: false,
    state: {
      isLoading,
    },
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
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">
          {t("projects:vouchers.title")} ({vouchers.length})
        </h3>
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <Info className="size-3.5" /> {t("projects:vouchers.info")}
        </span>
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        <MantineReactTable table={table} />
      </div>
    </div>
  )
}
