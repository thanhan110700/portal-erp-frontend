import { useEffect, useState } from "react"
import { MantineReactTable, useMantineReactTable, type MRT_ColumnDef } from "mantine-react-table"
import { useMemo } from "react"
import { Calendar, Receipt, Info } from "lucide-react"

import { projectApi } from "../api/projectApi"
import { toast } from "sonner"
import { StatusBadge } from "@/components/common/StatusBadge"
import { TablePagination } from "@/components/common/TablePagination"
import { MobileActionHeader } from "@/components/common/MobileActionHeader"
import { MobileCardList } from "@/components/common/MobileCardList"
import { useTranslation } from "react-i18next"
import type { ProjectVoucher } from "../types/project"

interface ProjectVouchersTabProps {
  projectId: number
}

export function ProjectVouchersTab({ projectId }: ProjectVouchersTabProps) {
  const { t } = useTranslation(["projects", "common"])
  const [vouchers, setVouchers] = useState<ProjectVoucher[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalRecords, setTotalRecords] = useState(0)
  const perPage = 10

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        const res = await projectApi.listVouchers(projectId, { page, per_page: perPage })
        setVouchers(res.data || [])
        setTotalRecords(res.meta?.total || 0)
      } catch (err) {
        console.error(err)
        toast.error(t("projects:vouchers.fetch_error"))
      } finally {
        setIsLoading(false)
      }
    }
    void loadData()
  }, [projectId, page, t])

  const columns = useMemo<MRT_ColumnDef<ProjectVoucher>[]>(
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
      <MobileActionHeader
        title={t("projects:vouchers.title")}
        subtitle={`(${totalRecords})`}
        actions={
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Info className="size-3.5 shrink-0" />{" "}
            <span className="hidden md:inline">{t("projects:vouchers.info")}</span>
          </span>
        }
      />

      <MobileCardList
        data={vouchers}
        keyExtractor={(voucher) => voucher.id}
        emptyIcon={Receipt}
        emptyTitle={t("common:table.noData", { defaultValue: "Không có dữ liệu" })}
        renderCard={(voucher) => {
          const isReceipt = voucher.voucher_type === "receipt"
          return (
            <div className="rounded-xl border bg-card p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
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
                    <span className="font-mono text-sm font-semibold">{voucher.voucher_code}</span>
                  </div>
                  <div className="mt-2">
                    <StatusBadge status={voucher.status} />
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                    {voucher.description || voucher.notes || "—"}
                  </p>
                </div>
                <div
                  className={`text-right font-mono font-semibold ${
                    isReceipt ? "text-emerald-600" : "text-rose-600"
                  }`}
                >
                  {isReceipt ? "+" : "-"}
                  {Number(voucher.amount).toLocaleString("vi-VN")} VNĐ
                </div>
              </div>
              <div className="mt-3 flex items-center text-xs text-muted-foreground border-t pt-3">
                <div className="flex items-center gap-1.5">
                  <Calendar className="size-3.5" />
                  <span>{voucher.voucher_date}</span>
                </div>
              </div>
            </div>
          )
        }}
        desktopTable={
          <div className="rounded-xl border bg-card overflow-hidden">
            <MantineReactTable table={table} />
          </div>
        }
      />
      {totalRecords > 0 && (
        <TablePagination
          page={page}
          perPage={perPage}
          total={totalRecords}
          totalPages={Math.ceil(totalRecords / perPage)}
          onPageChange={setPage}
        />
      )}
    </div>
  )
}
