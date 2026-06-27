import { useMemo } from "react"
import { MantineReactTable, useMantineReactTable, type MRT_ColumnDef } from "mantine-react-table"
import { Eye, Edit, Trash2 } from "lucide-react"

import { RowActions } from "@/components/common/RowActions"
import { TablePagination } from "@/components/common/TablePagination"
import { StatusBadge } from "@/components/common/StatusBadge"
import type { Project } from "../types/project"
import { useTranslation } from "react-i18next"

interface ProjectTableProps {
  data: Project[]
  isLoading?: boolean
  canEdit?: boolean
  canDelete?: boolean
  onEdit: (id: number) => void
  onDelete: (id: number) => void
  onView: (id: number) => void
  pagination: {
    page: number
    perPage: number
    totalRecords: number
    totalPages: number
    onChange: (page: number) => void
  }
}

export function ProjectTable({
  data,
  isLoading,
  canEdit = false,
  canDelete = false,
  onEdit,
  onDelete,
  onView,
  pagination,
}: ProjectTableProps) {
  const { t } = useTranslation(["projects", "common"])
  const columns = useMemo<MRT_ColumnDef<Project>[]>(
    () => [
      {
        accessorKey: "project_code",
        header: t("projects:columns.code"),
        size: 100,
        Cell: ({ cell }) => (
          <span className="font-semibold text-primary">{cell.getValue<string>()}</span>
        ),
      },
      {
        accessorKey: "project_name",
        header: t("projects:columns.name"),
        size: 200,
        Cell: ({ cell }) => <span className="font-medium">{cell.getValue<string>()}</span>,
      },
      {
        accessorKey: "customer.customer_name",
        header: t("projects:columns.customer"),
        size: 150,
      },
      {
        accessorKey: "contract_value",
        header: t("projects:columns.contract_value"),
        size: 150,
        Cell: ({ cell }) => {
          const val = cell.getValue<number | string>()
          if (val == null || val === "") return <span className="text-sm font-medium">—</span>
          const numVal = Number(val)
          if (isNaN(numVal)) return <span className="text-sm font-medium">—</span>
          return (
            <span className="text-sm font-medium text-emerald-600">
              {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
                numVal,
              )}
            </span>
          )
        },
      },
      {
        accessorKey: "status",
        header: t("projects:columns.status"),
        size: 120,
        Cell: ({ cell }) => <StatusBadge status={cell.getValue<string>()} />,
      },
      {
        id: "actions",
        header: t("common:table.actions"),
        size: 120,
        Cell: ({ row }) => {
          const actions: import("@/components/common/RowActions").RowAction[] = [
            {
              label: t("common:actions.view", { defaultValue: "Xem" }),
              icon: <Eye className="size-4" />,
              onClick: () => onView(row.original.id),
              className: "text-blue-600 hover:text-blue-700 hover:bg-blue-50",
            },
          ]
          if (canEdit) {
            actions.push({
              label: t("common:actions.edit", { defaultValue: "Sửa" }),
              icon: <Edit className="size-4" />,
              onClick: () => onEdit(row.original.id),
              className: "text-amber-600 hover:text-amber-700 hover:bg-amber-50",
            })
          }
          if (canDelete) {
            actions.push({
              label: t("common:actions.delete", { defaultValue: "Xóa" }),
              icon: <Trash2 className="size-4" />,
              onClick: () => onDelete(row.original.id),
              className: "text-red-600 hover:text-red-700 hover:bg-red-50",
            })
          }
          return <RowActions actions={actions} />
        },
      },
    ],
    [onEdit, onDelete, onView, canEdit, canDelete, t],
  )

  const table = useMantineReactTable({
    renderEmptyRowsFallback: () => (
      <div className="p-8 text-center text-muted-foreground">
        {t("common:table.noData", { defaultValue: "Không có dữ liệu" })}
      </div>
    ),
    columns,
    data,
    state: { isLoading },
    enableColumnActions: false,
    enableColumnFilters: false,
    enablePagination: false,
    enableSorting: true,
    enableBottomToolbar: false,
    enableTopToolbar: false,
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
      onClick: () => onView(row.original.id),
      style: { cursor: "pointer" },
    }),
  })

  return (
    <div>
      <MantineReactTable table={table} />
      <TablePagination
        page={pagination.page}
        perPage={pagination.perPage}
        total={pagination.totalRecords}
        totalPages={pagination.totalPages}
        onPageChange={pagination.onChange}
      />
    </div>
  )
}
