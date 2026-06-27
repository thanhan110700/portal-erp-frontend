import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { CommonDialog } from "@/components/common/CommonDialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import type { Contact, CreateContactPayload, UpdateContactPayload } from "../types/sales"
import { useTranslation } from "react-i18next"
import type { TFunction } from "i18next"

const createContactSchema = (t: TFunction) =>
  z.object({
    contact_name: z
      .string()
      .min(1, t("sales:contact.validation.name_required"))
      .max(255, t("sales:contact.validation.name_max")),
    position: z
      .string()
      .max(100, t("sales:contact.validation.position_max"))
      .optional()
      .nullable()
      .or(z.literal("")),
    phone: z
      .string()
      .max(20, t("sales:contact.validation.phone_max"))
      .optional()
      .nullable()
      .or(z.literal("")),
    email: z
      .string()
      .max(150, t("sales:customer_form.validation.email_max"))
      .email(t("sales:customer_form.validation.email_invalid"))
      .optional()
      .nullable()
      .or(z.literal("")),
    is_primary: z.boolean(),
  })

type ContactFormData = z.infer<ReturnType<typeof createContactSchema>>

interface ContactFormModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (payload: CreateContactPayload | UpdateContactPayload) => Promise<void>
  initialData?: Contact | null
}

export function ContactFormModal({ open, onClose, onSubmit, initialData }: ContactFormModalProps) {
  const { t } = useTranslation()
  const isEditing = !!initialData
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormData>({
    resolver: zodResolver(createContactSchema(t)),
    defaultValues: {
      contact_name: "",
      position: "",
      phone: "",
      email: "",
      is_primary: false,
    },
  })

  useEffect(() => {
    if (open) {
      if (initialData) {
        reset({
          contact_name: initialData.contact_name,
          position: initialData.position || "",
          phone: initialData.phone || "",
          email: initialData.email || "",
          is_primary: initialData.is_primary,
        })
      } else {
        reset({
          contact_name: "",
          position: "",
          phone: "",
          email: "",
          is_primary: false,
        })
      }
    }
  }, [open, initialData, reset])

  const isPrimary = watch("is_primary")

  const handleFormSubmit = async (data: ContactFormData) => {
    try {
      const payload: CreateContactPayload = {
        contact_name: data.contact_name,
        position: data.position || undefined,
        phone: data.phone || undefined,
        email: data.email || undefined,
        is_primary: data.is_primary,
      }
      await onSubmit(payload)
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <CommonDialog
      open={open}
      onClose={onClose}
      title={isEditing ? t("sales:contact.edit_title") : t("sales:contact.add_title")}
      size="md"
      primaryAction={{
        label: isEditing ? t("sales:contact.update") : t("sales:contact.save"),
        type: "submit",
        form: "contact-form",
        disabled: isSubmitting,
      }}
      cancelAction={{
        label: t("common:actions.cancel"),
        disabled: isSubmitting,
        onClick: onClose,
      }}
    >
      <form id="contact-form" onSubmit={handleSubmit(handleFormSubmit)} className="grid gap-4 py-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ct-name">{t("sales:contact.columns.name")} *</Label>
          <Input id="ct-name" {...register("contact_name")} aria-invalid={!!errors.contact_name} />
          {errors.contact_name && (
            <p className="text-xs text-destructive">{errors.contact_name.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ct-position">{t("sales:contact.columns.position")}</Label>
          <Input id="ct-position" {...register("position")} aria-invalid={!!errors.position} />
          {errors.position && <p className="text-xs text-destructive">{errors.position.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ct-phone">{t("sales:contact.columns.phone")}</Label>
            <Input
              id="ct-phone"
              inputMode="tel"
              {...register("phone")}
              aria-invalid={!!errors.phone}
            />
            {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ct-email">{t("sales:contact.columns.email")}</Label>
            <Input
              id="ct-email"
              type="email"
              {...register("email")}
              aria-invalid={!!errors.email}
            />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>
        </div>

        <div className="flex items-center space-x-2 mt-2">
          <Checkbox
            id="ct-primary"
            checked={isPrimary}
            onCheckedChange={(checked) => setValue("is_primary", checked as boolean)}
          />
          <Label htmlFor="ct-primary" className="font-normal cursor-pointer">
            {t("sales:contact.is_primary_label")}
          </Label>
        </div>
      </form>
    </CommonDialog>
  )
}
