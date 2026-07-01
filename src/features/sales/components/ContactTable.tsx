import { MantineReactTable, useMantineReactTable, type MRT_ColumnDef } from "mantine-react-table"
import { Pencil, Trash2, Phone, Mail, UserRound, BadgeCheck } from "lucide-react"
import { MobileCardList } from "@/components/common/MobileCardList"
import { MobileRowActions, type RowAction } from "@/components/common/MobileRowActions"
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

  const buildActions = (contact: Contact): RowAction[] => {
    const actions: RowAction[] = []

    if (canEdit) {
      actions.push({
        label: t("common:actions.edit", { defaultValue: "Sửa" }),
        icon: <Pencil className="size-4" />,
        onClick: () => onEdit(contact),
      })
    }

    if (canDelete) {
      actions.push({
        label: t("common:actions.delete", { defaultValue: "Xóa" }),
        icon: <Trash2 className="size-4" />,
        onClick: () => void onDelete(contact.id),
        variant: "destructive",
        separator: actions.length > 0,
      })
    }

    return actions
  }

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
        return <MobileRowActions actions={buildActions(row.original)} />
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
    <MobileCardList
      data={contacts}
      keyExtractor={(contact) => contact.id}
      emptyIcon={UserRound}
      emptyTitle={t("common:table.noData", { defaultValue: "Không có dữ liệu" })}
      renderCard={(contact) => (
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="truncate text-sm font-semibold">{contact.contact_name}</h3>
                {contact.is_primary && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                    <BadgeCheck className="size-3" />
                    {t("sales:contact.yes")}
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{contact.position || "—"}</p>
            </div>

            {(canEdit || canDelete) && (
              <div className="-mr-2 -mt-1">
                <MobileRowActions actions={buildActions(contact)} />
              </div>
            )}
          </div>

          <div className="mt-4 space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Phone className="size-4 shrink-0" />
              <a href={`tel:${contact.phone}`} className="truncate text-foreground">
                {contact.phone || "—"}
              </a>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="size-4 shrink-0" />
              <a href={`mailto:${contact.email}`} className="truncate text-foreground">
                {contact.email || "—"}
              </a>
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
  )
}
