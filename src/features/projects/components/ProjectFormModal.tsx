import { useEffect, useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { toast } from "sonner"
import { CommonDialog } from "@/components/common/CommonDialog"
import { CommonDatePicker } from "@/components/common/CommonDatePicker"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { SearchableSelect } from "@/components/common/SearchableSelect"
import { projectApi } from "../api/projectApi"
import { optionApi, type OptionItem } from "@/shared/api/optionApi"
import type { CreateProjectPayload, UpdateProjectPayload } from "../types/project"

interface ProjectFormModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  editingId?: number | null
}

export function ProjectFormModal({ open, onClose, onSuccess, editingId }: ProjectFormModalProps) {
  const isEdit = !!editingId

  const [customers, setCustomers] = useState<OptionItem[]>([])
  const [contracts, setContracts] = useState<OptionItem[]>([])
  const [statuses, setStatuses] = useState<OptionItem[]>([])

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateProjectPayload>({
    defaultValues: {
      project_name: "",
      status: "planning",
    },
  })

  useEffect(() => {
    if (open) {
      Promise.all([
        optionApi.getCustomers(),
        optionApi.getContracts(),
        optionApi.getProjectStatuses(),
      ])
        .then(([cus, ctr, stat]) => {
          setCustomers(cus)
          setContracts(ctr)
          setStatuses(stat)
        })
        .catch(console.error)
    }
  }, [open])

  useEffect(() => {
    if (open && isEdit && editingId) {
      projectApi
        .get(editingId)
        .then((data) => {
          reset({
            project_name: data.project_name,
            customer_id: data.customer_id,
            contract_id: data.contract_id || undefined,
            start_date: data.start_date || "",
            end_date: data.end_date || "",
            contract_value:
              typeof data.contract_value === "string"
                ? parseFloat(data.contract_value)
                : data.contract_value || 0,
            status: data.status || "planning",
            description: data.description || "",
          })
        })
        .catch(() => toast.error("Không thể tải thông tin dự án"))
    } else if (open && !isEdit) {
      reset({
        project_name: "",
        customer_id: undefined,
        contract_id: undefined,
        contract_value: 0,
        start_date: new Date().toISOString().split("T")[0],
        end_date: "",
        status: "planning",
        description: "",
      })
    }
  }, [open, isEdit, editingId, reset])

  const onSubmit = async (data: CreateProjectPayload) => {
    try {
      if (isEdit && editingId) {
        await projectApi.update(editingId, data as UpdateProjectPayload)
        toast.success("Cập nhật dự án thành công")
      } else {
        await projectApi.create(data)
        toast.success("Tạo dự án thành công")
      }
      onSuccess()
      onClose()
    } catch {
      toast.error(isEdit ? "Lỗi khi cập nhật" : "Lỗi khi tạo mới")
    }
  }

  return (
    <CommonDialog
      open={open}
      onClose={onClose}
      title={isEdit ? "Cập nhật Dự án" : "Tạo Dự án mới"}
      size="2xl"
      primaryAction={{
        label: isSubmitting ? "Đang lưu..." : isEdit ? "Cập nhật" : "Tạo dự án",
        type: "submit",
        form: "project-form",
        disabled: isSubmitting,
      }}
      cancelAction={{
        label: "Hủy",
        disabled: isSubmitting,
        onClick: onClose,
      }}
    >
      <form id="project-form" onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 flex flex-col gap-1.5">
            <Label htmlFor="p-name">Tên dự án *</Label>
            <Input
              id="p-name"
              {...register("project_name", { required: "Vui lòng nhập tên" })}
              aria-invalid={!!errors.project_name}
            />
            {errors.project_name && (
              <p className="text-xs text-destructive">{errors.project_name.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="p-customer">Khách hàng</Label>
            <Controller
              name="customer_id"
              control={control}
              render={({ field }) => (
                <SearchableSelect
                  value={field.value != null ? field.value.toString() : ""}
                  onValueChange={(val) => field.onChange(parseInt(val))}
                  options={customers.map((c) => ({
                    label: c.label,
                    value: (c.value ?? c.id)?.toString() || "",
                  }))}
                  placeholder="Chọn khách hàng"
                />
              )}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="p-contract">Hợp đồng (Tùy chọn)</Label>
            <Controller
              name="contract_id"
              control={control}
              render={({ field }) => (
                <SearchableSelect
                  value={field.value != null ? field.value.toString() : ""}
                  onValueChange={(val) => field.onChange(parseInt(val))}
                  options={[
                    { label: "--- Không liên kết ---", value: "0" },
                    ...contracts.map((c) => ({
                      label: c.label,
                      value: (c.value ?? c.id)?.toString() || "",
                    })),
                  ]}
                  placeholder="Chọn hợp đồng"
                />
              )}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Controller
              name="start_date"
              control={control}
              rules={{ required: "Vui lòng chọn ngày" }}
              render={({ field, fieldState }) => (
                <CommonDatePicker
                  label="Ngày bắt đầu"
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
              name="end_date"
              control={control}
              render={({ field, fieldState }) => (
                <CommonDatePicker
                  label="Ngày kết thúc (dự kiến)"
                  value={field.value || null}
                  onChange={field.onChange}
                  error={fieldState.error?.message}
                />
              )}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="p-value">Giá trị hợp đồng (VNĐ) *</Label>
            <Input
              id="p-value"
              type="number"
              {...register("contract_value", {
                valueAsNumber: true,
                required: "Vui lòng nhập giá trị",
              })}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="p-status">Trạng thái</Label>
            <Controller
              name="status"
              control={control}
              render={({ field }) => {
                const defaultStatusOptions = [
                  { value: "planning", label: "Kế hoạch (Planning)" },
                  { value: "quoting", label: "Báo giá (Quoting)" },
                  { value: "signed", label: "Đã ký (Signed)" },
                  { value: "ongoing", label: "Đang thực hiện (Ongoing)" },
                  { value: "testing", label: "Thử nghiệm (Testing)" },
                  { value: "settled", label: "Quyết toán (Settled)" },
                  { value: "completed", label: "Hoàn thành (Completed)" },
                ]

                const statusOptions =
                  statuses.length > 0
                    ? statuses
                        .filter(
                          (s, index, self) => index === self.findIndex((t) => t.value === s.value),
                        )
                        .map((s) => {
                          const val = s.value.toString()
                          let label = s.label
                          if (val === "planning") label = "Kế hoạch (Planning)"
                          else if (val === "quoting") label = "Báo giá (Quoting)"
                          else if (val === "signed") label = "Đã ký (Signed)"
                          else if (val === "ongoing") label = "Đang thực hiện (Ongoing)"
                          else if (val === "testing") label = "Thử nghiệm (Testing)"
                          else if (val === "settled") label = "Quyết toán (Settled)"
                          else if (val === "completed") label = "Hoàn thành (Completed)"
                          return { label, value: val }
                        })
                    : defaultStatusOptions

                return (
                  <SearchableSelect
                    value={field.value || ""}
                    onValueChange={field.onChange}
                    options={statusOptions}
                    placeholder="Chọn..."
                  />
                )
              }}
            />
          </div>

          <div className="col-span-2 flex flex-col gap-1.5">
            <Label htmlFor="p-desc">Mô tả dự án</Label>
            <Textarea id="p-desc" rows={3} {...register("description")} />
          </div>
        </div>
      </form>
    </CommonDialog>
  )
}
