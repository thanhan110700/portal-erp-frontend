import { useEffect, useState, useMemo, useCallback } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { MantineReactTable, useMantineReactTable, type MRT_ColumnDef } from "mantine-react-table"
import { Trash2, Download, FileText, Upload, Calendar, User, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { SearchableSelect } from "@/components/common/SearchableSelect"
import { FileUploadField } from "@/components/common/FileUploadField"
import { optionApi, type OptionItem } from "@/shared/api/optionApi"
import { projectApi } from "../api/projectApi"
import type { ProjectFile } from "../types/project"
import { toast } from "sonner"
import { useAuthStore } from "@/hooks/useAuthStore"
import dayjs from "dayjs"

interface ProjectFilesTabProps {
  projectId: number
  files: ProjectFile[]
  onRefresh: () => void
  canEdit: boolean
  isAdmin: boolean
}

const uploadSchema = z.object({
  file: z.any().refine((val) => val instanceof File, "Vui lòng chọn tệp tin"),
  file_category: z.string().min(1, "Vui lòng chọn phân loại tài liệu"),
  notes: z.string().max(500, "Ghi chú tối đa 500 ký tự").optional().nullable().or(z.literal("")),
})

type UploadFormData = z.infer<typeof uploadSchema>

export function ProjectFilesTab({
  projectId,
  files,
  onRefresh,
  canEdit,
  isAdmin,
}: ProjectFilesTabProps) {
  const currentUserId = useAuthStore((s) => s.user?.id)
  const [categories, setCategories] = useState<OptionItem[]>([])
  const [showUploadForm, setShowUploadForm] = useState(false)

  const {
    handleSubmit,
    control,
    register,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UploadFormData>({
    resolver: zodResolver(uploadSchema),
    defaultValues: {
      file: null,
      file_category: "",
      notes: "",
    },
  })

  useEffect(() => {
    optionApi.getFileCategories().then(setCategories).catch(console.error)
  }, [])

  const handleUploadSubmit = async (data: UploadFormData) => {
    try {
      await projectApi.uploadFile(projectId, data.file, data.file_category, data.notes || undefined)
      toast.success("Tải tệp lên thành công")
      reset({
        file: null,
        file_category: "",
        notes: "",
      })
      setShowUploadForm(false)
      onRefresh()
    } catch {
      toast.error("Tải tệp lên thất bại")
    }
  }

  const handleDelete = useCallback(
    async (fileId: number) => {
      if (!window.confirm("Bạn có chắc chắn muốn xóa tệp này?")) return
      try {
        await projectApi.deleteFile(projectId, fileId)
        toast.success("Đã xóa tệp")
        onRefresh()
      } catch {
        toast.error("Xóa tệp thất bại")
      }
    },
    [projectId, onRefresh],
  )

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const columns = useMemo<MRT_ColumnDef<ProjectFile>[]>(
    () => [
      {
        accessorKey: "original_name",
        header: "Tên tài liệu",
        size: 250,
        Cell: ({ row }) => {
          const file = row.original
          return (
            <a
              href={file.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-primary hover:underline max-w-xs truncate md:max-w-sm font-medium"
            >
              <FileText className="size-4 shrink-0" />
              <span className="truncate">{file.original_name}</span>
            </a>
          )
        },
      },
      {
        id: "category",
        header: "Phân loại",
        size: 150,
        Cell: ({ row }) => {
          const file = row.original
          return (
            <span className="capitalize">{file.pivot?.file_category || file.category || "—"}</span>
          )
        },
      },
      {
        id: "notes",
        header: "Ghi chú",
        size: 200,
        Cell: ({ row }) => {
          const file = row.original
          return (
            <span className="text-muted-foreground truncate block max-w-xs">
              {file.pivot?.notes || "—"}
            </span>
          )
        },
      },
      {
        accessorKey: "file_size",
        header: "Dung lượng",
        size: 130,
        Cell: ({ cell }) => (
          <div className="text-right font-mono text-muted-foreground whitespace-nowrap">
            {formatFileSize(cell.getValue<number>())}
          </div>
        ),
      },
      {
        id: "uploaded_at",
        header: "Ngày tải",
        size: 180,
        Cell: ({ row }) => {
          const file = row.original
          return (
            <div className="text-muted-foreground text-xs space-y-1">
              <div className="flex items-center gap-1">
                <Calendar className="size-3" />
                <span>{dayjs(file.uploaded_at || file.pivot?.added_at).format("DD/MM/YYYY")}</span>
              </div>
              <div className="flex items-center gap-1">
                <User className="size-3" />
                <span>Mã NV: {file.uploaded_by}</span>
              </div>
            </div>
          )
        },
      },
      {
        id: "actions",
        header: "Thao tác",
        size: 130,
        Cell: ({ row }) => {
          const file = row.original
          const isOwner = file.uploaded_by === currentUserId
          const showDelete = isAdmin || isOwner

          return (
            <div
              className="flex items-center justify-center gap-1.5"
              onClick={(e) => e.stopPropagation()}
            >
              <Button variant="ghost" size="icon" asChild className="size-11 md:size-8">
                <a href={file.url} download target="_blank" rel="noopener noreferrer">
                  <Download className="size-4" />
                </a>
              </Button>
              {showDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-11 md:size-8 hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                  onClick={() => handleDelete(file.id)}
                >
                  <Trash2 className="size-4" />
                </Button>
              )}
            </div>
          )
        },
      },
    ],
    [currentUserId, isAdmin, handleDelete],
  )

  const table = useMantineReactTable({
    columns,
    data: files,
    enableColumnActions: false,
    enableColumnFilters: false,
    enablePagination: false,
    enableSorting: false,
    enableBottomToolbar: false,
    enableTopToolbar: false,
    enableFullScreenToggle: false,
    mantineTableProps: {
      striped: true,
      highlightOnHover: true,
      withBorder: false,
      withColumnBorders: false,
    },
    mantineTableContainerProps: {
      onScroll: (e: React.UIEvent<HTMLDivElement>) => {
        e.currentTarget.style.setProperty("--mrt-scroll-left", `${e.currentTarget.scrollLeft}px`)
      },
      sx: { overflowX: "auto", WebkitOverflowScrolling: "touch" },
    },
  })

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Tài liệu đính kèm ({files.length})</h3>
        {canEdit && !showUploadForm && (
          <Button
            size="sm"
            onClick={() => setShowUploadForm(true)}
            className="gap-2 min-h-11 md:min-h-9"
          >
            <Upload className="size-4" />
            Tải lên tài liệu
          </Button>
        )}
      </div>

      {showUploadForm && (
        <div className="rounded-xl border bg-card p-5 space-y-4 shadow-sm animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b pb-2">
            <h4 className="font-semibold text-sm">Tải tài liệu mới lên dự án</h4>
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => setShowUploadForm(false)}
            >
              <X className="size-4" />
            </Button>
          </div>
          <form onSubmit={handleSubmit(handleUploadSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <Label>Phân loại tài liệu *</Label>
                  <Controller
                    name="file_category"
                    control={control}
                    render={({ field }) => (
                      <SearchableSelect
                        value={field.value}
                        onValueChange={field.onChange}
                        options={categories.map((c) => ({
                          label: c.label,
                          value: c.value?.toString() || c.id?.toString() || "",
                        }))}
                        placeholder="Chọn phân loại..."
                      />
                    )}
                  />
                  {errors.file_category && (
                    <p className="text-xs text-destructive">{errors.file_category.message}</p>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="notes">Mô tả / Ghi chú</Label>
                  <Input
                    id="notes"
                    placeholder="Mô tả tài liệu này (ví dụ: Bản vẽ kỹ thuật tầng 1...)"
                    {...register("notes")}
                  />
                  {errors.notes && (
                    <p className="text-xs text-destructive">{errors.notes.message}</p>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <FileUploadField
                  control={control}
                  name="file"
                  label="Tệp tin đính kèm *"
                  accept=".pdf,.jpg,.jpeg,.png,.xlsx,.xls,.docx,.doc"
                  hint="PDF, hình ảnh hoặc tài liệu Office lên đến 10 MB"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowUploadForm(false)}
                disabled={isSubmitting}
                className="min-h-11 md:min-h-9"
              >
                Hủy
              </Button>
              <Button type="submit" disabled={isSubmitting} className="min-h-11 md:min-h-9">
                {isSubmitting ? "Đang tải lên..." : "Tải lên"}
              </Button>
            </div>
          </form>
        </div>
      )}

      <div className="rounded-xl border bg-card overflow-hidden">
        <MantineReactTable table={table} />
      </div>
    </div>
  )
}
