import { useState, useMemo, useCallback } from "react"
import { MantineReactTable, useMantineReactTable, type MRT_ColumnDef } from "mantine-react-table"
import { Plus, Trash2, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"

import { toast } from "sonner"
import { StatusBadge } from "@/components/common/StatusBadge"
import type { ProjectExpense } from "../types/project"
import { projectApi } from "../api/projectApi"
import { ProjectExpenseFormModal } from "./ProjectExpenseFormModal"
import { ProjectExpenseDetailDialog } from "./ProjectExpenseDetailDialog"
import { useTranslation } from "react-i18next"

interface ProjectExpensesTabProps {
  projectId: number
  expenses: ProjectExpense[]
  onRefresh: () => void
  canCreate?: boolean
  canApprove?: boolean
  canDelete?: boolean
}

const EXPENSE_TYPE_LABELS: Record<string, string> = {
  food: "Ăn uống",
  transport: "Di chuyển",
  accommodation: "Lưu trú",
  material: "Vật tư",
  labor: "Nhân công",
  other: "Khác",
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

  const handleCreate = async (payload: any) => {
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
        await projectApi.updateExpenseStatus(projectId, expenseId, { status: "approved" })
        toast.success(t("projects:expenses.approve_success"))
        setDetailOpen(false)
        onRefresh()
      } catch {
        toast.error(t("projects:expenses.approve_error"))
      }
    },
    [projectId, onRefresh, t],
  )

  const handleReject = useCallback(
    async (expenseId: number) => {
      const reason = window.prompt(t("projects:expenses.reject_prompt"))
      if (reason === null) return // User cancelled prompt
      try {
        await projectApi.updateExpenseStatus(projectId, expenseId, {
          status: "rejected",
          notes: reason || undefined,
        })
        toast.success(t("projects:expenses.reject_success"))
        setDetailOpen(false)
        onRefresh()
      } catch {
        toast.error(t("projects:expenses.reject_error"))
      }
    },
    [projectId, onRefresh, t],
  )

  const handleRemove = useCallback(
    async (expenseId: number) => {
      if (!window.confirm(t("projects:expenses.delete_confirm"))) return
      try {
        await projectApi.removeExpense(projectId, expenseId)
        toast.success(t("projects:expenses.delete_success"))
        onRefresh()
      } catch {
        toast.error(t("projects:expenses.delete_error"))
      }
    },
    [projectId, onRefresh, t],
  )

  const columns = useMemo<MRT_ColumnDef<ProjectExpense>[]>(
    () => [
      {
        accessorKey: "expense_type",
        header: t("projects:expenses.columns.type"),
        size: 150,
        Cell: ({ cell }) => (
          <span className="font-semibold text-foreground">
            {EXPENSE_TYPE_LABELS[cell.getValue<string>()] || cell.getValue<string>()}
          </span>
        ),
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
    </div>
  )
}
