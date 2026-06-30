import { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { toast } from "sonner"
import {
  ArrowLeft,
  Building2,
  Calendar,
  Mail,
  Pencil,
  Phone,
  User,
  Briefcase,
  MapPin,
  Shield,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { MantineReactTable, useMantineReactTable, type MRT_ColumnDef } from "mantine-react-table"
import { StatusBadge } from "@/components/common/StatusBadge"
import { useAuthStore } from "@/hooks/useAuthStore"
import { hasPermission, PermissionSlugs } from "@/constants/permissions"
import { PATHS } from "@/constants/paths"
import { optionApi, type OptionItem } from "@/shared/api/optionApi"
import { employeeApi } from "../api/employeeApi"
import { departmentApi } from "../api/departmentApi"
import { AssignRoleModal } from "../components/AssignRoleModal"
import { EmployeeFormModal } from "../components/EmployeeFormModal"
import { EmployeeProjectsDialog } from "../components/EmployeeProjectsDialog"
import { EmployeeReports } from "../components/EmployeeReports"
import type {
  CreateEmployeePayload,
  Department,
  Employee,
  UpdateEmployeePayload,
  EmployeeProject,
} from "../types/employee"
import type { AssignEmployeeProjectsPayload } from "../api/employeeApi"

import { useTranslation } from "react-i18next"

const ROLE_LABELS_KEYS: Record<string, string> = {
  admin: "common:roles.admin",
  director: "common:roles.director",
  accountant: "common:roles.accountant",
  sales: "common:roles.sales",
  tech: "common:roles.tech",
  technician: "common:roles.technician",
  employee: "common:roles.employee",
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-3 py-2">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <Icon className="size-4" />
      </div>
      <div className="flex flex-col gap-0.5">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-sm font-medium">{value || "—"}</span>
      </div>
    </div>
  )
}

export function EmployeeDetailPage() {
  const { t } = useTranslation(["hr", "common", "errors"])
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const canEdit = hasPermission(user?.permissions, PermissionSlugs.EditEmployees)
  const canAssignProjects = hasPermission(user?.permissions, PermissionSlugs.EditProjectMembers)
  const canAssignRoles = hasPermission(user?.permissions, PermissionSlugs.EditPermissions)

  const [employee, setEmployee] = useState<Employee | null>(null)
  const [departments, setDepartments] = useState<Department[]>([])
  const [managerOptions, setManagerOptions] = useState<OptionItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [formOpen, setFormOpen] = useState(false)
  const [projectDrawerOpen, setProjectDrawerOpen] = useState(false)
  const [roleOpen, setRoleOpen] = useState(false)

  const projectColumns = useMemo<MRT_ColumnDef<EmployeeProject>[]>(
    () => [
      {
        accessorKey: "project_code",
        header: t("projects:fields.project_code", { defaultValue: "Mã DA" }),
        size: 120,
        Cell: ({ cell }) => <span className="font-mono text-xs">{cell.getValue<string>()}</span>,
      },
      {
        accessorKey: "project_name",
        header: t("projects:fields.project_name", { defaultValue: "Tên dự án" }),
        Cell: ({ cell }) => <span className="font-medium">{cell.getValue<string>()}</span>,
      },
      {
        accessorKey: "role",
        header: t("projects:members.fields.role", { defaultValue: "Vai trò" }),
        size: 130,
        Cell: ({ cell }) => cell.getValue<string>() || "—",
      },
      {
        accessorKey: "allocation_percent",
        header: t("projects:members.fields.allocation_percent", { defaultValue: "% Tham gia" }),
        size: 120,
        mantineTableHeadCellProps: { align: "right" },
        mantineTableBodyCellProps: { align: "right" },
        Cell: ({ cell }) => {
          const val = cell.getValue<number | string | null>()
          return val ? `${val}%` : "—"
        },
      },
      {
        accessorKey: "start_date",
        header: t("projects:fields.start_date", { defaultValue: "Ngày bắt đầu" }),
        size: 130,
        Cell: ({ cell }) => cell.getValue<string>() || "—",
      },
      {
        accessorKey: "end_date",
        header: t("projects:fields.end_date", { defaultValue: "Ngày kết thúc" }),
        size: 130,
        Cell: ({ cell }) => cell.getValue<string>() || "—",
      },
      {
        accessorKey: "status",
        header: t("projects:fields.status", { defaultValue: "Trạng thái" }),
        size: 130,
        mantineTableHeadCellProps: { align: "center" },
        mantineTableBodyCellProps: { align: "center" },
        Cell: ({ cell }) => (
          <div className="flex justify-center">
            <StatusBadge status={cell.getValue<string>()} />
          </div>
        ),
      },
    ],
    [t],
  )

  const projectTable = useMantineReactTable({
    columns: projectColumns,
    data: employee?.projects || [],
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
      sx: { overflowX: "auto", WebkitOverflowScrolling: "touch" },
    },
  })

  const fetchEmployee = useCallback(async () => {
    if (!id) return
    setIsLoading(true)
    try {
      const emp = await employeeApi.get(parseInt(id))
      setEmployee(emp)
    } catch {
      toast.error(t("hr:employees.fetch_error"))
      navigate(PATHS.hrEmployees)
    } finally {
      setIsLoading(false)
    }
  }, [id, navigate])

  useEffect(() => {
    fetchEmployee()
    departmentApi.list().then(setDepartments).catch(console.error)
    optionApi.getEmployees().then(setManagerOptions).catch(console.error)
  }, [fetchEmployee])

  const handleUpdate = async (
    payload: CreateEmployeePayload & { role?: string; is_active?: boolean },
  ) => {
    if (!employee) return
    try {
      const { role, ...updateData } = payload
      let updated = await employeeApi.update(employee.id, updateData as UpdateEmployeePayload)

      if (role && (!employee.roles?.length || employee?.roles[0] !== role)) {
        updated = await employeeApi.assignRole(employee.id, { role })
      }

      setEmployee(updated)
      setFormOpen(false)
      toast.success(t("common:messages.update_success"))
    } catch {
      toast.error(t("common:messages.update_error"))
      throw new Error("Update failed")
    }
  }

  const handleAssignProjects = async (payload: AssignEmployeeProjectsPayload) => {
    if (!employee) return
    await employeeApi.assignProjects(employee.id, payload)
    toast.success(t("hr:employees.assign_projects.update_success"))
    setProjectDrawerOpen(false)
  }

  const handleAssignRole = async (role: string) => {
    if (!employee) return
    try {
      const updated = await employeeApi.assignRole(employee.id, { role })
      setEmployee(updated)
      setRoleOpen(false)
      toast.success(t("hr:employees.assign_role_success", { role }))
    } catch {
      toast.error(t("hr:employees.assign_role_error"))
      throw new Error("Assign role failed")
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-9 w-36 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl md:col-span-2" />
        </div>
      </div>
    )
  }

  if (!employee) return null

  return (
    <div className="flex flex-col gap-6">
      {/* ── Back + Actions ────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(PATHS.hrEmployees)}
          className="gap-2 self-start -ml-2"
        >
          <ArrowLeft className="size-4" />
          {t("hr:employees.title")}
        </Button>

        <div className="flex gap-2">
          {canAssignProjects && (
            <Button
              id="btn-assign-projects"
              size="sm"
              onClick={() => setProjectDrawerOpen(true)}
              className="gap-2 min-h-11 md:min-h-9"
            >
              <Briefcase className="size-4" />
              {t("hr:employees.actions.assign_projects")}
            </Button>
          )}
          {canAssignRoles && (
            <Button
              id="btn-assign-role"
              variant="outline"
              size="sm"
              onClick={() => setRoleOpen(true)}
              className="gap-2 min-h-11 md:min-h-9"
            >
              <Shield className="size-4" />
              {t("hr:employees.actions.assign_role")}
            </Button>
          )}
          {canEdit && (
            <Button
              id="btn-edit-employee"
              size="sm"
              onClick={() => setFormOpen(true)}
              className="gap-2 min-h-11 md:min-h-9"
            >
              <Pencil className="size-4" />
              {t("common:actions.edit")}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* ── Left: Identity card ───────────────────────────────────────── */}
        <Card className="rounded-xl border bg-card">
          <CardContent className="flex flex-col items-center gap-4 pt-6 pb-6">
            {/* Avatar */}
            <div className="flex size-20 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/5 ring-4 ring-background shadow-sm text-primary text-2xl font-bold">
              {employee.full_name.charAt(0).toUpperCase()}
            </div>

            {/* Name & Code */}
            <div className="text-center">
              <h2 className="text-lg font-semibold">{employee.full_name}</h2>
              <p className="font-mono text-xs text-muted-foreground mt-0.5">{employee.user_code}</p>
            </div>

            {/* Position & Dept */}
            <div className="text-center flex flex-col gap-1">
              <span className="text-sm text-muted-foreground">{employee.position ?? "—"}</span>
              <span className="text-sm font-medium">{employee.department?.name ?? "—"}</span>
            </div>

            <Separator />

            {/* Status */}
            <Badge
              variant={employee.is_active ? "success" : "outline"}
              className="text-sm py-1 px-3"
            >
              {employee.is_active ? t("common:status.active") : t("common:status.inactive")}
            </Badge>

            {/* Roles */}
            {(() => {
              const roleName = employee.role?.name
              const roles = employee.roles || (roleName ? [roleName] : [])
              return roles.length > 0 ? (
                <div className="flex flex-wrap justify-center gap-1.5">
                  {roles.map((r) => (
                    <Badge key={r} variant="secondary" className="text-xs">
                      {ROLE_LABELS_KEYS[r] ? t(ROLE_LABELS_KEYS[r]) : r}
                    </Badge>
                  ))}
                </div>
              ) : null
            })()}
          </CardContent>
        </Card>

        {/* ── Right: Detail info ────────────────────────────────────────── */}
        <Card className="rounded-xl border bg-card md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">
              {t("hr:employees.details_title")}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col divide-y divide-border/60">
            <InfoRow
              icon={Mail}
              label={t("hr:employees.form.fields.email")}
              value={employee.email}
            />
            <InfoRow
              icon={Phone}
              label={t("hr:employees.form.fields.phone")}
              value={employee.phone}
            />
            <InfoRow
              icon={Building2}
              label={t("hr:employees.form.fields.department")}
              value={employee.department?.name}
            />
            <InfoRow
              icon={User}
              label={t("hr:employees.form.fields.manager")}
              value={employee.manager?.full_name}
            />
            <InfoRow
              icon={Calendar}
              label={t("hr:employees.form.fields.hire_date")}
              value={
                employee.hire_date
                  ? new Date(employee.hire_date).toLocaleDateString("vi-VN", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })
                  : null
              }
            />
            {employee.resign_date && (
              <InfoRow
                icon={Calendar}
                label={t("hr:employees.form.fields.resign_date")}
                value={new Date(employee.resign_date).toLocaleDateString("vi-VN")}
              />
            )}
            <InfoRow
              icon={MapPin}
              label={t("hr:employees.form.fields.address")}
              value={employee.address}
            />
            <InfoRow
              icon={User}
              label={t("hr:employees.form.fields.social_insurance")}
              value={employee.social_insurance}
            />
            <InfoRow
              icon={User}
              label={t("hr:employees.form.fields.national_id")}
              value={employee.national_id}
            />
          </CardContent>
        </Card>

        {/* ── Projects Card ─────────────────────────────────────────────── */}
        <Card className="rounded-xl border bg-card md:col-span-3">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold">
              {t("hr:employees.projects_title", { defaultValue: "Dự án tham gia" })}
            </CardTitle>
            {canAssignProjects && (
              <Button size="sm" onClick={() => setProjectDrawerOpen(true)}>
                {t("hr:employees.actions.assign_projects")}
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {!employee.projects || employee.projects.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center bg-muted/20 rounded-lg border border-dashed">
                <Briefcase className="size-8 text-muted-foreground/50 mb-3" />
                <h3 className="text-sm font-medium">
                  {t("hr:employees.no_projects_title", {
                    defaultValue: "Nhân viên chưa tham gia dự án nào",
                  })}
                </h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-xl">
                  {t("hr:employees.no_projects_description", {
                    defaultValue:
                      "Sử dụng nút 'Phân công dự án' để gắn nhân viên này vào các dự án hiện có.",
                  })}
                </p>
              </div>
            ) : (
              <div className="rounded-xl border overflow-hidden">
                <MantineReactTable table={projectTable} />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Reports ───────────────────────────────────────────────────────── */}
      <EmployeeReports employeeId={employee.id} />

      {/* ── Modals ────────────────────────────────────────────────────────── */}
      <EmployeeFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleUpdate}
        departments={departments}
        managerOptions={managerOptions}
        editData={employee}
      />

      <EmployeeProjectsDialog
        open={projectDrawerOpen}
        onClose={() => setProjectDrawerOpen(false)}
        onSubmit={handleAssignProjects}
        employeeName={employee.full_name}
      />

      <AssignRoleModal
        open={roleOpen}
        onClose={() => setRoleOpen(false)}
        onSubmit={handleAssignRole}
        employee={employee}
      />
    </div>
  )
}
