import { useEffect, useRef } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { CommonDialog } from "@/components/common/CommonDialog"
import { CommonDatePicker } from "@/components/common/CommonDatePicker"
import { Input } from "@/components/ui/input"
import { SearchableSelect } from "@/components/common/SearchableSelect"
import { Label } from "@/components/ui/label"
import * as z from "zod"
import type { CreateEmployeePayload, Department, Employee } from "../types/employee"
import { useTranslation, Trans } from "react-i18next"
import type { TFunction } from "i18next"

const createEmployeeFormSchema = (t: TFunction) =>
  z
    .object({
      full_name: z
        .string()
        .min(1, t("hr:employees.form.validation.full_name_required"))
        .max(150, t("hr:employees.form.validation.full_name_max")),
      email: z
        .string()
        .min(1, t("hr:employees.form.validation.email_required"))
        .email(t("hr:employees.form.validation.email_invalid")),
      phone: z
        .string()
        .max(20, t("hr:employees.form.validation.phone_max"))
        .optional()
        .nullable()
        .or(z.literal("")),
      department_id: z.string().min(1, t("hr:employees.form.validation.department_required")),
      position: z
        .string()
        .min(1, t("hr:employees.form.validation.position_required"))
        .max(100, t("hr:employees.form.validation.position_max")),
      hire_date: z.string().min(1, t("hr:employees.form.validation.hire_date_required")),
      resign_date: z.string().optional().nullable().or(z.literal("")),
      address: z
        .string()
        .max(500, t("hr:employees.form.validation.address_max"))
        .optional()
        .nullable()
        .or(z.literal("")),
      social_insurance: z
        .string()
        .max(20, t("hr:employees.form.validation.social_insurance_max"))
        .optional()
        .nullable()
        .or(z.literal("")),
      national_id: z
        .string()
        .max(20, t("hr:employees.form.validation.national_id_max"))
        .optional()
        .nullable()
        .or(z.literal("")),
      manager_id: z.string().optional().nullable().or(z.literal("")),
      password: z.string().optional().nullable().or(z.literal("")),
      role: z.string().optional().nullable().or(z.literal("")),
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
        message: t("hr:employees.form.validation.resign_date_invalid"),
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
        message: t("hr:employees.form.validation.password_min"),
        path: ["password"],
      },
    )

type EmployeeFormData = z.infer<ReturnType<typeof createEmployeeFormSchema>>

