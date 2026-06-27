import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { MantineReactTable, useMantineReactTable, type MRT_ColumnDef } from "mantine-react-table"
import { Trash2, Edit, Eye } from "lucide-react"

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

import type { Customer } from "../types/sales"
import { useTranslation } from "react-i18next"

interface CustomerTableProps {
  customers: Customer[]
  isLoading?: boolean
  onEdit: (customer: Customer) => void
  onDelete: (id: number) => Promise<void>
  isAdmin?: boolean
}

export function CustomerTable({
  customers,
  isLoading = false,
  onEdit,
  onDelete,
  isAdmin = false,
}: CustomerTableProps) {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null)

  const columns = useMemo<MRT_ColumnDef<Customer>[]>(
    () => [
      {
        accessorKey: "customer_name",
        header: t("sales:customer_list.columns.customer"),
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
        header: t("sales:customer_list.columns.classification"),
        size: 110,
        Cell: ({ cell }) => <StatusBadge status={cell.getValue<string | null>()} />,
      },
      {
        accessorKey: "phone",
        header: t("sales:customer_list.columns.phone"),
        size: 120,
        Cell: ({ cell }) => <span className="text-sm">{cell.getValue<string>()}</span>,
      },
      {
        accessorKey: "email",
        header: t("sales:customer_list.columns.email"),
        size: 180,
        Cell: ({ cell }) => (
          <span className="text-sm text-muted-foreground">{cell.getValue<string>() || "—"}</span>
        ),
      },
      {
        accessorKey: "sales_rep.full_name",
        header: t("sales:customer_list.columns.sales_rep"),
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
          const actions: import("@/components/common/RowActions").RowAction[] = [
            {
              label: t("common:actions.view_detail", { defaultValue: "Chi tiết" }),
              icon: <Eye className="size-4" />,
              onClick: () => navigate(`/sales/customers/${row.original.id}`),
              className: "text-blue-600 hover:text-blue-700 hover:bg-blue-50",
            },
            {
              label: t("common:actions.edit", { defaultValue: "Sửa" }),
              icon: <Edit className="size-4" />,
              onClick: () => onEdit(row.original),
              className: "text-muted-foreground hover:text-foreground",
            },
          ]
          if (isAdmin) {
            actions.push({
              label: t("common:actions.delete", { defaultValue: "Xóa" }),
              icon: <Trash2 className="size-4" />,
              onClick: () => setDeleteTarget(row.original),
              className: "text-muted-foreground hover:text-destructive hover:bg-destructive/10",
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
    [isAdmin, onEdit, t, navigate],
  )

  const table = useMantineReactTable({
    renderEmptyRowsFallback: () => (
      <div className="p-8 text-center text-muted-foreground">
        {t("common:table.noData", { defaultValue: "Không có dữ liệu" })}
      </div>
    ),
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
            <AlertDialogTitle>{t("sales:customer_list.delete_title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("sales:customer_list.delete_confirm", {
                name: deleteTarget?.customer_name ?? deleteTarget?.name ?? "",
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common:actions.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={async () => {
                if (deleteTarget) {
                  await onDelete(deleteTarget.id)
                  setDeleteTarget(null)
                }
              }}
            >
              {t("common:actions.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
