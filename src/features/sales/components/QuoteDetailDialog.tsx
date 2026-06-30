import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  FileText,
  Download,
  Trash2,
  Upload,
  Mail,
  Calendar,
  DollarSign,
  User,
  ArrowRightLeft,
} from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { toast } from "sonner"

import { CommonDialog } from "@/components/common/CommonDialog"
import { ConfirmDialog } from "@/components/common/ConfirmDialog"
import { StatusBadge } from "@/components/common/StatusBadge"
import { SearchableSelect } from "@/components/common/SearchableSelect"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Form } from "@/components/ui/form"
import { FileUploadField } from "@/components/common/FileUploadField"
import { useAuthStore } from "@/hooks/useAuthStore"
import { hasPermission, PermissionSlugs } from "@/constants/permissions"

import { quoteApi } from "../api/quoteApi"
import type { Quote } from "../types/sales"

interface QuoteDetailDialogProps {
  open: boolean
  onClose: () => void
  quoteId: number
  onRefresh: () => void
  onConvertToContract?: (quote: Quote) => void
}

const QUOTE_STATUS_OPTIONS = [
  { value: "draft", label: "Nháp" },
  { value: "sent", label: "Đã gửi" },
  { value: "waiting", label: "Đang chờ" },
  { value: "accepted", label: "Đã chốt" },
  { value: "rejected", label: "Từ chối" },
  { value: "cancelled", label: "Đã hủy" },
]

const ALLOWED_QUOTE_TRANSITIONS: Record<string, string[]> = {
  draft: ["sent", "cancelled"],
  sent: ["waiting", "accepted", "rejected", "cancelled"],
  waiting: ["accepted", "rejected", "cancelled"],
}

type QuoteFileFormValues = {
  file: File | null
}

