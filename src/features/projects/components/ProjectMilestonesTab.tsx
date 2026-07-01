import { useState, useMemo, useCallback } from "react"
import { MantineReactTable, useMantineReactTable, type MRT_ColumnDef } from "mantine-react-table"
import { Plus, Trash2, Edit2, Calendar, Milestone } from "lucide-react"
import { Button } from "@/components/ui/button"

import { toast } from "sonner"
import { StatusBadge } from "@/components/common/StatusBadge"
import { ConfirmDialog } from "@/components/common/ConfirmDialog"
import { MobileActionHeader } from "@/components/common/MobileActionHeader"
import { MobileCardList } from "@/components/common/MobileCardList"
import { MobileRowActions, type RowAction } from "@/components/common/MobileRowActions"
import type {
  CreateProjectMilestonePayload,
  ProjectMilestone,
  UpdateProjectMilestonePayload,
} from "../types/project"
import { projectApi } from "../api/projectApi"
import { ProjectMilestoneFormModal } from "./ProjectMilestoneFormModal"
import { useTranslation } from "react-i18next"

interface ProjectMilestonesTabProps {
  projectId: number
  milestones: ProjectMilestone[]
  onRefresh: () => void
  canEdit: boolean
}

export function ProjectMilestonesTab({
  projectId,
  milestones,
  onRefresh,
  canEdit,
}: ProjectMilestonesTabProps) {
  const { t } = useTranslation(["projects", "common"])
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedMilestone, setSelectedMilestone] = useState<ProjectMilestone | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null)

  const handleAddOrUpdate = async (
    payload: CreateProjectMilestonePayload | UpdateProjectMilestonePayload,
  ) => {
    try {
      if (selectedMilestone) {
        await projectApi.updateMilestone(
          projectId,
          selectedMilestone.id,
          payload as UpdateProjectMilestonePayload,
        )
        toast.success(t("projects:milestones.update_success"))
      } else {
        await projectApi.addMilestone(projectId, payload as CreateProjectMilestonePayload)
        toast.success(t("projects:milestones.add_success"))
      }
      setModalOpen(false)
      onRefresh()
    } catch {
      toast.error(t("projects:milestones.process_error"))
    }
  }

  const executeRemove = useCallback(
    async (milestoneId: number) => {
      try {
        await projectApi.removeMilestone(projectId, milestoneId)
        toast.success(t("projects:milestones.delete_success"))
        onRefresh()
      } catch {
        toast.error(t("projects:milestones.delete_error"))
      } finally {
        setDeleteConfirmId(null)
      }
    },
    [onRefresh, projectId, t],
  )

  const handleRemove = useCallback((milestoneId: number) => {
    setDeleteConfirmId(milestoneId)
  }, [])

  const buildActions = useCallback(
    (milestone: ProjectMilestone): RowAction[] => {
      if (!canEdit) return []

      return [
        {
          label: t("common:actions.edit", { defaultValue: "Sửa" }),
          icon: <Edit2 className="size-4" />,
          onClick: () => {
            setSelectedMilestone(milestone)
            setModalOpen(true)
          },
        },
        {
          label: t("common:actions.delete", { defaultValue: "Xóa" }),
          icon: <Trash2 className="size-4" />,
          onClick: () => handleRemove(milestone.id),
          variant: "destructive",
          separator: true,
        },
      ]
    },
    [canEdit, handleRemove, t],
  )

  const sortedMilestones = [...milestones].sort((a, b) => {
    return new Date(a.milestone_date).getTime() - new Date(b.milestone_date).getTime()
  })

  const columns = useMemo<MRT_ColumnDef<ProjectMilestone>[]>(() => {
    const cols: MRT_ColumnDef<ProjectMilestone>[] = [
      {
        accessorKey: "milestone_name",
        header: t("projects:milestones.columns.name"),
        size: 200,
        Cell: ({ cell }) => (
          <span className="font-semibold text-foreground">{cell.getValue<string>()}</span>
        ),
      },
      {
        accessorKey: "milestone_date",
        header: t("projects:milestones.columns.due_date"),
        size: 150,
        Cell: ({ cell }) => (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="size-4 shrink-0" />
            <span>{cell.getValue<string>()}</span>
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: t("projects:milestones.columns.status"),
        size: 150,
        Cell: ({ cell }) => {
          const status = cell.getValue<string>() || "planned"
          return <StatusBadge status={status} />
        },
      },
      {
        accessorKey: "notes",
        header: t("projects:milestones.columns.notes"),
        size: 300,
        Cell: ({ cell }) => (
          <span
            className="block max-w-[300px] truncate text-muted-foreground"
            title={cell.getValue<string>() || ""}
          >
            {cell.getValue<string>() || "—"}
          </span>
        ),
      },
    ]

    if (canEdit) {
      cols.push({
        id: "actions",
        header: t("common:table.actions"),
        size: 100,
        Cell: ({ row }) => <MobileRowActions actions={buildActions(row.original)} />,
      })
    }
    return cols
  }, [buildActions, canEdit, t])

  const table = useMantineReactTable({
    renderEmptyRowsFallback: () => (
      <div className="p-8 text-center text-muted-foreground">
        {t("common:table.noData", { defaultValue: "Không có dữ liệu" })}
      </div>
    ),
    columns,
    data: sortedMilestones,
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
      <MobileActionHeader
        title={t("projects:milestones.title")}
        subtitle={`(${milestones.length})`}
        actions={
          canEdit ? (
            <Button
              size="sm"
              onClick={() => {
                setSelectedMilestone(null)
                setModalOpen(true)
              }}
              className="gap-2 min-h-11 md:min-h-9"
            >
              <Plus className="size-4" />
              {t("projects:milestones.add_milestone")}
            </Button>
          ) : undefined
        }
      />

      <MobileCardList
        data={sortedMilestones}
        keyExtractor={(milestone) => milestone.id}
        emptyIcon={Milestone}
        emptyTitle={t("common:table.noData", { defaultValue: "Không có dữ liệu" })}
        renderCard={(milestone) => (
          <div className="relative rounded-xl border bg-card p-4 shadow-sm">
            <div className="absolute bottom-0 left-[1.1rem] top-0 w-px bg-border/70" />
            <div className="relative flex items-start gap-3">
              <div className="relative z-10 mt-1 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary" />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{milestone.milestone_name}</p>
                    <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="size-4 shrink-0" />
                      <span>{milestone.milestone_date}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={milestone.status || "planned"} />
                    {canEdit && <MobileRowActions actions={buildActions(milestone)} />}
                  </div>
                </div>
                {milestone.notes && (
                  <p className="mt-3 text-sm text-muted-foreground">{milestone.notes}</p>
                )}
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

      {modalOpen && (
        <ProjectMilestoneFormModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onSubmit={handleAddOrUpdate}
          editData={selectedMilestone}
        />
      )}

      <ConfirmDialog
        open={deleteConfirmId !== null}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={() => {
          if (deleteConfirmId !== null) return executeRemove(deleteConfirmId)
        }}
        title={t("projects:milestones.delete_confirm")}
      />
    </div>
  )
}
