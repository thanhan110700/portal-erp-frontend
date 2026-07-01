import { useState, useMemo, useCallback } from "react"
import { MantineReactTable, useMantineReactTable, type MRT_ColumnDef } from "mantine-react-table"
import { Plus, Trash2, Check, X, Receipt, Calendar, Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"

import { toast } from "sonner"
import { StatusBadge } from "@/components/common/StatusBadge"
import { ConfirmDialog } from "@/components/common/ConfirmDialog"
import { MobileActionHeader } from "@/components/common/MobileActionHeader"
import { MobileCardList } from "@/components/common/MobileCardList"
import { MobileRowActions, type RowAction } from "@/components/common/MobileRowActions"
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
    [expenses, onRefresh, projectId, t],
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
    [onRefresh, projectId, t],
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

  const buildActions = useCallback(
    (expense: ProjectExpense): RowAction[] => {
      const actions: RowAction[] = []
      const isPending = expense.status === "pending"

      if (canApprove && isPending) {
        actions.push({
          label: t("projects:expenses.actions.approve"),
          icon: <Check className="size-4" />,
          onClick: () => void handleApprove(expense.id),
        })
        actions.push({
          label: t("projects:expenses.actions.reject"),
          icon: <X className="size-4" />,
          onClick: () => handleReject(expense.id),
          variant: "destructive",
        })
      }

      if (canDelete) {
        actions.push({
          label: t("projects:expenses.actions.delete"),
          icon: <Trash2 className="size-4" />,
          onClick: () => handleRemove(expense.id),
          variant: "destructive",
          separator: actions.length > 0,
        })
      }

      return actions
    },
    [canApprove, canDelete, handleApprove, handleReject, handleRemove, t],
  )

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
          <span className="whitespace-nowrap text-muted-foreground">{cell.getValue<string>()}</span>
        ),
      },
      {
        accessorKey: "description",
        header: t("projects:expenses.columns.description"),
        size: 250,
        Cell: ({ cell }) => (
          <span
            className="block max-w-[250px] truncate text-muted-foreground"
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
            <div className="space-y-1 text-xs">
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
        Cell: ({ row }) => <MobileRowActions actions={buildActions(row.original)} />,
      },
    ],
    [buildActions, t],
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
      <MobileActionHeader
        title={t("projects:expenses.title")}
        subtitle={`(${expenses.length})`}
        actions={
          canCreate ? (
            <Button
              size="sm"
              onClick={() => setModalOpen(true)}
              className="gap-2 min-h-11 md:min-h-9"
            >
              <Plus className="size-4" />
              {t("projects:expenses.add_expense")}
            </Button>
          ) : undefined
        }
      />

      <MobileCardList
        data={expenses}
        keyExtractor={(expense) => expense.id}
        emptyIcon={Receipt}
        emptyTitle={t("common:table.noData", { defaultValue: "Không có dữ liệu" })}
        renderCard={(expense) => (
          <div
            className="rounded-xl border bg-card p-4 shadow-sm transition-colors active:bg-muted/40"
            onClick={() => {
              setSelectedExpense(expense)
              setDetailOpen(true)
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-sm font-semibold">
                    {expense.expense_type
                      ? t(`projects:expense_types.${expense.expense_type}`, {
                          defaultValue: expense.expense_type,
                        })
                      : "—"}
                  </p>
                  <StatusBadge status={expense.status} />
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                  {expense.description || "—"}
                </p>
              </div>
              <div onClick={(e) => e.stopPropagation()} className="-mr-2 -mt-1">
                <MobileRowActions actions={buildActions(expense)} />
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="size-4 shrink-0" />
                <span>{expense.expense_date}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Wallet className="size-4 shrink-0" />
                <span>{Number(expense.amount).toLocaleString("vi-VN")} VNĐ</span>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span>{expense.user?.full_name || "—"}</span>
              {expense.approver && <span>{expense.approver.full_name}</span>}
              {expense.voucher && <span className="font-mono">{expense.voucher.voucher_code}</span>}
            </div>
          </div>
        )}
        desktopTable={
          <div className="rounded-xl border bg-card overflow-hidden">
            <MantineReactTable table={table} />
          </div>
        }
      />

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
