import { useMemo, useState } from "react"
import { MantineReactTable, useMantineReactTable, type MRT_ColumnDef } from "mantine-react-table"
import { Trash2, Edit, FileSignature, Download } from "lucide-react"

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

import type { Contract } from "../types/sales"

interface ContractTableProps {
  contracts: Contract[]
  isLoading?: boolean
  onEdit: (contract: Contract) => void
  onDelete: (id: number) => Promise<void>
  isAdmin?: boolean
}

function getContractStatusBadge(status: string) {
  switch (status.toLowerCase()) {
    case "draft":
      return (
        <Badge variant="outline" className="text-muted-foreground">
          Draft
        </Badge>
      )
    case "signed":
      return <Badge className="bg-blue-500 hover:bg-blue-600">Signed</Badge>
    case "ongoing":
      return <Badge className="bg-amber-500 hover:bg-amber-600">Ongoing</Badge>
    case "completed":
      return <Badge className="bg-green-500 hover:bg-green-600">Completed</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

export function ContractTable({
  contracts,
  isLoading = false,
  onEdit,
  onDelete,
  isAdmin = false,
}: ContractTableProps) {
  const [deleteTarget, setDeleteTarget] = useState<Contract | null>(null)

  const columns = useMemo<MRT_ColumnDef<Contract>[]>(
    () => [
      {
        accessorKey: "contract_code",
        header: "Mã Hợp đồng",
        size: 140,
        Cell: ({ cell }) => (
          <div className="flex items-center gap-2 font-mono text-sm">
            <FileSignature className="size-4 text-muted-foreground" />
            <span className="font-semibold text-primary">{cell.getValue<string>()}</span>
          </div>
        ),
      },
      {
        accessorKey: "customer.name",
        header: "Khách hàng",
        size: 200,
        Cell: ({ row }) => (
          <div className="flex flex-col gap-0.5">
            <span className="font-semibold text-sm">
              {row.original.customer?.customer_name ?? row.original.customer?.name ?? "—"}
            </span>
            <span className="text-xs text-muted-foreground">
              {row.original.customer?.phone || ""}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "contract_date",
        header: "Ngày Hợp đồng",
        size: 120,
        Cell: ({ cell }) => <span className="text-sm">{cell.getValue<string>()}</span>,
      },
      {
        accessorKey: "contract_value",
        header: "Giá trị HĐ (VNĐ)",
        size: 150,
        Cell: ({ cell }) => {
          const val = cell.getValue<number | string>()
          if (val == null || val === "") return <span className="text-sm font-medium">—</span>
          const numVal = Number(val)
          if (isNaN(numVal)) return <span className="text-sm font-medium">—</span>
          return (
            <span className="text-sm font-medium">
              {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
                numVal,
              )}
            </span>
          )
        },
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
        accessorKey: "status",
        header: "Trạng thái",
        size: 110,
        Cell: ({ cell }) => getContractStatusBadge(cell.getValue<string>()),
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
                title="Tải File"
              >
                <Download className="size-4" />
              </Button>
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
    data: contracts,
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
  })

  return (
    <>
      <div className="rounded-xl border bg-card overflow-hidden">
        <MantineReactTable table={table} />
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa hợp đồng?</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa hợp đồng{" "}
              <span className="font-semibold text-foreground">{deleteTarget?.contract_code}</span>{" "}
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
