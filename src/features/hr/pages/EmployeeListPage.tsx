import { useCallback, useEffect, useState, useMemo } from "react"
import { toast } from "sonner"
import { Plus, Users } from "lucide-react"

import { TablePagination } from "@/components/common/TablePagination"
import { Button } from "@/components/ui/button"
import { FilterPanel, type FilterFieldDef } from "@/components/common/FilterPanel"
import { useAuthStore } from "@/hooks/useAuthStore"
import { departmentApi, employeeApi } from "../api/employeeApi"
import { EmployeeTable } from "../components/EmployeeTable"
import { EmployeeFormModal } from "../components/EmployeeFormModal"
import { AssignRoleModal } from "../components/AssignRoleModal"
import type { CreateEmployeePayload, Department, Employee } from "../types/employee"

const PER_PAGE = 20

export function EmployeeListPage() {
  const user = useAuthStore((s) => s.user)
  const isAdmin = user?.roles?.includes("admin") ?? false
  const isHR =
    user?.roles?.includes("admin") ||
    user?.roles?.includes("director") ||
    user?.roles?.includes("hr") ||
    false

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
  const [roleModalOpen, setRoleModalOpen] = useState(false)
  const [roleTarget, setRoleTarget] = useState<Employee | null>(null)

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
      toast.error("Không thể tải danh sách nhân viên")
    } finally {
      setIsLoading(false)
    }
  }, [search, deptFilter, page])

  useEffect(() => {
    fetchEmployees()
  }, [fetchEmployees])

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleCreateOrUpdate = async (payload: CreateEmployeePayload) => {
    try {
      if (editTarget) {
        await employeeApi.update(editTarget.id, payload)
        toast.success("Cập nhật thông tin nhân viên thành công")
      } else {
        await employeeApi.create(payload)
        toast.success("Tạo nhân viên mới thành công")
      }
      setFormOpen(false)
      setEditTarget(null)
      fetchEmployees()
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Đã có lỗi xảy ra"
      toast.error(msg)
      throw err
    }
  }

  const handleDelete = async (employee: Employee) => {
    try {
      await employeeApi.delete(employee.id)
      toast.success(`Đã xóa nhân viên ${employee.full_name}`)
      fetchEmployees()
    } catch {
      toast.error("Không thể xóa nhân viên này")
    }
  }

  const handleEdit = (employee: Employee) => {
    setEditTarget(employee)
    setFormOpen(true)
  }

  const handleAssignRole = (employee: Employee) => {
    setRoleTarget(employee)
    setRoleModalOpen(true)
  }

  const handleRoleSubmit = async (role: string) => {
    if (!roleTarget) return
    try {
      const updated = await employeeApi.assignRole(roleTarget.id, { role })
      toast.success(`Đã gán vai trò "${role}" cho ${updated.full_name}`)
      setRoleModalOpen(false)
      setRoleTarget(null)
      fetchEmployees()
    } catch {
      toast.error("Không thể gán vai trò")
    }
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
    console.log("🚀 ~ EmployeeListPage ~ departments:", departments)
    return [
      {
        field: "search",
        type: "input",
        label: "Tìm kiếm",
        placeholder: "Tìm theo tên, email...",
        value: search,
      },
      {
        field: "department_id",
        type: "select",
        label: "Phòng ban",
        placeholder: "Tất cả phòng ban",
        value: deptFilter,
        options: departments.map((d) => ({ label: d.label || d.name, value: d.id.toString() })),
      },
    ]
  }, [search, deptFilter, departments])

  return (
    <div className="flex flex-col gap-6">
      {/* ── Page Header ───────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Users className="size-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Nhân viên</h1>
            <p className="text-sm text-muted-foreground">
              {isLoading ? "Đang tải..." : `${total} nhân viên`}
            </p>
          </div>
        </div>
        {isHR && (
          <Button
            id="btn-create-employee"
            onClick={() => {
              setEditTarget(null)
              setFormOpen(true)
            }}
            className="gap-2 self-start sm:self-auto"
          >
            <Plus className="size-4" />
            Thêm nhân viên
          </Button>
        )}
      </div>

      {/* ── Filters ───────────────────────────────────────────────────────── */}
      <FilterPanel
        applyMode
        fields={filterFields}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
        title="Lọc nhân viên"
      />

      {/* ── Table ─────────────────────────────────────────────────────────── */}
      <EmployeeTable
        employees={employees}
        isLoading={isLoading}
        canEdit={isHR}
        canDelete={isAdmin}
        canAssignRole={isAdmin}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onAssignRole={handleAssignRole}
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

      <AssignRoleModal
        open={roleModalOpen}
        onClose={() => {
          setRoleModalOpen(false)
          setRoleTarget(null)
        }}
        onSubmit={handleRoleSubmit}
        employee={roleTarget}
      />
    </div>
  )
}
