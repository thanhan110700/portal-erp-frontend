import { useEffect, useState, useMemo, useCallback } from "react"
import { Building2, Plus, Edit, Trash2, RefreshCw } from "lucide-react"
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
import { useAuthStore } from "@/hooks/useAuthStore"
import { useTranslation } from "react-i18next"

export function DepartmentListPage() {
  const { t } = useTranslation()
  const user = useAuthStore((s) => s.user)
  const isAdmin = user?.roles?.includes("admin") ?? false
  const isDirector = user?.roles?.includes("director") ?? false
  const canEdit = isAdmin || isDirector

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
          if (!canEdit) return null
          return (
            <div
              className="flex items-center justify-end gap-1"
              onClick={(e) => e.stopPropagation()}
            >
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-muted-foreground hover:text-foreground"
                onClick={() => handleOpenEdit(row.original)}
              >
                <Edit className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                onClick={() => setDeleteTarget(row.original)}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          )
        },
      },
    ],
    [canEdit, t],
  )

  const table = useMantineReactTable({
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
    <div className="flex flex-col gap-6">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Building2 className="size-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">{t("hr:department.title")}</h1>
            <p className="text-sm text-muted-foreground">{t("hr:department.description")}</p>
          </div>
        </div>
        <div className="flex gap-2 self-start sm:self-auto">
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
          {canEdit && (
            <Button size="sm" onClick={handleOpenCreate} className="gap-2 min-h-11 md:min-h-9">
              <Plus className="size-4" />
              {t("hr:department.create")}
            </Button>
          )}
        </div>
      </div>

      {/* ── Table ───────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3">
        <div className="rounded-xl border bg-card overflow-hidden">
          <MantineReactTable table={table} />
        </div>
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
              onClick={async () => {
                if (deleteTarget) {
                  await handleDelete(deleteTarget.id)
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
