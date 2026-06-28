import { useState, useCallback, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { Pencil, Trash2, Eye } from "lucide-react"
import { MantineReactTable, useMantineReactTable, type MRT_ColumnDef } from "mantine-react-table"
import { useTranslation } from "react-i18next"

import { Badge } from "@/components/ui/badge"
import { RowActions } from "@/components/common/RowActions"
import { StatusBadge } from "@/components/common/StatusBadge"
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

function RoleBadge({ role }: { role: string }) {
  const { t } = useTranslation(["common"])
  const label = t(`common:roles.${role}`, { defaultValue: role })
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

interface EmployeeTableProps {
  employees: Employee[]
  isLoading?: boolean
  canEdit?: boolean
  canDelete?: boolean
  onEdit: (employee: Employee) => void
  onDelete: (employee: Employee) => void
}

export function EmployeeTable({
  employees,
  isLoading = false,
  canEdit = true,
  canDelete = false,

  onEdit,
  onDelete,
}: EmployeeTableProps) {
  const { t } = useTranslation(["hr", "common"])
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
        header: t("hr:employees.columns.user_code"),
        size: 90,
        Cell: ({ cell }) => (
          <span className="font-mono text-xs text-muted-foreground font-medium">
            {cell.getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: "full_name",
        header: t("hr:employees.columns.full_name"),
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
        header: t("hr:employees.columns.department"),
        size: 150,
        Cell: ({ row }) => <span>{row.original.department?.name ?? "—"}</span>,
      },
      {
        accessorKey: "position",
        header: t("hr:employees.columns.position"),
        size: 120,
        Cell: ({ cell }) => <span>{cell.getValue<string>() ?? "—"}</span>,
      },
      {
        accessorKey: "hire_date",
        header: t("hr:employees.columns.hire_date"),
        size: 120,
        Cell: ({ cell }) => {
          const val = cell.getValue<string>()
          return <span>{val ? new Date(val).toLocaleDateString("vi-VN") : "—"}</span>
        },
      },
      {
        accessorKey: "roles",
        header: t("hr:employees.columns.roles"),
        size: 150,
        Cell: ({ row }) => {
          const roleName = row.original.role?.name
          const roles = row.original.roles || (roleName ? [roleName] : [])

          return (
            <div className="flex flex-wrap gap-1">
              {roles.length > 0 ? (
                roles.map((r) => <RoleBadge key={r} role={r} />)
              ) : (
                <span className="text-xs text-muted-foreground">—</span>
              )}
            </div>
          )
        },
      },
      {
        accessorKey: "is_active",
        header: t("common:status.status"),
        size: 110,
        Cell: ({ cell }) => (
          <StatusBadge status={cell.getValue<boolean>() ? "active" : "inactive"} />
        ),
      },
      {
        id: "actions",
        header: "",
        size: 140,
        Cell: ({ row }) => {
          const emp = row.original
          const actions: import("@/components/common/RowActions").RowAction[] = [
            {
              label: t("hr:employees.actions.view_detail", { defaultValue: "Xem chi tiết" }),
              icon: <Eye className="size-3.5" />,
              onClick: () => navigate(hrEmployeeDetailPath(emp.id)),
            },
          ]
          if (canEdit) {
            actions.push({
              label: t("common:actions.edit", { defaultValue: "Sửa" }),
              icon: <Pencil className="size-3.5" />,
              onClick: () => onEdit(emp),
            })
          }

          if (canDelete) {
            actions.push({
              label: t("hr:employees.actions.delete", { defaultValue: "Xóa" }),
              icon: <Trash2 className="size-3.5" />,
              onClick: () => setDeleteTarget(emp),
              className: "text-destructive hover:text-destructive hover:bg-destructive/10",
              variant: "destructive" as const,
            })
          }
          return (
            <div onClick={(e) => e.stopPropagation()}>
              <RowActions actions={actions} />
            </div>
          )
        },
      },
    ],
    [canEdit, canDelete, onEdit, navigate, t],
  )

  const table = useMantineReactTable({
    renderEmptyRowsFallback: () => (
      <div className="p-8 text-center text-muted-foreground">
        {t("common:table.noData", { defaultValue: "Không có dữ liệu" })}
      </div>
    ),
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
            <AlertDialogTitle>{t("hr:employees.delete_title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("hr:employees.delete_confirm")} <strong>{deleteTarget?.full_name}</strong> (
              {deleteTarget?.user_code}){t("hr:employees.delete_warning")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common:actions.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleConfirmDelete}
            >
              {t("common:actions.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
