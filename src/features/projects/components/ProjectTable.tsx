import { useMemo } from "react"
import { MantineReactTable, useMantineReactTable, type MRT_ColumnDef } from "mantine-react-table"
import { Eye, Edit, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { TablePagination } from "@/components/common/TablePagination"
import type { Project } from "../types/project"

interface ProjectTableProps {
  data: Project[]
  isLoading?: boolean
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

const getStatusColor = (status: string) => {
  switch (status) {
    case "planning":
      return "bg-blue-100 text-blue-800"
    case "in_progress":
      return "bg-amber-100 text-amber-800"
    case "completed":
      return "bg-green-100 text-green-800"
    case "on_hold":
      return "bg-gray-100 text-gray-800"
    case "cancelled":
      return "bg-red-100 text-red-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

export function ProjectTable({
  data,
  isLoading,
  onEdit,
  onDelete,
  onView,
  pagination,
}: ProjectTableProps) {
  const columns = useMemo<MRT_ColumnDef<Project>[]>(
    () => [
      {
        accessorKey: "project_code",
        header: "Mã DA",
        size: 100,
        Cell: ({ cell }) => (
          <span className="font-semibold text-primary">{cell.getValue<string>()}</span>
        ),
      },
      {
        accessorKey: "project_name",
        header: "Tên dự án",
        size: 200,
        Cell: ({ cell }) => <span className="font-medium">{cell.getValue<string>()}</span>,
      },
      {
        accessorKey: "customer.customer_name",
        header: "Khách hàng",
        size: 150,
      },
      {
        accessorKey: "contract_value",
        header: "Giá trị (VNĐ)",
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
        header: "Trạng thái",
        size: 120,
        Cell: ({ cell }) => (
          <Badge className={`${getStatusColor(cell.getValue<string>())} border-transparent`}>
            {cell.getValue<string>()}
          </Badge>
        ),
      },
      {
        id: "actions",
        header: "Thao tác",
        size: 120,
        Cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onView(row.original.id)}
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            >
              <Eye className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onEdit(row.original.id)}
              className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
            >
              <Edit className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onDelete(row.original.id)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ),
      },
    ],
    [onEdit, onDelete, onView],
  )

  const table = useMantineReactTable({
    columns,
    data,
    state: { isLoading },
    enableColumnActions: false,
    enableColumnFilters: false,
    enablePagination: false,
    enableSorting: false,
    enableBottomToolbar: false,
    enableTopToolbar: false,
    mantineTableProps: {
      striped: true,
      withBorder: false,
    },
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
