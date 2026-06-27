import { useEffect, useState, useCallback, useMemo } from "react"
import { MantineReactTable, useMantineReactTable, type MRT_ColumnDef } from "mantine-react-table"
import { Plus, Trash2, Edit2, History, Paperclip, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FilterPanel, type FilterFieldDef } from "@/components/common/FilterPanel"
import { TablePagination } from "@/components/common/TablePagination"
import { useAuthStore } from "@/hooks/useAuthStore"
import { voucherApi } from "../api/voucherApi"
import type { Voucher, ListVouchersParams } from "../types/voucher"
import { VoucherFormModal } from "../components/VoucherFormModal"
import { VoucherHistoryDialog } from "../components/VoucherHistoryDialog"
import { VoucherAttachmentsDialog } from "../components/VoucherAttachmentsDialog"
import { toast } from "sonner"

const STATUS_VARIANTS: Record<string, any> = {
  draft: "secondary",
  pending: "warning",
  approved: "success",
  paid: "info",
  rejected: "danger",
  cancelled: "muted",
}

const STATUS_LABELS: Record<string, string> = {
  draft: "Lưu nháp",
  pending: "Chờ duyệt",
  approved: "Đã duyệt",
  paid: "Đã chi",
  rejected: "Từ chối",
  cancelled: "Đã hủy",
}

