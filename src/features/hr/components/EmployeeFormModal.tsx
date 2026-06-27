import { useEffect, useRef } from "react"
import { useForm, Controller } from "react-hook-form"
import { CommonDialog } from "@/components/common/CommonDialog"
import { CommonDatePicker } from "@/components/common/CommonDatePicker"
import { Input } from "@/components/ui/input"
import { SearchableSelect } from "@/components/common/SearchableSelect"
import { Label } from "@/components/ui/label"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import type { CreateEmployeePayload, Department, Employee } from "../types/employee"

const employeeFormSchema = z
  .object({
    full_name: z
      .string()
      .min(1, "Vui lòng nhập họ tên")
      .max(150, "Họ tên không được quá 150 ký tự"),
    email: z.string().min(1, "Vui lòng nhập email").email("Email không hợp lệ"),
    phone: z
      .string()
      .max(20, "Số điện thoại không được quá 20 ký tự")
      .optional()
      .nullable()
      .or(z.literal("")),
    department_id: z.string().min(1, "Vui lòng chọn phòng ban"),
    position: z
      .string()
      .min(1, "Vui lòng nhập chức vụ")
      .max(100, "Chức vụ không được quá 100 ký tự"),
    hire_date: z.string().min(1, "Vui lòng nhập ngày vào làm"),
    resign_date: z.string().optional().nullable().or(z.literal("")),
    address: z
      .string()
      .max(500, "Địa chỉ không được quá 500 ký tự")
      .optional()
      .nullable()
      .or(z.literal("")),
    social_insurance: z
      .string()
      .max(20, "Số BHXH không được quá 20 ký tự")
      .optional()
      .nullable()
      .or(z.literal("")),
    national_id: z
      .string()
      .max(20, "CMND / CCCD không được quá 20 ký tự")
      .optional()
      .nullable()
      .or(z.literal("")),
    manager_id: z.string().optional().nullable().or(z.literal("")),
    password: z.string().optional().nullable().or(z.literal("")),
  })
  .refine(
    (data) => {
      if (data.resign_date && data.hire_date) {
        const resign = new Date(data.resign_date)
        const hire = new Date(data.hire_date)
        return resign > hire
      }
      return true
    },
    {
      message: "Ngày nghỉ việc phải sau ngày vào làm",
      path: ["resign_date"],
    },
  )
  .refine(
    (data) => {
      if (data.password && data.password.length > 0) {
        return data.password.length >= 8
      }
      return true
    },
    {
      message: "Mật khẩu phải từ 8 ký tự trở lên",
      path: ["password"],
    },
  )

type EmployeeFormData = z.infer<typeof employeeFormSchema>

interface EmployeeFormModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (payload: CreateEmployeePayload) => Promise<void>
  departments: Department[]
  employees: Employee[] // for manager select
  editData?: Employee | null
  isLoading?: boolean
}

