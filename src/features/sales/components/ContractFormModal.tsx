import { useEffect } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { CommonDialog } from "@/components/common/CommonDialog"
import { CommonDatePicker } from "@/components/common/CommonDatePicker"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { SearchableSelect } from "@/components/common/SearchableSelect"
import type { Contract, CreateContractPayload } from "../types/sales"
import type { OptionItem } from "@/shared/api/optionApi"
import { toast } from "sonner"

const contractSchema = z.object({
  customer_id: z.number().min(1, "Vui lòng chọn khách hàng"),
  quote_id: z.number().optional().nullable(),
  contract_date: z.string().min(1, "Vui lòng nhập ngày hợp đồng"),
  contract_value: z
    .number({ message: "Vui lòng nhập giá trị hợp đồng" })
    .gt(0, "Giá trị hợp đồng phải lớn hơn 0"),
  sales_rep_id: z.number().min(1, "Vui lòng chọn Sales phụ trách"),
  signed_date: z.string().optional().nullable().or(z.literal("")),
  status: z.string().min(1, "Vui lòng chọn trạng thái"),
  content: z
    .string()
    .max(10000, "Nội dung hợp đồng không được quá 10000 ký tự")
    .optional()
    .nullable()
    .or(z.literal("")),
  terms: z
    .string()
    .max(5000, "Điều khoản không được quá 5000 ký tự")
    .optional()
    .nullable()
    .or(z.literal("")),
})

type ContractFormData = z.infer<typeof contractSchema>

interface ContractFormModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (payload: CreateContractPayload) => Promise<void>
  editData?: Contract | null
  statuses?: OptionItem[]
  customers?: OptionItem[]
  salesReps?: OptionItem[]
  quotes?: OptionItem[]
}

