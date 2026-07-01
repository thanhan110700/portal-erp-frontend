import { useEffect, useState, useMemo, useCallback } from "react"
import { Building2, Plus, Edit, Trash2, RefreshCw, FolderTree } from "lucide-react"
import { toast } from "sonner"
import { MantineReactTable, useMantineReactTable, type MRT_ColumnDef } from "mantine-react-table"

import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

import { departmentApi, type CreateDepartmentPayload } from "../api/departmentApi"
import type { Department } from "../types/employee"
import { DepartmentFormModal } from "../components/DepartmentFormModal"
import { MobileActionHeader } from "@/components/common/MobileActionHeader"
import { MobileCardList } from "@/components/common/MobileCardList"
import { MobileRowActions, type RowAction } from "@/components/common/MobileRowActions"
import { Fab } from "@/components/common/Fab"
import { useAuthStore } from "@/hooks/useAuthStore"
import { hasPermission, PermissionSlugs } from "@/constants/permissions"
import { useTranslation } from "react-i18next"

export function DepartmentListPage() {
  const { t } = useTranslation()
  const user = useAuthStore((s) => s.user)
  const canCreate = hasPermission(user?.permissions, PermissionSlugs.CreateDepartments)
  const canEdit = hasPermission(user?.permissions, PermissionSlugs.EditDepartments)
  const canDelete = hasPermission(user?.permissions, PermissionSlugs.DeleteDepartments)

  const [departments, setDepartments] = useState<Department[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Department | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Department | null>(null)

  const loadData = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await departmentApi.list()
      setDepartments(data)
    } catch {
      toast.error(t("hr:department.fetch_error"))
    } finally {
      setIsLoading(false)
    }
  }, [t])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const handleOpenCreate = () => {
    setEditTarget(null)
    setModalOpen(true)
  }

  const handleOpenEdit = (dept: Department) => {
    setEditTarget(dept)
    setModalOpen(true)
  }

  const handleDelete = async (id: number) => {
    try {
      await departmentApi.delete(id)
      toast.success(t("hr:department.delete_success"))
      void loadData()
    } catch {
      toast.error(t("hr:department.delete_error"))
    }
  }

  const handleSubmitForm = async (payload: CreateDepartmentPayload) => {
    try {
      if (editTarget) {
        await departmentApi.update(editTarget.id, payload)
        toast.success(t("hr:department.update_success"))
      } else {
        await departmentApi.create(payload)
        toast.success(t("hr:department.create_success"))
      }
      setModalOpen(false)
      void loadData()
    } catch {
      toast.error(t("hr:department.save_error"))
      throw new Error("Save failed")
    }
  }

  const buildActions = useCallback(
    (department: Department): RowAction[] => {
      const actions: RowAction[] = []

      if (canEdit) {
        actions.push({
          label: t("common:actions.edit", { defaultValue: "Sửa" }),
          icon: <Edit className="size-4" />,
          onClick: () => handleOpenEdit(department),
        })
      }

      if (canDelete) {
        actions.push({
          label: t("hr:department.actions.delete", { defaultValue: "Xóa" }),
          icon: <Trash2 className="size-4" />,
          onClick: () => setDeleteTarget(department),
          variant: "destructive",
          separator: actions.length > 0,
        })
      }

      return actions
    },
    [canDelete, canEdit, t],
  )

  const columns = useMemo<MRT_ColumnDef<Department>[]>(
    () => [
      {
        accessorKey: "code",
        header: t("hr:department.columns.code"),
        size: 100,
        Cell: ({ cell }) => (
          <span className="font-semibold text-primary">{cell.getValue<string>()}</span>
        ),
      },
      {
        accessorKey: "name",
        header: t("hr:department.columns.name"),
        size: 200,
        Cell: ({ cell }) => (
          <span className="font-semibold text-sm">{cell.getValue<string>()}</span>
        ),
      },
      {
        accessorKey: "description",
        header: t("hr:department.columns.description"),
        size: 300,
        Cell: ({ cell }) => (
          <span className="text-sm text-muted-foreground line-clamp-2">
            {cell.getValue<string>() || "—"}
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
        size: 100,
        Cell: ({ row }) => {
          if (!canEdit && !canDelete) return null
          return (
            <div
              className="flex items-center justify-end gap-1"
              onClick={(e) => e.stopPropagation()}
            >
              <MobileRowActions actions={buildActions(row.original)} />
            </div>
          )
        },
      },
    ],
    [buildActions, canDelete, canEdit, t],
  )

  const table = useMantineReactTable({
    renderEmptyRowsFallback: () => (
      <div className="p-8 text-center text-muted-foreground">
        {t("common:table.noData", { defaultValue: "Không có dữ liệu" })}
      </div>
    ),
    columns,
    data: departments,
    enableColumnActions: false,
    enableColumnFilters: false,
    enablePagination: false,
    enableSorting: true,
    enableBottomToolbar: false,
    enableTopToolbar: false,
    enableFullScreenToggle: false,
    state: {
      isLoading,
    },
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
    <div className="flex flex-col gap-6 pb-20 md:pb-0">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <MobileActionHeader
        icon={Building2}
        title={t("hr:department.title")}
        subtitle={t("hr:department.description")}
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void loadData()}
              disabled={isLoading}
              className="gap-1.5 min-h-11 md:min-h-9"
            >
              <RefreshCw className={`size-3.5 ${isLoading ? "animate-spin" : ""}`} />
              {t("common:actions.refresh")}
            </Button>
            {canCreate && (
              <Button
                size="sm"
                onClick={handleOpenCreate}
                className="hidden gap-2 min-h-11 md:flex md:min-h-9"
              >
                <Plus className="size-4" />
                {t("hr:department.create")}
              </Button>
            )}
          </>
        }
      />

      {canCreate && <Fab onClick={handleOpenCreate} label={t("hr:department.create")} />}

      {/* ── Table ───────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3">
        <MobileCardList
          data={departments}
          isLoading={isLoading}
          keyExtractor={(department) => department.id}
          emptyIcon={FolderTree}
          emptyTitle={t("common:table.noData", { defaultValue: "Không có dữ liệu" })}
          renderCard={(department) => (
            <div className="rounded-xl border bg-card p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate text-sm font-semibold">{department.name}</h3>
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      {department.code}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {department.description || "—"}
                  </p>
                </div>

                {buildActions(department).length > 0 && (
                  <div className="-mr-2 -mt-1">
                    <MobileRowActions actions={buildActions(department)} />
                  </div>
                )}
              </div>
            </div>
          )}
          desktopTable={
            <div className="rounded-xl border bg-card overflow-hidden">
              <MantineReactTable table={table} />
            </div>
          }
        />
      </div>

      {/* ── Modals ───────────────────────────────────────────────────────── */}
      <DepartmentFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmitForm}
        editData={editTarget}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("hr:department.actions.delete_title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("hr:department.actions.delete_confirm")}{" "}
              <span className="font-semibold text-foreground">{deleteTarget?.name}</span>
              {t("hr:department.actions.delete_warning")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common:actions.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (deleteTarget) {
                  void handleDelete(deleteTarget.id)
                  setDeleteTarget(null)
                }
              }}
            >
              {t("hr:department.actions.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
