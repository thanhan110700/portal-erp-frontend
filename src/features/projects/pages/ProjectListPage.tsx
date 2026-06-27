import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Plus } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { FilterPanel, type FilterFieldDef } from "@/components/common/FilterPanel"
import { ProjectTable } from "../components/ProjectTable"
import { ProjectFormModal } from "../components/ProjectFormModal"

import { optionApi, type OptionItem } from "@/shared/api/optionApi"
import { projectApi, type ListProjectsParams } from "../api/projectApi"
import { useAuthStore } from "@/hooks/useAuthStore"
import { hasPermission, PermissionSlugs } from "@/constants/permissions"
import type { Project } from "../types/project"
import { useTranslation } from "react-i18next"

export function ProjectListPage() {
  const { t } = useTranslation(["projects", "common"])
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)

  const canCreate = hasPermission(user?.permissions, PermissionSlugs.CreateProjects)
  const canEdit = hasPermission(user?.permissions, PermissionSlugs.EditProjects)
  const canDelete = hasPermission(user?.permissions, PermissionSlugs.DeleteProjects)

  const [projects, setProjects] = useState<Project[]>([])
  const [totalRecords, setTotalRecords] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  const [queryParams, setQueryParams] = useState<ListProjectsParams>({
    page: 1,
    per_page: 10,
    search: "",
    status: "",
  })

  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)

  const [statuses, setStatuses] = useState<OptionItem[]>([])

  const loadProjects = async () => {
    setIsLoading(true)
    try {
      const res = await projectApi.list(queryParams)
      setProjects(res.data)
      setTotalRecords(res.meta?.total || 0)
    } catch {
      toast.error(t("projects:list.fetch_error"))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    optionApi.getProjectStatuses().then(setStatuses).catch(console.error)
  }, [])

  useEffect(() => {
    void loadProjects()
  }, [queryParams])

  const handleApplyFilters = (values: Record<string, any>) => {
    setQueryParams((prev) => ({
      ...prev,
      ...values,
      page: 1,
    }))
  }

  const handleResetFilters = () => {
    setQueryParams({
      page: 1,
      per_page: 10,
      search: "",
      status: "",
    })
  }

  const handlePageChange = (page: number) => {
    setQueryParams((prev: ListProjectsParams) => ({ ...prev, page }))
  }

  const handleDelete = async (id: number) => {
    try {
      await projectApi.delete(id)
      toast.success(t("projects:list.delete_success"))
      void loadProjects()
    } catch {
      toast.error(t("projects:list.delete_error"))
    }
  }

  const filterFields: FilterFieldDef[] = [
    {
      field: "search",
      label: t("projects:list.search"),
      type: "input",
      placeholder: t("projects:list.search_placeholder"),
      value: queryParams.search || "",
    },
    {
      field: "status",
      label: t("projects:list.filter_status"),
      type: "select",
      placeholder: t("common:filter.all"),
      value: queryParams.status || "",
      options: [
        ...statuses.map((s) => ({
          label: s.label,
          value: s.value.toString(),
        })),
      ],
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">{t("projects:list.title")}</h1>
        {canCreate && (
          <Button
            onClick={() => {
              setEditingId(null)
              setModalOpen(true)
            }}
          >
            <Plus className="mr-2 size-4" />
            {t("projects:list.create")}
          </Button>
        )}
      </div>

      <FilterPanel
        applyMode
        fields={filterFields}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
      />

      <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
        <div className="p-0">
          <ProjectTable
            data={projects}
            isLoading={isLoading}
            canEdit={canEdit}
            canDelete={canDelete}
            onEdit={(id) => {
              setEditingId(id)
              setModalOpen(true)
            }}
            onDelete={handleDelete}
            onView={(id) => navigate(`/projects/${id}`)}
            pagination={{
              page: queryParams.page || 1,
              perPage: queryParams.per_page || 10,
              totalRecords,
              totalPages: Math.ceil(totalRecords / (queryParams.per_page || 10)),
              onChange: handlePageChange,
            }}
          />
        </div>
      </div>

      {modalOpen && (
        <ProjectFormModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onSuccess={loadProjects}
          editingId={editingId}
        />
      )}
    </div>
  )
}
