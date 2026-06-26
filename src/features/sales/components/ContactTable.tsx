import { MantineReactTable, useMantineReactTable, type MRT_ColumnDef } from "mantine-react-table"
import { Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Contact } from "../types/sales"

interface ContactTableProps {
  contacts: Contact[]
  onEdit: (contact: Contact) => void
  onDelete: (id: number) => Promise<void>
  isAdmin?: boolean
}

export function ContactTable({ contacts, onEdit, onDelete, isAdmin = false }: ContactTableProps) {
  const columns: MRT_ColumnDef<Contact>[] = [
    {
      accessorKey: "contact_name",
      header: "Họ và tên",
      size: 150,
      Cell: ({ cell }) => <span className="font-medium">{cell.getValue<string>()}</span>,
    },
    {
      accessorKey: "position",
      header: "Chức vụ",
      size: 130,
    },
    {
      accessorKey: "phone",
      header: "Số điện thoại",
      size: 120,
    },
    {
      accessorKey: "email",
      header: "Email",
      size: 180,
    },
    {
      accessorKey: "is_primary",
      header: "Liên hệ chính",
      size: 120,
      Cell: ({ cell }) =>
        cell.getValue<boolean>() ? (
          <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
            Có
          </span>
        ) : null,
    },
    {
      id: "actions",
      header: "",
      size: 80,
      Cell: ({ row }) => {
        if (!isAdmin) return null
        return (
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground hover:text-primary hover:bg-primary/10"
              onClick={() => onEdit(row.original)}
            >
              <Pencil className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              onClick={() => void onDelete(row.original.id)}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        )
      },
    },
  ]

  const table = useMantineReactTable({
    columns,
    data: contacts,
    enableColumnActions: false,
    enableColumnFilters: true,
    enableGlobalFilter: true,
    enablePagination: false,
    enableSorting: true,
    enableBottomToolbar: false,
    enableTopToolbar: true,
    positionGlobalFilter: "left",
    mantineSearchTextInputProps: {
      placeholder: "Tìm kiếm...",
      variant: "filled",
    },
    mantineTableProps: {
      striped: true,
      withBorder: false,
    },
  })

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <MantineReactTable table={table} />
    </div>
  )
}
