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

const customerSchema = z.object({
  customer_name: z
    .string()
    .min(1, "Vui lòng nhập tên khách hàng")
    .max(255, "Tên khách hàng không được quá 255 ký tự"),
  phone: z
    .string()
    .min(1, "Vui lòng nhập số điện thoại")
    .max(20, "Số điện thoại không được quá 20 ký tự"),
  email: z
    .string()
    .max(150, "Email không được quá 150 ký tự")
    .email("Email không hợp lệ")
    .optional()
    .nullable()
    .or(z.literal("")),
  address: z
    .string()
    .max(1000, "Địa chỉ không được quá 1000 ký tự")
    .optional()
    .nullable()
    .or(z.literal("")),
  tax_number: z
    .string()
    .max(50, "Mã số thuế không được quá 50 ký tự")
    .optional()
    .nullable()
    .or(z.literal("")),
  classification: z.string().optional().nullable().or(z.literal("")),
  sales_rep_id: z.number().min(1, "Vui lòng chọn nhân viên sales"),
  notes: z
    .string()
    .max(2000, "Ghi chú không được quá 2000 ký tự")
    .optional()
    .nullable()
    .or(z.literal("")),
})

type CustomerFormData = z.infer<typeof customerSchema>

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
    resolver: zodResolver(customerSchema),
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
          toast.error("Không thể tải thông tin chi tiết khách hàng")
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
      toast.error("Đã xảy ra lỗi khi lưu khách hàng")
    }
  }

  return (
    <CommonDialog
      open={open}
      onClose={onClose}
      title={
        isEditing
          ? `Cập nhật khách hàng — ${editData.customer_name ?? editData.name}`
          : "Thêm khách hàng mới"
      }
      size="xl"
      primaryAction={{
        label: isSubmitting ? "Đang lưu..." : "Lưu Khách hàng",
        type: "submit",
        form: "customer-form",
        disabled: isSubmitting || isLoadingDetail,
      }}
      cancelAction={{
        label: "Hủy",
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
              <Label htmlFor="cus-name">Tên khách hàng *</Label>
              <Input
                id="cus-name"
                placeholder="Công ty ABC"
                {...register("customer_name")}
                aria-invalid={!!errors.customer_name}
              />
              {errors.customer_name && (
                <p className="text-xs text-destructive">{errors.customer_name.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cus-phone">Số điện thoại *</Label>
              <Input
                id="cus-phone"
                placeholder="0987654321"
                {...register("phone")}
                aria-invalid={!!errors.phone}
              />
              {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cus-email">Email</Label>
              <Input
                id="cus-email"
                type="email"
                placeholder="email@example.com"
                {...register("email")}
                aria-invalid={!!errors.email}
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cus-tax">Mã số thuế</Label>
              <Input
                id="cus-tax"
                placeholder="0101234567"
                {...register("tax_number")}
                aria-invalid={!!errors.tax_number}
              />
              {errors.tax_number && (
                <p className="text-xs text-destructive">{errors.tax_number.message}</p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cus-address">Địa chỉ</Label>
            <Input
              id="cus-address"
              placeholder="123 Đường ABC, Phường X, Quận Y..."
              {...register("address")}
              aria-invalid={!!errors.address}
            />
            {errors.address && <p className="text-xs text-destructive">{errors.address.message}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cus-class" className="text-sm font-medium">
                Phân loại
              </Label>
              <SearchableSelect
                value={classificationValue || ""}
                onValueChange={(val) => setValue("classification", val || null)}
                options={classifications.map((item) => ({
                  label: item.label,
                  value: item.value?.toString() || item.id?.toString() || "",
                }))}
                placeholder="Chọn phân loại..."
              />
              {errors.classification && (
                <p className="text-xs text-destructive">{errors.classification.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cus-sales" className="text-sm font-medium">
                Sales phụ trách *
              </Label>
              <SearchableSelect
                value={salesRepValue ? salesRepValue.toString() : ""}
                onValueChange={(val) => setValue("sales_rep_id", val ? parseInt(val) : 0)}
                options={salesReps.map((item) => ({
                  label: item.label,
                  value: item.value?.toString() || item.id?.toString() || "",
                }))}
                placeholder="Chọn nhân viên sales..."
              />
              {errors.sales_rep_id && (
                <p className="text-xs text-destructive">{errors.sales_rep_id.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cus-notes">Ghi chú</Label>
            <Textarea
              id="cus-notes"
              rows={3}
              placeholder="Ghi chú thêm về khách hàng..."
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
