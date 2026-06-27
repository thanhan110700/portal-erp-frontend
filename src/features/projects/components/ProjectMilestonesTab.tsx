import { useState, useMemo, useCallback } from "react"
import { MantineReactTable, useMantineReactTable, type MRT_ColumnDef } from "mantine-react-table"
import { Plus, Trash2, Edit2, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import type { ProjectMilestone } from "../types/project"
import { projectApi } from "../api/projectApi"
import { ProjectMilestoneFormModal } from "./ProjectMilestoneFormModal"

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
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedMilestone, setSelectedMilestone] = useState<ProjectMilestone | null>(null)

  const handleAddOrUpdate = async (payload: any) => {
    try {
      if (selectedMilestone) {
        await projectApi.updateMilestone(projectId, selectedMilestone.id, payload)
        toast.success("Cập nhật cột mốc thành công")
      } else {
        await projectApi.addMilestone(projectId, payload)
        toast.success("Thêm cột mốc thành công")
      }
      setModalOpen(false)
      onRefresh()
    } catch {
      toast.error("Lỗi xử lý yêu cầu")
    }
  }

  const handleRemove = useCallback(
    async (milestoneId: number) => {
      if (!window.confirm("Bạn có chắc chắn muốn xóa cột mốc này?")) return
      try {
        await projectApi.removeMilestone(projectId, milestoneId)
        toast.success("Đã xóa cột mốc")
        onRefresh()
      } catch {
        toast.error("Xóa cột mốc thất bại")
      }
    },
    [projectId, onRefresh],
  )

  // Sort milestones by date chronologically
  const sortedMilestones = [...milestones].sort((a, b) => {
    return new Date(a.milestone_date).getTime() - new Date(b.milestone_date).getTime()
  })

  const columns = useMemo<MRT_ColumnDef<ProjectMilestone>[]>(() => {
    const cols: MRT_ColumnDef<ProjectMilestone>[] = [
      {
        accessorKey: "milestone_name",
        header: "Tên cột mốc",
        size: 200,
        Cell: ({ cell }) => (
          <span className="font-semibold text-foreground">{cell.getValue<string>()}</span>
        ),
      },
      {
        accessorKey: "milestone_date",
        header: "Ngày đến hạn",
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
        header: "Trạng thái",
        size: 150,
        Cell: ({ cell }) => {
          const status = cell.getValue<string>() || "planned"
          return (
            <Badge variant={STATUS_VARIANTS[status] || "default"}>
              {STATUS_LABELS[status] || status || ""}
            </Badge>
          )
        },
      },
      {
        accessorKey: "notes",
        header: "Ghi chú / Tiêu chí nghiệm thu",
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
        header: "Thao tác",
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
  }, [canEdit, handleRemove, setSelectedMilestone, setModalOpen])

  const table = useMantineReactTable({
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
        <h3 className="text-lg font-semibold">Cột mốc dự án ({milestones.length})</h3>
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
            Thêm cột mốc
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
