import { useState, useCallback, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { Pencil, Trash2, ShieldCheck, Eye } from "lucide-react"
import { MantineReactTable, useMantineReactTable, type MRT_ColumnDef } from "mantine-react-table"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { hrEmployeeDetailPath } from "@/constants/paths"
import type { Employee } from "../types/employee"

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  director: "Giám đốc",
  accountant: "Kế toán",
  sales: "Kinh doanh",
  technician: "Kỹ thuật",
  employee: "Nhân viên",
}

function RoleBadge({ role }: { role: string }) {
  const label = ROLE_LABELS[role] ?? role
  const variantMap: Record<string, "default" | "secondary" | "warning" | "destructive"> = {
    admin: "destructive",
    director: "warning",
    accountant: "default",
    sales: "secondary",
    technician: "secondary",
    employee: "outline" as "secondary",
  }
  return (
    <Badge variant={variantMap[role] ?? "outline"} className="text-[11px]">
      {label}
    </Badge>
  )
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <Badge variant={active ? "success" : "outline"} className="text-[11px]">
      {active ? "Hoạt động" : "Nghỉ việc"}
    </Badge>
  )
}

interface EmployeeTableProps {
  employees: Employee[]
  isLoading?: boolean
  canEdit?: boolean
  canDelete?: boolean
  canAssignRole?: boolean
  onEdit: (employee: Employee) => void
  onDelete: (employee: Employee) => void
  onAssignRole: (employee: Employee) => void
}

export function EmployeeTable({
  employees,
  isLoading = false,
  canEdit = true,
  canDelete = false,
  canAssignRole = false,
  onEdit,
  onDelete,
  onAssignRole,
}: EmployeeTableProps) {
  const navigate = useNavigate()
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null)

  const handleConfirmDelete = useCallback(() => {
    if (deleteTarget) {
      onDelete(deleteTarget)
      setDeleteTarget(null)
    }
  }, [deleteTarget, onDelete])

  const columns = useMemo<MRT_ColumnDef<Employee>[]>(
    () => [
      {
        accessorKey: "user_code",
        header: "Mã NV",
        size: 90,
        Cell: ({ cell }) => (
          <span className="font-mono text-xs text-muted-foreground font-medium">
            {cell.getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: "full_name",
        header: "Họ tên",
        size: 200,
        Cell: ({ row }) => (
          <div className="flex flex-col gap-0.5">
            <span className="font-medium text-sm">{row.original.full_name}</span>
            <span className="text-xs text-muted-foreground">{row.original.email}</span>
          </div>
        ),
      },
      {
        accessorKey: "department.name",
        header: "Phòng ban",
        size: 150,
        Cell: ({ row }) => <span>{row.original.department?.name ?? "—"}</span>,
      },
      {
        accessorKey: "position",
        header: "Chức vụ",
        size: 120,
        Cell: ({ cell }) => <span>{cell.getValue<string>() ?? "—"}</span>,
      },
      {
        accessorKey: "hire_date",
        header: "Ngày vào",
        size: 120,
        Cell: ({ cell }) => {
          const val = cell.getValue<string>()
          return <span>{val ? new Date(val).toLocaleDateString("vi-VN") : "—"}</span>
        },
      },
      {
        accessorKey: "roles",
        header: "Vai trò",
        size: 150,
        Cell: ({ row }) => (
          <div className="flex flex-wrap gap-1">
            {row.original.roles.length > 0 ? (
              row.original.roles.map((role) => <RoleBadge key={role} role={role} />)
            ) : (
              <span className="text-xs text-muted-foreground">—</span>
            )}
          </div>
        ),
      },
      {
        accessorKey: "is_active",
        header: "Trạng thái",
        size: 110,
        Cell: ({ cell }) => <StatusBadge active={cell.getValue<boolean>()} />,
      },
      {
        id: "actions",
        header: "",
        size: 140,
        Cell: ({ row }) => {
          const emp = row.original
          return (
            <div
              className="flex items-center justify-end gap-1"
              onClick={(e) => e.stopPropagation()}
            >
              <Button
                variant="ghost"
                size="icon-sm"
                title="Xem chi tiết"
                onClick={() => navigate(hrEmployeeDetailPath(emp.id))}
              >
                <Eye className="size-3.5" />
              </Button>
              {canEdit && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  title="Sửa thông tin"
                  onClick={() => onEdit(emp)}
                >
                  <Pencil className="size-3.5" />
                </Button>
              )}
              {canAssignRole && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  title="Phân quyền"
                  onClick={() => onAssignRole(emp)}
                >
                  <ShieldCheck className="size-3.5" />
                </Button>
              )}
              {canDelete && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  title="Xóa nhân viên"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => setDeleteTarget(emp)}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              )}
            </div>
          )
        },
      },
    ],
    [canEdit, canDelete, canAssignRole, onEdit, onAssignRole, navigate],
  )

  const table = useMantineReactTable({
    columns,
    data: employees,
    enableColumnActions: false,
    enableColumnFilters: false,
    enablePagination: false,
    enableSorting: true,
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
    mantineTableBodyRowProps: ({ row }) => ({
      onClick: () => navigate(hrEmployeeDetailPath(row.original.id)),
      style: { cursor: "pointer" },
    }),
  })

  return (
    <>
      <div className="rounded-xl border bg-card overflow-hidden">
        <MantineReactTable table={table} />
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa nhân viên?</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn xóa nhân viên <strong>{deleteTarget?.full_name}</strong> (
              {deleteTarget?.user_code})? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleConfirmDelete}
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