export function QuoteDetailDialog({
  open,
  onClose,
  quoteId,
  onRefresh,
  onConvertToContract,
}: QuoteDetailDialogProps) {
  const { t } = useTranslation(["sales", "common"])
  const user = useAuthStore((s) => s.user)
  const canEdit = hasPermission(user?.permissions, PermissionSlugs.EditQuotes)

  const [quote, setQuote] = useState<Quote | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [statusUpdating, setStatusUpdating] = useState(false)
  const [pendingStatus, setPendingStatus] = useState<string | null>(null)
  const [statusNotes, setStatusNotes] = useState("")
  const [deleteFileConfirmId, setDeleteFileConfirmId] = useState<number | null>(null)

  const form = useForm<QuoteFileFormValues>({
    resolver: zodResolver(
      z.object({
        file: z
          .any()
          .refine((val) => val instanceof File, t("sales:quote.files.validation.file_required")),
      }),
    ),
    defaultValues: { file: null },
  })
  const {
    handleSubmit,
    control,
    reset,
    formState: { isSubmitting },
  } = form

  const loadData = async () => {
    setIsLoading(true)
    try {
      const data = await quoteApi.get(quoteId)
      setQuote(data)
    } catch {
      toast.error(t("sales:quote.fetch_error"))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (open && quoteId) {
      void loadData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, quoteId])

  const handleStatusChange = (newStatus: string) => {
    if (newStatus === quote?.status) return
    if (newStatus === "rejected") {
      setPendingStatus(newStatus)
      setStatusNotes("")
    } else {
      void confirmStatusChange(newStatus)
    }
  }

  const confirmStatusChange = async (newStatus: string, notes?: string) => {
    if (!quote) return
    setStatusUpdating(true)
    try {
      const updated = await quoteApi.updateStatus(quote.id, newStatus, notes)
      setQuote(updated)
      toast.success(t("sales:quote.status_update_success"))
      onRefresh()
    } catch {
      toast.error(t("sales:quote.status_update_error"))
    } finally {
      setStatusUpdating(false)
      setPendingStatus(null)
    }
  }

  const handleGeneratePdf = async () => {
    try {
      const blob = await quoteApi.generatePdf(quoteId)
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `${quote?.quote_code || "quote"}.pdf`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    } catch {
      toast.error(t("sales:quote.pdf_error", { defaultValue: "Không thể tải PDF báo giá" }))
    }
  }

  const handleSendEmail = async () => {
    try {
      const sentTo = await quoteApi.sendEmail(quoteId)
      toast.success(
        t("sales:quote.email_success", {
          email: sentTo,
          defaultValue: "Đã gửi email báo giá",
        }),
      )
    } catch {
      toast.error(t("sales:quote.email_error", { defaultValue: "Gửi email báo giá thất bại" }))
    }
  }

  const handleUpload = async (data: QuoteFileFormValues) => {
    if (!data.file) return
    try {
      await quoteApi.uploadFile(quoteId, data.file)
      toast.success(t("sales:quote.files.upload_success"))
      reset({ file: null })
      await loadData()
      onRefresh()
    } catch {
      toast.error(t("sales:quote.files.upload_error"))
    }
  }

  const executeDeleteFile = async (fileId: number) => {
    try {
      await quoteApi.deleteFile(quoteId, fileId)
      toast.success(t("sales:quote.files.delete_success"))
      await loadData()
      onRefresh()
    } catch {
      toast.error(t("sales:quote.files.delete_error"))
    } finally {
      setDeleteFileConfirmId(null)
    }
  }

  const handleDeleteFile = (fileId: number) => {
    setDeleteFileConfirmId(fileId)
  }

  if (isLoading || !quote) {
    return (
      <CommonDialog
        open={open}
        onClose={onClose}
        title={t("common:table.loading", { defaultValue: "Đang tải..." })}
        size="full"
      >
        <div className="flex items-center justify-center h-64">
          <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </CommonDialog>
    )
  }

  return (
    <>
      <CommonDialog
        open={open}
        onClose={onClose}
        size="full"
        title={
          <div className="flex items-center gap-3">
            <span>{quote.quote_code}</span>
            <StatusBadge status={quote.status} />
          </div>
        }
        description={t("sales:quote.detail_description", { defaultValue: "Chi tiết Báo giá" })}
        primaryAction={
          quote.status === "accepted" && !quote.contract && onConvertToContract
            ? {
                label: t("sales:quote.actions.convert", { defaultValue: "Tạo Hợp đồng" }),
                onClick: () => {
                  onClose()
                  onConvertToContract(quote)
                },
              }
            : undefined
        }
      >
        <div className="space-y-8 pb-12">
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => void handleGeneratePdf()}>
              <Download className="mr-2 size-4" />
              {t("sales:quote.actions.download_pdf")}
            </Button>
            {canEdit && (
              <Button variant="outline" size="sm" onClick={() => void handleSendEmail()}>
                <Mail className="mr-2 size-4" />
                {t("sales:quote.actions.send_email", { defaultValue: "Gửi email" })}
              </Button>
            )}
          </div>

          {/* Status Change Bar */}
          {canEdit && (
            <div className="flex items-center gap-4 p-4 rounded-xl border bg-card shadow-sm">
              <h3 className="font-semibold text-sm flex items-center gap-2 whitespace-nowrap">
                <ArrowRightLeft className="size-4 text-muted-foreground" />
                {t("sales:quote.change_status", { defaultValue: "Chuyển trạng thái" })}
              </h3>
              <div className="flex-1 max-w-[200px]">
                <SearchableSelect
                  value={quote.status}
                  onValueChange={handleStatusChange}
                  options={QUOTE_STATUS_OPTIONS.filter(
                    (status) =>
                      status.value === quote.status ||
                      (ALLOWED_QUOTE_TRANSITIONS[quote.status] ?? []).includes(status.value),
                  ).map((s) => ({
                    ...s,
                    label: t(`common:status.${s.value}`, { defaultValue: s.label }),
                  }))}
                  disabled={statusUpdating}
                />
              </div>
            </div>
          )}

          {/* Basic Info */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 p-4 rounded-xl bg-muted/20 border">
            <div className="col-span-2">
              <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1.5">
                <User className="size-4" /> {t("sales:quote.columns.customer")}
              </p>
              <p className="font-medium text-foreground">
                {quote.customer?.customer_name || "—"}{" "}
                <span className="text-xs text-muted-foreground font-mono ml-2">
                  {quote.customer?.customer_code}
                </span>
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1.5">
                <DollarSign className="size-4" /> {t("sales:quote.columns.value")}
              </p>
              <p className="text-lg font-bold font-mono text-primary">
                {Number(quote.quote_value).toLocaleString("vi-VN")}{" "}
                {t("common:currency", { defaultValue: "VNĐ" })}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1.5">
                <Calendar className="size-4" /> {t("sales:quote.columns.quote_date")}
              </p>
              <p className="font-medium text-foreground">{quote.quote_date}</p>
            </div>
          </div>

          {/* Content & Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-sm mb-2">
                {t("sales:quote.form.fields.description")}
              </h3>
              <p className="text-foreground text-sm whitespace-pre-wrap p-4 rounded-lg bg-card border">
                {quote.description ||
                  t("sales:quote.no_description", { defaultValue: "Không có mô tả" })}
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-sm mb-2">{t("sales:quote.form.fields.notes")}</h3>
              <p className="text-muted-foreground text-sm whitespace-pre-wrap p-4 rounded-lg bg-card border border-dashed">
                {quote.notes || t("sales:quote.no_notes", { defaultValue: "Không có ghi chú" })}
              </p>
            </div>
          </div>

          <Separator />

          {/* Files Section */}
          <div>
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <FileText className="size-5 text-primary" />
              {t("sales:quote.actions.attachments")} ({quote.files?.length || 0})
            </h3>

            <div className="space-y-6">
              {canEdit && (
                <div className="p-4 rounded-xl border border-dashed bg-muted/10">
                  <Form {...form}>
                    <form onSubmit={handleSubmit(handleUpload)} className="space-y-3">
                      <FileUploadField
                        control={control}
                        name="file"
                        label={t("sales:quote.upload_label", {
                          defaultValue: "Chọn file đính kèm",
                        })}
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.png"
                        hint={t("sales:quote.upload_hint", {
                          defaultValue: "PDF, Word, Excel, Images",
                        })}
                        required
                      />
                      <div className="flex justify-end">
                        <Button
                          type="submit"
                          disabled={isSubmitting}
                          size="sm"
                          className="gap-2 w-full mt-2"
                        >
                          <Upload className="size-4" />
                          {isSubmitting
                            ? t("common:actions.saving")
                            : t("sales:quote.files.upload", { defaultValue: "Tải lên" })}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </div>
              )}

              <div className="space-y-2">
                {!quote.files || quote.files.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-sm text-muted-foreground bg-muted/20 rounded-xl border border-dashed min-h-[120px]">
                    {t("common:table.noData")}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {quote.files.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between p-3 rounded-xl border bg-background overflow-hidden"
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                          <FileText className="size-4 text-muted-foreground shrink-0" />
                          <span className="text-sm truncate font-medium text-foreground">
                            {file.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button variant="ghost" size="icon" asChild className="size-8">
                            <a href={file.url} download target="_blank" rel="noopener noreferrer">
                              <Download className="size-4" />
                            </a>
                          </Button>
                          {canEdit && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-muted-foreground hover:text-destructive"
                              onClick={() => handleDeleteFile(file.id)}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </CommonDialog>

      {/* Reject Status Notes Dialog */}
      {pendingStatus === "rejected" && (
        <CommonDialog
          open={!!pendingStatus}
          onClose={() => setPendingStatus(null)}
          title={t("sales:quote.status.reject_title", { defaultValue: "Lý do từ chối" })}
          primaryAction={{
            label: t("common:actions.confirm"),
            onClick: () => {
              if (!statusNotes.trim()) {
                toast.error(
                  t("sales:quote.status.reject_reason_required", {
                    defaultValue: "Vui lòng nhập lý do từ chối",
                  }),
                )
                return
              }
              void confirmStatusChange(pendingStatus, statusNotes)
            },
            disabled: !statusNotes.trim() || statusUpdating,
          }}
        >
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              {t("sales:quote.status.reject_description", {
                defaultValue: "Vui lòng nhập lý do từ chối báo giá này.",
              })}
            </p>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("sales:quote.form.fields.notes")}</label>
              <textarea
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={statusNotes}
                onChange={(e) => setStatusNotes(e.target.value)}
                placeholder={t("sales:quote.status.reject_placeholder", {
                  defaultValue: "Nhập lý do...",
                })}
              />
            </div>
          </div>
        </CommonDialog>
      )}

      <ConfirmDialog
        open={deleteFileConfirmId !== null}
        onClose={() => setDeleteFileConfirmId(null)}
        onConfirm={() => {
          if (deleteFileConfirmId !== null) return executeDeleteFile(deleteFileConfirmId)
        }}
        title={t("sales:quote.files.delete_confirm")}
      />
    </>
  )
}
