import { useState, useMemo, useCallback } from "react"
import { MantineReactTable, useMantineReactTable, type MRT_ColumnDef } from "mantine-react-table"
import { Plus, Trash2, Edit2, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import type { ProjectMilestone } from "../types/project"
import { projectApi } from "../api/projectApi"
import { ProjectMilestoneFormModal } from "./ProjectMilestoneFormModal"
import { useTranslation } from "react-i18next"

interface ProjectMilestonesTabProps {
  projectId: number
  milestones: ProjectMilestone[]
  onRefresh: () => void
  canEdit: boolean
}

const STATUS_VARIANTS: Record<string, any> = {
  planned: "secondary",
  in_progress: "info",
  completed: "success",
  delayed: "danger",
}

const STATUS_LABELS: Record<string, string> = {
  planned: "Lên kế hoạch",
  in_progress: "Đang thực hiện",
  completed: "Hoàn thành",
  delayed: "Bị trễ",
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

  const handleAddOrUpdate = async (payload: any) => {
    try {
      if (selectedMilestone) {
        await projectApi.updateMilestone(projectId, selectedMilestone.id, payload)
        toast.success(t("projects:milestones.update_success"))
      } else {
        await projectApi.addMilestone(projectId, payload)
        toast.success(t("projects:milestones.add_success"))
      }
      setModalOpen(false)
      onRefresh()
    } catch {
      toast.error(t("projects:milestones.process_error"))
    }
  }

  const handleRemove = useCallback(
    async (milestoneId: number) => {
      if (!window.confirm(t("projects:milestones.delete_confirm"))) return
      try {
        await projectApi.removeMilestone(projectId, milestoneId)
        toast.success(t("projects:milestones.delete_success"))
        onRefresh()
      } catch {
        toast.error(t("projects:milestones.delete_error"))
      }
    },
    [projectId, onRefresh, t],
  )

  // Sort milestones by date chronologically
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
          return (
            <Badge variant={STATUS_VARIANTS[status] || "default"}>
              {t(`common:status.${status}`, {
                defaultValue: STATUS_LABELS[status] || status || "",
              })}
            </Badge>
          )
        },
      },
      {
        accessorKey: "notes",
        header: t("projects:milestones.columns.notes"),
        size: 300,
        Cell: ({ cell }) => (
          <span
            className="text-muted-foreground truncate block max-w-[300px]"
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
        Cell: ({ row }) => {
          const milestone = row.original
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
                  setSelectedMilestone(milestone)
                  setModalOpen(true)
                }}
              >
                <Edit2 className="size-4 text-muted-foreground hover:text-foreground" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-11 md:size-8 hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                onClick={() => handleRemove(milestone.id)}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          )
        },
      })
    }
    return cols
  }, [canEdit, handleRemove, setSelectedMilestone, setModalOpen, t])

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
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">
          {t("projects:milestones.title")} ({milestones.length})
        </h3>
        {canEdit && (
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
        )}
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        <MantineReactTable table={table} />
      </div>

      {modalOpen && (
        <ProjectMilestoneFormModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onSubmit={handleAddOrUpdate}
          editData={selectedMilestone}
        />
      )}
    </div>
  )
}
