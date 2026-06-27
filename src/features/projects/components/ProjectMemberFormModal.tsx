import { useEffect, useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { CommonDialog } from "@/components/common/CommonDialog"
import { CommonDatePicker } from "@/components/common/CommonDatePicker"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { SearchableSelect } from "@/components/common/SearchableSelect"
import { optionApi, type OptionItem } from "@/shared/api/optionApi"
import type { ProjectMember } from "../types/project"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"

const getMemberSchema = (t: any) =>
  z
    .object({
      user_id: z.number().min(1, t("projects:members.form.validation.employee_required")),
      role: z
        .string()
        .max(100, t("projects:members.form.validation.role_max"))
        .optional()
        .nullable()
        .or(z.literal("")),
      start_date: z.string().optional().nullable().or(z.literal("")),
      end_date: z.string().optional().nullable().or(z.literal("")),
      labor_cost: z.preprocess(
        (val) =>
          val === "" || val === null || val === undefined || Number.isNaN(Number(val))
            ? null
            : Number(val),
        z
          .number()
          .min(0, t("projects:members.form.validation.labor_cost_min"))
          .nullable()
          .optional(),
      ),
      notes: z
        .string()
        .max(1000, t("projects:members.form.validation.notes_max"))
        .optional()
        .nullable()
        .or(z.literal("")),
    })
    .refine(
      (data) => {
        if (data.start_date && data.end_date) {
          return new Date(data.end_date) >= new Date(data.start_date)
        }
        return true
      },
      {
        message: t("projects:members.form.validation.date_invalid"),
        path: ["end_date"],
      },
    )

interface ProjectMemberFormModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (payload: any) => Promise<void>
  editData?: ProjectMember | null
}

export function ProjectMemberFormModal({
  open,
  onClose,
  onSubmit,
  editData,
}: ProjectMemberFormModalProps) {
  const { t } = useTranslation(["projects", "common"])
  const isEditing = !!editData
  const [employees, setEmployees] = useState<OptionItem[]>([])

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(getMemberSchema(t)),
    defaultValues: {
      user_id: 0,
      role: "",
      start_date: "",
      end_date: "",
      labor_cost: "" as any,
      notes: "",
    },
  })

  useEffect(() => {
    if (open) {
      optionApi.getEmployees().then(setEmployees).catch(console.error)

      if (editData) {
        reset({
          user_id: editData.user?.id || 0,
          role: editData.role || "",
          start_date: editData.start_date || "",
          end_date: editData.end_date || "",
          labor_cost: editData.labor_cost ? Number(editData.labor_cost) : ("" as any),
          notes: editData.notes || "",
        })
      } else {
        reset({
          user_id: 0,
          role: "",
          start_date: new Date().toISOString().split("T")[0],
          end_date: "",
          labor_cost: "" as any,
          notes: "",
        })
      }
    }
  }, [open, editData, reset])

  const handleFormSubmit = async (data: any) => {
    try {
      const payload: any = {
        role: data.role || null,
        start_date: data.start_date || null,
        end_date: data.end_date || null,
        labor_cost:
          data.labor_cost !== "" && data.labor_cost !== null ? Number(data.labor_cost) : null,
        notes: data.notes || null,
      }
      if (!isEditing) {
        payload.user_id = data.user_id
      }
      await onSubmit(payload)
    } catch (error) {
      console.error(error)
      toast.error(t("projects:members.form.validation.save_error"))
    }
  }

  return (
    <CommonDialog
      open={open}
      onClose={onClose}
      title={
        isEditing ? t("projects:members.form.title_edit") : t("projects:members.form.title_add")
      }
      size="lg"
      primaryAction={{
        label: isSubmitting ? t("common:action.saving") : t("common:action.save"),
        type: "submit",
        form: "project-member-form",
        disabled: isSubmitting,
      }}
      cancelAction={{
        label: t("common:action.cancel"),
        disabled: isSubmitting,
        onClick: onClose,
      }}
    >
      <form
        id="project-member-form"
        onSubmit={handleSubmit(handleFormSubmit)}
        className="grid gap-4 py-2"
      >
        <div className="flex flex-col gap-1.5">
          <Label>{t("projects:members.form.employee")}</Label>
          <Controller
            name="user_id"
            control={control}
            disabled={isEditing}
            render={({ field }) => (
              <SearchableSelect
                value={field.value ? field.value.toString() : ""}
                onValueChange={(val) => field.onChange(parseInt(val))}
                options={employees.map((emp) => ({
                  label: emp.label,
                  value: emp.value?.toString() || emp.id?.toString() || "",
                }))}
                placeholder={t("projects:members.form.employee_placeholder")}
                disabled={isEditing}
              />
            )}
          />
          {errors.user_id && <p className="text-xs text-destructive">{errors.user_id.message}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="m-role">{t("projects:members.form.role")}</Label>
            <Input
              id="m-role"
              placeholder={t("projects:members.form.role_placeholder")}
              {...register("role")}
            />
            {errors.role && (
              <p className="text-xs text-destructive">{errors.role.message as string}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="m-labor-cost">{t("projects:members.form.labor_cost")}</Label>
            <Input
              id="m-labor-cost"
              type="number"
              inputMode="decimal"
              placeholder={t("projects:members.form.labor_cost_placeholder")}
              {...register("labor_cost", { valueAsNumber: true })}
            />
            {errors.labor_cost && (
              <p className="text-xs text-destructive">{errors.labor_cost.message as string}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Controller
              name="start_date"
              control={control}
              render={({ field, fieldState }) => (
                <CommonDatePicker
                  label={t("projects:members.form.start_date")}
                  value={field.value || null}
                  onChange={field.onChange}
                  error={fieldState.error?.message}
                />
              )}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Controller
              name="end_date"
              control={control}
              render={({ field, fieldState }) => (
                <CommonDatePicker
                  label={t("projects:members.form.end_date")}
                  value={field.value || null}
                  onChange={field.onChange}
                  error={fieldState.error?.message}
                />
              )}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="m-notes">{t("projects:members.form.notes")}</Label>
          <Textarea
            id="m-notes"
            rows={3}
            placeholder={t("projects:members.form.notes_placeholder")}
            {...register("notes")}
            className="resize-none"
          />
          {errors.notes && (
            <p className="text-xs text-destructive">{errors.notes.message as string}</p>
          )}
        </div>
      </form>
    </CommonDialog>
  )
}
