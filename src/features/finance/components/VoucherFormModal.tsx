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
import type { Voucher, CreateVoucherPayload, UpdateVoucherPayload } from "../types/voucher"
import { toast } from "sonner"

const voucherSchema = z
  .object({
    voucher_type: z.enum(["receipt", "payment"]),
    amount: z.number({ message: "Vui lòng nhập số tiền hợp lệ" }).gt(0, "Số tiền phải lớn hơn 0"),
    voucher_date: z.string().min(1, "Vui lòng chọn ngày chứng từ"),
    description: z
      .string()
      .min(1, "Vui lòng nhập lý do / mô tả chứng từ")
      .max(1000, "Mô tả tối đa 1000 ký tự"),
    notes: z
      .string()
      .max(2000, "Ghi chú tối đa 2000 ký tự")
      .optional()
      .nullable()
      .or(z.literal("")),
    project_id: z.number().optional().nullable(),
    contract_id: z.number().optional().nullable(),
    customer_id: z.number().optional().nullable(),
    department_id: z.number().optional().nullable(),
  })
  .refine(
    (data) => {
      return !!(data.project_id || data.contract_id || data.customer_id || data.department_id)
    },
    {
      message:
        "Chứng từ phải liên kết với ít nhất một thông tin: Dự án, Hợp đồng, Khách hàng hoặc Phòng ban.",
      path: ["project_id"], // Attach error message to project field primarily
    },
  )

interface VoucherFormModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (payload: any) => Promise<void>
  editData?: Voucher | null
}

const VOUCHER_TYPE_OPTIONS = [
  { value: "receipt", label: "Thu tiền (Receipt)" },
  { value: "payment", label: "Chi tiền (Payment)" },
]

export function VoucherFormModal({ open, onClose, onSubmit, editData }: VoucherFormModalProps) {
  const isEditing = !!editData

  const [projects, setProjects] = useState<OptionItem[]>([])
  const [contracts, setContracts] = useState<OptionItem[]>([])
  const [customers, setCustomers] = useState<OptionItem[]>([])
  const [departments, setDepartments] = useState<OptionItem[]>([])

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(voucherSchema),
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
      ])
        .then(([p, con, cus, d]) => {
          setProjects(p)
          setContracts(con)
          setCustomers(cus)
          setDepartments(d)
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
        })
      }
    }
  }, [open, editData, reset])

  const handleFormSubmit = async (data: any) => {
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
      await onSubmit(payload)
    } catch (error) {
      console.error(error)
      toast.error("Lỗi khi lưu chứng từ")
    }
  }

  return (
    <CommonDialog
      open={open}
      onClose={onClose}
      title={isEditing ? `Cập nhật Chứng từ: ${editData.voucher_code}` : "Lập Chứng từ Thu/Chi mới"}
      size="xl"
      primaryAction={{
        label: isSubmitting ? "Đang lưu..." : "Lưu",
        type: "submit",
        form: "voucher-form",
        disabled: isSubmitting,
      }}
      cancelAction={{
        label: "Hủy",
        disabled: isSubmitting,
        onClick: onClose,
      }}
    >
      <form id="voucher-form" onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 py-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Loại chứng từ *</Label>
            <Controller
              name="voucher_type"
              control={control}
              render={({ field }) => (
                <SearchableSelect
                  value={field.value}
                  onValueChange={field.onChange}
                  options={VOUCHER_TYPE_OPTIONS}
                  placeholder="Chọn loại..."
                  disabled={isEditing}
                />
              )}
            />
            {errors.voucher_type && (
              <p className="text-xs text-destructive">{errors.voucher_type.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="v-amount">Số tiền (VNĐ) *</Label>
            <Input
              id="v-amount"
              type="number"
              min="0"
              placeholder="Nhập số tiền..."
              {...register("amount", { valueAsNumber: true })}
            />
            {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Controller
              name="voucher_date"
              control={control}
              render={({ field, fieldState }) => (
                <CommonDatePicker
                  label="Ngày chứng từ *"
                  value={field.value || null}
                  onChange={field.onChange}
                  error={fieldState.error?.message}
                  required
                />
              )}
            />
          </div>
        </div>

        <div className="rounded-xl border bg-muted/20 p-4 space-y-4">
          <h4 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">
            Liên kết Phân hệ (Chọn ít nhất một mục) *
          </h4>

          {errors.project_id && (
            <p className="text-xs text-destructive bg-destructive/10 p-2 rounded-lg">
              {errors.project_id.message}
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Dự án liên quan</Label>
              <Controller
                name="project_id"
                control={control}
                render={({ field }) => (
                  <SearchableSelect
                    value={field.value ? field.value.toString() : ""}
                    onValueChange={(val) => field.onChange(val ? parseInt(val) : null)}
                    options={[
                      { value: "", label: "— Không liên kết —" },
                      ...projects.map((p) => ({
                        label: p.label,
                        value: p.value?.toString() || p.id?.toString() || "",
                      })),
                    ]}
                    placeholder="Chọn dự án..."
                  />
                )}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Hợp đồng liên quan</Label>
              <Controller
                name="contract_id"
                control={control}
                render={({ field }) => (
                  <SearchableSelect
                    value={field.value ? field.value.toString() : ""}
                    onValueChange={(val) => field.onChange(val ? parseInt(val) : null)}
                    options={[
                      { value: "", label: "— Không liên kết —" },
                      ...contracts.map((c) => ({
                        label: c.label,
                        value: c.value?.toString() || c.id?.toString() || "",
                      })),
                    ]}
                    placeholder="Chọn hợp đồng..."
                  />
                )}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Khách hàng liên quan</Label>
              <Controller
                name="customer_id"
                control={control}
                render={({ field }) => (
                  <SearchableSelect
                    value={field.value ? field.value.toString() : ""}
                    onValueChange={(val) => field.onChange(val ? parseInt(val) : null)}
                    options={[
                      { value: "", label: "— Không liên kết —" },
                      ...customers.map((c) => ({
                        label: c.label,
                        value: c.value?.toString() || c.id?.toString() || "",
                      })),
                    ]}
                    placeholder="Chọn khách hàng..."
                  />
                )}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Phòng ban chịu phí / thụ hưởng</Label>
              <Controller
                name="department_id"
                control={control}
                render={({ field }) => (
                  <SearchableSelect
                    value={field.value ? field.value.toString() : ""}
                    onValueChange={(val) => field.onChange(val ? parseInt(val) : null)}
                    options={[
                      { value: "", label: "— Không liên kết —" },
                      ...departments.map((d) => ({
                        label: d.label,
                        value: d.value?.toString() || d.id?.toString() || "",
                      })),
                    ]}
                    placeholder="Chọn phòng ban..."
                  />
                )}
              />
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="v-desc">Nội dung diễn giải chứng từ *</Label>
          <Textarea
            id="v-desc"
            rows={2}
            placeholder="Mô tả cụ thể nội dung thu/chi..."
            {...register("description")}
            className="resize-none"
          />
          {errors.description && (
            <p className="text-xs text-destructive">{errors.description.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="v-notes">Ghi chú nội bộ</Label>
          <Textarea
            id="v-notes"
            rows={2}
            placeholder="Ghi chú thêm về phương thức thanh toán, tài khoản nhận..."
            {...register("notes")}
            className="resize-none"
          />
          {errors.notes && <p className="text-xs text-destructive">{errors.notes.message}</p>}
        </div>
      </form>
    </CommonDialog>
  )
}
