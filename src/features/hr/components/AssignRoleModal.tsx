import { useState, useMemo } from "react"
import { CommonDialog } from "@/components/common/CommonDialog"
import { Label } from "@/components/ui/label"
import { SearchableSelect } from "@/components/common/SearchableSelect"
import { Badge } from "@/components/ui/badge"
import type { Employee } from "../types/employee"

const ROLE_OPTIONS = [
  { value: "admin", label: "Admin", description: "Quản lý toàn bộ hệ thống" },
  { value: "director", label: "Giám đốc", description: "Duyệt chi, xem tất cả báo cáo" },
  { value: "accountant", label: "Kế toán", description: "Tạo/sửa phiếu, duyệt chứng từ" },
  { value: "sales", label: "Kinh doanh", description: "Quản lý KH, báo giá, hợp đồng" },
  { value: "technician", label: "Kỹ thuật", description: "Quản lý dự án, cập nhật tiến độ" },
  { value: "employee", label: "Nhân viên", description: "Chấm công, xem dữ liệu cá nhân" },
]

interface AssignRoleModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (role: string) => Promise<void>
  employee: Employee | null
}

export function AssignRoleModal({ open, onClose, onSubmit, employee }: AssignRoleModalProps) {
  const [selectedRole, setSelectedRole] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const currentRoles = employee?.roles ?? []

  const roleSelectOptions = useMemo(() => {
    return ROLE_OPTIONS.map((r) => ({
      label: `${r.label} - ${r.description}`,
      value: r.value,
    }))
  }, [])

  const handleSubmit = async () => {
    if (!selectedRole) return
    setIsSubmitting(true)
    try {
      await onSubmit(selectedRole)
      setSelectedRole("")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setSelectedRole("")
    onClose()
  }

  return (
    <CommonDialog
      open={open}
      onClose={handleClose}
      title={`Phân quyền — ${employee?.full_name}`}
      size="md"
      primaryAction={{
        label: isSubmitting ? "Đang lưu..." : "Gán vai trò",
        disabled: !selectedRole || isSubmitting,
        onClick: handleSubmit,
      }}
      cancelAction={{
        label: "Hủy",
        disabled: isSubmitting,
        onClick: handleClose,
      }}
    >
      <div className="flex flex-col gap-5 py-2">
        {/* Current roles display */}
        <div className="flex flex-col gap-2">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Vai trò hiện tại
          </Label>
          <div className="flex flex-wrap gap-2 min-h-8">
            {currentRoles.length > 0 ? (
              currentRoles.map((role) => {
                const opt = ROLE_OPTIONS.find((r) => r.value === role)
                return (
                  <Badge key={role} variant="secondary" className="text-sm py-1 px-2.5">
                    {opt?.label ?? role}
                  </Badge>
                )
              })
            ) : (
              <span className="text-sm text-muted-foreground italic">Chưa có vai trò nào</span>
            )}
          </div>
        </div>

        {/* Role selector */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="assign-role-select" className="text-sm font-medium">
            Gán vai trò mới
          </Label>
          <SearchableSelect
            value={selectedRole}
            onValueChange={setSelectedRole}
            options={roleSelectOptions}
            placeholder="Chọn vai trò..."
          />
          <p className="text-xs text-muted-foreground">
            Gán vai trò sẽ thay thế vai trò hiện tại của nhân viên.
          </p>
        </div>
      </div>
    </CommonDialog>
  )
}
