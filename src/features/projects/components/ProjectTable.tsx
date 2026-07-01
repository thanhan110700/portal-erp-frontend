import { useCallback, useMemo } from "react"
import { MantineReactTable, useMantineReactTable, type MRT_ColumnDef } from "mantine-react-table"
import { Eye, Edit, Trash2, Briefcase, Building2, TrendingUp } from "lucide-react"

import { MobileCardList } from "@/components/common/MobileCardList"
import { MobileRowActions, type RowAction } from "@/components/common/MobileRowActions"
import { TablePagination } from "@/components/common/TablePagination"
import { StatusBadge } from "@/components/common/StatusBadge"
import type { Project } from "../types/project"
import { useTranslation } from "react-i18next"

interface ProjectTableProps {
  data: Project[]
  isLoading?: boolean
  canEdit?: boolean
  canDelete?: boolean
  onEdit: (id: number) => void
  onDelete: (id: number) => void
  onView: (id: number) => void
  pagination: {
    page: number
    perPage: number
    totalRecords: number
    totalPages: number
    onChange: (page: number) => void
  }
}

export function ProjectTable({
  data,
  isLoading,
  canEdit = false,
  canDelete = false,
  onEdit,
  onDelete,
  onView,
  pagination,
}: ProjectTableProps) {
  const { t } = useTranslation(["projects", "common"])

  const buildActions = useCallback(
    (project: Project): RowAction[] => {
      const actions: RowAction[] = [
        {
          label: t("common:actions.view", { defaultValue: "Xem" }),
          icon: <Eye className="size-4" />,
          onClick: () => onView(project.id),
        },
      ]

      if (canEdit) {
        actions.push({
          label: t("common:actions.edit", { defaultValue: "Sửa" }),
          icon: <Edit className="size-4" />,
          onClick: () => onEdit(project.id),
        })
      }

      if (canDelete) {
        actions.push({
          label: t("common:actions.delete", { defaultValue: "Xóa" }),
          icon: <Trash2 className="size-4" />,
          onClick: () => onDelete(project.id),
          variant: "destructive",
          separator: true,
        })
      }

      return actions
    },
    [canDelete, canEdit, onDelete, onEdit, onView, t],
  )

  const columns = useMemo<MRT_ColumnDef<Project>[]>(
    () => [
      {
        accessorKey: "project_code",
        header: t("projects:columns.code"),
        size: 100,
        Cell: ({ cell }) => (
          <span className="font-semibold text-primary">{cell.getValue<string>()}</span>
        ),
      },
      {
        accessorKey: "project_name",
        header: t("projects:columns.name"),
        size: 200,
        Cell: ({ cell }) => <span className="font-medium">{cell.getValue<string>()}</span>,
      },
      {
        accessorKey: "customer.name",
        header: t("projects:columns.customer"),
        size: 150,
      },
      {
        accessorKey: "contract_value",
        header: t("projects:columns.contract_value"),
        size: 150,
        Cell: ({ cell }) => {
          const val = cell.getValue<number | string>()
          if (val == null || val === "") return <span className="text-sm font-medium">—</span>
          const numVal = Number(val)
          if (isNaN(numVal)) return <span className="text-sm font-medium">—</span>
          return (
            <span className="text-sm font-medium text-emerald-600">
              {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
                numVal,
              )}
            </span>
          )
        },
      },
      {
        accessorKey: "status",
        header: t("projects:columns.status"),
        size: 120,
        Cell: ({ cell }) => <StatusBadge status={cell.getValue<string>()} />,
      },
      {
        id: "actions",
        header: t("common:table.actions"),
        size: 120,
        Cell: ({ row }) => <MobileRowActions actions={buildActions(row.original)} />,
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
    data,
    state: { isLoading },
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
    mantineTableBodyRowProps: ({ row }) => ({
      onClick: () => onView(row.original.id),
      style: { cursor: "pointer" },
    }),
  })

  return (
    <div>
      <MobileCardList
        data={data}
        isLoading={isLoading}
        keyExtractor={(project) => project.id}
        emptyIcon={Briefcase}
        emptyTitle={t("common:table.noData", { defaultValue: "Không có dữ liệu" })}
        renderCard={(project) => {
          const contractValue = Number(project.contract_value || 0)
          const progress = project.progress_percent || 0

          return (
            <div
              className="rounded-xl border bg-card p-4 shadow-sm transition-colors active:bg-muted/40"
              onClick={() => onView(project.id)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate text-sm font-semibold text-foreground">
                      {project.project_name}
                    </h3>
                    <StatusBadge status={project.status} />
                  </div>
                  <p className="mt-1 font-mono text-xs text-muted-foreground">
                    {project.project_code}
                  </p>
                </div>
                <div onClick={(e) => e.stopPropagation()} className="-mr-2 -mt-1">
                  <MobileRowActions actions={buildActions(project)} />
                </div>
              </div>

              <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Building2 className="size-4 shrink-0" />
                  <span className="truncate">{project.customer?.name || "—"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="size-4 shrink-0" />
                  <span>{new Intl.NumberFormat("vi-VN").format(contractValue)} VNĐ</span>
                </div>
              </div>

              <div className="mt-4 space-y-1.5">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{t("projects:detail.progress")}</span>
                  <span className="font-semibold text-foreground">{progress}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
          )
        }}
        desktopTable={<MantineReactTable table={table} />}
      />
      <TablePagination
        page={pagination.page}
        perPage={pagination.perPage}
        total={pagination.totalRecords}
        totalPages={pagination.totalPages}
        onPageChange={pagination.onChange}
      />
    </div>
  )
}
