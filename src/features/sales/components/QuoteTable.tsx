import { useMemo, useState } from "react"
import { MantineReactTable, useMantineReactTable, type MRT_ColumnDef } from "mantine-react-table"
import { Trash2, Edit, FileText, Download } from "lucide-react"

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

import type { Quote } from "../types/sales"

interface QuoteTableProps {
  quotes: Quote[]
  isLoading?: boolean
  onEdit: (quote: Quote) => void
  onDelete: (id: number) => Promise<void>
  isAdmin?: boolean
}

function getQuoteStatusBadge(status: string) {
  switch (status.toLowerCase()) {
    case "draft":
      return (
        <Badge variant="outline" className="text-muted-foreground">
          Draft
        </Badge>
      )
    case "sent":
      return <Badge className="bg-blue-500 hover:bg-blue-600">Sent</Badge>
    case "waiting":
      return <Badge className="bg-amber-500 hover:bg-amber-600">Waiting</Badge>
    case "accepted":
      return <Badge className="bg-green-500 hover:bg-green-600">Accepted</Badge>
    case "rejected":
      return <Badge variant="destructive">Rejected</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

export function QuoteTable({
  quotes,
  isLoading = false,
  onEdit,
  onDelete,
  isAdmin = false,
}: QuoteTableProps) {
  const [deleteTarget, setDeleteTarget] = useState<Quote | null>(null)

  const columns = useMemo<MRT_ColumnDef<Quote>[]>(
    () => [
      {
        accessorKey: "quote_code",
        header: "Mã BG",
        size: 130,
        Cell: ({ cell }) => (
          <div className="flex items-center gap-2 font-mono text-sm">
            <FileText className="size-4 text-muted-foreground" />
            <span className="font-semibold text-primary">{cell.getValue<string>()}</span>
          </div>
        ),
      },
      {
        accessorKey: "customer.customer_name",
        header: "Khách hàng",
        size: 200,
        Cell: ({ row }) => (
          <div className="flex flex-col gap-0.5">
            <span className="font-semibold text-sm">
              {row.original.customer?.customer_name || "—"}
            </span>
            <span className="text-xs text-muted-foreground">
              {row.original.customer?.customer_code || ""}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "quote_date",
        header: "Ngày báo giá",
        size: 120,
        Cell: ({ cell }) => <span className="text-sm">{cell.getValue<string>()}</span>,
      },
      {
        accessorKey: "quote_value",
        header: "Giá trị (VNĐ)",
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
        accessorKey: "status",
        header: "Trạng thái",
        size: 120,
        Cell: ({ cell }) => getQuoteStatusBadge(cell.getValue<string>()),
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
                title="Tải PDF"
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
    data: quotes,
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
            <AlertDialogTitle>Xóa báo giá?</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa báo giá{" "}
              <span className="font-semibold text-foreground">{deleteTarget?.quote_code}</span>{" "}
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
