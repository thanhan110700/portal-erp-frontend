import { useEffect } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { CommonDialog } from "@/components/common/CommonDialog"
import { CommonDatePicker } from "@/components/common/CommonDatePicker"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { SearchableSelect } from "@/components/common/SearchableSelect"
import type { ProjectMilestone } from "../types/project"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"

const getMilestoneSchema = (t: any) =>
  z.object({
    milestone_name: z
      .string()
      .min(1, t("projects:milestones.form.validation.name_required"))
      .max(255, t("projects:milestones.form.validation.name_max")),
    milestone_date: z.string().min(1, t("projects:milestones.form.validation.date_required")),
    status: z.enum(["planned", "in_progress", "completed", "delayed"]).default("planned"),
    notes: z
      .string()
      .max(1000, t("projects:milestones.form.validation.notes_max"))
      .optional()
      .nullable()
      .or(z.literal("")),
  })

interface ProjectMilestoneFormModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (payload: any) => Promise<void>
  editData?: ProjectMilestone | null
}

const STATUS_OPTIONS = [
  { value: "planned", label: "Lên kế hoạch" },
  { value: "in_progress", label: "Đang thực hiện" },
  { value: "completed", label: "Hoàn thành" },
  { value: "delayed", label: "Bị trễ" },
]

export function ProjectMilestoneFormModal({
  open,
  onClose,
  onSubmit,
  editData,
}: ProjectMilestoneFormModalProps) {
  const { t } = useTranslation(["projects", "common"])
  const isEditing = !!editData

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(getMilestoneSchema(t)),
    defaultValues: {
      milestone_name: "",
      milestone_date: "",
      status: "planned" as const,
      notes: "",
    },
  })

  useEffect(() => {
    if (open) {
      if (editData) {
        reset({
          milestone_name: editData.milestone_name,
          milestone_date: editData.milestone_date,
          status: (editData.status as any) || "planned",
          notes: editData.notes || "",
        })
      } else {
        reset({
          milestone_name: "",
          milestone_date: new Date().toISOString().split("T")[0],
          status: "planned",
          notes: "",
        })
      }
    }
  }, [open, editData, reset])

  const handleFormSubmit = async (data: any) => {
    try {
      const payload = {
        milestone_name: data.milestone_name,
        milestone_date: data.milestone_date,
        status: data.status,
        notes: data.notes || null,
      }
      await onSubmit(payload)
    } catch (error) {
      console.error(error)
      toast.error(t("projects:milestones.form.validation.save_error"))
    }
  }

  return (
    <CommonDialog
      open={open}
      onClose={onClose}
      title={
        isEditing
          ? t("projects:milestones.form.title_edit")
          : t("projects:milestones.form.title_add")
      }
      size="lg"
      primaryAction={{
        label: isSubmitting ? t("common:actions.saving") : t("common:actions.save"),
        type: "submit",
        form: "project-milestone-form",
        disabled: isSubmitting,
      }}
      cancelAction={{
        label: t("common:actions.cancel"),
        disabled: isSubmitting,
        onClick: onClose,
      }}
    >
      <form
        id="project-milestone-form"
        onSubmit={handleSubmit(handleFormSubmit)}
        className="grid gap-4 py-2"
      >
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ms-name" required>
            {t("projects:milestones.form.name")}
          </Label>
          <Input
            id="ms-name"
            placeholder={t("projects:milestones.form.name_placeholder")}
            {...register("milestone_name")}
          />
          {errors.milestone_name && (
            <p className="text-xs text-destructive">{errors.milestone_name.message as string}</p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Controller
              name="milestone_date"
              control={control}
              render={({ field, fieldState }) => (
                <CommonDatePicker
                  label={t("projects:milestones.form.due_date")}
                  value={field.value || null}
                  onChange={field.onChange}
                  error={fieldState.error?.message}
                  required
                />
              )}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>{t("projects:milestones.form.status")}</Label>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <SearchableSelect
                  value={field.value}
                  onValueChange={field.onChange}
                  options={STATUS_OPTIONS.map((s) => ({
                    ...s,
                    label: t(`common:status.${s.value}`, { defaultValue: s.label }),
                  }))}
                  placeholder={t("projects:milestones.form.status_placeholder")}
                />
              )}
            />
            {errors.status && (
              <p className="text-xs text-destructive">{errors.status.message as string}</p>
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="ms-notes">{t("projects:milestones.form.notes")}</Label>
          <Textarea
            id="ms-notes"
            rows={3}
            placeholder={t("projects:milestones.form.notes_placeholder")}
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
