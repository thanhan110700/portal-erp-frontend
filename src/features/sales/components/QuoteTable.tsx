import { useCallback, useMemo, useState } from "react"
import { MantineReactTable, useMantineReactTable, type MRT_ColumnDef } from "mantine-react-table"
import { Trash2, Edit, FileText, Building2, Calendar, Wallet } from "lucide-react"

import { useTranslation } from "react-i18next"

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

import type { Quote } from "../types/sales"

interface QuoteTableProps {
  quotes: Quote[]
  isLoading?: boolean
  onEdit: (quote: Quote) => void
  onDelete: (id: number) => Promise<void>
  onViewDetail?: (quote: Quote) => void
  canEdit?: boolean
  canDelete?: boolean
}

export function QuoteTable({
  quotes,
  isLoading = false,
  onEdit,
  onDelete,
  canEdit = false,
  canDelete = false,
  onViewDetail,
}: QuoteTableProps) {
  const { t } = useTranslation()
  const [deleteTarget, setDeleteTarget] = useState<Quote | null>(null)

  const buildActions = useCallback(
    (quote: Quote): RowAction[] => {
      const actions: RowAction[] = []

      if (onViewDetail) {
        actions.push({
          label: t("common:action.view", { defaultValue: "Xem chi tiết" }),
          icon: <FileText className="size-4" />,
          onClick: () => onViewDetail(quote),
        })
      }
      if (canEdit) {
        actions.push({
          label: t("common:actions.edit", { defaultValue: "Sửa" }),
          icon: <Edit className="size-4" />,
          onClick: () => onEdit(quote),
        })
      }
      if (canDelete) {
        actions.push({
          label: t("common:actions.delete", { defaultValue: "Xóa" }),
          icon: <Trash2 className="size-4" />,
          onClick: () => setDeleteTarget(quote),
          variant: "destructive",
          separator: actions.length > 0,
        })
      }

      return actions
    },
    [canDelete, canEdit, onEdit, onViewDetail, t],
  )

  const columns = useMemo<MRT_ColumnDef<Quote>[]>(
    () => [
      {
        accessorKey: "quote_code",
        header: t("sales:quote.columns.quote_code"),
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
        header: t("sales:quote.columns.customer"),
        size: 200,
        Cell: ({ row }) => (
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-semibold">
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
        header: t("sales:quote.columns.quote_date"),
        size: 120,
        Cell: ({ cell }) => <span className="text-sm">{cell.getValue<string>()}</span>,
      },
      {
        accessorKey: "quote_value",
        header: t("sales:quote.columns.value"),
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
        header: t("common:status.status"),
        size: 120,
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
        data={quotes}
        isLoading={isLoading}
        keyExtractor={(quote) => quote.id}
        emptyIcon={FileText}
        emptyTitle={t("common:table.noData", { defaultValue: "Không có dữ liệu" })}
        renderCard={(quote) => (
          <div
            className="rounded-xl border bg-card p-4 shadow-sm transition-colors active:bg-muted/40"
            onClick={() => {
              if (onViewDetail) onViewDetail(quote)
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="truncate text-sm font-semibold">{quote.quote_code}</h3>
                  <StatusBadge status={quote.status} />
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {quote.customer?.customer_name || "—"}
                </p>
              </div>
              <div onClick={(e) => e.stopPropagation()} className="-mr-2 -mt-1">
                <MobileRowActions actions={buildActions(quote)} />
              </div>
            </div>

            <div className="mt-4 space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Building2 className="size-4 shrink-0" />
                <span>{quote.customer?.customer_code || "—"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="size-4 shrink-0" />
                <span>{quote.quote_date}</span>
              </div>
              <div className="flex items-center gap-2">
                <Wallet className="size-4 shrink-0" />
                <span>
                  {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
                    Number(quote.quote_value || 0),
                  )}
                </span>
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
            <AlertDialogTitle>{t("sales:quote.actions.delete_title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("sales:quote.actions.delete_confirm")}{" "}
              <span className="font-semibold text-foreground">{deleteTarget?.quote_code}</span>{" "}
              {t("sales:quote.actions.delete_warning")}
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
              {t("sales:quote.actions.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
