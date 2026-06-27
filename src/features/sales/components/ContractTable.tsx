import { useMemo, useState } from "react"
import { MantineReactTable, useMantineReactTable, type MRT_ColumnDef } from "mantine-react-table"
import { Trash2, Edit, FileSignature, Download, Paperclip } from "lucide-react"

import { ContractFilesDialog } from "./ContractFilesDialog"
import { useTranslation } from "react-i18next"

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

import type { Contract } from "../types/sales"

interface ContractTableProps {
  contracts: Contract[]
  isLoading?: boolean
  onEdit: (contract: Contract) => void
  onDelete: (id: number) => Promise<void>
  onRefresh: () => void
  isAdmin?: boolean
}

export function ContractTable({
  contracts,
  isLoading = false,
  onEdit,
  onDelete,
  isAdmin = false,
  onRefresh,
}: ContractTableProps) {
  const { t } = useTranslation()
  const [deleteTarget, setDeleteTarget] = useState<Contract | null>(null)
  const [fileTarget, setFileTarget] = useState<Contract | null>(null)

  const columns = useMemo<MRT_ColumnDef<Contract>[]>(
    () => [
      {
        accessorKey: "contract_code",
        header: t("sales:contract.columns.contract_code"),
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
        header: t("sales:contract.columns.customer"),
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
        header: t("sales:contract.columns.contract_date"),
        size: 120,
        Cell: ({ cell }) => <span className="text-sm">{cell.getValue<string>()}</span>,
      },
      {
        accessorKey: "contract_value",
        header: t("sales:contract.columns.value"),
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
        header: t("sales:contract.columns.sales_rep"),
        size: 150,
        Cell: ({ row }) => (
          <span className="text-sm font-medium">{row.original.sales_rep?.full_name ?? "—"}</span>
        ),
      },
      {
        accessorKey: "status",
        header: t("common:status.status"),
        size: 110,
        Cell: ({ cell }) => <StatusBadge status={cell.getValue<string>()} />,
      },
      {
        id: "actions",
        header: "",
        size: 100,
        Cell: ({ row }) => {
          const actions: import("@/components/common/RowActions").RowAction[] = [
            {
              label: t("sales:contract.actions.attachments", { defaultValue: "Đính kèm" }),
              icon: (
                <div className="relative">
                  <Paperclip className="size-4" />
                  {row.original.files && row.original.files.length > 0 && (
                    <span className="absolute -top-1 -right-2 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
                      {row.original.files.length}
                    </span>
                  )}
                </div>
              ),
              onClick: () => setFileTarget(row.original),
              className: "text-muted-foreground hover:text-foreground",
            },
            {
              label: t("sales:contract.actions.download_file", { defaultValue: "Tải file" }),
              icon: <Download className="size-4" />,
              onClick: () => {},
              className: "text-muted-foreground hover:text-foreground",
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
    [isAdmin, onEdit, t],
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
            <AlertDialogTitle>{t("sales:contract.actions.delete_title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("sales:contract.actions.delete_confirm")}{" "}
              <span className="font-semibold text-foreground">{deleteTarget?.contract_code}</span>{" "}
              {t("sales:contract.actions.delete_warning")}
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
              {t("sales:contract.actions.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ContractFilesDialog
        open={!!fileTarget}
        onClose={() => setFileTarget(null)}
        contractId={fileTarget?.id ?? 0}
        contractTitle={fileTarget?.contract_code ?? ""}
        onRefresh={onRefresh}
      />
    </>
  )
}