export function VoucherListPage() {
  const user = useAuthStore((s) => s.user)
  const isAdmin = user?.roles?.includes("admin") ?? false
  const isDirector = user?.roles?.includes("director") ?? false
  const isFinance = user?.roles?.includes("finance") ?? false
  const canEdit = isAdmin || isFinance || isDirector
  const canApprove = isAdmin || isDirector

  const [vouchers, setVouchers] = useState<Voucher[]>([])
  const [loading, setLoading] = useState(true)
  const [totalItems, setTotalItems] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(15)

  // Filters state
  const [filters, setFilters] = useState<Record<string, any>>({
    search: "",
    voucher_type: "",
    status: "",
    date_from: "",
    date_to: "",
  })

  // Modals state
  const [formOpen, setFormOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [attachmentsOpen, setAttachmentsOpen] = useState(false)
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null)

  const fetchVouchers = useCallback(async () => {
    setLoading(true)
    try {
      const params: ListVouchersParams = {
        page: currentPage,
        per_page: pageSize,
        search: filters.search || undefined,
        voucher_type: filters.voucher_type || undefined,
        status: filters.status || undefined,
        date_from: filters.date_from || undefined,
        date_to: filters.date_to || undefined,
      }
      const data = await voucherApi.list(params)
      setVouchers(data.data || [])
      setTotalItems(data.meta?.total || 0)
    } catch {
      toast.error("Không thể tải danh sách chứng từ")
    } finally {
      setLoading(false)
    }
  }, [currentPage, pageSize, filters])

  useEffect(() => {
    void fetchVouchers()
  }, [fetchVouchers])

  const handleCreateOrUpdate = async (payload: any) => {
    try {
      if (selectedVoucher) {
        await voucherApi.update(selectedVoucher.id, payload)
        toast.success("Cập nhật chứng từ thành công")
      } else {
        await voucherApi.create(payload)
        toast.success("Lập chứng từ thành công")
      }
      setFormOpen(false)
      void fetchVouchers()
    } catch (err: any) {
      const errMsg = err.response?.data?.message || "Lỗi xử lý chứng từ"
      toast.error(errMsg)
    }
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa chứng từ này?")) return
    try {
      await voucherApi.delete(id)
      toast.success("Đã xóa chứng từ")
      void fetchVouchers()
    } catch {
      toast.error("Xóa chứng từ thất bại")
    }
  }

  const handleApprove = async (id: number) => {
    try {
      await voucherApi.approve(id, "approve")
      toast.success("Đã phê duyệt chứng từ")
      void fetchVouchers()
    } catch (err: any) {
      const errMsg = err.response?.data?.message || "Duyệt thất bại"
      toast.error(errMsg)
    }
  }

  const handleReject = async (id: number) => {
    const reason = window.prompt("Nhập lý do từ chối (bắt buộc):")
    if (reason === null) return
    if (!reason.trim()) {
      toast.error("Lý do từ chối không được bỏ trống")
      return
    }
    try {
      await voucherApi.approve(id, "reject", reason)
      toast.success("Đã từ chối chứng từ")
      void fetchVouchers()
    } catch (err: any) {
      const errMsg = err.response?.data?.message || "Từ chối thất bại"
      toast.error(errMsg)
    }
  }

  const handleFilterSubmit = (newFilters: Record<string, any>) => {
    setFilters(newFilters)
    setCurrentPage(1)
  }

  const filterFields = useMemo<FilterFieldDef[]>(() => {
    return [
      {
        field: "search",
        label: "Tìm kiếm",
        type: "input",
        placeholder: "Mã chứng từ, lý do...",
        value: filters.search || "",
      },
      {
        field: "voucher_type",
        label: "Loại giao dịch",
        type: "select",
        placeholder: "Tất cả",
        value: filters.voucher_type || null,
        options: [
          { label: "Thu tiền (Receipt)", value: "receipt" },
          { label: "Chi tiền (Payment)", value: "payment" },
        ],
      },
      {
        field: "status",
        label: "Trạng thái",
        type: "select",
        placeholder: "Tất cả",
        value: filters.status || null,
        options: [
          { label: "Lưu nháp", value: "draft" },
          { label: "Chờ duyệt", value: "pending" },
          { label: "Đã duyệt", value: "approved" },
          { label: "Đã chi/nhận", value: "paid" },
          { label: "Từ chối", value: "rejected" },
          { label: "Đã hủy", value: "cancelled" },
        ],
      },
      {
        field: "date_from",
        label: "Từ ngày",
        type: "datepicker",
        value: filters.date_from || null,
      },
      {
        field: "date_to",
        label: "Đến ngày",
        type: "datepicker",
        value: filters.date_to || null,
      },
    ]
  }, [filters])

  const columns = useMemo<MRT_ColumnDef<Voucher>[]>(
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
        size: 120,
        Cell: ({ cell }) => {
          const type = cell.getValue<string>()
          const isReceipt = type === "receipt"
          return (
            <span
              className={
                isReceipt ? "text-emerald-600 font-semibold" : "text-rose-600 font-semibold"
              }
            >
              {isReceipt ? "Thu tiền" : "Chi tiền"}
            </span>
          )
        },
      },
      {
        accessorKey: "voucher_date",
        header: "Ngày",
        size: 120,
        Cell: ({ cell }) => (
          <span className="text-muted-foreground whitespace-nowrap">{cell.getValue<string>()}</span>
        ),
      },
      {
        accessorKey: "amount",
        header: "Số tiền",
        size: 150,
        Cell: ({ row }) => {
          const isReceipt = row.original.voucher_type === "receipt"
          return (
            <div
              className={`text-right font-mono font-bold whitespace-nowrap ${isReceipt ? "text-emerald-600" : "text-rose-600"}`}
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
        header: "Diễn giải / Liên kết",
        size: 250,
        Cell: ({ row }) => {
          const voucher = row.original
          const linkedTarget =
            voucher.project?.name ||
            voucher.contract?.name ||
            voucher.customer?.name ||
            voucher.department?.name ||
            "—"
          const linkedType = voucher.project
            ? "Dự án"
            : voucher.contract
              ? "Hợp đồng"
              : voucher.customer
                ? "Khách hàng"
                : voucher.department
                  ? "Phòng ban"
                  : ""

          return (
            <div className="max-w-xs space-y-1">
              <div
                className="text-foreground font-medium truncate"
                title={voucher.description || ""}
              >
                {voucher.description}
              </div>
              {linkedType && (
                <div className="text-xs text-muted-foreground">
                  {linkedType}: <span className="text-primary font-medium">{linkedTarget}</span>
                </div>
              )}
            </div>
          )
        },
      },
      {
        id: "attachments",
        header: "Tài liệu",
        size: 100,
        Cell: ({ row }) => {
          const voucher = row.original
          return (
            <div className="flex justify-center">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1 min-w-[50px]"
                onClick={() => {
                  setSelectedVoucher(voucher)
                  setAttachmentsOpen(true)
                }}
              >
                <Paperclip className="size-3.5" />
                <span className="text-xs font-mono">{voucher.files?.length || 0}</span>
              </Button>
            </div>
          )
        },
      },
      {
        id: "actions",
        header: "Thao tác",
        size: 200,
        Cell: ({ row }) => {
          const voucher = row.original
          const isPending = voucher.status === "pending"
          const isDraftOrPending = voucher.status === "draft" || isPending

          return (
            <div
              className="flex items-center justify-center gap-1.5"
              onClick={(e) => e.stopPropagation()}
            >
              {canApprove && isPending && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-11 md:size-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                    onClick={() => handleApprove(voucher.id)}
                    title="Duyệt"
                  >
                    <Check className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-11 md:size-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                    onClick={() => handleReject(voucher.id)}
                    title="Từ chối"
                  >
                    <X className="size-4" />
                  </Button>
                </>
              )}

              {canEdit && isDraftOrPending && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-11 md:size-8"
                  onClick={() => {
                    setSelectedVoucher(voucher)
                    setFormOpen(true)
                  }}
                  title="Chỉnh sửa"
                >
                  <Edit2 className="size-4" />
                </Button>
              )}

              {canEdit && isDraftOrPending && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-11 md:size-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  onClick={() => handleDelete(voucher.id)}
                  title="Xóa"
                >
                  <Trash2 className="size-4" />
                </Button>
              )}

              <Button
                variant="ghost"
                size="icon"
                className="size-11 md:size-8 text-muted-foreground hover:text-foreground"
                onClick={() => {
                  setSelectedVoucher(voucher)
                  setHistoryOpen(true)
                }}
                title="Lịch sử duyệt"
              >
                <History className="size-4" />
              </Button>
            </div>
          )
        },
      },
    ],
    [canApprove, canEdit],
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
      isLoading: loading,
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Quản lý Chứng từ Thu/Chi</h1>
          <p className="text-sm text-muted-foreground">
            Lập kế hoạch thu, chi, phê duyệt hóa đơn, quyết toán tài chính phòng ban và dự án.
          </p>
        </div>
        {canEdit && (
          <Button
            onClick={() => {
              setSelectedVoucher(null)
              setFormOpen(true)
            }}
            className="gap-2 min-h-11 md:min-h-9"
          >
            <Plus className="size-4" />
            Lập chứng từ mới
          </Button>
        )}
      </div>

      <FilterPanel
        applyMode
        fields={filterFields}
        onApply={handleFilterSubmit}
        onReset={() => {
          setFilters({
            search: "",
            voucher_type: "",
            status: "",
            date_from: "",
            date_to: "",
          })
          setCurrentPage(1)
        }}
      />

      <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
        <MantineReactTable table={table} />
      </div>

      <TablePagination
        total={totalItems}
        perPage={pageSize}
        page={currentPage}
        totalPages={Math.ceil(totalItems / pageSize)}
        onPageChange={setCurrentPage}
      />

      {formOpen && (
        <VoucherFormModal
          open={formOpen}
          onClose={() => setFormOpen(false)}
          onSubmit={handleCreateOrUpdate}
          editData={selectedVoucher}
        />
      )}

      {historyOpen && selectedVoucher && (
        <VoucherHistoryDialog
          open={historyOpen}
          onClose={() => setHistoryOpen(false)}
          voucherId={selectedVoucher.id}
          voucherCode={selectedVoucher.voucher_code}
        />
      )}

      {attachmentsOpen && selectedVoucher && (
        <VoucherAttachmentsDialog
          open={attachmentsOpen}
          onClose={() => setAttachmentsOpen(false)}
          voucherId={selectedVoucher.id}
          voucherCode={selectedVoucher.voucher_code}
          onRefresh={fetchVouchers}
        />
      )}
    </div>
  )
}
