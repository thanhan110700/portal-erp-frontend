import { useEffect, useState } from "react"
import { useForm, Controller } from "react-hook-form"
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
  } = useForm<CreateProjectPayload>({
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
            customer_id: data.customer_id,
            contract_id: data.contract_id || undefined,
            start_date: data.start_date || "",
            end_date: data.end_date || "",
            contract_value:
              typeof data.contract_value === "string"
                ? parseFloat(data.contract_value)
                : data.contract_value || 0,
            status: data.status || "planning",
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
      })
    }
  }, [open, isEdit, editingId, reset])

  const onSubmit = async (data: CreateProjectPayload) => {
    try {
      if (isEdit && editingId) {
        await projectApi.update(editingId, data as UpdateProjectPayload)
        toast.success(t("projects:form.update_success"))
      } else {
        await projectApi.create(data)
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
            <Input
              id="p-name"
              {...register("project_name", {
                required: t("projects:form.validation.name_required"),
              })}
              aria-invalid={!!errors.project_name}
            />
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
              rules={{ required: t("projects:form.validation.date_required") }}
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
              {...register("contract_value", {
                valueAsNumber: true,
                required: t("projects:form.validation.value_required"),
              })}
            />
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
                  { value: "on_hold", label: t("common:status.on_hold") },
                  { value: "cancelled", label: t("common:status.cancelled") },
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

          <div className="col-span-2 flex flex-col gap-1.5">
            <Label htmlFor="p-desc">{t("projects:form.description")}</Label>
            <Textarea id="p-desc" rows={3} {...register("description")} />
          </div>
        </div>
      </form>
    </CommonDialog>
  )
}
