import { useState, useMemo, useCallback } from "react"
import { MantineReactTable, useMantineReactTable, type MRT_ColumnDef } from "mantine-react-table"
import { Plus, Trash2, Edit2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { ConfirmDialog } from "@/components/common/ConfirmDialog"
import type { ProjectMember } from "../types/project"
import { projectApi } from "../api/projectApi"
import { ProjectMemberFormModal } from "./ProjectMemberFormModal"
import { useTranslation } from "react-i18next"
import { AxiosError } from "axios"
import type { ProjectMemberFormPayload } from "../types/project"

interface ProjectMembersTabProps {
  projectId: number
  members: ProjectMember[]
  onRefresh: () => void
  canCreate?: boolean
  canEdit?: boolean
  canDelete?: boolean
}

export function ProjectMembersTab({
  projectId,
  members,
  onRefresh,
  canCreate = false,
  canEdit = false,
  canDelete = false,
}: ProjectMembersTabProps) {
  const { t } = useTranslation(["projects", "common"])
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState<ProjectMember | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null)

  const handleAddOrUpdate = async (payload: ProjectMemberFormPayload) => {
    try {
      if (selectedMember) {
        await projectApi.updateMember(projectId, selectedMember.id, payload)
        toast.success(t("projects:members.update_success"))
      } else {
        await projectApi.addMember(projectId, payload as any)
        toast.success(t("projects:members.add_success"))
      }
      setModalOpen(false)
      onRefresh()
    } catch (error: unknown) {
      let errMsg = t("projects:members.process_error")
      if (error instanceof AxiosError && error.response?.data?.message) {
        errMsg = error.response.data.message
      }
      toast.error(errMsg)
    }
  }

  const executeRemove = useCallback(
    async (memberId: number) => {
      try {
        await projectApi.removeMember(projectId, memberId)
        toast.success(t("projects:members.delete_success"))
        onRefresh()
      } catch {
        toast.error(t("projects:members.delete_error"))
      } finally {
        setDeleteConfirmId(null)
      }
    },
    [projectId, onRefresh, t],
  )

  const handleRemove = useCallback((memberId: number) => {
    setDeleteConfirmId(memberId)
  }, [])

  const columns = useMemo<MRT_ColumnDef<ProjectMember>[]>(() => {
    const cols: MRT_ColumnDef<ProjectMember>[] = [
      {
        accessorKey: "user.full_name",
        header: t("projects:members.columns.full_name"),
        size: 200,
        Cell: ({ row }) => (
          <span className="font-medium text-foreground">{row.original.user?.full_name || "—"}</span>
        ),
      },
      {
        accessorKey: "role",
        header: t("projects:members.columns.role"),
        size: 150,
        Cell: ({ cell }) => (
          <Badge variant="secondary" className="px-2 py-0.5 font-normal">
            {cell.getValue<string>() || t("projects:members.no_role")}
          </Badge>
        ),
      },
      {
        accessorKey: "start_date",
        header: t("projects:members.columns.start_date"),
        size: 130,
        Cell: ({ cell }) => (
          <span className="text-muted-foreground">{cell.getValue<string>() || "—"}</span>
        ),
      },
      {
        accessorKey: "end_date",
        header: t("projects:members.columns.end_date"),
        size: 130,
        Cell: ({ cell }) => (
          <span className="text-muted-foreground">{cell.getValue<string>() || "—"}</span>
        ),
      },
      {
        accessorKey: "notes",
        header: t("projects:members.columns.notes", { defaultValue: "Ghi chú" }),
        size: 200,
        Cell: ({ cell }) => (
          <span
            className="text-muted-foreground truncate max-w-[200px] block"
            title={cell.getValue<string>() || ""}
          >
            {cell.getValue<string>() || "—"}
          </span>
        ),
      },
      {
        accessorKey: "allocation_percent",
        header: t("projects:members.columns.allocation_percent", { defaultValue: "Tỷ lệ (%)" }),
        size: 120,
        Cell: ({ cell }) => {
          const val = cell.getValue<number | null>()
          return (
            <div className="text-center font-medium">
              {val !== null && val !== undefined ? `${val}%` : "—"}
            </div>
          )
        },
      },
      {
        accessorKey: "labor_cost",
        header: t("projects:members.columns.labor_cost"),
        size: 200,
        Cell: ({ cell }) => {
          const cost = cell.getValue<number | null>()
          return (
            <div className="text-right font-mono">
              {cost ? Number(cost).toLocaleString("vi-VN") + " VNĐ" : "—"}
            </div>
          )
        },
      },
    ]

    if (canEdit || canDelete) {
      cols.push({
        id: "actions",
        header: t("common:table.actions"),
        size: 100,
        Cell: ({ row }) => {
          const member = row.original
          return (
            <div
              className="flex items-center justify-center gap-1.5"
              onClick={(e) => e.stopPropagation()}
            >
              {canEdit && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-11 md:size-8"
                  onClick={() => {
                    setSelectedMember(member)
                    setModalOpen(true)
                  }}
                >
                  <Edit2 className="size-4 text-muted-foreground hover:text-foreground" />
                </Button>
              )}
              {canDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-11 md:size-8 hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                  onClick={() => handleRemove(member.id)}
                >
                  <Trash2 className="size-4" />
                </Button>
              )}
            </div>
          )
        },
      })
    }

    return cols
  }, [canEdit, canDelete, handleRemove, setSelectedMember, setModalOpen, t])

  const table = useMantineReactTable({
    renderEmptyRowsFallback: () => (
      <div className="p-8 text-center text-muted-foreground">
        {t("common:table.noData", { defaultValue: "Không có dữ liệu" })}
      </div>
    ),
    columns,
    data: members,
    enableColumnActions: false,
    enableColumnFilters: false,
    enablePagination: false,
    enableSorting: false,
    enableBottomToolbar: false,
    enableTopToolbar: false,
    enableFullScreenToggle: false,
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
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">
          {t("projects:members.title")} ({members.length})
        </h3>
        {canCreate && (
          <Button
            size="sm"
            onClick={() => {
              setSelectedMember(null)
              setModalOpen(true)
            }}
            className="gap-2 min-h-11 md:min-h-9"
          >
            <Plus className="size-4" />
            {t("projects:members.add_member")}
          </Button>
        )}
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        <MantineReactTable table={table} />
      </div>

      {modalOpen && (
        <ProjectMemberFormModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onSubmit={handleAddOrUpdate}
          editData={selectedMember}
        />
      )}

      <ConfirmDialog
        open={deleteConfirmId !== null}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={() => {
          if (deleteConfirmId !== null) return executeRemove(deleteConfirmId)
        }}
        title={t("projects:members.delete_confirm")}
      />
    </div>
  )
}
