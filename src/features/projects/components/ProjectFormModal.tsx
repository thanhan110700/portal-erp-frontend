import { useEffect, useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { toast } from "sonner"
import { CommonDialog } from "@/components/common/CommonDialog"
import { CommonDatePicker } from "@/components/common/CommonDatePicker"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { SearchableSelect } from "@/components/common/SearchableSelect"
import { optionApi, type OptionItem } from "@/shared/api/optionApi"
import type { CreateProjectPayload, UpdateProjectPayload } from "../types/project"
import { projectApi } from "../api/projectApi"
import { useTranslation } from "react-i18next"

const getProjectSchema = (t: any) =>
  z
    .object({
      project_name: z
        .string()
        .min(1, t("projects:form.validation.name_required", { defaultValue: "Vui lòng nhập tên" }))
        .max(255, t("projects:form.validation.name_max", { defaultValue: "Tối đa 255 ký tự" })),
      description: z
        .string()
        .max(5000, t("projects:form.validation.desc_max", { defaultValue: "Tối đa 5000 ký tự" }))
        .optional()
        .nullable()
        .or(z.literal("")),
      customer_id: z.number({
        message: t("projects:form.validation.customer_required", {
          defaultValue: "Vui lòng chọn khách hàng",
        }),
      }),
      contract_id: z.number().optional().nullable().or(z.literal(0)),
      start_date: z
        .string()
        .min(
          1,
          t("projects:form.validation.date_required", { defaultValue: "Vui lòng chọn ngày" }),
        ),
      end_date: z.string().optional().nullable().or(z.literal("")),
      contract_value: z
        .number({ message: t("projects:form.validation.value_required") })
        .gt(
          0,
          t("projects:form.validation.value_min", { defaultValue: "Giá trị hợp đồng phải > 0" }),
        ),
      status: z
        .enum(["planning", "quoting", "signed", "ongoing", "testing", "settled", "completed"])
        .optional()
        .nullable()
        .or(z.literal("")),
      progress_percent: z
        .number({
          message: t("projects:form.validation.progress_invalid", {
            defaultValue: "Không hợp lệ",
          }),
        })
        .min(0, t("projects:form.validation.progress_min", { defaultValue: "Tối thiểu 0" }))
        .max(100, t("projects:form.validation.progress_max", { defaultValue: "Tối đa 100" }))
        .optional()
        .nullable(),
    })
    .refine(
      (data) => {
        if (!data.end_date || !data.start_date) return true
        return new Date(data.end_date) > new Date(data.start_date)
      },
      {
        message: t("projects:form.validation.date_invalid", {
          defaultValue: "Ngày kết thúc phải lớn hơn ngày bắt đầu",
        }),
        path: ["end_date"],
      },
    )

type ProjectFormValues = z.infer<ReturnType<typeof getProjectSchema>>

interface ProjectFormModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  editingId?: number | null
}

