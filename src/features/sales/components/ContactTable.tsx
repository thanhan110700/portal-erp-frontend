import { MantineReactTable, useMantineReactTable, type MRT_ColumnDef } from "mantine-react-table"
import { Pencil, Trash2 } from "lucide-react"
import { RowActions } from "@/components/common/RowActions"
import type { Contact } from "../types/sales"
import { useTranslation } from "react-i18next"

interface ContactTableProps {
  contacts: Contact[]
  onEdit: (contact: Contact) => void
  onDelete: (id: number) => Promise<void>
  canEdit?: boolean
  canDelete?: boolean
}

export function ContactTable({
  contacts,
  onEdit,
  onDelete,
  canEdit = false,
  canDelete = false,
}: ContactTableProps) {
  const { t } = useTranslation()
  const columns: MRT_ColumnDef<Contact>[] = [
    {
      accessorKey: "contact_name",
      header: t("sales:contact.columns.name"),
      size: 150,
      Cell: ({ cell }) => <span className="font-medium">{cell.getValue<string>()}</span>,
    },
    {
      accessorKey: "position",
      header: t("sales:contact.columns.position"),
      size: 130,
    },
    {
      accessorKey: "phone",
      header: t("sales:contact.columns.phone"),
      size: 120,
    },
    {
      accessorKey: "email",
      header: t("sales:contact.columns.email"),
      size: 180,
    },
    {
      accessorKey: "is_primary",
      header: t("sales:contact.columns.is_primary"),
      size: 120,
      Cell: ({ cell }) =>
        cell.getValue<boolean>() ? (
          <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
            {t("sales:contact.yes")}
          </span>
        ) : null,
    },
    {
      id: "actions",
      header: "",
      size: 80,
      Cell: ({ row }) => {
        if (!canEdit && !canDelete) return null

        const actions: import("@/components/common/RowActions").RowAction[] = []

        if (canEdit) {
          actions.push({
            label: t("common:actions.edit", { defaultValue: "Sửa" }),
            icon: <Pencil className="size-4" />,
            onClick: () => onEdit(row.original),
            className: "text-muted-foreground hover:text-primary hover:bg-primary/10",
          })
        }

        if (canDelete) {
          actions.push({
            label: t("common:actions.delete", { defaultValue: "Xóa" }),
            icon: <Trash2 className="size-4" />,
            onClick: () => void onDelete(row.original.id),
            className: "text-muted-foreground hover:text-destructive hover:bg-destructive/10",
            variant: "destructive",
          })
        }

        return <RowActions actions={actions} />
      },
    },
  ]

  const table = useMantineReactTable({
    renderEmptyRowsFallback: () => (
      <div className="p-8 text-center text-muted-foreground">
        {t("common:table.noData", { defaultValue: "Không có dữ liệu" })}
      </div>
    ),
    columns,
    data: contacts,
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
  })

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <MantineReactTable table={table} />
    </div>
  )
}
