import { useEffect, useState } from "react"
import { useForm, useFieldArray, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import dayjs from "dayjs"
import { Trash2, Plus } from "lucide-react"

import { CommonDrawer } from "@/components/common/CommonDrawer"
import { CommonDatePicker } from "@/components/common/CommonDatePicker"
import { SearchableSelect } from "@/components/common/SearchableSelect"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { optionApi, type OptionItem } from "@/shared/api/optionApi"
import type { AssignEmployeeProjectsPayload } from "../api/employeeApi"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"
import type { TFunction } from "i18next"

const createAssignProjectsSchema = (t: TFunction) =>
  z
    .object({
      projects: z
        .array(
          z.object({
            project_id: z
              .number()
              .min(1, t("hr:employees.assign_projects.validation.project_required")),
            role: z
              .string()
              .max(100, t("hr:employees.assign_projects.validation.role_max"))
              .nullable()
              .optional(),
            start_date: z.string().nullable().optional(),
            end_date: z.string().nullable().optional(),
            labor_cost: z
              .number()
              .min(0, t("hr:employees.assign_projects.validation.labor_cost_min"))
              .nullable()
              .optional(),
            notes: z
              .string()
              .max(1000, t("hr:employees.assign_projects.validation.notes_max"))
              .nullable()
              .optional(),
          }),
        )
        .min(1, t("hr:employees.assign_projects.validation.min_one_project")),
    })
    .refine(
      (data) => {
        for (const p of data.projects) {
          if (p.start_date && p.end_date) {
            if (dayjs(p.end_date).isBefore(dayjs(p.start_date))) {
              return false
            }
          }
        }
        return true
      },
      { message: t("hr:employees.assign_projects.validation.date_invalid") },
    )

export type AssignProjectsFormValues = z.infer<ReturnType<typeof createAssignProjectsSchema>>

interface EmployeeProjectsDrawerProps {
  open: boolean
  onClose: () => void
  onSubmit: (payload: AssignEmployeeProjectsPayload) => Promise<void>
  employeeName: string
}

export function EmployeeProjectsDrawer({
  open,
  onClose,
  onSubmit,
  employeeName,
}: EmployeeProjectsDrawerProps) {
  const { t } = useTranslation(["hr", "common"])
  const [projectOptions, setProjectOptions] = useState<OptionItem[]>([])

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AssignProjectsFormValues>({
    resolver: zodResolver(createAssignProjectsSchema(t)),
    defaultValues: {
      projects: [
        { project_id: 0, role: "", start_date: "", end_date: "", labor_cost: 0, notes: "" },
      ],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: "projects",
  })

  useEffect(() => {
    if (open) {
      optionApi.getProjects().then(setProjectOptions).catch(console.error)

      reset({
        projects: [
          { project_id: 0, role: "", start_date: "", end_date: "", labor_cost: 0, notes: "" },
        ],
      })
    }
  }, [open, reset])

  const handleFormSubmit = async (data: AssignProjectsFormValues) => {
    try {
      await onSubmit({ projects: data.projects })
      toast.success(t("hr:employees.assign_projects.update_success"))
      onClose()
    } catch (error) {
      console.error(error)
      toast.error(t("hr:employees.assign_projects.update_error"))
    }
  }

  return (
    <CommonDrawer
      open={open}
      onClose={onClose}
      title={t("hr:employees.assign_projects.title", { name: employeeName })}
      direction="right"
      width="600px"
      primaryAction={{
        label: isSubmitting
          ? t("hr:employees.form.saving")
          : t("hr:employees.assign_projects.submit"),
        type: "submit",
        form: "assign-projects-form",
        disabled: isSubmitting,
      }}
    >
      <form
        id="assign-projects-form"
        onSubmit={handleSubmit(handleFormSubmit)}
        className="space-y-6"
      >
        {errors.projects?.root && (
          <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
            {errors.projects.root.message}
          </div>
        )}

        {fields.map((item, index) => (
          <div key={item.id} className="p-4 border rounded-lg bg-muted/20 relative space-y-4">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 text-muted-foreground hover:text-destructive"
              onClick={() => remove(index)}
              disabled={fields.length === 1}
            >
              <Trash2 className="h-4 w-4" />
            </Button>

            <div className="space-y-1.5 pr-8">
              <Label>{t("hr:employees.assign_projects.fields.project")} *</Label>
              <Controller
                name={`projects.${index}.project_id`}
                control={control}
                render={({ field }) => (
                  <SearchableSelect
                    value={field.value ? field.value.toString() : ""}
                    onValueChange={(val) => field.onChange(val ? parseInt(val) : 0)}
                    options={projectOptions.map((p) => ({
                      label: p.label,
                      value: p.value?.toString() || p.id?.toString() || "",
                    }))}
                    placeholder={t("hr:employees.assign_projects.fields.project_placeholder")}
                  />
                )}
              />
              {errors.projects?.[index]?.project_id && (
                <p className="text-xs text-destructive">
                  {errors.projects[index]?.project_id?.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>{t("hr:employees.assign_projects.fields.role")}</Label>
                <Input
                  placeholder={t("hr:employees.assign_projects.fields.role_placeholder")}
                  {...register(`projects.${index}.role`)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t("hr:employees.assign_projects.fields.labor_cost")}</Label>
                <Input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  placeholder="0"
                  {...register(`projects.${index}.labor_cost`, { valueAsNumber: true })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Controller
                  name={`projects.${index}.start_date`}
                  control={control}
                  render={({ field }) => (
                    <CommonDatePicker
                      label={t("hr:employees.assign_projects.fields.start_date")}
                      value={field.value || null}
                      onChange={field.onChange}
                    />
                  )}
                />
              </div>
              <div className="space-y-1.5">
                <Controller
                  name={`projects.${index}.end_date`}
                  control={control}
                  render={({ field }) => (
                    <CommonDatePicker
                      label={t("hr:employees.assign_projects.fields.end_date")}
                      value={field.value || null}
                      onChange={field.onChange}
                    />
                  )}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>{t("hr:employees.assign_projects.fields.notes")}</Label>
              <Textarea
                placeholder={t("hr:employees.assign_projects.fields.notes_placeholder")}
                rows={2}
                className="resize-none"
                {...register(`projects.${index}.notes`)}
              />
            </div>
          </div>
        ))}

        <Button
          type="button"
          variant="outline"
          className="w-full border-dashed"
          onClick={() =>
            append({
              project_id: 0,
              role: "",
              start_date: "",
              end_date: "",
              labor_cost: 0,
              notes: "",
            })
          }
        >
          <Plus className="mr-2 h-4 w-4" />
          {t("hr:employees.assign_projects.add_project")}
        </Button>
      </form>
    </CommonDrawer>
  )
}