export function ContractFormModal({
  open,
  onClose,
  onSubmit,
  editData,
  statuses = [],
  customers = [],
  salesReps = [],
  quotes = [],
}: ContractFormModalProps) {
  const isEditing = !!editData

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ContractFormData>({
    resolver: zodResolver(contractSchema),
    defaultValues: {
      customer_id: 0,
      quote_id: null,
      sales_rep_id: 0,
      contract_date: new Date().toISOString().split("T")[0],
      signed_date: "",
      contract_value: 0,
      status: "Draft",
      content: "",
      terms: "",
    },
  })

  const customerIdValue = watch("customer_id")

  useEffect(() => {
    if (open) {
      if (editData) {
        reset({
          customer_id: editData.customer?.id || 0,
          quote_id: editData.quote?.id || null,
          sales_rep_id: editData.sales_rep?.id || 0,
          contract_date: editData.contract_date || new Date().toISOString().split("T")[0],
          signed_date: editData.signed_date || "",
          contract_value:
            typeof editData.contract_value === "string"
              ? parseFloat(editData.contract_value)
              : editData.contract_value || 0,
          status: editData.status || "Draft",
          content: editData.content || "",
          terms: editData.terms || "",
        })
      } else {
        reset({
          customer_id: 0,
          quote_id: null,
          sales_rep_id: 0,
          contract_date: new Date().toISOString().split("T")[0],
          signed_date: "",
          contract_value: 0,
          status: "Draft",
          content: "",
          terms: "",
        })
      }
    }
  }, [open, editData, reset])

  const handleFormSubmit = async (data: ContractFormData) => {
    try {
      const payload: CreateContractPayload = {
        customer_id: data.customer_id,
        quote_id: data.quote_id || undefined,
        sales_rep_id: data.sales_rep_id,
        contract_date: data.contract_date,
        contract_value: data.contract_value,
        signed_date: data.signed_date || null,
        status: data.status,
        content: data.content || undefined,
        terms: data.terms || undefined,
      }
      await onSubmit(payload)
    } catch (error) {
      console.error(error)
      toast.error("Đã xảy ra lỗi khi lưu hợp đồng")
    }
  }

  // Filter quotes by selected customer
  const filteredQuotes = customerIdValue
    ? quotes.filter((q) => parseInt(q.customer_id as string) === customerIdValue)
    : quotes

  return (
    <CommonDialog
      open={open}
      onClose={onClose}
      title={isEditing ? `Cập nhật Hợp đồng — ${editData.contract_code}` : "Tạo Hợp đồng mới"}
      size="2xl"
      primaryAction={{
        label: isSubmitting ? "Đang lưu..." : "Lưu Hợp đồng",
        type: "submit",
        form: "contract-form",
        disabled: isSubmitting,
      }}
      cancelAction={{
        label: "Hủy",
        disabled: isSubmitting,
        onClick: onClose,
      }}
    >
      <form
        id="contract-form"
        onSubmit={handleSubmit(handleFormSubmit)}
        className="grid gap-4 py-2"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="c-customer">Khách hàng *</Label>
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

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="c-quote">Liên kết Báo giá (Tùy chọn)</Label>
            <Controller
              name="quote_id"
              control={control}
              render={({ field }) => (
                <SearchableSelect
                  value={field.value ? field.value.toString() : ""}
                  onValueChange={(val) => field.onChange(val && val !== "0" ? parseInt(val) : null)}
                  options={[
                    { label: "--- Không liên kết ---", value: "0" },
                    ...filteredQuotes.map((item) => ({
                      label: `${item.label}`,
                      value: item.value?.toString() || item.id?.toString() || "",
                    })),
                  ]}
                  placeholder="Chọn báo giá (nếu có)"
                />
              )}
            />
            {errors.quote_id && (
              <p className="text-xs text-destructive">{errors.quote_id.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="c-sales">Sales phụ trách *</Label>
            <Controller
              name="sales_rep_id"
              control={control}
              render={({ field }) => (
                <SearchableSelect
                  value={field.value ? field.value.toString() : ""}
                  onValueChange={(val) => field.onChange(parseInt(val))}
                  options={salesReps.map((item) => ({
                    label: item.label,
                    value: item.value?.toString() || item.id?.toString() || "",
                  }))}
                  placeholder="Chọn sales..."
                />
              )}
            />
            {errors.sales_rep_id && (
              <p className="text-xs text-destructive">{errors.sales_rep_id.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="c-status">Trạng thái *</Label>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <SearchableSelect
                  value={field.value || ""}
                  onValueChange={field.onChange}
                  options={
                    statuses.length > 0
                      ? statuses.map((item) => ({
                          label: item.label,
                          value: item.value.toString(),
                        }))
                      : [
                          { label: "Draft", value: "Draft" },
                          { label: "Signed", value: "Signed" },
                          { label: "Ongoing", value: "Ongoing" },
                          { label: "Completed", value: "Completed" },
                        ]
                  }
                  placeholder="Chọn trạng thái..."
                />
              )}
            />
            {errors.status && <p className="text-xs text-destructive">{errors.status.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1.5">
            <Controller
              name="contract_date"
              control={control}
              render={({ field, fieldState }) => (
                <CommonDatePicker
                  label="Ngày HĐ"
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
              name="signed_date"
              control={control}
              render={({ field, fieldState }) => (
                <CommonDatePicker
                  label="Ngày ký"
                  value={field.value || null}
                  onChange={field.onChange}
                  error={fieldState.error?.message}
                />
              )}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="c-value">Giá trị HĐ (VNĐ) *</Label>
            <Input
              id="c-value"
              type="number"
              min="0"
              {...register("contract_value", { valueAsNumber: true })}
              aria-invalid={!!errors.contract_value}
            />
            {errors.contract_value && (
              <p className="text-xs text-destructive">{errors.contract_value.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="c-content">Nội dung hợp đồng</Label>
          <Textarea
            id="c-content"
            rows={3}
            placeholder="Ghi chú nội dung chính..."
            {...register("content")}
            className="resize-none"
            aria-invalid={!!errors.content}
          />
          {errors.content && <p className="text-xs text-destructive">{errors.content.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="c-terms">Điều khoản đặc biệt</Label>
          <Textarea
            id="c-terms"
            rows={3}
            placeholder="Các điều khoản thanh toán, giao hàng bổ sung..."
            {...register("terms")}
            className="resize-none"
            aria-invalid={!!errors.terms}
          />
          {errors.terms && <p className="text-xs text-destructive">{errors.terms.message}</p>}
        </div>
      </form>
    </CommonDialog>
  )
}