interface EmployeeFormModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (payload: CreateEmployeePayload & { role?: string }) => Promise<void>
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
  const { t } = useTranslation(["hr", "common"])
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
    resolver: zodResolver(createEmployeeFormSchema(t)),
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
      role: "",
    },
  })

  const deptValue = watch("department_id")
  const managerValue = watch("manager_id")
  const roleValue = watch("role")

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
        role: editData.role?.name ?? editData.roles?.[0] ?? "",
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
    const payload = {
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
      role: data.role || undefined,
    } as CreateEmployeePayload & { role?: string }
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
      title={
        isEditing
          ? t("hr:employees.form.edit_title", { name: editData?.full_name })
          : t("hr:employees.form.add_title")
      }
      size="full"
      primaryAction={{
        label: isSubmitting
          ? t("hr:employees.form.saving")
          : isEditing
            ? t("hr:employees.form.update")
            : t("hr:employees.form.create"),
        type: "submit",
        form: "employee-form",
        disabled: isSubmitting || isLoading,
      }}
      cancelAction={{
        label: t("common:actions.cancel"),
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
          <FormField
            label={`${t("hr:employees.form.fields.full_name")} *`}
            error={errors.full_name?.message}
            id="emp-full-name"
          >
            <Input
              id="emp-full-name"
              placeholder={t("hr:employees.form.fields.full_name_placeholder")}
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

          <FormField
            label={`${t("hr:employees.form.fields.email")} *`}
            error={errors.email?.message}
            id="emp-email"
          >
            <Input
              id="emp-email"
              type="email"
              placeholder={t("hr:employees.form.fields.email_placeholder")}
              {...register("email")}
              aria-invalid={!!errors.email}
              className="h-9"
            />
          </FormField>

          <FormField label={t("hr:employees.form.fields.phone")} id="emp-phone">
            <Input
              id="emp-phone"
              type="tel"
              placeholder={t("hr:employees.form.fields.phone_placeholder")}
              inputMode="tel"
              {...register("phone")}
              className="h-9"
            />
          </FormField>

          <FormField
            label={`${t("hr:employees.form.fields.position")} *`}
            error={errors.position?.message}
            id="emp-position"
          >
            <Input
              id="emp-position"
              placeholder={t("hr:employees.form.fields.position_placeholder")}
              {...register("position")}
              aria-invalid={!!errors.position}
              className="h-9"
            />
          </FormField>
        </div>

        {/* Department + Manager */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            label={`${t("hr:employees.form.fields.department")} *`}
            error={errors.department_id?.message}
            id="emp-dept"
          >
            <input type="hidden" {...register("department_id")} />
            <SearchableSelect
              value={deptValue}
              onValueChange={handleDeptChange}
              options={departments.map((d) => ({
                label: d.label || d.name,
                value: d.id.toString(),
              }))}
              placeholder={t("hr:employees.form.fields.department_placeholder")}
              className={errors.department_id ? "border-destructive h-9" : "h-9"}
            />
          </FormField>

          <FormField label={t("hr:employees.form.fields.manager")} id="emp-manager">
            <input type="hidden" {...register("manager_id")} />
            <SearchableSelect
              value={managerValue || undefined}
              onValueChange={handleManagerChange}
              options={[
                { label: t("hr:employees.form.fields.manager_none"), value: "none" },
                ...employees
                  .filter((e) => !editData || e.id !== editData.id)
                  .map((e) => ({
                    label: `${e.full_name} (${e.user_code})`,
                    value: e.id.toString(),
                  })),
              ]}
              placeholder={t("hr:employees.form.fields.manager_none")}
              className="h-9"
            />
          </FormField>
        </div>

        {/* Roles */}
        <FormField
          label={t("hr:employees.form.fields.role", { defaultValue: "Vai trò / Quyền" })}
          id="emp-role"
        >
          <input type="hidden" {...register("role")} />
          <SearchableSelect
            value={roleValue || ""}
            onValueChange={(val) => setValue("role", val)}
            options={[
              { label: t("common:roles.admin"), value: "admin" },
              { label: t("common:roles.director"), value: "director" },
              { label: t("common:roles.accountant"), value: "accountant" },
              { label: t("common:roles.sales"), value: "sales" },
              { label: t("common:roles.technician"), value: "technician" },
              { label: t("common:roles.employee"), value: "employee" },
            ]}
            placeholder={t("hr:employees.form.fields.role_placeholder", {
              defaultValue: "Chọn vai trò",
            })}
            className="h-9"
          />
        </FormField>

        {/* Dates */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label={`${t("hr:employees.form.fields.hire_date")} *`} id="emp-hire">
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

          <FormField label={t("hr:employees.form.fields.resign_date")} id="emp-resign">
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
          <FormField label={t("hr:employees.form.fields.social_insurance")} id="emp-si">
            <Input
              id="emp-si"
              placeholder={t("hr:employees.form.fields.social_insurance_placeholder")}
              {...register("social_insurance")}
              className="h-9"
            />
          </FormField>

          <FormField label={t("hr:employees.form.fields.national_id")} id="emp-nid">
            <Input
              id="emp-nid"
              placeholder={t("hr:employees.form.fields.national_id_placeholder")}
              {...register("national_id")}
              className="h-9"
            />
          </FormField>
        </div>

        <FormField label={t("hr:employees.form.fields.address")} id="emp-address">
          <Input
            id="emp-address"
            placeholder={t("hr:employees.form.fields.address_placeholder")}
            {...register("address")}
            className="h-9"
          />
        </FormField>

        {/* Password — only shown for new employees */}
        {!isEditing && (
          <FormField label={t("hr:employees.form.fields.password")} id="emp-password">
            <Input
              id="emp-password"
              type="password"
              placeholder={t("hr:employees.form.fields.password_placeholder")}
              {...register("password")}
              className="h-9"
            />
            <p className="text-xs text-muted-foreground mt-1">
              <Trans i18nKey="hr:employees.form.fields.password_hint">
                Để trống sẽ dùng mật khẩu mặc định <code>Password@123</code>
              </Trans>
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
