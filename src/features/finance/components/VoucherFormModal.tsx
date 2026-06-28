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
import { MultiSearchableSelect } from "@/components/common/MultiSearchableSelect"
import { optionApi, type OptionItem } from "@/shared/api/optionApi"
import type { Voucher, CreateVoucherPayload, UpdateVoucherPayload } from "../types/voucher"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"

const getVoucherSchema = (t: any) =>
  z
    .object({
      voucher_type: z.enum(["receipt", "payment"]),
      amount: z
        .number({ message: t("finance:form.validation.amount_invalid") })
        .gt(0, t("finance:form.validation.amount_gt0")),
      voucher_date: z.string().min(1, t("finance:form.validation.date_required")),
      description: z
        .string()
        .min(1, t("finance:form.validation.description_required"))
        .max(1000, t("finance:form.validation.description_max")),
      notes: z
        .string()
        .max(2000, t("finance:form.validation.notes_max"))
        .optional()
        .nullable()
        .or(z.literal("")),
      project_id: z.number().optional().nullable(),
      contract_id: z.number().optional().nullable(),
      customer_id: z.number().optional().nullable(),
      department_id: z.number().optional().nullable(),
      employee_ids: z.array(z.number()).optional(),
    })
    .refine(
      (data) => {
        return !!(data.project_id || data.contract_id || data.customer_id || data.department_id)
      },
      {
        message: t("finance:form.validation.linked_required"),
        path: ["project_id"], // Attach error message to project field primarily
      },
    )

interface VoucherFormModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (payload: CreateVoucherPayload | UpdateVoucherPayload) => Promise<void>
  editData?: Voucher | null
}

