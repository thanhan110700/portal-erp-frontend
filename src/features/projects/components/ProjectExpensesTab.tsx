import { useState, useMemo, useCallback } from "react"
import { MantineReactTable, useMantineReactTable, type MRT_ColumnDef } from "mantine-react-table"
import { Plus, Trash2, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import type { ProjectExpense } from "../types/project"
import { projectApi } from "../api/projectApi"
import { ProjectExpenseFormModal } from "./ProjectExpenseFormModal"

interface ProjectExpensesTabProps {
  projectId: number
  expenses: ProjectExpense[]
  onRefresh: () => void
  canEdit: boolean
  isAdmin: boolean
}

const EXPENSE_TYPE_LABELS: Record<string, string> = {
  food: "Ăn uống",
  transport: "Di chuyển",
  accommodation: "Lưu trú",
  material: "Vật tư",
  labor: "Nhân công",
  other: "Khác",
}

const STATUS_VARIANTS: Record<string, any> = {
  pending: "warning",
  approved: "success",
  paid: "info",
  rejected: "danger",
}

const STATUS_LABELS: Record<string, string> = {
  pending: "Chờ duyệt",
  approved: "Đã duyệt",
  paid: "Đã chi",
  rejected: "Từ chối",
}

export function ProjectExpensesTab({
  projectId,
  expenses,
  onRefresh,
  canEdit,
  isAdmin,
}: ProjectExpensesTabProps) {
  const [modalOpen, setModalOpen] = useState(false)

  const handleCreate = async (payload: any) => {
    try {
      await projectApi.addExpense(projectId, payload)
      toast.success("Gửi yêu cầu chi phí thành công")
      setModalOpen(false)
      onRefresh()
    } catch {
      toast.error("Gửi yêu cầu chi phí thất bại")
    }
  }

  const handleApprove = useCallback(
    async (expenseId: number) => {
      try {
        await projectApi.updateExpenseStatus(projectId, expenseId, { status: "approved" })
        toast.success("Đã phê duyệt yêu cầu chi phí")
        onRefresh()
      } catch {
        toast.error("Phê duyệt thất bại")
      }
    },
    [projectId, onRefresh],
  )

  const handleReject = useCallback(
    async (expenseId: number) => {
      const reason = window.prompt("Nhập lý do từ chối (tùy chọn):")
      if (reason === null) return // User cancelled prompt
      try {
        await projectApi.updateExpenseStatus(projectId, expenseId, {
          status: "rejected",
          notes: reason || undefined,
        })
        toast.success("Đã từ chối yêu cầu chi phí")
        onRefresh()
      } catch {
        toast.error("Từ chối thất bại")
      }
    },
    [projectId, onRefresh],
  )

  const handleRemove = useCallback(
    async (expenseId: number) => {
      if (!window.confirm("Bạn có chắc chắn muốn xóa yêu cầu chi phí này?")) return
      try {
        await projectApi.removeExpense(projectId, expenseId)
        toast.success("Đã xóa khoản chi")
        onRefresh()
      } catch {
        toast.error("Xóa khoản chi thất bại")
      }
    },
    [projectId, onRefresh],
  )

  const columns = useMemo<MRT_ColumnDef<ProjectExpense>[]>(
    () => [
      {
        accessorKey: "expense_type",
        header: "Phân loại",
        size: 150,
        Cell: ({ cell }) => (
          <span className="font-semibold text-foreground">
            {EXPENSE_TYPE_LABELS[cell.getValue<string>()] || cell.getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: "expense_date",
        header: "Ngày chi",
        size: 130,
        Cell: ({ cell }) => (
          <span className="text-muted-foreground whitespace-nowrap">{cell.getValue<string>()}</span>
        ),
      },
      {
        accessorKey: "description",
        header: "Lý do / Mô tả",
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
        header: "Số tiền",
        size: 160,
        Cell: ({ cell }) => (
          <div className="text-right font-mono font-semibold text-foreground">
            {Number(cell.getValue<number>()).toLocaleString("vi-VN")} VNĐ
          </div>
        ),
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
        id: "approvers",
        header: "Người yêu cầu / duyệt",
        size: 180,
        Cell: ({ row }) => {
          const expense = row.original
          return (
            <div className="text-xs space-y-1">
              <div className="text-muted-foreground">
                Yêu cầu:{" "}
                <span className="font-medium text-foreground">
                  {expense.user?.full_name || "—"}
                </span>
              </div>
              {expense.approver && (
                <div className="text-muted-foreground">
                  Duyệt:{" "}
                  <span className="font-medium text-foreground">{expense.approver.full_name}</span>
                </div>
              )}
            </div>
          )
        },
      },
      {
        id: "actions",
        header: "Thao tác",
        size: 150,
        Cell: ({ row }) => {
          const expense = row.original
          const isPending = expense.status === "pending"
          const canApproveReject = canEdit && isPending

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
                    title="Phê duyệt"
                  >
                    <Check className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-11 md:size-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                    onClick={() => handleReject(expense.id)}
                    title="Từ chối"
                  >
                    <X className="size-4" />
                  </Button>
                </>
              )}
              {(isAdmin || isPending) && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-11 md:size-8 hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                  onClick={() => handleRemove(expense.id)}
                  title="Xóa yêu cầu"
                >
                  <Trash2 className="size-4" />
                </Button>
              )}
            </div>
          )
        },
      },
    ],
    [canEdit, isAdmin, handleApprove, handleReject, handleRemove],
  )

  const table = useMantineReactTable({
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
        <h3 className="text-lg font-semibold">Chi phí dự án ({expenses.length})</h3>
        <Button size="sm" onClick={() => setModalOpen(true)} className="gap-2 min-h-11 md:min-h-9">
          <Plus className="size-4" />
          Yêu cầu chi phí
        </Button>
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
    </div>
  )
}
