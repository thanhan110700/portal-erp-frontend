import { useEffect, useState, useMemo, useCallback } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { MantineReactTable, useMantineReactTable, type MRT_ColumnDef } from "mantine-react-table"
import { Trash2, Download, FileText, Upload, Calendar, User, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { SearchableSelect } from "@/components/common/SearchableSelect"
import { FileUploadField } from "@/components/common/FileUploadField"
import { ConfirmDialog } from "@/components/common/ConfirmDialog"
import { ImagePreviewDialog } from "@/components/common/ImagePreviewDialog"
import { optionApi, type OptionItem } from "@/shared/api/optionApi"
import { projectApi } from "../api/projectApi"
import type { ProjectFile } from "../types/project"
import { toast } from "sonner"
import { useAuthStore } from "@/hooks/useAuthStore"
import dayjs from "dayjs"
import { useTranslation } from "react-i18next"

interface ProjectFilesTabProps {
  projectId: number
  files: ProjectFile[]
  onRefresh: () => void
  canEdit: boolean
  isAdmin: boolean
}

type UploadFormData = {
  file: File | null
  file_category: string
  notes?: string | null
}

export function ProjectFilesTab({
  projectId,
  files,
  onRefresh,
  canEdit,
  isAdmin,
}: ProjectFilesTabProps) {
  const { t } = useTranslation(["projects", "common"])
  const currentUserId = useAuthStore((s) => s.user?.id)
  const [categories, setCategories] = useState<OptionItem[]>([])
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const isImage = (url: string) => /\.(jpeg|jpg|gif|png|webp)$/i.test(url)

  const form = useForm<UploadFormData>({
    resolver: zodResolver(
      z.object({
        file: z
          .any()
          .refine((val) => val instanceof File, t("projects:files.validation.file_required")),
        file_category: z.string().min(1, t("projects:files.validation.category_required")),
        notes: z
          .string()
          .max(500, t("projects:files.validation.notes_max"))
          .optional()
          .nullable()
          .or(z.literal("")),
      }),
    ),
    defaultValues: {
      file: null,
      file_category: "",
      notes: "",
    },
  })
  const {
    handleSubmit,
    control,
    register,
    reset,
    formState: { errors, isSubmitting },
  } = form

  useEffect(() => {
    optionApi.getFileCategories().then(setCategories).catch(console.error)
  }, [])

  const handleUploadSubmit = async (data: UploadFormData) => {
    if (!data.file) return
    try {
      await projectApi.uploadFile(projectId, data.file, data.file_category, data.notes || undefined)
      toast.success(t("projects:files.upload_success"))
      reset({
        file: null,
        file_category: "",
        notes: "",
      })
      setShowUploadForm(false)
      onRefresh()
    } catch {
      toast.error(t("projects:files.upload_error"))
    }
  }

  const executeDelete = useCallback(
    async (fileId: number) => {
      try {
        await projectApi.deleteFile(projectId, fileId)
        toast.success(t("projects:files.delete_success"))
        onRefresh()
      } catch {
        toast.error(t("projects:files.delete_error"))
      } finally {
        setDeleteConfirmId(null)
      }
    },
    [projectId, onRefresh, t],
  )

  const handleDelete = useCallback((fileId: number) => {
    setDeleteConfirmId(fileId)
  }, [])

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const filteredFiles = useMemo(() => {
    if (!searchQuery.trim()) return files
    const q = searchQuery.toLowerCase()
    return files.filter((f) => f.original_name.toLowerCase().includes(q))
  }, [files, searchQuery])

  const columns = useMemo<MRT_ColumnDef<ProjectFile>[]>(
    () => [
      {
        accessorKey: "original_name",
        header: t("projects:files.columns.name"),
        size: 250,
        Cell: ({ row }) => {
          const file = row.original
          const handleNameClick = (e: React.MouseEvent) => {
            if (isImage(file.url)) {
              e.preventDefault()
              setPreviewUrl(file.url)
            }
          }
          return (
            <a
              href={file.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleNameClick}
              className="flex items-center gap-2 text-primary hover:underline max-w-xs truncate md:max-w-sm font-medium cursor-pointer"
            >
              <FileText className="size-4 shrink-0" />
              <span className="truncate">{file.original_name}</span>
            </a>
          )
        },
      },
      {
        id: "category",
        header: t("projects:files.columns.category"),
        size: 150,
        Cell: ({ row }) => {
          const file = row.original
          const cat = file.pivot?.file_category || file.category
          return (
            <span className="capitalize">
              {cat ? t(`projects:file_categories.${cat}`, { defaultValue: cat }) : "—"}
            </span>
          )
        },
      },
      {
        id: "notes",
        header: t("projects:files.columns.notes"),
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
        header: t("projects:files.columns.size"),
        size: 130,
        Cell: ({ cell }) => (
          <div className="text-right font-mono text-muted-foreground whitespace-nowrap">
            {formatFileSize(cell.getValue<number>())}
          </div>
        ),
      },
      {
        id: "uploaded_at",
        header: t("projects:files.columns.uploaded_at"),
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
                <span>
                  {t("projects:files.columns.employee_code")}: {file.uploaded_by}
                </span>
              </div>
            </div>
          )
        },
      },
      {
        id: "actions",
        header: t("common:table.actions"),
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
    [currentUserId, isAdmin, handleDelete, t],
  )

  const table = useMantineReactTable({
    renderEmptyRowsFallback: () => (
      <div className="p-8 text-center text-muted-foreground">
        {t("common:table.noData", { defaultValue: "Không có dữ liệu" })}
      </div>
    ),
    columns,
    data: filteredFiles,
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
      <div className="flex justify-between items-center gap-4">
        <h3 className="text-lg font-semibold whitespace-nowrap">
          {t("projects:files.title")} ({filteredFiles.length})
        </h3>
        <div className="flex-1 flex justify-end items-center gap-3">
          <Input
            placeholder={t("common:actions.search")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-xs h-9"
          />
          {canEdit && !showUploadForm && (
            <Button
              size="sm"
              onClick={() => setShowUploadForm(true)}
              className="gap-2 min-h-11 md:min-h-9"
            >
              <Upload className="size-4" />
              {t("projects:files.upload")}
            </Button>
          )}
        </div>
      </div>

      {showUploadForm && (
        <div className="rounded-xl border bg-card p-5 space-y-4 shadow-sm animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b pb-2">
            <h4 className="font-semibold text-sm">{t("projects:files.upload_title")}</h4>
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => setShowUploadForm(false)}
            >
              <X className="size-4" />
            </Button>
          </div>
          <Form {...form}>
            <form onSubmit={handleSubmit(handleUploadSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="flex flex-col gap-1.5">
                    <Label>{t("projects:files.category")}</Label>
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
                          placeholder={t("projects:files.category_placeholder")}
                        />
                      )}
                    />
                    {errors.file_category && (
                      <p className="text-xs text-destructive">{errors.file_category.message}</p>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="notes">{t("projects:files.notes")}</Label>
                    <Input
                      id="notes"
                      placeholder={t("projects:files.notes_placeholder")}
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
                    label={t("projects:files.file_label")}
                    accept=".pdf,.jpg,.jpeg,.png,.xlsx,.xls,.docx,.doc"
                    hint={t("projects:files.file_hint")}
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
                  {t("common:actions.cancel")}
                </Button>
                <Button type="submit" disabled={isSubmitting} className="min-h-11 md:min-h-9">
                  {isSubmitting ? t("projects:files.uploading") : t("projects:files.submit")}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      )}

      <div className="rounded-xl border bg-card overflow-hidden">
        <MantineReactTable table={table} />
      </div>

      <ConfirmDialog
        open={deleteConfirmId !== null}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={() => {
          if (deleteConfirmId !== null) return executeDelete(deleteConfirmId)
        }}
        title={t("projects:files.delete_confirm")}
      />

      <ImagePreviewDialog
        open={previewUrl !== null}
        onClose={() => setPreviewUrl(null)}
        src={previewUrl}
      />
    </div>
  )
}