export function ProjectFormModal({ open, onClose, onSuccess, editingId }: ProjectFormModalProps) {
  const { t } = useTranslation(["projects", "common"])
  const isEdit = !!editingId

  const [customers, setCustomers] = useState<OptionItem[]>([])
  const [contracts, setContracts] = useState<OptionItem[]>([])
  const [statuses, setStatuses] = useState<OptionItem[]>([])

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProjectFormValues>({
    resolver: zodResolver(getProjectSchema(t)),
    defaultValues: {
      project_name: "",
      status: "planning",
    },
  })

  useEffect(() => {
    if (open) {
      Promise.all([
        optionApi.getCustomers(),
        optionApi.getContracts(),
        optionApi.getProjectStatuses(),
      ])
        .then(([cus, ctr, stat]) => {
          setCustomers(cus)
          setContracts(ctr)
          setStatuses(stat)
        })
        .catch(console.error)
    }
  }, [open])

  useEffect(() => {
    if (open && isEdit && editingId) {
      projectApi
        .get(editingId)
        .then((data) => {
          reset({
            project_name: data.project_name,
            customer_id: data.customer_id || data.customer?.id || (undefined as unknown as number),
            contract_id: data.contract_id || data.contract?.id || undefined,
            start_date: data.start_date || "",
            end_date: data.end_date || "",
            contract_value:
              typeof data.contract_value === "string"
                ? parseFloat(data.contract_value)
                : data.contract_value || 0,
            status: (data.status as any) || "planning",
            progress_percent: data.progress_percent || 0,
            description: data.description || "",
          })
        })
        .catch(() => toast.error(t("projects:form.fetch_error")))
    } else if (open && !isEdit) {
      reset({
        project_name: "",
        customer_id: undefined,
        contract_id: undefined,
        contract_value: 0,
        start_date: new Date().toISOString().split("T")[0],
        end_date: "",
        status: "planning",
        description: "",
        progress_percent: 0,
      })
    }
  }, [open, isEdit, editingId, reset])

  const onSubmit = async (data: ProjectFormValues) => {
    try {
      if (isEdit && editingId) {
        await projectApi.update(editingId, data as UpdateProjectPayload)
        toast.success(t("projects:form.update_success"))
      } else {
        await projectApi.create(data as CreateProjectPayload)
        toast.success(t("projects:form.create_success"))
      }
      onSuccess()
      onClose()
    } catch {
      toast.error(isEdit ? t("projects:form.update_error") : t("projects:form.create_error"))
    }
  }

  return (
    <CommonDialog
      open={open}
      onClose={onClose}
      title={isEdit ? t("projects:form.update_title") : t("projects:form.create_title")}
      size="full"
      primaryAction={{
        label: isSubmitting
          ? t("common:table.loading")
          : isEdit
            ? t("projects:form.submit_update")
            : t("projects:form.submit_create"),
        type: "submit",
        form: "project-form",
        disabled: isSubmitting,
      }}
      cancelAction={{
        label: t("common:actions.cancel"),
        disabled: isSubmitting,
        onClick: onClose,
      }}
    >
      <form id="project-form" onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 flex flex-col gap-1.5">
            <Label htmlFor="p-name">{t("projects:form.name")}</Label>
            <Input id="p-name" {...register("project_name")} aria-invalid={!!errors.project_name} />
            {errors.project_name && (
              <p className="text-xs text-destructive">{errors.project_name.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="p-customer">{t("projects:form.customer")}</Label>
            <Controller
              name="customer_id"
              control={control}
              render={({ field }) => (
                <SearchableSelect
                  value={field.value != null ? field.value.toString() : ""}
                  onValueChange={(val) => field.onChange(parseInt(val))}
                  options={customers.map((c) => ({
                    label: c.label,
                    value: (c.value ?? c.id)?.toString() || "",
                  }))}
                  placeholder={t("projects:form.customer_placeholder")}
                />
              )}
            />
            {errors.customer_id && (
              <p className="text-xs text-destructive">{errors.customer_id.message as string}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="p-contract">{t("projects:form.contract")}</Label>
            <Controller
              name="contract_id"
              control={control}
              render={({ field }) => (
                <SearchableSelect
                  value={field.value != null ? field.value.toString() : ""}
                  onValueChange={(val) => field.onChange(parseInt(val))}
                  options={[
                    { label: t("projects:form.contract_none"), value: "0" },
                    ...contracts.map((c) => ({
                      label: c.label,
                      value: (c.value ?? c.id)?.toString() || "",
                    })),
                  ]}
                  placeholder={t("projects:form.contract_placeholder")}
                />
              )}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Controller
              name="start_date"
              control={control}
              render={({ field, fieldState }) => (
                <CommonDatePicker
                  label={t("projects:form.start_date")}
                  value={field.value || null}
                  onChange={field.onChange}
                  error={fieldState.error?.message}
                  required
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
                  label={t("projects:form.end_date")}
                  value={field.value || null}
                  onChange={field.onChange}
                  error={fieldState.error?.message}
                />
              )}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="p-value">{t("projects:form.value")}</Label>
            <Input
              id="p-value"
              type="number"
              inputMode="decimal"
              {...register("contract_value", { valueAsNumber: true })}
            />
            {errors.contract_value && (
              <p className="text-xs text-destructive">{errors.contract_value.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="p-status">{t("projects:form.status")}</Label>
            <Controller
              name="status"
              control={control}
              render={({ field }) => {
                const defaultStatusOptions = [
                  { value: "planning", label: t("common:status.planning") },
                  { value: "quoting", label: t("common:status.quoting") },
                  { value: "signed", label: t("common:status.signed") },
                  { value: "ongoing", label: t("common:status.ongoing") },
                  { value: "testing", label: t("common:status.testing") },
                  { value: "settled", label: t("common:status.settled") },
                  { value: "completed", label: t("common:status.completed") },
                ]

                const statusOptions =
                  statuses.length > 0
                    ? statuses
                        .filter(
                          (s, index, self) => index === self.findIndex((t) => t.value === s.value),
                        )
                        .map((s) => {
                          const val = s.value.toString()
                          const translatedLabel = t(`common:status.${val}`, {
                            defaultValue: s.label,
                          })
                          return { label: translatedLabel, value: val }
                        })
                    : defaultStatusOptions

                return (
                  <SearchableSelect
                    value={field.value || ""}
                    onValueChange={field.onChange}
                    options={statusOptions}
                    placeholder={t("projects:form.status_placeholder")}
                  />
                )
              }}
            />
          </div>

          {isEdit && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="p-progress">
                {t("projects:form.progress_percent", { defaultValue: "Tiến độ (%)" })}
              </Label>
              <Input
                id="p-progress"
                type="number"
                inputMode="decimal"
                {...register("progress_percent", { valueAsNumber: true })}
              />
              {errors.progress_percent && (
                <p className="text-xs text-destructive">{errors.progress_percent.message}</p>
              )}
            </div>
          )}

          <div className="col-span-2 flex flex-col gap-1.5">
            <Label htmlFor="p-desc">{t("projects:form.description")}</Label>
            <Textarea id="p-desc" rows={3} {...register("description")} />
            {errors.description && (
              <p className="text-xs text-destructive">{errors.description.message as string}</p>
            )}
          </div>
        </div>
      </form>
    </CommonDialog>
  )
}
