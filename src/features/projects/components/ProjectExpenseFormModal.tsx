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
import { optionApi, type OptionItem } from "@/shared/api/optionApi"
import { toast } from "sonner"

const expenseSchema = z.object({
  expense_type: z.string().min(1, "Vui lòng chọn phân loại chi phí"),
  amount: z.number({ message: "Vui lòng nhập số tiền hợp lệ" }).gt(0, "Số tiền phải lớn hơn 0"),
  expense_date: z.string().min(1, "Vui lòng chọn ngày chi"),
  description: z
    .string()
    .min(1, "Vui lòng nhập lý do / mô tả khoản chi")
    .max(1000, "Mô tả tối đa 1000 ký tự"),
})

interface ProjectExpenseFormModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (payload: any) => Promise<void>
}

export function ProjectExpenseFormModal({ open, onClose, onSubmit }: ProjectExpenseFormModalProps) {
  const [expenseTypes, setExpenseTypes] = useState<OptionItem[]>([])

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      expense_type: "",
      amount: 0,
      expense_date: "",
      description: "",
    },
  })

  useEffect(() => {
    if (open) {
      optionApi.getExpenseTypes().then(setExpenseTypes).catch(console.error)

      reset({
        expense_type: "",
        amount: 0,
        expense_date: new Date().toISOString().split("T")[0],
        description: "",
      })
    }
  }, [open, reset])

  const handleFormSubmit = async (data: any) => {
    try {
      const payload = {
        expense_type: data.expense_type,
        amount: data.amount,
        expense_date: data.expense_date,
        description: data.description,
      }
      await onSubmit(payload)
    } catch (error) {
      console.error(error)
      toast.error("Lỗi khi gửi yêu cầu chi phí")
    }
  }

  return (
    <CommonDialog
      open={open}
      onClose={onClose}
      title="Yêu cầu Chi phí dự án"
      size="lg"
      primaryAction={{
        label: isSubmitting ? "Đang gửi..." : "Gửi yêu cầu",
        type: "submit",
        form: "project-expense-form",
        disabled: isSubmitting,
      }}
      cancelAction={{
        label: "Hủy",
        disabled: isSubmitting,
        onClick: onClose,
      }}
    >
      <form
        id="project-expense-form"
        onSubmit={handleSubmit(handleFormSubmit)}
        className="grid gap-4 py-2"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Phân loại chi phí *</Label>
            <Controller
              name="expense_type"
              control={control}
              render={({ field }) => (
                <SearchableSelect
                  value={field.value}
                  onValueChange={field.onChange}
                  options={expenseTypes.map((t) => ({
                    label: t.label,
                    value: t.value?.toString() || t.id?.toString() || "",
                  }))}
                  placeholder="Chọn phân loại chi..."
                />
              )}
            />
            {errors.expense_type && (
              <p className="text-xs text-destructive">{errors.expense_type.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ex-amount">Số tiền (VNĐ) *</Label>
            <Input
              id="ex-amount"
              type="number"
              min="0"
              placeholder="Nhập số tiền..."
              {...register("amount", { valueAsNumber: true })}
            />
            {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Controller
              name="expense_date"
              control={control}
              render={({ field, fieldState }) => (
                <CommonDatePicker
                  label="Ngày chi *"
                  value={field.value || null}
                  onChange={field.onChange}
                  error={fieldState.error?.message}
                  required
                />
              )}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="ex-desc">Lý do chi / Mô tả chi tiết *</Label>
          <Textarea
            id="ex-desc"
            rows={3}
            placeholder="Mô tả cụ thể lý do chi và nội dung chi tiêu..."
            {...register("description")}
            className="resize-none"
          />
          {errors.description && (
            <p className="text-xs text-destructive">{errors.description.message}</p>
          )}
        </div>
      </form>
    </CommonDialog>
  )
}