export function VoucherFormModal({ open, onClose, onSubmit, editData }: VoucherFormModalProps) {
  const { t } = useTranslation(["finance", "common"])
  const isEditing = !!editData

  const [projects, setProjects] = useState<OptionItem[]>([])
  const [contracts, setContracts] = useState<OptionItem[]>([])
  const [customers, setCustomers] = useState<OptionItem[]>([])
  const [departments, setDepartments] = useState<OptionItem[]>([])
  const [employees, setEmployees] = useState<OptionItem[]>([])
  const [voucherTypes, setVoucherTypes] = useState<OptionItem[]>([])

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(getVoucherSchema(t)),
    defaultValues: {
      voucher_type: "payment" as const,
      amount: 0,
      voucher_date: "",
      description: "",
      notes: "",
      project_id: null,
      contract_id: null,
      customer_id: null,
      department_id: null,
      employee_ids: [] as number[],
    },
  })

  useEffect(() => {
    if (open) {
      // Parallel loading of option lists
      Promise.all([
        optionApi.getProjects(),
        optionApi.getContracts(),
        optionApi.getCustomers(),
        optionApi.getDepartments(),
        optionApi.getEmployees(),
        optionApi.getVoucherTypes(),
      ])
        .then(([p, con, cus, d, emp, vt]) => {
          setProjects(p)
          setContracts(con)
          setCustomers(cus)
          setDepartments(d)
          setEmployees(emp)
          setVoucherTypes(vt)
        })
        .catch(console.error)

      if (editData) {
        reset({
          voucher_type: editData.voucher_type,
          amount: Number(editData.amount),
          voucher_date: editData.voucher_date,
          description: editData.description || "",
          notes: editData.notes || "",
          project_id: editData.project?.id || null,
          contract_id: editData.contract?.id || null,
          customer_id: editData.customer?.id || null,
          department_id: editData.department?.id || null,
          employee_ids: editData.employees?.map((e) => e.id) || [],
        })
      } else {
        reset({
          voucher_type: "payment",
          amount: 0,
          voucher_date: new Date().toISOString().split("T")[0],
          description: "",
          notes: "",
          project_id: null,
          contract_id: null,
          customer_id: null,
          department_id: null,
          employee_ids: [],
        })
      }
    }
  }, [open, editData, reset])

  const handleFormSubmit = async (data: z.infer<ReturnType<typeof getVoucherSchema>>) => {
    try {
      const payload: CreateVoucherPayload | UpdateVoucherPayload = {
        voucher_type: data.voucher_type,
        amount: data.amount,
        voucher_date: data.voucher_date,
        description: data.description,
        notes: data.notes || null,
        project_id: data.project_id || null,
        contract_id: data.contract_id || null,
        customer_id: data.customer_id || null,
        department_id: data.department_id || null,
      }
      if (data.voucher_type === "payment" && data.employee_ids && data.employee_ids.length > 0) {
        payload.employee_ids = data.employee_ids
      } else if (data.voucher_type === "payment") {
        payload.employee_ids = []
      }
      await onSubmit(payload)
    } catch (error) {
      console.error(error)
      toast.error(t("finance:form.validation.save_error"))
    }
  }

  return (
    <CommonDialog
      open={open}
      onClose={onClose}
      title={
        isEditing
          ? t("finance:form.title_edit", { code: editData.voucher_code })
          : t("finance:form.title_add")
      }
      size="full"
      primaryAction={{
        label: isSubmitting ? t("common:action.saving") : t("common:action.save"),
        type: "submit",
        form: "voucher-form",
        disabled: isSubmitting,
      }}
      cancelAction={{
        label: t("common:action.cancel"),
        disabled: isSubmitting,
        onClick: onClose,
      }}
    >
      <form
        id="voucher-form"
        onSubmit={(e) => void handleSubmit(handleFormSubmit)(e)}
        className="space-y-4 py-2"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>{t("finance:form.type")}</Label>
            <Controller
              name="voucher_type"
              control={control}
              render={({ field }) => (
                <SearchableSelect
                  value={field.value}
                  onValueChange={field.onChange}
                  options={voucherTypes.map((v) => ({
                    value: v.value.toString(),
                    label: v.label,
                  }))}
                  placeholder={t("finance:form.type_placeholder")}
                  disabled={isEditing}
                />
              )}
            />
            {errors.voucher_type && (
              <p className="text-xs text-destructive">{errors.voucher_type.message as string}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="v-amount">{t("finance:form.amount")}</Label>
            <Input
              id="v-amount"
              type="number"
              inputMode="decimal"
              min="0"
              placeholder={t("finance:form.amount_placeholder")}
              {...register("amount", { valueAsNumber: true })}
            />
            {errors.amount && (
              <p className="text-xs text-destructive">{errors.amount.message as string}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Controller
              name="voucher_date"
              control={control}
              render={({ field, fieldState }) => (
                <CommonDatePicker
                  label={t("finance:form.date")}
                  value={field.value || null}
                  onChange={field.onChange}
                  error={fieldState.error?.message}
                  required
                />
              )}
            />
          </div>

          <Controller
            name="voucher_type"
            control={control}
            render={({ field: { value: typeVal } }) =>
              typeVal === "payment" ? (
                <div className="flex flex-col gap-1.5">
                  <Label>{t("finance:form.employee")}</Label>
                  <Controller
                    name="employee_ids"
                    control={control}
                    render={({ field }) => (
                      <MultiSearchableSelect
                        values={field.value?.map(String) || []}
                        onValuesChange={(vals) => field.onChange(vals.map(Number))}
                        options={employees.map((e) => ({
                          label: e.label,
                          value: e.value?.toString() || e.id?.toString() || "",
                        }))}
                        placeholder={t("finance:form.employee_placeholder")}
                      />
                    )}
                  />
                  <p className="text-xs text-muted-foreground">{t("finance:form.employee_hint")}</p>
                </div>
              ) : (
                <div />
              )
            }
          />
        </div>

        <div className="rounded-xl border bg-muted/20 p-4 space-y-4">
          <h4 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">
            {t("finance:form.linked_title")}
          </h4>

          {errors.project_id && (
            <p className="text-xs text-destructive bg-destructive/10 p-2 rounded-lg">
              {errors.project_id.message as string}
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>{t("finance:form.project")}</Label>
              <Controller
                name="project_id"
                control={control}
                render={({ field }) => (
                  <SearchableSelect
                    value={field.value ? field.value.toString() : ""}
                    onValueChange={(val) => field.onChange(val ? parseInt(val) : null)}
                    options={[
                      { value: "", label: t("finance:form.no_link") },
                      ...projects.map((p) => ({
                        label: p.label,
                        value: p.value?.toString() || p.id?.toString() || "",
                      })),
                    ]}
                    placeholder={t("finance:form.project_placeholder")}
                  />
                )}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>{t("finance:form.contract")}</Label>
              <Controller
                name="contract_id"
                control={control}
                render={({ field }) => (
                  <SearchableSelect
                    value={field.value ? field.value.toString() : ""}
                    onValueChange={(val) => field.onChange(val ? parseInt(val) : null)}
                    options={[
                      { value: "", label: t("finance:form.no_link") },
                      ...contracts.map((c) => ({
                        label: c.label,
                        value: c.value?.toString() || c.id?.toString() || "",
                      })),
                    ]}
                    placeholder={t("finance:form.contract_placeholder")}
                  />
                )}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>{t("finance:form.customer")}</Label>
              <Controller
                name="customer_id"
                control={control}
                render={({ field }) => (
                  <SearchableSelect
                    value={field.value ? field.value.toString() : ""}
                    onValueChange={(val) => field.onChange(val ? parseInt(val) : null)}
                    options={[
                      { value: "", label: t("finance:form.no_link") },
                      ...customers.map((c) => ({
                        label: c.label,
                        value: c.value?.toString() || c.id?.toString() || "",
                      })),
                    ]}
                    placeholder={t("finance:form.customer_placeholder")}
                  />
                )}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>{t("finance:form.department")}</Label>
              <Controller
                name="department_id"
                control={control}
                render={({ field }) => (
                  <SearchableSelect
                    value={field.value ? field.value.toString() : ""}
                    onValueChange={(val) => field.onChange(val ? parseInt(val) : null)}
                    options={[
                      { value: "", label: t("finance:form.no_link") },
                      ...departments.map((d) => ({
                        label: d.label,
                        value: d.value?.toString() || d.id?.toString() || "",
                      })),
                    ]}
                    placeholder={t("finance:form.department_placeholder")}
                  />
                )}
              />
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="v-desc">{t("finance:form.description")}</Label>
          <Textarea
            id="v-desc"
            rows={2}
            placeholder={t("finance:form.description_placeholder")}
            {...register("description")}
            className="resize-none"
          />
          {errors.description && (
            <p className="text-xs text-destructive">{errors.description.message as string}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="v-notes">{t("finance:form.notes")}</Label>
          <Textarea
            id="v-notes"
            rows={2}
            placeholder={t("finance:form.notes_placeholder")}
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
