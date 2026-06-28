import { useCallback, useEffect, useState, useMemo } from "react"
import { toast } from "sonner"
import { Plus, Users } from "lucide-react"

import { useTranslation } from "react-i18next"
import { TablePagination } from "@/components/common/TablePagination"
import { Button } from "@/components/ui/button"
import { FilterPanel, type FilterFieldDef } from "@/components/common/FilterPanel"
import { useAuthStore } from "@/hooks/useAuthStore"
import { hasPermission, PermissionSlugs } from "@/constants/permissions"
import { employeeApi } from "../api/employeeApi"
import { departmentApi } from "../api/departmentApi"
import { EmployeeTable } from "../components/EmployeeTable"
import { EmployeeFormModal } from "../components/EmployeeFormModal"
import type { CreateEmployeePayload, Department, Employee } from "../types/employee"

const PER_PAGE = 20

export function EmployeeListPage() {
  const { t } = useTranslation(["hr", "common"])
  const user = useAuthStore((s) => s.user)
  const canCreate = hasPermission(user?.permissions, PermissionSlugs.CreateEmployees)
  const canEdit = hasPermission(user?.permissions, PermissionSlugs.EditEmployees)
  const canDelete = hasPermission(user?.permissions, PermissionSlugs.DeleteEmployees)

  // ── Data state ────────────────────────────────────────────────────────────
  const [employees, setEmployees] = useState<Employee[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  // ── Filter state ──────────────────────────────────────────────────────────
  const [search, setSearch] = useState<string | null>(null)
  const [deptFilter, setDeptFilter] = useState<string | null>(null)
  const [page, setPage] = useState(1)

  // ── Modal state ───────────────────────────────────────────────────────────
  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Employee | null>(null)

  // ── Fetch departments on mount ────────────────────────────────────────────
  useEffect(() => {
    departmentApi.list().then(setDepartments).catch(console.error)
  }, [])

  // ── Fetch employees when filters/page change ──────────────────────────────
  const fetchEmployees = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await employeeApi.list({
        search: search || undefined,
        department_id: deptFilter ? parseInt(deptFilter) : null,
        page,
        per_page: PER_PAGE,
      })
      setEmployees(res.data)
      setTotalPages(res.meta.last_page)
      setTotal(res.meta.total)
    } catch {
      toast.error(t("common:messages.error"))
    } finally {
      setIsLoading(false)
    }
  }, [search, deptFilter, page])

  useEffect(() => {
    fetchEmployees()
  }, [fetchEmployees])

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleCreateOrUpdate = async (payload: CreateEmployeePayload & { role?: string }) => {
    try {
      const { role, ...employeeData } = payload
      let finalEmployee

      if (editTarget) {
        finalEmployee = await employeeApi.update(editTarget.id, employeeData)
      } else {
        finalEmployee = await employeeApi.create(employeeData)
      }

      if (role) {
        await employeeApi.assignRole(finalEmployee.id, { role })
      }

      toast.success(t("common:messages.success"))
      setFormOpen(false)
      setEditTarget(null)
      fetchEmployees()
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        t("common:messages.error")
      toast.error(msg)
      throw err
    }
  }

  const handleDelete = async (employee: Employee) => {
    try {
      await employeeApi.delete(employee.id)
      toast.success(t("common:messages.success"))
      fetchEmployees()
    } catch {
      toast.error(t("common:messages.error"))
    }
  }

  const handleEdit = (employee: Employee) => {
    setEditTarget(employee)
    setFormOpen(true)
  }

  const handleResetFilters = () => {
    setSearch(null)
    setDeptFilter(null)
    setPage(1)
  }

  const handleApplyFilters = (values: Record<string, unknown>) => {
    setSearch((values.search as string | null) ?? null)
    setDeptFilter((values.department_id as string | null) ?? null)
    setPage(1)
  }

  const filterFields = useMemo<FilterFieldDef[]>(() => {
    return [
      {
        field: "search",
        type: "input",
        label: t("common:actions.search").replace("...", ""),
        placeholder: t("common:actions.search"),
        value: search || "",
      },
      {
        field: "department_id",
        type: "select",
        label: t("hr:department.title"),
        placeholder: t("common:filter.all"),
        value: deptFilter || "",
        options: departments.map((d) => ({ label: d.label || d.name, value: d.id.toString() })),
      },
    ]
  }, [search, deptFilter, departments, t])

  return (
    <div className="flex flex-col gap-6">
      {/* ── Page Header ───────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Users className="size-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">{t("hr:employees.title")}</h1>
            <p className="text-sm text-muted-foreground">
              {isLoading ? t("common:table.loading") : `${total}`}
            </p>
          </div>
        </div>
        {canCreate && (
          <Button
            id="btn-create-employee"
            onClick={() => {
              setEditTarget(null)
              setFormOpen(true)
            }}
            className="gap-2 self-start sm:self-auto"
          >
            <Plus className="size-4" />
            {t("hr:employees.create")}
          </Button>
        )}
      </div>

      {/* ── Filters ───────────────────────────────────────────────────────── */}
      <FilterPanel
        applyMode
        fields={filterFields}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
      />

      {/* ── Table ─────────────────────────────────────────────────────────── */}
      <EmployeeTable
        employees={employees}
        isLoading={isLoading}
        canEdit={canEdit}
        canDelete={canDelete}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* ── Pagination ────────────────────────────────────────────────────── */}
      <TablePagination
        page={page}
        totalPages={totalPages}
        total={total}
        perPage={PER_PAGE}
        onPageChange={setPage}
      />

      {/* ── Modals ────────────────────────────────────────────────────────── */}
      <EmployeeFormModal
        open={formOpen}
        onClose={() => {
          setFormOpen(false)
          setEditTarget(null)
        }}
        onSubmit={handleCreateOrUpdate}
        departments={departments}
        employees={employees}
        editData={editTarget}
      />
    </div>
  )
}
