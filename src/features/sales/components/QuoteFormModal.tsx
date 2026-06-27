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
import type { Quote, CreateQuotePayload } from "../types/sales"
import { optionApi, type OptionItem } from "@/shared/api/optionApi"
import { toast } from "sonner"

const quoteSchema = z.object({
  customer_id: z.number().min(1, "Vui lòng chọn khách hàng"),
  quote_date: z.string().min(1, "Vui lòng nhập ngày báo giá"),
  quote_value: z
    .number({ message: "Vui lòng nhập tổng giá trị" })
    .gt(0, "Giá trị báo giá phải lớn hơn 0"),
  description: z
    .string()
    .max(5000, "Mô tả không được quá 5000 ký tự")
    .optional()
    .nullable()
    .or(z.literal("")),
  notes: z
    .string()
    .max(2000, "Ghi chú không được quá 2000 ký tự")
    .optional()
    .nullable()
    .or(z.literal("")),
})

type QuoteFormData = z.infer<typeof quoteSchema>

interface QuoteFormModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (payload: CreateQuotePayload) => Promise<void>
  editData?: Quote | null
}

export function QuoteFormModal({ open, onClose, onSubmit, editData }: QuoteFormModalProps) {
  const isEditing = !!editData

  const [customers, setCustomers] = useState<OptionItem[]>([])

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<QuoteFormData>({
    resolver: zodResolver(quoteSchema),
    defaultValues: {
      customer_id: 0,
      quote_date: new Date().toISOString().split("T")[0],
      quote_value: 0,
      description: "",
      notes: "",
    },
  })

  useEffect(() => {
    if (open) {
      optionApi.getCustomers().then(setCustomers).catch(console.error)

      if (editData) {
        reset({
          customer_id: editData.customer?.id || 0,
          quote_date: editData.quote_date,
          quote_value: Number(editData.quote_value) || 0,
          description: editData.description || "",
          notes: editData.notes || "",
        })
      } else {
        reset({
          customer_id: 0,
          quote_date: new Date().toISOString().split("T")[0],
          quote_value: 0,
          description: "",
          notes: "",
        })
      }
    }
  }, [open, editData, reset])

  const handleFormSubmit = async (data: QuoteFormData) => {
    try {
      const payload: CreateQuotePayload = {
        customer_id: data.customer_id,
        quote_date: data.quote_date,
        quote_value: data.quote_value,
        description: data.description || null,
        notes: data.notes || null,
      }
      await onSubmit(payload)
    } catch (error) {
      console.error(error)
      toast.error("Đã xảy ra lỗi khi lưu báo giá")
    }
  }

  return (
    <CommonDialog
      open={open}
      onClose={onClose}
      title={isEditing ? `Cập nhật Báo giá — ${editData.quote_code}` : "Tạo Báo giá mới"}
      size="xl"
      primaryAction={{
        label: isSubmitting ? "Đang lưu..." : "Lưu Báo giá",
        type: "submit",
        form: "quote-form",
        disabled: isSubmitting,
      }}
      cancelAction={{
        label: "Hủy",
        disabled: isSubmitting,
        onClick: onClose,
      }}
    >
      <form id="quote-form" onSubmit={handleSubmit(handleFormSubmit)} className="grid gap-4 py-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="q-customer">Khách hàng *</Label>
          <Controller
            name="customer_id"
            control={control}
            render={({ field }) => (
              <SearchableSelect
                value={field.value ? field.value.toString() : ""}
                onValueChange={(val) => field.onChange(parseInt(val))}
                options={customers.map((item) => ({
                  label: item.label,
                  value: item.value?.toString() || item.id?.toString() || "",
                }))}
                placeholder="Chọn khách hàng..."
              />
            )}
          />
          {errors.customer_id && (
            <p className="text-xs text-destructive">{errors.customer_id.message}</p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Controller
              name="quote_date"
              control={control}
              render={({ field, fieldState }) => (
                <CommonDatePicker
                  label="Ngày báo giá"
                  value={field.value || null}
                  onChange={field.onChange}
                  error={fieldState.error?.message}
                  required
                />
              )}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="q-value">Tổng giá trị (VNĐ) *</Label>
            <Input
              id="q-value"
              type="number"
              min="0"
              {...register("quote_value", { valueAsNumber: true })}
              aria-invalid={!!errors.quote_value}
            />
            {errors.quote_value && (
              <p className="text-xs text-destructive">{errors.quote_value.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="q-description">Nội dung chi tiết</Label>
          <Textarea
            id="q-description"
            rows={3}
            placeholder="Ghi chú nội dung báo giá..."
            {...register("description")}
            className="resize-none"
            aria-invalid={!!errors.description}
          />
          {errors.description && (
            <p className="text-xs text-destructive">{errors.description.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="q-notes">Ghi chú nội bộ</Label>
          <Textarea
            id="q-notes"
            rows={2}
            placeholder="Ghi chú riêng biệt cho nội bộ..."
            {...register("notes")}
            className="resize-none"
            aria-invalid={!!errors.notes}
          />
          {errors.notes && <p className="text-xs text-destructive">{errors.notes.message}</p>}
        </div>
      </form>
    </CommonDialog>
  )
}
