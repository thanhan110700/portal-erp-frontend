import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { CommonDialog } from "@/components/common/CommonDialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { SearchableSelect } from "@/components/common/SearchableSelect"
import type { Customer, CreateCustomerPayload } from "../types/sales"
import { customerApi } from "../api/customerApi"
import { type OptionItem } from "@/shared/api/optionApi"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"
import type { TFunction } from "i18next"

const createCustomerSchema = (t: TFunction) =>
  z.object({
    customer_name: z
      .string()
      .min(1, t("sales:customer_form.validation.name_required"))
      .max(255, t("sales:customer_form.validation.name_max")),
    phone: z
      .string()
      .min(1, t("sales:customer_form.validation.phone_required"))
      .max(20, t("sales:customer_form.validation.phone_max")),
    email: z
      .string()
      .max(150, t("sales:customer_form.validation.email_max"))
      .email(t("sales:customer_form.validation.email_invalid"))
      .optional()
      .nullable()
      .or(z.literal("")),
    address: z
      .string()
      .max(1000, t("sales:customer_form.validation.address_max"))
      .optional()
      .nullable()
      .or(z.literal("")),
    tax_number: z
      .string()
      .max(50, t("sales:customer_form.validation.tax_max"))
      .optional()
      .nullable()
      .or(z.literal("")),
    classification: z.string().optional().nullable().or(z.literal("")),
    sales_rep_id: z.number().min(1, t("sales:customer_form.validation.sales_required")),
    notes: z
      .string()
      .max(2000, t("sales:customer_form.validation.notes_max"))
      .optional()
      .nullable()
      .or(z.literal("")),
  })

type CustomerFormData = z.infer<ReturnType<typeof createCustomerSchema>>

interface CustomerFormModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (payload: CreateCustomerPayload) => Promise<void>
  editData?: Customer | null
  classifications: OptionItem[]
  salesReps: OptionItem[]
}

