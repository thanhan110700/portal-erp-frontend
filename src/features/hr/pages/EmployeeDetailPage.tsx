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
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuthStore } from "@/hooks/useAuthStore"
import { PATHS } from "@/constants/paths"
import { departmentApi, employeeApi } from "../api/employeeApi"
import { EmployeeFormModal } from "../components/EmployeeFormModal"
import { AssignRoleModal } from "../components/AssignRoleModal"
import type { CreateEmployeePayload, Department, Employee } from "../types/employee"

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  director: "Giám đốc",
  accountant: "Kế toán",
  sales: "Kinh doanh",
  technician: "Kỹ thuật",
  employee: "Nhân viên",
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

  const fetchEmployee = useCallback(async () => {
    if (!id) return
    setIsLoading(true)
    try {
      const emp = await employeeApi.get(parseInt(id))
      setEmployee(emp)
    } catch {
      toast.error("Không tìm thấy nhân viên")
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
      toast.success("Cập nhật thông tin thành công")
    } catch {
      toast.error("Không thể cập nhật thông tin")
      throw new Error("Update failed")
    }
  }

  const handleRoleSubmit = async (role: string) => {
    if (!employee) return
    try {
      const updated = await employeeApi.assignRole(employee.id, { role })
      setEmployee(updated)
      setRoleModalOpen(false)
      toast.success(`Đã gán vai trò "${role}"`)
    } catch {
      toast.error("Không thể gán vai trò")
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
          Danh sách nhân viên
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
              Phân quyền
            </Button>
          )}
          {isHR && (
            <Button
              id="btn-edit-employee"
              size="sm"
              onClick={() => setFormOpen(true)}
              className="gap-2"
            >
              <Pencil className="size-4" />
              Sửa thông tin
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
              {employee.is_active ? "Đang hoạt động" : "Đã nghỉ việc"}
            </Badge>

            {/* Roles */}
            {employee.roles.length > 0 && (
              <div className="flex flex-wrap justify-center gap-1.5">
                {employee.roles.map((role) => (
                  <Badge key={role} variant="secondary" className="text-xs">
                    {ROLE_LABELS[role] ?? role}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Right: Detail info ────────────────────────────────────────── */}
        <Card className="rounded-xl border bg-card md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Thông tin chi tiết</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col divide-y divide-border/60">
            <InfoRow icon={Mail} label="Email" value={employee.email} />
            <InfoRow icon={Phone} label="Số điện thoại" value={employee.phone} />
            <InfoRow icon={Building2} label="Phòng ban" value={employee.department?.name} />
            <InfoRow icon={User} label="Quản lý trực tiếp" value={employee.manager?.full_name} />
            <InfoRow
              icon={Calendar}
              label="Ngày vào làm"
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
                label="Ngày nghỉ việc"
                value={new Date(employee.resign_date).toLocaleDateString("vi-VN")}
              />
            )}
            <InfoRow icon={MapPin} label="Địa chỉ" value={employee.address} />
            <InfoRow icon={User} label="BHXH" value={employee.social_insurance} />
            <InfoRow icon={User} label="CMND / CCCD" value={employee.national_id} />
          </CardContent>
        </Card>
      </div>

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
    </div>
  )
}
