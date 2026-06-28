import { useState, useEffect, useCallback } from "react"
import { useTranslation } from "react-i18next"

import {
  Edit2,
  Trash2,
  Paperclip,
  History as HistoryIcon,
  Download,
  Upload,
  FileText,
} from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { toast } from "sonner"

import { CommonDialog } from "@/components/common/CommonDialog"
import { StatusBadge } from "@/components/common/StatusBadge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { FileUploadField } from "@/components/common/FileUploadField"
import { Form } from "@/components/ui/form"
import { useAuthStore } from "@/hooks/useAuthStore"
import { hasPermission, PermissionSlugs } from "@/constants/permissions"

import { voucherApi } from "../api/voucherApi"
import type { Voucher, VoucherAuditLog } from "../types/voucher"

interface VoucherDetailDialogProps {
  open: boolean
  onClose: () => void
  voucherId: number
  onRefresh: () => void
  onEdit?: (voucher: Voucher) => void
}

const getFileSchema = (t: (key: string) => string) =>
  z.object({
    file: z.custom<File>(
      (val) => val instanceof File,
      t("finance:attachments.validation.file_required"),
    ),
  })

export function VoucherDetailDialog({
  open,
  onClose,
  voucherId,
  onRefresh,
  onEdit,
}: VoucherDetailDialogProps) {
  const { t } = useTranslation(["finance", "common"])
  const user = useAuthStore((s) => s.user)
  const canApprove = hasPermission(user?.permissions, PermissionSlugs.ApproveVouchers)
  const canEdit = hasPermission(user?.permissions, PermissionSlugs.EditVouchers)
  const canDelete = hasPermission(user?.permissions, PermissionSlugs.DeleteVouchers)

  const [voucher, setVoucher] = useState<Voucher | null>(null)
  const [history, setHistory] = useState<VoucherAuditLog[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const form = useForm({
    resolver: zodResolver(getFileSchema(t)),
    defaultValues: { file: undefined },
  })
  const {
    handleSubmit,
    control,
    reset,
    formState: { isSubmitting },
  } = form

  const loadData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [v, h] = await Promise.all([
        voucherApi.get(voucherId),
        voucherApi.getHistory(voucherId),
      ])
      setVoucher(v)
      setHistory(h)
    } catch {
      toast.error(t("finance:detail.fetch_error", { defaultValue: "Lỗi tải dữ liệu phiếu" }))
    } finally {
      setIsLoading(false)
    }
  }, [voucherId, t])

  useEffect(() => {
    if (open && voucherId) {
      void loadData()
    }
  }, [open, voucherId, loadData])

  const handleUpload = async (data: { file: File }) => {
    try {
      await voucherApi.uploadFile(voucherId, data.file)
      toast.success(t("finance:attachments.upload_success"))
      reset({ file: undefined } as unknown as { file: File })
      await loadData()
      onRefresh()
    } catch {
      toast.error(t("finance:attachments.upload_error"))
    }
  }

  const handleDeleteFile = async (fileId: number) => {
    if (!window.confirm(t("finance:attachments.delete_confirm"))) return
    try {
      await voucherApi.deleteFile(voucherId, fileId)
      toast.success(t("finance:attachments.delete_success"))
      await loadData()
      onRefresh()
    } catch {
      toast.error(t("finance:attachments.delete_error"))
    }
  }

  const handleApprove = async () => {
    try {
      await voucherApi.approve(voucherId, "approve")
      toast.success(t("finance:list.approve_success"))
      onRefresh()
      onClose()
    } catch (err: unknown) {
      toast.error(
        (err as { response?: { data?: { message?: string } } }).response?.data?.message ||
          t("finance:list.approve_error"),
      )
    }
  }

  const handleReject = async () => {
    const reason = window.prompt(t("finance:list.reject_prompt"))
    if (reason === null) return
    if (!reason.trim()) {
      toast.error(t("finance:list.reject_reason_required"))
      return
    }
    try {
      await voucherApi.approve(voucherId, "reject", reason)
      toast.success(t("finance:list.reject_success"))
      onRefresh()
      onClose()
    } catch (err: unknown) {
      toast.error(
        (err as { response?: { data?: { message?: string } } }).response?.data?.message ||
          t("finance:list.reject_error"),
      )
    }
  }

  const handleDeleteVoucher = async () => {
    if (!window.confirm(t("finance:list.delete_confirm"))) return
    try {
      await voucherApi.delete(voucherId)
      toast.success(t("finance:list.delete_success"))
      onRefresh()
      onClose()
    } catch {
      toast.error(t("finance:list.delete_error"))
    }
  }

  if (isLoading || !voucher) {
    return (
      <CommonDialog open={open} onClose={onClose} title="Loading..." size="full">
        <div className="flex items-center justify-center h-64">
          <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </CommonDialog>
    )
  }

  const isReceipt = voucher.voucher_type === "receipt"
  const isPending = voucher.status === "pending"
  const isDraftOrPending = voucher.status === "draft" || isPending

  const linkedTarget =
    voucher.project?.name ||
    voucher.contract?.name ||
    voucher.customer?.name ||
    voucher.department?.name ||
    "—"
  const linkedType = voucher.project
    ? t("finance:list.linked.project")
    : voucher.contract
      ? t("finance:list.linked.contract")
      : voucher.customer
        ? t("finance:list.linked.customer")
        : voucher.department
          ? t("finance:list.linked.department")
          : ""

  return (
    <CommonDialog
      open={open}
      onClose={onClose}
      size="full"
      title={
        <div className="flex items-center gap-3">
          <span>{voucher.voucher_code}</span>
          <StatusBadge status={voucher.status} />
        </div>
      }
      description={isReceipt ? t("finance:list.types.receipt") : t("finance:list.types.payment")}
      primaryAction={
        canApprove && isPending
          ? {
              label: t("finance:list.actions.approve", { defaultValue: "Duyệt" }),
              onClick: () => void handleApprove(),
            }
          : undefined
      }
      cancelAction={
        canApprove && isPending
          ? {
              label: t("finance:list.actions.reject", { defaultValue: "Từ chối" }),
              onClick: () => void handleReject(),
              variant: "destructive",
            }
          : undefined
      }
    >
      <div className="space-y-8 pb-12">
        {/* Basic Info */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 p-4 rounded-xl bg-muted/20 border">
          <div>
            <p className="text-sm text-muted-foreground mb-1">{t("finance:form.amount")}</p>
            <p
              className={`text-lg font-bold font-mono ${
                isReceipt ? "text-emerald-600" : "text-rose-600"
              }`}
            >
              {isReceipt ? "+" : "-"}
              {Number(voucher.amount).toLocaleString("vi-VN")}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">{t("finance:form.date")}</p>
            <p className="font-medium text-foreground">{voucher.voucher_date}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">{t("finance:form.employee")}</p>
            <p className="font-medium text-foreground truncate">
              {voucher.employees?.map((e) => e.full_name).join(", ") || "—"}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">
              {linkedType || t("finance:form.linked_title")}
            </p>
            <p className="font-medium text-foreground truncate">{linkedTarget}</p>
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-lg mb-2">{t("finance:form.description")}</h3>
          <p className="text-foreground whitespace-pre-wrap">{voucher.description}</p>
          {voucher.notes && (
            <div className="mt-4 p-4 rounded-lg bg-orange-50 dark:bg-orange-950/20 text-orange-800 dark:text-orange-200">
              <span className="font-semibold">{t("finance:form.notes")}: </span>
              {voucher.notes}
            </div>
          )}
        </div>

        {/* Actions (if owner/editor) */}
        {canEdit && isDraftOrPending && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="min-h-11 md:min-h-9"
              onClick={() => {
                onClose()
                onEdit?.(voucher)
              }}
            >
              <Edit2 className="size-4 mr-2" />
              {t("finance:list.actions.edit")}
            </Button>
            {canDelete && (
              <Button
                variant="destructive"
                className="min-h-11 md:min-h-9"
                onClick={() => void handleDeleteVoucher()}
              >
                <Trash2 className="size-4 mr-2" />
                {t("finance:list.actions.delete")}
              </Button>
            )}
          </div>
        )}

        <Separator />

        {/* Attachments Section */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Paperclip className="size-5 text-primary" />
            <h3 className="font-semibold text-lg">{t("finance:attachments.list_title")}</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Upload form */}
            <div className="p-4 rounded-xl border border-dashed bg-muted/10">
              <Form {...form}>
                <form
                  onSubmit={(e) => {
                    void handleSubmit(handleUpload)(e)
                  }}
                  className="space-y-3"
                >
                  <FileUploadField
                    control={control}
                    name="file"
                    label={t("finance:attachments.select_label")}
                    accept=".pdf,.jpg,.jpeg,.png,.xlsx,.xls,.docx,.doc"
                    hint={t("finance:attachments.select_hint")}
                    required
                  />
                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="gap-2 w-full mt-2 min-h-11 md:min-h-9"
                    >
                      <Upload className="size-4" />
                      {isSubmitting
                        ? t("finance:attachments.uploading")
                        : t("finance:attachments.upload_button")}
                    </Button>
                  </div>
                </form>
              </Form>
            </div>

            {/* File List */}
            <div className="space-y-2">
              {!voucher.files || voucher.files.length === 0 ? (
                <div className="flex items-center justify-center h-full text-sm text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
                  {t("finance:attachments.empty")}
                </div>
              ) : (
                <div className="divide-y rounded-xl border bg-background overflow-hidden">
                  {voucher.files.map((file) => (
                    <div key={file.id} className="flex items-center justify-between p-3">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <FileText className="size-4 text-muted-foreground shrink-0" />
                        <span className="text-sm truncate font-medium text-foreground">
                          {file.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button variant="ghost" size="icon" asChild className="size-11 md:size-8">
                          <a href={file.url} download target="_blank" rel="noopener noreferrer">
                            <Download className="size-4" />
                          </a>
                        </Button>
                        {canEdit && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-11 md:size-8 text-muted-foreground hover:text-destructive"
                            onClick={() => void handleDeleteFile(file.id)}
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

        <Separator />

        {/* History Section */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <HistoryIcon className="size-5 text-primary" />
            <h3 className="font-semibold text-lg">{t("finance:history.title")}</h3>
          </div>
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("finance:history.empty")}</p>
          ) : (
            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
              {history.map((log) => (
                <div
                  key={log.id}
                  className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active"
                >
                  <div className="flex items-center justify-center w-5 h-5 rounded-full border-2 border-primary bg-background shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm relative z-10"></div>

                  <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] p-4 rounded-lg border bg-card shadow-sm group-hover:border-primary/50 transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <div className="font-semibold text-sm capitalize text-primary">
                        {log.action}
                      </div>
                      <time className="text-xs text-muted-foreground font-mono">
                        {new Date(log.created_at).toLocaleString("vi-VN")}
                      </time>
                    </div>
                    <div className="text-sm text-foreground">
                      {log.user?.full_name || "System"}
                      {log.notes && <span className="text-muted-foreground"> - {log.notes}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </CommonDialog>
  )
}
