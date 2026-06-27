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
import type { ProjectMilestone } from "../types/project"
import { toast } from "sonner"

const milestoneSchema = z.object({
  milestone_name: z
    .string()
    .min(1, "Vui lòng nhập tên cột mốc")
    .max(255, "Tên cột mốc tối đa 255 ký tự"),
  milestone_date: z.string().min(1, "Vui lòng chọn ngày đến hạn"),
  status: z.enum(["planned", "in_progress", "completed", "delayed"]).default("planned"),
  notes: z.string().max(1000, "Ghi chú tối đa 1000 ký tự").optional().nullable().or(z.literal("")),
})

interface ProjectMilestoneFormModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (payload: any) => Promise<void>
  editData?: ProjectMilestone | null
}

const STATUS_OPTIONS = [
  { value: "planned", label: "Lên kế hoạch" },
  { value: "in_progress", label: "Đang thực hiện" },
  { value: "completed", label: "Hoàn thành" },
  { value: "delayed", label: "Bị trễ" },
]

export function ProjectMilestoneFormModal({
  open,
  onClose,
  onSubmit,
  editData,
}: ProjectMilestoneFormModalProps) {
  const isEditing = !!editData

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(milestoneSchema),
    defaultValues: {
      milestone_name: "",
      milestone_date: "",
      status: "planned" as const,
      notes: "",
    },
  })

  useEffect(() => {
    if (open) {
      if (editData) {
        reset({
          milestone_name: editData.milestone_name,
          milestone_date: editData.milestone_date,
          status: (editData.status as any) || "planned",
          notes: editData.notes || "",
        })
      } else {
        reset({
          milestone_name: "",
          milestone_date: new Date().toISOString().split("T")[0],
          status: "planned",
          notes: "",
        })
      }
    }
  }, [open, editData, reset])

  const handleFormSubmit = async (data: any) => {
    try {
      const payload = {
        milestone_name: data.milestone_name,
        milestone_date: data.milestone_date,
        status: data.status,
        notes: data.notes || null,
      }
      await onSubmit(payload)
    } catch (error) {
      console.error(error)
      toast.error("Lỗi khi lưu cột mốc")
    }
  }

  return (
    <CommonDialog
      open={open}
      onClose={onClose}
      title={isEditing ? "Cập nhật Cột mốc" : "Thêm Cột mốc mới"}
      size="lg"
      primaryAction={{
        label: isSubmitting ? "Đang lưu..." : "Lưu",
        type: "submit",
        form: "project-milestone-form",
        disabled: isSubmitting,
      }}
      cancelAction={{
        label: "Hủy",
        disabled: isSubmitting,
        onClick: onClose,
      }}
    >
      <form
        id="project-milestone-form"
        onSubmit={handleSubmit(handleFormSubmit)}
        className="grid gap-4 py-2"
      >
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ms-name">Tên cột mốc *</Label>
          <Input
            id="ms-name"
            placeholder="Ví dụ: Bàn giao thiết kế, Handoff UAT..."
            {...register("milestone_name")}
          />
          {errors.milestone_name && (
            <p className="text-xs text-destructive">{errors.milestone_name.message}</p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Controller
              name="milestone_date"
              control={control}
              render={({ field, fieldState }) => (
                <CommonDatePicker
                  label="Ngày đến hạn *"
                  value={field.value || null}
                  onChange={field.onChange}
                  error={fieldState.error?.message}
                  required
                />
              )}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Trạng thái *</Label>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <SearchableSelect
                  value={field.value}
                  onValueChange={field.onChange}
                  options={STATUS_OPTIONS}
                  placeholder="Chọn trạng thái..."
                />
              )}
            />
            {errors.status && <p className="text-xs text-destructive">{errors.status.message}</p>}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="ms-notes">Ghi chú / Mô tả tiêu chí</Label>
          <Textarea
            id="ms-notes"
            rows={3}
            placeholder="Ghi chú chi tiết công việc hoặc tiêu chí nghiệm thu của cột mốc..."
            {...register("notes")}
            className="resize-none"
          />
          {errors.notes && <p className="text-xs text-destructive">{errors.notes.message}</p>}
        </div>
      </form>
    </CommonDialog>
  )
}
