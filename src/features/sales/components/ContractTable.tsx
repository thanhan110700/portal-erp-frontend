import { useCallback, useMemo, useState } from "react"
import { MantineReactTable, useMantineReactTable, type MRT_ColumnDef } from "mantine-react-table"
import { Trash2, Edit, FileSignature, Building2, Calendar, Wallet, User } from "lucide-react"

import { MobileCardList } from "@/components/common/MobileCardList"
import { MobileRowActions, type RowAction } from "@/components/common/MobileRowActions"
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
import { useTranslation } from "react-i18next"

interface ContractTableProps {
  contracts: Contract[]
  isLoading?: boolean
  onEdit: (contract: Contract) => void
  onDelete: (id: number) => Promise<void>
  onViewDetail?: (contract: Contract) => void
  canEdit?: boolean
  canDelete?: boolean
}

export function ContractTable({
  contracts,
  isLoading = false,
  onEdit,
  onDelete,
  canEdit = false,
  canDelete = false,
  onViewDetail,
}: ContractTableProps) {
  const { t } = useTranslation()
  const [deleteTarget, setDeleteTarget] = useState<Contract | null>(null)

  const buildActions = useCallback(
    (contract: Contract): RowAction[] => {
      const actions: RowAction[] = []

      if (onViewDetail) {
        actions.push({
          label: t("common:action.view", { defaultValue: "Xem chi tiết" }),
          icon: <FileSignature className="size-4" />,
          onClick: () => onViewDetail(contract),
        })
      }
      if (canEdit) {
        actions.push({
          label: t("common:actions.edit", { defaultValue: "Sửa" }),
          icon: <Edit className="size-4" />,
          onClick: () => onEdit(contract),
        })
      }
      if (canDelete) {
        actions.push({
          label: t("common:actions.delete", { defaultValue: "Xóa" }),
          icon: <Trash2 className="size-4" />,
          onClick: () => setDeleteTarget(contract),
          variant: "destructive",
          separator: actions.length > 0,
        })
      }

      return actions
    },
    [canDelete, canEdit, onEdit, onViewDetail, t],
  )

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
        accessorKey: "customer.customer_name",
        header: t("sales:contract.columns.customer"),
        size: 200,
        Cell: ({ row }) => (
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-semibold">
              {row.original.customer?.customer_name ?? "—"}
            </span>
            <span className="text-xs text-muted-foreground">
              {row.original.customer?.customer_code || ""}
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
        Cell: ({ row }) => (
          <div onClick={(e) => e.stopPropagation()}>
            <MobileRowActions actions={buildActions(row.original)} />
          </div>
        ),
      },
    ],
    [buildActions, t],
  )

  const table = useMantineReactTable({
    renderEmptyRowsFallback: () => (
      <div className="p-8 text-center text-muted-foreground">
        {t("common:table.noData", { defaultValue: "Không có dữ liệu" })}
      </div>
    ),
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
    mantineTableBodyRowProps: ({ row }) => ({
      onClick: () => {
        if (onViewDetail) onViewDetail(row.original)
      },
      sx: { cursor: onViewDetail ? "pointer" : "default" },
    }),
    mantineTableContainerProps: {
      onScroll: (e: React.UIEvent<HTMLDivElement>) => {
        e.currentTarget.style.setProperty("--mrt-scroll-left", `${e.currentTarget.scrollLeft}px`)
      },
      sx: { overflowX: "auto", WebkitOverflowScrolling: "touch" },
    },
  })

  return (
    <>
      <MobileCardList
        data={contracts}
        isLoading={isLoading}
        keyExtractor={(contract) => contract.id}
        emptyIcon={FileSignature}
        emptyTitle={t("common:table.noData", { defaultValue: "Không có dữ liệu" })}
        renderCard={(contract) => (
          <div
            className="rounded-xl border bg-card p-4 shadow-sm transition-colors active:bg-muted/40"
            onClick={() => {
              if (onViewDetail) onViewDetail(contract)
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="truncate text-sm font-semibold">{contract.contract_code}</h3>
                  <StatusBadge status={contract.status} />
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {contract.customer?.customer_name || "—"}
                </p>
              </div>
              <div onClick={(e) => e.stopPropagation()} className="-mr-2 -mt-1">
                <MobileRowActions actions={buildActions(contract)} />
              </div>
            </div>

            <div className="mt-4 space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Building2 className="size-4 shrink-0" />
                <span>{contract.customer?.customer_code || "—"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="size-4 shrink-0" />
                <span>{contract.contract_date}</span>
              </div>
              <div className="flex items-center gap-2">
                <Wallet className="size-4 shrink-0" />
                <span>
                  {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
                    Number(contract.contract_value || 0),
                  )}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <User className="size-4 shrink-0" />
                <span>{contract.sales_rep?.full_name || "—"}</span>
              </div>
            </div>
          </div>
        )}
        desktopTable={
          <div className="rounded-xl border bg-card overflow-hidden">
            <MantineReactTable table={table} />
          </div>
        }
      />

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
              onClick={() => {
                if (deleteTarget) {
                  void onDelete(deleteTarget.id)
                  setDeleteTarget(null)
                }
              }}
            >
              {t("sales:contract.actions.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
