import { useEffect, useState, useCallback, useMemo } from "react"
import { MantineReactTable, useMantineReactTable, type MRT_ColumnDef } from "mantine-react-table"
import { Plus, Trash2, Edit2, Paperclip, Check, X, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/common/StatusBadge"
import { FilterPanel, type FilterFieldDef } from "@/components/common/FilterPanel"
import { TablePagination } from "@/components/common/TablePagination"
import { RowActions } from "@/components/common/RowActions"
import { useAuthStore } from "@/hooks/useAuthStore"
import { hasPermission, PermissionSlugs } from "@/constants/permissions"
import { voucherApi } from "../api/voucherApi"
import type {
  Voucher,
  ListVouchersParams,
  CreateVoucherPayload,
  UpdateVoucherPayload,
} from "../types/voucher"
import { VoucherFormModal } from "../components/VoucherFormModal"
import { VoucherDetailDialog } from "../components/VoucherDetailDialog"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"
import { optionApi, type OptionItem } from "@/shared/api/optionApi"

export function VoucherListPage() {
  const { t } = useTranslation(["finance", "common"])
  const user = useAuthStore((s) => s.user)
  const canCreate = hasPermission(user?.permissions, PermissionSlugs.CreateVouchers)
  const canEdit = hasPermission(user?.permissions, PermissionSlugs.EditVouchers)
  const canDelete = hasPermission(user?.permissions, PermissionSlugs.DeleteVouchers)
  const canApprove = hasPermission(user?.permissions, PermissionSlugs.ApproveVouchers)

  const [vouchers, setVouchers] = useState<Voucher[]>([])
  const [loading, setLoading] = useState(true)
  const [totalItems, setTotalItems] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(15)

  // Filters state
  const [filters, setFilters] = useState<Record<string, unknown>>({
    search: "",
    voucher_type: "",
    status: "",
    date_from: "",
    date_to: "",
  })

  // Modals state
  const [formOpen, setFormOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null)

  // Options state
  const [voucherTypes, setVoucherTypes] = useState<OptionItem[]>([])
  const [voucherStatuses, setVoucherStatuses] = useState<OptionItem[]>([])

  useEffect(() => {
    Promise.all([optionApi.getVoucherTypes(), optionApi.getVoucherStatuses()])
      .then(([types, statuses]) => {
        setVoucherTypes(types)
        setVoucherStatuses(statuses)
      })
      .catch(console.error)
  }, [])

  const fetchVouchers = useCallback(async () => {
    setLoading(true)
    try {
      const params: ListVouchersParams = {
        page: currentPage,
        per_page: pageSize,
        search: (filters.search as string) || undefined,
        voucher_type: (filters.voucher_type as string) || undefined,
        status: (filters.status as string) || undefined,
        date_from: (filters.date_from as string) || undefined,
        date_to: (filters.date_to as string) || undefined,
      }
      const data = await voucherApi.list(params)
      setVouchers(data.data || [])
      setTotalItems(data.meta?.total || 0)
    } catch {
      toast.error(t("finance:list.fetch_error"))
    } finally {
      setLoading(false)
    }
  }, [currentPage, pageSize, filters, t])

  useEffect(() => {
    void fetchVouchers()
  }, [fetchVouchers])

  const handleCreateOrUpdate = async (payload: CreateVoucherPayload | UpdateVoucherPayload) => {
    try {
      if (selectedVoucher) {
        await voucherApi.update(selectedVoucher.id, payload as UpdateVoucherPayload)
        toast.success(t("finance:list.update_success"))
      } else {
        await voucherApi.create(payload as CreateVoucherPayload)
        toast.success(t("finance:list.create_success"))
      }
      setFormOpen(false)
      void fetchVouchers()
    } catch (err: unknown) {
      const errMsg =
        (err as { response?: { data?: { message?: string } } }).response?.data?.message ||
        t("finance:list.update_error", { defaultValue: "Lỗi xử lý chứng từ" })
      toast.error(errMsg)
    }
  }

  const handleDelete = useCallback(
    async (id: number) => {
      if (!window.confirm(t("finance:list.delete_confirm"))) return
      try {
        await voucherApi.delete(id)
        toast.success(t("finance:list.delete_success"))
        void fetchVouchers()
      } catch {
        toast.error(t("finance:list.delete_error"))
      }
    },
    [t, fetchVouchers],
  )

  const handleApprove = useCallback(
    async (id: number) => {
      try {
        await voucherApi.approve(id, "approve")
        toast.success(t("finance:list.approve_success"))
        void fetchVouchers()
      } catch (err: unknown) {
        const errMsg =
          (err as { response?: { data?: { message?: string } } }).response?.data?.message ||
          t("finance:list.approve_error")
        toast.error(errMsg)
      }
    },
    [t, fetchVouchers],
  )

  const handleReject = useCallback(
    async (id: number) => {
      const reason = window.prompt(t("finance:list.reject_prompt"))
      if (reason === null) return
      if (!reason.trim()) {
        toast.error(t("finance:list.reject_reason_required"))
        return
      }
      try {
        await voucherApi.approve(id, "reject", reason)
        toast.success(t("finance:list.reject_success"))
        void fetchVouchers()
      } catch (err: unknown) {
        const errMsg =
          (err as { response?: { data?: { message?: string } } }).response?.data?.message ||
          t("finance:list.reject_error")
        toast.error(errMsg)
      }
    },
    [t, fetchVouchers],
  )

  const handleFilterSubmit = (newFilters: Record<string, unknown>) => {
    setFilters(newFilters)
    setCurrentPage(1)
  }

  const filterFields = useMemo<FilterFieldDef[]>(() => {
    return [
      {
        field: "search",
        label: t("finance:list.filters.search"),
        type: "input",
        placeholder: t("finance:list.filters.search_placeholder"),
        value: (filters.search as string) || "",
      },
      {
        field: "voucher_type",
        label: t("finance:list.filters.type"),
        type: "select",
        placeholder: t("common:filter.all"),
        value: (filters.voucher_type as string) || "",
        options: voucherTypes.map((t) => ({ label: t.label, value: t.value.toString() })),
      },
      {
        field: "status",
        label: t("finance:list.filters.status"),
        type: "select",
        placeholder: t("common:filter.all"),
        value: (filters.status as string) || "",
        options: voucherStatuses.map((s) => ({ label: s.label, value: s.value.toString() })),
      },
      {
        field: "date_from",
        label: t("finance:list.filters.date_from"),
        type: "datepicker",
        value: (filters.date_from as string) || null,
      },
      {
        field: "date_to",
        label: t("finance:list.filters.date_to"),
        type: "datepicker",
        value: (filters.date_to as string) || null,
      },
    ]
  }, [filters, t, voucherTypes, voucherStatuses])

  const columns = useMemo<MRT_ColumnDef<Voucher>[]>(
    () => [
      {
        accessorKey: "voucher_code",
        header: t("finance:list.columns.code"),
        size: 140,
        Cell: ({ cell }) => (
          <span className="font-semibold text-foreground">{cell.getValue<string>()}</span>
        ),
      },
      {
        accessorKey: "voucher_type",
        header: t("finance:list.columns.type"),
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
              {isReceipt
                ? t("finance:list.types.receipt_short")
                : t("finance:list.types.payment_short")}
            </span>
          )
        },
      },
      {
        accessorKey: "voucher_date",
        header: t("finance:list.columns.date"),
        size: 120,
        Cell: ({ cell }) => (
          <span className="text-muted-foreground whitespace-nowrap">{cell.getValue<string>()}</span>
        ),
      },
      {
        accessorKey: "amount",
        header: t("finance:list.columns.amount"),
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
        header: t("finance:list.columns.status"),
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
        header: t("finance:list.columns.description"),
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
            ? t("finance:list.linked.project")
            : voucher.contract
              ? t("finance:list.linked.contract")
              : voucher.customer
                ? t("finance:list.linked.customer")
                : voucher.department
                  ? t("finance:list.linked.department")
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
        header: t("finance:list.columns.attachments"),
        size: 100,
        Cell: ({ row }) => {
          const voucher = row.original
          return (
            <div className="flex justify-center">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1 min-w-[50px]"
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedVoucher(voucher)
                  setDetailOpen(true)
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
        header: t("common:table.actions"),
        size: 200,
        Cell: ({ row }) => {
          const voucher = row.original
          const isPending = voucher.status === "pending"
          const isDraftOrPending = voucher.status === "draft" || isPending

          const actions: import("@/components/common/RowActions").RowAction[] = []

          if (canApprove && isPending) {
            actions.push({
              label: t("finance:list.actions.approve", { defaultValue: "Duyệt" }),
              icon: <Check className="size-4" />,
              onClick: () => void handleApprove(voucher.id),
              className: "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50",
            })
            actions.push({
              label: t("finance:list.actions.reject", { defaultValue: "Từ chối" }),
              icon: <X className="size-4" />,
              onClick: () => void handleReject(voucher.id),
              className: "text-rose-600 hover:text-rose-700 hover:bg-rose-50",
            })
          }

          if (canEdit && isDraftOrPending) {
            actions.push({
              label: t("finance:list.actions.edit", { defaultValue: "Sửa" }),
              icon: <Edit2 className="size-4" />,
              onClick: () => {
                setSelectedVoucher(voucher)
                setFormOpen(true)
              },
            })
          }
          if (canDelete && isDraftOrPending) {
            actions.push({
              label: t("finance:list.actions.delete", { defaultValue: "Xóa" }),
              icon: <Trash2 className="size-4" />,
              onClick: () => void handleDelete(voucher.id),
              className: "text-muted-foreground hover:text-destructive hover:bg-destructive/10",
              variant: "destructive" as const,
            })
          }

          actions.unshift({
            label: t("common:action.view", { defaultValue: "Xem chi tiết" }),
            icon: <Eye className="size-4" />,
            onClick: () => {
              setSelectedVoucher(voucher)
              setDetailOpen(true)
            },
          })

          return (
            <div onClick={(e) => e.stopPropagation()}>
              <RowActions actions={actions} />
            </div>
          )
        },
      },
    ],
    [canApprove, canEdit, canDelete, t, handleApprove, handleReject, handleDelete],
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
      isLoading: loading,
    },
    mantineTableProps: {
      striped: true,
      highlightOnHover: true,
      withBorder: false,
      withColumnBorders: false,
    },
    mantineTableBodyRowProps: ({ row }) => ({
      onClick: () => {
        setSelectedVoucher(row.original)
        setDetailOpen(true)
      },
      sx: { cursor: "pointer" },
    }),
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
          <h1 className="text-2xl font-bold tracking-tight">{t("finance:list.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("finance:list.description")}</p>
        </div>
        {canCreate && (
          <Button
            onClick={() => {
              setSelectedVoucher(null)
              setFormOpen(true)
            }}
            className="gap-2 min-h-11 md:min-h-9"
          >
            <Plus className="size-4" />
            {t("finance:list.create")}
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

      {detailOpen && selectedVoucher && (
        <VoucherDetailDialog
          open={detailOpen}
          onClose={() => setDetailOpen(false)}
          voucherId={selectedVoucher.id}
          onRefresh={() => void fetchVouchers()}
          onEdit={(v) => {
            setSelectedVoucher(v)
            setFormOpen(true)
          }}
        />
      )}
    </div>
  )
}
