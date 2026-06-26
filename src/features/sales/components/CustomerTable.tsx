import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { MantineReactTable, useMantineReactTable, type MRT_ColumnDef } from "mantine-react-table"
import { Trash2, Edit } from "lucide-react"

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

import type { Customer } from "../types/sales"

interface CustomerTableProps {
  customers: Customer[]
  isLoading?: boolean
  onEdit: (customer: Customer) => void
  onDelete: (id: number) => Promise<void>
  isAdmin?: boolean
}

function getClassificationBadge(classification?: string | null) {
  if (!classification) return <Badge variant="outline">—</Badge>
  switch (classification.toLowerCase()) {
    case "vip":
      return <Badge className="bg-amber-500 hover:bg-amber-600 text-white">VIP</Badge>
    case "regular":
      return <Badge variant="secondary">Regular</Badge>
    case "new":
      return (
        <Badge variant="outline" className="text-primary border-primary">
          New
        </Badge>
      )
    case "inactive":
      return <Badge variant="destructive">Inactive</Badge>
    default:
      return <Badge variant="outline">{classification}</Badge>
  }
}

export function CustomerTable({
  customers,
  isLoading = false,
  onEdit,
  onDelete,
  isAdmin = false,
}: CustomerTableProps) {
  const navigate = useNavigate()
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null)

  const columns = useMemo<MRT_ColumnDef<Customer>[]>(
    () => [
      {
        accessorKey: "customer_name",
        header: "Khách hàng",
        size: 200,
        Cell: ({ row }) => (
          <div className="flex flex-col gap-0.5">
            <span className="font-semibold text-sm">
              {row.original.customer_name ?? row.original.name}
            </span>
            <span className="font-mono text-xs text-muted-foreground">
              {row.original.customer_code}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "classification",
        header: "Phân loại",
        size: 110,
        Cell: ({ cell }) => getClassificationBadge(cell.getValue<string | null>()),
      },
      {
        accessorKey: "phone",
        header: "SĐT",
        size: 120,
        Cell: ({ cell }) => <span className="text-sm">{cell.getValue<string>()}</span>,
      },
      {
        accessorKey: "email",
        header: "Email",
        size: 180,
        Cell: ({ cell }) => (
          <span className="text-sm text-muted-foreground">{cell.getValue<string>() || "—"}</span>
        ),
      },
      {
        accessorKey: "sales_rep.full_name",
        header: "Sales phụ trách",
        size: 150,
        Cell: ({ row }) => (
          <span className="text-sm font-medium">{row.original.sales_rep?.full_name ?? "—"}</span>
        ),
      },
      {
        id: "actions",
        header: "",
        size: 100,
        Cell: ({ row }) => {
          return (
            <div
              className="flex items-center justify-end gap-1"
              onClick={(e) => e.stopPropagation()}
            >
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-muted-foreground hover:text-foreground"
                onClick={() => onEdit(row.original)}
              >
                <Edit className="size-4" />
              </Button>
              {isAdmin && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  onClick={() => setDeleteTarget(row.original)}
                >
                  <Trash2 className="size-4" />
                </Button>
              )}
            </div>
          )
        },
      },
    ],
    [isAdmin, onEdit],
  )

  const table = useMantineReactTable({
    columns,
    data: customers,
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
      // onClick: () => navigate(salesCustomerDetailPath(row.original.id)),
      onClick: () => navigate(`/sales/customers/${row.original.id}`),
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
            <AlertDialogTitle>Xóa khách hàng?</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa khách hàng{" "}
              <span className="font-semibold text-foreground">
                {deleteTarget?.customer_name ?? deleteTarget?.name}
              </span>{" "}
              không? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={async () => {
                if (deleteTarget) {
                  await onDelete(deleteTarget.id)
                  setDeleteTarget(null)
                }
              }}
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
