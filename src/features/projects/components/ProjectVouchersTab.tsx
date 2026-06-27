import { useEffect, useState } from "react"
import { MantineReactTable, useMantineReactTable, type MRT_ColumnDef } from "mantine-react-table"
import { useMemo } from "react"
import { Calendar, Receipt, Info } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { projectApi } from "../api/projectApi"
import { toast } from "sonner"

interface ProjectVouchersTabProps {
  projectId: number
}

const STATUS_VARIANTS: Record<string, any> = {
  draft: "secondary",
  pending: "warning",
  approved: "success",
  rejected: "danger",
}

const STATUS_LABELS: Record<string, string> = {
  draft: "Lưu nháp",
  pending: "Chờ duyệt",
  approved: "Đã duyệt",
  rejected: "Từ chối",
}

export function ProjectVouchersTab({ projectId }: ProjectVouchersTabProps) {
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
        toast.error("Không thể tải danh sách chứng từ")
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [projectId])

  const columns = useMemo<MRT_ColumnDef<any>[]>(
    () => [
      {
        accessorKey: "voucher_code",
        header: "Mã chứng từ",
        size: 140,
        Cell: ({ cell }) => (
          <span className="font-semibold text-foreground">{cell.getValue<string>()}</span>
        ),
      },
      {
        accessorKey: "voucher_type",
        header: "Loại",
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
              {isReceipt ? "Thu tiền" : "Chi tiền"}
            </span>
          )
        },
      },
      {
        accessorKey: "voucher_date",
        header: "Ngày chứng từ",
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
        header: "Số tiền",
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
        header: "Trạng thái",
        size: 130,
        Cell: ({ cell }) => {
          const status = cell.getValue<string>()
          return (
            <div className="flex justify-center">
              <Badge variant={STATUS_VARIANTS[status] || "default"}>
                {STATUS_LABELS[status] || status}
              </Badge>
            </div>
          )
        },
      },
      {
        id: "description",
        header: "Diễn giải / Ghi chú",
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
    [],
  )

  const table = useMantineReactTable({
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
        <h3 className="text-lg font-semibold">Chứng từ liên quan ({vouchers.length})</h3>
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <Info className="size-3.5" /> Chỉ xem liên kết. Quản lý chứng từ tại phân hệ Tài chính.
        </span>
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        <MantineReactTable table={table} />
      </div>
    </div>
  )
}
