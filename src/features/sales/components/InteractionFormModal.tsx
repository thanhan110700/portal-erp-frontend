import { useEffect, useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { CommonDialog } from "@/components/common/CommonDialog"
import { CommonDatePicker } from "@/components/common/CommonDatePicker"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { SearchableSelect } from "@/components/common/SearchableSelect"
import type { CreateInteractionPayload } from "../types/sales"
import { optionApi, type OptionItem } from "@/shared/api/optionApi"
import { useAuthStore } from "@/hooks/useAuthStore"

interface InteractionFormModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (payload: CreateInteractionPayload) => Promise<void>
}

export function InteractionFormModal({ open, onClose, onSubmit }: InteractionFormModalProps) {
  const [types, setTypes] = useState<OptionItem[]>([])
  const user = useAuthStore((s) => s.user)

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CreateInteractionPayload>({
    defaultValues: {
      type: "Call",
      interaction_date: new Date().toISOString().split("T")[0],
      content: "",
      user_id: user?.id || 0,
    },
  })

  useEffect(() => {
    if (open) {
      optionApi.getInteractionTypes().then(setTypes).catch(console.error)
    }
  }, [open])

  return (
    <CommonDialog
      open={open}
      onClose={onClose}
      title="Thêm Lịch sử Tương tác"
      size="md"
      primaryAction={{
        label: "Lưu tương tác",
        type: "submit",
        form: "interaction-form",
        disabled: isSubmitting,
      }}
      cancelAction={{
        label: "Hủy",
        disabled: isSubmitting,
        onClick: onClose,
      }}
    >
      <form id="interaction-form" onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-2">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="i-type">Hình thức *</Label>
            <Controller
              name="type"
              control={control}
              rules={{ required: "Vui lòng chọn hình thức" }}
              render={({ field }) => (
                <SearchableSelect
                  value={field.value || ""}
                  onValueChange={field.onChange}
                  options={
                    types.length > 0
                      ? types.map((item) => ({
                          label: item.label,
                          value: item.value.toString(),
                        }))
                      : [
                          { label: "Gọi điện", value: "Call" },
                          { label: "Email", value: "Email" },
                          { label: "Gặp mặt", value: "Meeting" },
                          { label: "Zalo/Chat", value: "Zalo" },
                        ]
                  }
                  placeholder="Chọn..."
                />
              )}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Controller
              name="interaction_date"
              control={control}
              rules={{ required: "Vui lòng chọn ngày" }}
              render={({ field, fieldState }) => (
                <CommonDatePicker
                  label="Ngày thực hiện"
                  value={field.value || null}
                  onChange={field.onChange}
                  error={fieldState.error?.message}
                  required
                />
              )}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="i-content">Nội dung trao đổi *</Label>
          <Textarea
            id="i-content"
            rows={4}
            placeholder="Ghi chú chi tiết nội dung đã trao đổi với khách hàng..."
            {...register("content", { required: "Vui lòng nhập nội dung" })}
            aria-invalid={!!errors.content}
          />
          {errors.content && <p className="text-xs text-destructive">{errors.content.message}</p>}
        </div>
      </form>
    </CommonDialog>
  )
}
