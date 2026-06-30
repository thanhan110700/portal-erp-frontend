import { useCallback, useEffect, useState, useMemo } from "react"
import { toast } from "sonner"
import { Plus, Users, Download } from "lucide-react"

import { useTranslation } from "react-i18next"
import { TablePagination } from "@/components/common/TablePagination"
import { Button } from "@/components/ui/button"
import { FilterPanel, type FilterFieldDef } from "@/components/common/FilterPanel"
import { useAuthStore } from "@/hooks/useAuthStore"
import { hasPermission, PermissionSlugs } from "@/constants/permissions"
import { optionApi, type OptionItem } from "@/shared/api/optionApi"
import { employeeApi } from "../api/employeeApi"
import { departmentApi } from "../api/departmentApi"
import { AssignRoleModal } from "../components/AssignRoleModal"
import { EmployeeTable } from "../components/EmployeeTable"
import { EmployeeFormModal } from "../components/EmployeeFormModal"
import type {
  CreateEmployeePayload,
  Department,
  Employee,
  UpdateEmployeePayload,
} from "../types/employee"

const PER_PAGE = 20

export function EmployeeListPage() {
  const { t } = useTranslation(["hr", "common"])
  const user = useAuthStore((s) => s.user)
  const canCreate = hasPermission(user?.permissions, PermissionSlugs.CreateEmployees)
  const canEdit = hasPermission(user?.permissions, PermissionSlugs.EditEmployees)
  const canDelete = hasPermission(user?.permissions, PermissionSlugs.DeleteEmployees)
  const canAssignRoles = hasPermission(user?.permissions, PermissionSlugs.EditPermissions)

  // ── Data state ────────────────────────────────────────────────────────────
  const [employees, setEmployees] = useState<Employee[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [managerOptions, setManagerOptions] = useState<OptionItem[]>([])
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
  const [roleTarget, setRoleTarget] = useState<Employee | null>(null)

  // ── Fetch departments on mount ────────────────────────────────────────────
  useEffect(() => {
    departmentApi.list().then(setDepartments).catch(console.error)
    optionApi.getEmployees().then(setManagerOptions).catch(console.error)
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
  const handleCreateOrUpdate = async (
    payload: CreateEmployeePayload & { role?: string; is_active?: boolean },
  ) => {
    try {
      const { role, ...employeeData } = payload
      let finalEmployee

      if (editTarget) {
        finalEmployee = await employeeApi.update(
          editTarget.id,
          employeeData as UpdateEmployeePayload,
        )
      } else {
        finalEmployee = await employeeApi.create(employeeData as CreateEmployeePayload)
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

  const handleAssignRole = async (role: string) => {
    if (!roleTarget) return
    try {
      await employeeApi.assignRole(roleTarget.id, { role })
      toast.success(t("hr:employees.assign_role_success", { role }))
      setRoleTarget(null)
      fetchEmployees()
    } catch {
      toast.error(t("hr:employees.assign_role_error"))
      throw new Error("Assign role failed")
    }
  }

  const handleExportCurrent = () => {
    const header = ["Mã NV", "Họ tên", "Email", "Phòng ban", "Chức vụ", "Vai trò", "Trạng thái"]
    const rows = employees.map((employee) => [
      employee.user_code,
      employee.full_name,
      employee.email,
      employee.department?.name ?? "",
      employee.position ?? "",
      employee.role?.name ?? "",
      employee.is_active ? t("common:status.active") : t("common:status.inactive"),
    ])
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell ?? "").replaceAll('"', '""')}"`).join(","))
      .join("\n")
    const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "employees-current-page.csv"
    link.click()
    URL.revokeObjectURL(url)
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
        <div className="flex gap-2 self-start sm:self-auto">
          <Button
            id="btn-export-employees-current"
            variant="outline"
            onClick={handleExportCurrent}
            className="gap-2"
            disabled={employees.length === 0}
          >
            <Download className="size-4" />
            {t("hr:employees.actions.export_current", { defaultValue: "Xuất danh sách hiện tại" })}
          </Button>
          {canCreate && (
            <Button
              id="btn-create-employee"
              onClick={() => {
                setEditTarget(null)
                setFormOpen(true)
              }}
              className="gap-2"
            >
              <Plus className="size-4" />
              {t("hr:employees.create")}
            </Button>
          )}
        </div>
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
        canAssignRole={canAssignRoles}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onAssignRole={setRoleTarget}
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
        managerOptions={managerOptions}
        editData={editTarget}
      />

      <AssignRoleModal
        open={!!roleTarget}
        onClose={() => setRoleTarget(null)}
        onSubmit={handleAssignRole}
        employee={roleTarget}
      />
    </div>
  )
}
