import { useCallback, useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { toast } from "sonner"
import {
  ArrowLeft,
  Building2,
  Calendar,
  Mail,
  MapPin,
  Pencil,
  Phone,
  ShieldCheck,
  User,
  Briefcase,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuthStore } from "@/hooks/useAuthStore"
import { PATHS } from "@/constants/paths"
import { employeeApi } from "../api/employeeApi"
import { departmentApi } from "../api/departmentApi"
import { EmployeeFormModal } from "../components/EmployeeFormModal"
import { AssignRoleModal } from "../components/AssignRoleModal"
import { EmployeeProjectsDrawer } from "../components/EmployeeProjectsDrawer"
import { EmployeeReports } from "../components/EmployeeReports"
import type { CreateEmployeePayload, Department, Employee } from "../types/employee"
import type { AssignEmployeeProjectsPayload } from "../api/employeeApi"

import { useTranslation } from "react-i18next"

const ROLE_LABELS_KEYS: Record<string, string> = {
  admin: "common:roles.admin",
  director: "common:roles.director",
  accountant: "common:roles.accountant",
  sales: "common:roles.sales",
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
  const isAdmin = user?.roles?.includes("admin") ?? false
  const isHR = user?.roles?.includes("admin") || user?.roles?.includes("director") || false

  const [employee, setEmployee] = useState<Employee | null>(null)
  const [departments, setDepartments] = useState<Department[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [formOpen, setFormOpen] = useState(false)
  const [roleModalOpen, setRoleModalOpen] = useState(false)
  const [projectDrawerOpen, setProjectDrawerOpen] = useState(false)

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
  }, [fetchEmployee])

  const handleUpdate = async (payload: CreateEmployeePayload) => {
    if (!employee) return
    try {
      const updated = await employeeApi.update(employee.id, payload)
      setEmployee(updated)
      setFormOpen(false)
      toast.success(t("common:messages.update_success"))
    } catch {
      toast.error(t("common:messages.update_error"))
      throw new Error("Update failed")
    }
  }

  const handleRoleSubmit = async (role: string) => {
    if (!employee) return
    try {
      const updated = await employeeApi.assignRole(employee.id, { role })
      setEmployee(updated)
      setRoleModalOpen(false)
      toast.success(t("hr:employees.assign_role_success", { role: t(`common:roles.${role}`) }))
    } catch {
      toast.error(t("hr:employees.assign_role_error"))
    }
  }

  const handleAssignProjects = async (payload: AssignEmployeeProjectsPayload) => {
    if (!employee) return
    await employeeApi.assignProjects(employee.id, payload)
    // Refresh employee data if needed, though projects are not currently displayed on this page
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
          {isAdmin && (
            <Button
              id="btn-assign-role"
              variant="outline"
              size="sm"
              onClick={() => setRoleModalOpen(true)}
              className="gap-2"
            >
              <ShieldCheck className="size-4" />
              {t("hr:employees.actions.assign_role")}
            </Button>
          )}
          {isHR && (
            <>
              <Button
                id="btn-assign-projects"
                variant="outline"
                size="sm"
                onClick={() => setProjectDrawerOpen(true)}
                className="gap-2 min-h-11 md:min-h-9"
              >
                <Briefcase className="size-4" />
                {t("hr:employees.actions.assign_projects")}
              </Button>
              <Button
                id="btn-edit-employee"
                size="sm"
                onClick={() => setFormOpen(true)}
                className="gap-2 min-h-11 md:min-h-9"
              >
                <Pencil className="size-4" />
                {t("common:actions.edit")}
              </Button>
            </>
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
            {employee.roles.length > 0 && (
              <div className="flex flex-wrap justify-center gap-1.5">
                {employee.roles.map((role) => (
                  <Badge key={role} variant="secondary" className="text-xs">
                    {ROLE_LABELS_KEYS[role] ? t(ROLE_LABELS_KEYS[role]) : role}
                  </Badge>
                ))}
              </div>
            )}
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
      </div>

      {/* ── Reports ───────────────────────────────────────────────────────── */}
      <EmployeeReports employeeId={employee.id} />

      {/* ── Modals ────────────────────────────────────────────────────────── */}
      <EmployeeFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleUpdate}
        departments={departments}
        employees={[]}
        editData={employee}
      />

      <AssignRoleModal
        open={roleModalOpen}
        onClose={() => setRoleModalOpen(false)}
        onSubmit={handleRoleSubmit}
        employee={employee}
      />

      <EmployeeProjectsDrawer
        open={projectDrawerOpen}
        onClose={() => setProjectDrawerOpen(false)}
        onSubmit={handleAssignProjects}
        employeeName={employee.full_name}
      />
    </div>
  )
}
