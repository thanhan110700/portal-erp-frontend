import { useState, useMemo, useCallback } from "react"
import { MantineReactTable, useMantineReactTable, type MRT_ColumnDef } from "mantine-react-table"
import { Plus, Trash2, Edit2, Users, Calendar, Briefcase } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { ConfirmDialog } from "@/components/common/ConfirmDialog"
import { MobileActionHeader } from "@/components/common/MobileActionHeader"
import { MobileCardList } from "@/components/common/MobileCardList"
import { MobileRowActions, type RowAction } from "@/components/common/MobileRowActions"
import type { CreateProjectMemberPayload, ProjectMember } from "../types/project"
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
        await projectApi.addMember(projectId, payload as CreateProjectMemberPayload)
        toast.success(t("projects:members.add_success"))
      }
      setModalOpen(false)
      onRefresh()
    } catch (error: unknown) {
      let errMsg = t("projects:members.process_error")
      if (
        error instanceof AxiosError &&
        typeof error.response?.data === "object" &&
        error.response?.data !== null &&
        "message" in error.response.data &&
        typeof error.response.data.message === "string"
      ) {
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
    [onRefresh, projectId, t],
  )

  const handleRemove = useCallback((memberId: number) => {
    setDeleteConfirmId(memberId)
  }, [])

  const buildActions = useCallback(
    (member: ProjectMember): RowAction[] => {
      const actions: RowAction[] = []

      if (canEdit) {
        actions.push({
          label: t("common:actions.edit", { defaultValue: "Sửa" }),
          icon: <Edit2 className="size-4" />,
          onClick: () => {
            setSelectedMember(member)
            setModalOpen(true)
          },
        })
      }

      if (canDelete) {
        actions.push({
          label: t("common:actions.delete", { defaultValue: "Xóa" }),
          icon: <Trash2 className="size-4" />,
          onClick: () => handleRemove(member.id),
          variant: "destructive",
          separator: actions.length > 0,
        })
      }

      return actions
    },
    [canDelete, canEdit, handleRemove, t],
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
        accessorKey: "notes",
        header: t("projects:members.columns.notes", { defaultValue: "Ghi chú" }),
        size: 200,
        Cell: ({ cell }) => (
          <span
            className="block max-w-[200px] truncate text-muted-foreground"
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
              {cost ? `${Number(cost).toLocaleString("vi-VN")} VNĐ` : "—"}
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
        Cell: ({ row }) => <MobileRowActions actions={buildActions(row.original)} />,
      })
    }

    return cols
  }, [buildActions, canDelete, canEdit, t])

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
      <MobileActionHeader
        title={t("projects:members.title")}
        subtitle={`(${members.length})`}
        actions={
          canCreate ? (
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
          ) : undefined
        }
      />

      <MobileCardList
        data={members}
        keyExtractor={(member) => member.id}
        emptyIcon={Users}
        emptyTitle={t("common:table.noData", { defaultValue: "Không có dữ liệu" })}
        renderCard={(member) => (
          <div className="rounded-xl border bg-card p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                    {member.user?.full_name?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                      {member.user?.full_name || "—"}
                    </p>
                    <div className="mt-1">
                      <Badge variant="secondary" className="px-2 py-0.5 font-normal">
                        {member.role || t("projects:members.no_role")}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {buildActions(member).length > 0 && (
                <div className="-mr-2 -mt-1">
                  <MobileRowActions actions={buildActions(member)} />
                </div>
              )}
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="size-4 shrink-0" />
                <span>{member.start_date || "—"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="size-4 shrink-0" />
                <span>{member.end_date || "—"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="size-4 shrink-0" />
                <span>
                  {member.allocation_percent != null ? `${member.allocation_percent}%` : "—"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Briefcase className="size-4 shrink-0" />
                <span>
                  {member.labor_cost
                    ? `${Number(member.labor_cost).toLocaleString("vi-VN")} VNĐ`
                    : "—"}
                </span>
              </div>
            </div>

            {member.notes && <p className="mt-3 text-sm text-muted-foreground">{member.notes}</p>}
          </div>
        )}
        desktopTable={
          <div className="rounded-xl border bg-card overflow-hidden">
            <MantineReactTable table={table} />
          </div>
        }
      />

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