export function EmployeeFormModal({
  open,
  onClose,
  onSubmit,
  departments,
  employees,
  editData,
  isLoading = false,
}: EmployeeFormModalProps) {
  const isEditing = !!editData
  const firstInputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    control,
    formState: { errors, isSubmitting },
  } = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: {
      full_name: "",
      email: "",
      phone: "",
      department_id: "",
      position: "",
      hire_date: "",
      resign_date: "",
      address: "",
      social_insurance: "",
      national_id: "",
      manager_id: "",
      password: "",
    },
  })

  const deptValue = watch("department_id")
  const managerValue = watch("manager_id")

  // Populate form when editing
  useEffect(() => {
    if (open && editData) {
      reset({
        full_name: editData.full_name,
        email: editData.email,
        phone: editData.phone ?? "",
        department_id: editData.department?.id?.toString() ?? "",
        position: editData.position ?? "",
        hire_date: editData.hire_date ?? "",
        resign_date: editData.resign_date ?? "",
        address: editData.address ?? "",
        social_insurance: editData.social_insurance ?? "",
        national_id: editData.national_id ?? "",
        manager_id: editData.manager?.id?.toString() ?? "",
        password: "",
      })
    } else if (open && !editData) {
      reset()
    }
  }, [open, editData, reset])

  // Focus first field when modal opens
  useEffect(() => {
    if (open) {
      setTimeout(() => firstInputRef.current?.focus(), 100)
    }
  }, [open])

  const handleFormSubmit = async (data: EmployeeFormData) => {
    const payload: CreateEmployeePayload = {
      full_name: data.full_name,
      email: data.email,
      phone: data.phone || null,
      department_id: parseInt(data.department_id),
      position: data.position,
      hire_date: data.hire_date,
      resign_date: data.resign_date || null,
      address: data.address || null,
      social_insurance: data.social_insurance || null,
      national_id: data.national_id || null,
      manager_id: data.manager_id ? parseInt(data.manager_id) : null,
      password: data.password || null,
    }
    await onSubmit(payload)
  }

  const handleDeptChange = (value: string) => {
    setValue("department_id", value)
  }

  const handleManagerChange = (value: string) => {
    setValue("manager_id", value)
  }

  const { ref: fullNameRef, ...fullNameRegister } = register("full_name")

  return (
    <CommonDialog
      open={open}
      onClose={onClose}
      title={isEditing ? `Sửa thông tin — ${editData?.full_name}` : "Thêm nhân viên mới"}
      size="2xl"
      primaryAction={{
        label: isSubmitting ? "Đang lưu..." : isEditing ? "Cập nhật" : "Tạo nhân viên",
        type: "submit",
        form: "employee-form",
        disabled: isSubmitting || isLoading,
      }}
      cancelAction={{
        label: "Hủy",
        disabled: isSubmitting,
        onClick: onClose,
      }}
    >
      <form
        id="employee-form"
        onSubmit={handleSubmit(handleFormSubmit)}
        className="grid gap-4 py-2"
      >
        {/* Basic info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Họ tên *" error={errors.full_name?.message} id="emp-full-name">
            <Input
              id="emp-full-name"
              placeholder="Nguyễn Văn A"
              {...fullNameRegister}
              ref={(e) => {
                fullNameRef(e)
                // @ts-ignore
                firstInputRef.current = e
              }}
              aria-invalid={!!errors.full_name}
              className="h-9"
            />
          </FormField>

          <FormField label="Email *" error={errors.email?.message} id="emp-email">
            <Input
              id="emp-email"
              type="email"
              placeholder="nva@company.com"
              {...register("email")}
              aria-invalid={!!errors.email}
              className="h-9"
            />
          </FormField>

          <FormField label="Số điện thoại" id="emp-phone">
            <Input
              id="emp-phone"
              type="tel"
              placeholder="0901234567"
              {...register("phone")}
              className="h-9"
            />
          </FormField>

          <FormField label="Chức vụ *" error={errors.position?.message} id="emp-position">
            <Input
              id="emp-position"
              placeholder="Kế toán viên"
              {...register("position")}
              aria-invalid={!!errors.position}
              className="h-9"
            />
          </FormField>
        </div>

        {/* Department + Manager */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Phòng ban *" error={errors.department_id?.message} id="emp-dept">
            <input type="hidden" {...register("department_id")} />
            <SearchableSelect
              value={deptValue}
              onValueChange={handleDeptChange}
              options={departments.map((d) => ({
                label: d.label || d.name,
                value: d.id.toString(),
              }))}
              placeholder="Chọn phòng ban"
              className={errors.department_id ? "border-destructive h-9" : "h-9"}
            />
          </FormField>

          <FormField label="Quản lý trực tiếp" id="emp-manager">
            <input type="hidden" {...register("manager_id")} />
            <SearchableSelect
              value={managerValue || undefined}
              onValueChange={handleManagerChange}
              options={[
                { label: "Không có", value: "none" },
                ...employees
                  .filter((e) => !editData || e.id !== editData.id)
                  .map((e) => ({
                    label: `${e.full_name} (${e.user_code})`,
                    value: e.id.toString(),
                  })),
              ]}
              placeholder="Không có"
              className="h-9"
            />
          </FormField>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Ngày vào làm *" error={errors.hire_date?.message} id="emp-hire">
            <Controller
              name="hire_date"
              control={control}
              render={({ field, fieldState }) => (
                <CommonDatePicker
                  value={field.value || null}
                  onChange={field.onChange}
                  error={fieldState.error?.message}
                />
              )}
            />
          </FormField>

          <FormField label="Ngày nghỉ việc" id="emp-resign" error={errors.resign_date?.message}>
            <Controller
              name="resign_date"
              control={control}
              render={({ field, fieldState }) => (
                <CommonDatePicker
                  value={field.value || null}
                  onChange={field.onChange}
                  error={fieldState.error?.message}
                />
              )}
            />
          </FormField>
        </div>

        {/* Additional HR info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Số BHXH" id="emp-si">
            <Input
              id="emp-si"
              placeholder="0123456789"
              {...register("social_insurance")}
              className="h-9"
            />
          </FormField>

          <FormField label="CMND / CCCD" id="emp-nid">
            <Input
              id="emp-nid"
              placeholder="079201012345"
              {...register("national_id")}
              className="h-9"
            />
          </FormField>
        </div>

        <FormField label="Địa chỉ" id="emp-address">
          <Input
            id="emp-address"
            placeholder="123 Lê Lợi, Quận 1, TP.HCM"
            {...register("address")}
            className="h-9"
          />
        </FormField>

        {/* Password — only shown for new employees */}
        {!isEditing && (
          <FormField label="Mật khẩu ban đầu" id="emp-password">
            <Input
              id="emp-password"
              type="password"
              placeholder="Mặc định: Password@123"
              {...register("password")}
              className="h-9"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Để trống sẽ dùng mật khẩu mặc định <code>Password@123</code>
            </p>
          </FormField>
        )}
      </form>
    </CommonDialog>
  )
}

// Small helper field wrapper
function FormField({
  label,
  id,
  error,
  children,
}: {
  label: string
  id: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} className="text-sm font-medium">
        {label}
      </Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
