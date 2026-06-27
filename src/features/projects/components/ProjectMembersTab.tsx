import { useState, useMemo, useCallback } from "react"
import { MantineReactTable, useMantineReactTable, type MRT_ColumnDef } from "mantine-react-table"
import { Plus, Trash2, Edit2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import type { ProjectMember } from "../types/project"
import { projectApi } from "../api/projectApi"
import { ProjectMemberFormModal } from "./ProjectMemberFormModal"
import { useTranslation } from "react-i18next"

interface ProjectMembersTabProps {
  projectId: number
  members: ProjectMember[]
  onRefresh: () => void
  canEdit: boolean
}

export function ProjectMembersTab({
  projectId,
  members,
  onRefresh,
  canEdit,
}: ProjectMembersTabProps) {
  const { t } = useTranslation(["projects", "common"])
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState<ProjectMember | null>(null)

  const handleAddOrUpdate = async (payload: any) => {
    try {
      if (selectedMember) {
        await projectApi.updateMember(projectId, selectedMember.id, payload)
        toast.success(t("projects:members.update_success"))
      } else {
        await projectApi.addMember(projectId, payload)
        toast.success(t("projects:members.add_success"))
      }
      setModalOpen(false)
      onRefresh()
    } catch (err: any) {
      const errMsg = err.response?.data?.message || t("projects:members.process_error")
      toast.error(errMsg)
    }
  }

  const handleRemove = useCallback(
    async (memberId: number) => {
      if (!window.confirm(t("projects:members.delete_confirm"))) return
      try {
        await projectApi.removeMember(projectId, memberId)
        toast.success(t("projects:members.delete_success"))
        onRefresh()
      } catch {
        toast.error(t("projects:members.delete_error"))
      }
    },
    [projectId, onRefresh, t],
  )

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

    if (canEdit) {
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
              <Button
                variant="ghost"
                size="icon"
                className="size-11 md:size-8 hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                onClick={() => handleRemove(member.id)}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          )
        },
      })
    }

    return cols
  }, [canEdit, handleRemove, setSelectedMember, setModalOpen, t])

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
        {canEdit && (
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
    </div>
  )
}
