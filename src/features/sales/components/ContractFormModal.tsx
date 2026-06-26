import { useEffect } from "react"
import { useForm, Controller } from "react-hook-form"
import { CommonDialog } from "@/components/common/CommonDialog"
import { CommonDatePicker } from "@/components/common/CommonDatePicker"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { SearchableSelect } from "@/components/common/SearchableSelect"
import type { Contract, CreateContractPayload } from "../types/sales"
import type { OptionItem } from "@/shared/api/optionApi"
import { toast } from "sonner"

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
  } = useForm<CreateContractPayload>({
    defaultValues: {
      customer_id: 0,
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
          quote_id: editData.quote?.id || undefined,
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
          quote_id: undefined,
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

  const handleFormSubmit = async (data: CreateContractPayload) => {
    try {
      const payload = { ...data, signed_date: data.signed_date || null }
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
              rules={{
                required: "Vui lòng chọn khách hàng",
                min: { value: 1, message: "Vui lòng chọn khách hàng" },
              }}
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
                  onValueChange={(val) => field.onChange(parseInt(val))}
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
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="c-sales">Sales phụ trách *</Label>
            <Controller
              name="sales_rep_id"
              control={control}
              rules={{
                required: "Vui lòng chọn Sales",
                min: { value: 1, message: "Vui lòng chọn Sales" },
              }}
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
            <Label htmlFor="c-status">Trạng thái</Label>
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
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1.5">
            <Controller
              name="contract_date"
              control={control}
              rules={{ required: "Vui lòng nhập ngày HĐ" }}
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
              {...register("contract_value", {
                required: "Vui lòng nhập giá trị hợp đồng",
                valueAsNumber: true,
                min: { value: 0, message: "Giá trị không hợp lệ" },
              })}
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
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="c-terms">Điều khoản đặc biệt</Label>
          <Textarea
            id="c-terms"
            rows={3}
            placeholder="Các điều khoản thanh toán, giao hàng bổ sung..."
            {...register("terms")}
            className="resize-none"
          />
        </div>
      </form>
    </CommonDialog>
  )
}