export function CustomerFormModal({
  open,
  onClose,
  onSubmit,
  editData,
  classifications,
  salesReps,
}: CustomerFormModalProps) {
  const { t } = useTranslation()
  const isEditing = !!editData
  const [isLoadingDetail, setIsLoadingDetail] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CustomerFormData>({
    resolver: zodResolver(createCustomerSchema(t)),
    defaultValues: {
      customer_name: "",
      phone: "",
      email: "",
      address: "",
      tax_number: "",
      classification: "",
      sales_rep_id: 0,
      notes: "",
    },
  })

  const classificationValue = watch("classification")
  const salesRepValue = watch("sales_rep_id")

  useEffect(() => {
    if (!open) return

    if (editData?.id) {
      setIsLoadingDetail(true)
      customerApi
        .get(editData.id)
        .then((detail) => {
          reset({
            customer_name: detail.customer_name ?? detail.name ?? "",
            phone: detail.phone || "",
            email: detail.email || "",
            address: detail.address || "",
            tax_number: detail.tax_number ?? detail.tax_code ?? "",
            classification: detail.classification || "",
            sales_rep_id: detail.sales_rep?.id ?? detail.sales_rep_id ?? 0,
            notes: detail.notes || "",
          })
        })
        .catch((err) => {
          console.error(err)
          toast.error(t("sales:customer_form.load_error"))
          onClose()
        })
        .finally(() => {
          setIsLoadingDetail(false)
        })
    } else {
      reset({
        customer_name: "",
        phone: "",
        email: "",
        address: "",
        tax_number: "",
        classification: "",
        sales_rep_id: 0,
        notes: "",
      })
    }
  }, [open, editData, reset, onClose])

  const handleFormSubmit = async (data: CustomerFormData) => {
    try {
      const payload: CreateCustomerPayload = {
        customer_name: data.customer_name,
        phone: data.phone,
        email: data.email || null,
        address: data.address || null,
        tax_number: data.tax_number || null,
        classification: data.classification || null,
        sales_rep_id: data.sales_rep_id,
        notes: data.notes || null,
      }
      await onSubmit(payload)
    } catch (error) {
      console.error(error)
      toast.error(t("sales:customer_form.save_error"))
    }
  }

  return (
    <CommonDialog
      open={open}
      onClose={onClose}
      title={
        isEditing
          ? t("sales:customer_form.edit_title", { name: editData.customer_name ?? editData.name })
          : t("sales:customer_form.add_title")
      }
      size="full"
      primaryAction={{
        label: isSubmitting ? t("sales:customer_form.saving") : t("sales:customer_form.save"),
        type: "submit",
        form: "customer-form",
        disabled: isSubmitting || isLoadingDetail,
      }}
      cancelAction={{
        label: t("common:actions.cancel"),
        disabled: isSubmitting || isLoadingDetail,
        onClick: onClose,
      }}
    >
      {isLoadingDetail ? (
        <div className="flex h-60 items-center justify-center">
          <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : (
        <form
          id="customer-form"
          onSubmit={handleSubmit(handleFormSubmit)}
          className="grid gap-4 py-2"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cus-name">{t("sales:customer_form.fields.name")} *</Label>
              <Input
                id="cus-name"
                placeholder={t("sales:customer_form.fields.name_placeholder")}
                {...register("customer_name")}
                aria-invalid={!!errors.customer_name}
              />
              {errors.customer_name && (
                <p className="text-xs text-destructive">{errors.customer_name.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cus-phone">{t("sales:customer_form.fields.phone")} *</Label>
              <Input
                id="cus-phone"
                placeholder={t("sales:customer_form.fields.phone_placeholder")}
                inputMode="tel"
                {...register("phone")}
                aria-invalid={!!errors.phone}
              />
              {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cus-email">{t("sales:customer_form.fields.email")}</Label>
              <Input
                id="cus-email"
                type="email"
                placeholder={t("sales:customer_form.fields.email_placeholder")}
                {...register("email")}
                aria-invalid={!!errors.email}
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cus-tax">{t("sales:customer_form.fields.tax")}</Label>
              <Input
                id="cus-tax"
                placeholder={t("sales:customer_form.fields.tax_placeholder")}
                {...register("tax_number")}
                aria-invalid={!!errors.tax_number}
              />
              {errors.tax_number && (
                <p className="text-xs text-destructive">{errors.tax_number.message}</p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cus-address">{t("sales:customer_form.fields.address")}</Label>
            <Input
              id="cus-address"
              placeholder={t("sales:customer_form.fields.address_placeholder")}
              {...register("address")}
              aria-invalid={!!errors.address}
            />
            {errors.address && <p className="text-xs text-destructive">{errors.address.message}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cus-class" className="text-sm font-medium">
                {t("sales:customer_form.fields.classification")}
              </Label>
              <SearchableSelect
                value={classificationValue || ""}
                onValueChange={(val) => setValue("classification", val || null)}
                options={classifications.map((item) => ({
                  label: item.label,
                  value: item.value?.toString() || item.id?.toString() || "",
                }))}
                placeholder={t("sales:customer_form.fields.classification_placeholder")}
              />
              {errors.classification && (
                <p className="text-xs text-destructive">{errors.classification.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cus-sales" className="text-sm font-medium">
                {t("sales:customer_form.fields.sales_rep")} *
              </Label>
              <SearchableSelect
                value={salesRepValue ? salesRepValue.toString() : ""}
                onValueChange={(val) => setValue("sales_rep_id", val ? parseInt(val) : 0)}
                options={salesReps.map((item) => ({
                  label: item.label,
                  value: item.value?.toString() || item.id?.toString() || "",
                }))}
                placeholder={t("sales:customer_form.fields.sales_rep_placeholder")}
              />
              {errors.sales_rep_id && (
                <p className="text-xs text-destructive">{errors.sales_rep_id.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cus-notes">{t("sales:customer_form.fields.notes")}</Label>
            <Textarea
              id="cus-notes"
              rows={3}
              placeholder={t("sales:customer_form.fields.notes_placeholder")}
              {...register("notes")}
              className="resize-none"
              aria-invalid={!!errors.notes}
            />
            {errors.notes && <p className="text-xs text-destructive">{errors.notes.message}</p>}
          </div>
        </form>
      )}
    </CommonDialog>
  )
}
