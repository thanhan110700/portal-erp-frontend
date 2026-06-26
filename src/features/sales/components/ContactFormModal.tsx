import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { CommonDialog } from "@/components/common/CommonDialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import type { Contact, CreateContactPayload, UpdateContactPayload } from "../types/sales"

interface ContactFormModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (payload: CreateContactPayload | UpdateContactPayload) => Promise<void>
  initialData?: Contact | null
}

export function ContactFormModal({ open, onClose, onSubmit, initialData }: ContactFormModalProps) {
  const isEditing = !!initialData
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateContactPayload | UpdateContactPayload>({
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

  return (
    <CommonDialog
      open={open}
      onClose={onClose}
      title={isEditing ? "Cập nhật Người Liên Hệ" : "Thêm Người Liên Hệ"}
      size="md"
      primaryAction={{
        label: isEditing ? "Cập nhật" : "Lưu liên hệ",
        type: "submit",
        form: "contact-form",
        disabled: isSubmitting,
      }}
      cancelAction={{
        label: "Hủy",
        disabled: isSubmitting,
        onClick: onClose,
      }}
    >
      <form id="contact-form" onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ct-name">Họ và tên *</Label>
          <Input
            id="ct-name"
            {...register("contact_name", { required: "Vui lòng nhập tên" })}
            aria-invalid={!!errors.contact_name}
          />
          {errors.contact_name && (
            <p className="text-xs text-destructive">{errors.contact_name.message as string}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ct-position">Chức vụ</Label>
          <Input id="ct-position" {...register("position")} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ct-phone">Số điện thoại *</Label>
            <Input
              id="ct-phone"
              {...register("phone", { required: "Vui lòng nhập SĐT" })}
              aria-invalid={!!errors.phone}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ct-email">Email</Label>
            <Input id="ct-email" type="email" {...register("email")} />
          </div>
        </div>

        <div className="flex items-center space-x-2 mt-2">
          <Checkbox
            id="ct-primary"
            checked={isPrimary}
            onCheckedChange={(checked) => setValue("is_primary", checked as boolean)}
          />
          <Label htmlFor="ct-primary" className="font-normal cursor-pointer">
            Đây là người liên hệ chính
          </Label>
        </div>
      </form>
    </CommonDialog>
  )
}
