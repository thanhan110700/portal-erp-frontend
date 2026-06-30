import { useState, useMemo, useCallback } from "react"
import { MantineReactTable, useMantineReactTable, type MRT_ColumnDef } from "mantine-react-table"
import { Plus, Trash2, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"

import { toast } from "sonner"
import { StatusBadge } from "@/components/common/StatusBadge"
import { ConfirmDialog } from "@/components/common/ConfirmDialog"
import type { ProjectExpense, CreateProjectExpensePayload } from "../types/project"
import { projectApi } from "../api/projectApi"
import { voucherApi } from "@/features/finance/api/voucherApi"
import { ProjectExpenseFormModal } from "./ProjectExpenseFormModal"
import { ProjectExpenseDetailDialog } from "./ProjectExpenseDetailDialog"
import { useTranslation } from "react-i18next"
import { CommonDialog } from "@/components/common/CommonDialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

interface ProjectExpensesTabProps {
  projectId: number
  expenses: ProjectExpense[]
  onRefresh: () => void
  canCreate?: boolean
  canApprove?: boolean
  canDelete?: boolean
}

export function ProjectExpensesTab({
  projectId,
  expenses,
  onRefresh,
  canCreate = false,
  canApprove = false,
  canDelete = false,
}: ProjectExpensesTabProps) {
  const { t } = useTranslation(["projects", "common"])
  const [modalOpen, setModalOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedExpense, setSelectedExpense] = useState<ProjectExpense | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null)
  const [rejectConfirmId, setRejectConfirmId] = useState<number | null>(null)
  const [rejectReason, setRejectReason] = useState("")
  const [voucherConfirmExpense, setVoucherConfirmExpense] = useState<ProjectExpense | null>(null)
  const [isCreatingVoucher, setIsCreatingVoucher] = useState(false)

  const handleCreate = async (payload: CreateProjectExpensePayload) => {
    try {
      await projectApi.addExpense(projectId, payload)
      toast.success(t("projects:expenses.submit_success"))
      setModalOpen(false)
      onRefresh()
    } catch {
      toast.error(t("projects:expenses.submit_error"))
    }
  }

  const handleApprove = useCallback(
    async (expenseId: number) => {
      try {
        await projectApi.updateExpenseStatus(projectId, expenseId, { action: "approve" })
        toast.success(t("projects:expenses.approve_success"))
        setDetailOpen(false)
        onRefresh()

        const expense = expenses.find((e) => e.id === expenseId)
        if (expense) {
          setVoucherConfirmExpense(expense)
        }
      } catch {
        toast.error(t("projects:expenses.approve_error"))
      }
    },
    [projectId, expenses, onRefresh, t],
  )

  const handleReject = useCallback((expenseId: number) => {
    setRejectConfirmId(expenseId)
    setRejectReason("")
  }, [])

  const executeReject = async () => {
    if (rejectConfirmId === null) return
    try {
      await projectApi.updateExpenseStatus(projectId, rejectConfirmId, {
        action: "reject",
        notes: rejectReason || undefined,
      })
      toast.success(t("projects:expenses.reject_success"))
      setDetailOpen(false)
      onRefresh()
    } catch {
      toast.error(t("projects:expenses.reject_error"))
    } finally {
      setRejectConfirmId(null)
    }
  }

  const executeRemove = useCallback(
    async (expenseId: number) => {
      try {
        await projectApi.removeExpense(projectId, expenseId)
        toast.success(t("projects:expenses.delete_success"))
        onRefresh()
      } catch {
        toast.error(t("projects:expenses.delete_error"))
      } finally {
        setDeleteConfirmId(null)
      }
    },
    [projectId, onRefresh, t],
  )

  const handleRemove = useCallback((expenseId: number) => {
    setDeleteConfirmId(expenseId)
  }, [])

  const executeCreateVoucher = async () => {
    if (!voucherConfirmExpense) return
    setIsCreatingVoucher(true)
    try {
      await voucherApi.create({
        voucher_type: "payment",
        amount: Number(voucherConfirmExpense.amount),
        voucher_date: new Date().toISOString().split("T")[0],
        description: `Thanh toán chi phí dự án: ${voucherConfirmExpense.description || ""}`,
        project_id: projectId,
      })
      toast.success(t("common:messages.success", { defaultValue: "Tạo phiếu chi thành công" }))
    } catch {
      toast.error(t("common:messages.error", { defaultValue: "Lỗi tạo phiếu chi" }))
    } finally {
      setIsCreatingVoucher(false)
      setVoucherConfirmExpense(null)
    }
  }

  const columns = useMemo<MRT_ColumnDef<ProjectExpense>[]>(
    () => [
      {
        accessorKey: "expense_type",
        header: t("projects:expenses.columns.type"),
        size: 150,
        Cell: ({ cell }) => {
          const type = cell.getValue<string>()
          return (
            <span className="font-semibold text-foreground">
              {type ? t(`projects:expense_types.${type}`, { defaultValue: type }) : "—"}
            </span>
          )
        },
      },
      {
        accessorKey: "expense_date",
        header: t("projects:expenses.columns.date"),
        size: 130,
        Cell: ({ cell }) => (
          <span className="text-muted-foreground whitespace-nowrap">{cell.getValue<string>()}</span>
        ),
      },
      {
        accessorKey: "description",
        header: t("projects:expenses.columns.description"),
        size: 250,
        Cell: ({ cell }) => (
          <span
            className="text-muted-foreground truncate block max-w-[250px]"
            title={cell.getValue<string>()}
          >
            {cell.getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: "amount",
        header: t("projects:expenses.columns.amount"),
        size: 160,
        Cell: ({ cell }) => (
          <div className="text-right font-mono font-semibold text-foreground">
            {Number(cell.getValue<number>()).toLocaleString("vi-VN")} VNĐ
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: t("projects:expenses.columns.status"),
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
        id: "approvers",
        header: t("projects:expenses.columns.approvers"),
        size: 180,
        Cell: ({ row }) => {
          const expense = row.original
          return (
            <div className="text-xs space-y-1">
              <div className="text-muted-foreground">
                {t("projects:expenses.approvers.requester")}{" "}
                <span className="font-medium text-foreground">
                  {expense.user?.full_name || "—"}
                </span>
              </div>
              {expense.approver && (
                <div className="text-muted-foreground">
                  {t("projects:expenses.approvers.approver")}{" "}
                  <span className="font-medium text-foreground">{expense.approver.full_name}</span>
                </div>
              )}
            </div>
          )
        },
      },
      {
        id: "voucher",
        header: t("projects:expenses.columns.voucher", { defaultValue: "Phiếu chi" }),
        size: 150,
        Cell: ({ row }) => {
          const voucher = row.original.voucher
          if (!voucher) return <span className="text-muted-foreground">—</span>
          return (
            <div className="flex flex-col gap-1">
              <span className="font-mono text-xs">{voucher.voucher_code}</span>
              <div>
                <StatusBadge status={voucher.status} />
              </div>
            </div>
          )
        },
      },
      {
        id: "actions",
        header: t("common:table.actions"),
        size: 150,
        Cell: ({ row }) => {
          const expense = row.original
          const isPending = expense.status === "pending"
          const canApproveReject = canApprove && isPending

          return (
            <div
              className="flex items-center justify-center gap-1.5"
              onClick={(e) => e.stopPropagation()}
            >
              {canApproveReject && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-11 md:size-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                    onClick={() => handleApprove(expense.id)}
                    title={t("projects:expenses.actions.approve")}
                  >
                    <Check className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-11 md:size-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                    onClick={() => handleReject(expense.id)}
                    title={t("projects:expenses.actions.reject")}
                  >
                    <X className="size-4" />
                  </Button>
                </>
              )}
              {canDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-11 md:size-8 hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                  onClick={() => handleRemove(expense.id)}
                  title={t("projects:expenses.actions.delete")}
                >
                  <Trash2 className="size-4" />
                </Button>
              )}
            </div>
          )
        },
      },
    ],
    [canApprove, canDelete, handleApprove, handleReject, handleRemove, t],
  )

  const table = useMantineReactTable({
    renderEmptyRowsFallback: () => (
      <div className="p-8 text-center text-muted-foreground">
        {t("common:table.noData", { defaultValue: "Không có dữ liệu" })}
      </div>
    ),
    columns,
    data: expenses,
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
    mantineTableBodyRowProps: ({ row }) => ({
      onClick: () => {
        setSelectedExpense(row.original)
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
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">
          {t("projects:expenses.title")} ({expenses.length})
        </h3>
        {canCreate && (
          <Button
            size="sm"
            onClick={() => setModalOpen(true)}
            className="gap-2 min-h-11 md:min-h-9"
          >
            <Plus className="size-4" />
            {t("projects:expenses.add_expense")}
          </Button>
        )}
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        <MantineReactTable table={table} />
      </div>

      {modalOpen && (
        <ProjectExpenseFormModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onSubmit={handleCreate}
        />
      )}

      {detailOpen && selectedExpense && (
        <ProjectExpenseDetailDialog
          open={detailOpen}
          onClose={() => setDetailOpen(false)}
          expense={selectedExpense}
          canApprove={canApprove}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}

      <ConfirmDialog
        open={deleteConfirmId !== null}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={() => {
          if (deleteConfirmId !== null) return executeRemove(deleteConfirmId)
        }}
        title={t("projects:expenses.delete_confirm")}
      />

      <CommonDialog
        open={rejectConfirmId !== null}
        onClose={() => setRejectConfirmId(null)}
        title={t("projects:expenses.reject_prompt")}
        size="md"
        primaryAction={{
          label: t("projects:expenses.actions.reject"),
          onClick: () => void executeReject(),
          variant: "destructive",
        }}
        cancelAction={{
          label: t("common:actions.cancel"),
          onClick: () => setRejectConfirmId(null),
        }}
      >
        <div className="space-y-3 py-4">
          <Label>{t("projects:expenses.form.notes")}</Label>
          <Textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder={t("projects:expenses.reject_reason_placeholder", {
              defaultValue: "Nhập lý do từ chối...",
            })}
            rows={3}
          />
        </div>
      </CommonDialog>

      <ConfirmDialog
        open={voucherConfirmExpense !== null}
        onClose={() => setVoucherConfirmExpense(null)}
        onConfirm={executeCreateVoucher}
        title={t("projects:expenses.create_voucher_confirm", {
          defaultValue: "Bạn có muốn tự động tạo phiếu chi cho khoản này không?",
        })}
        confirmText={t("common:actions.confirm", { defaultValue: "Đồng ý" })}
        isDangerous={false}
        loading={isCreatingVoucher}
      />
    </div>
  )
}
