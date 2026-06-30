import { useState, useEffect, useCallback } from "react"
import { useTranslation } from "react-i18next"

import {
  Edit2,
  Trash2,
  Paperclip,
  History as HistoryIcon,
  Download,
  FileText,
  ExternalLink,
} from "lucide-react"
import { toast } from "sonner"

import { CommonDialog } from "@/components/common/CommonDialog"
import { ConfirmDialog } from "@/components/common/ConfirmDialog"
import { StatusBadge } from "@/components/common/StatusBadge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useAuthStore } from "@/hooks/useAuthStore"
import { hasPermission, PermissionSlugs } from "@/constants/permissions"
import { FileUploadInput } from "@/components/common/FileUploadField"

import { voucherApi } from "../api/voucherApi"
import type { Voucher, VoucherAuditLog } from "../types/voucher"
import { VoucherRejectDialog } from "./VoucherRejectDialog"

interface VoucherDetailDialogProps {
  open: boolean
  onClose: () => void
  voucherId: number
  onRefresh: () => void
  onEdit?: (voucher: Voucher) => void
}

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
  const [rejectOpen, setRejectOpen] = useState(false)
  const [isRejecting, setIsRejecting] = useState(false)

  const [isUploading, setIsUploading] = useState(false)
  const [deleteFileConfirmId, setDeleteFileConfirmId] = useState<number | null>(null)
  const [deleteVoucherConfirmOpen, setDeleteVoucherConfirmOpen] = useState(false)

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
      toast.error(t("finance:detail.fetch_error"))
    } finally {
      setIsLoading(false)
    }
  }, [voucherId, t])

  useEffect(() => {
    if (open && voucherId) {
      void loadData()
    }
  }, [open, voucherId, loadData])

  const handleUploadDirect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 10 * 1024 * 1024) {
      toast.error(t("finance:attachments.validation.file_size_max"))
      e.target.value = ""
      return
    }

    setIsUploading(true)
    try {
      await voucherApi.uploadFile(voucherId, file)
      toast.success(t("finance:attachments.upload_success"))
      await loadData()
      onRefresh()
    } catch {
      toast.error(t("finance:attachments.upload_error"))
    } finally {
      setIsUploading(false)
      e.target.value = ""
    }
  }
  const executeDeleteFile = async (fileId: number) => {
    try {
      await voucherApi.deleteFile(voucherId, fileId)
      toast.success(t("finance:attachments.delete_success"))
      await loadData()
      onRefresh()
    } catch {
      toast.error(t("finance:attachments.delete_error"))
    } finally {
      setDeleteFileConfirmId(null)
    }
  }

  const handleDeleteFile = (fileId: number) => {
    setDeleteFileConfirmId(fileId)
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

  const handleReject = async (reason: string) => {
    setIsRejecting(true)
    try {
      await voucherApi.approve(voucherId, "reject", reason)
      toast.success(t("finance:list.reject_success"))
      setRejectOpen(false)
      onRefresh()
      onClose()
    } catch (err: unknown) {
      toast.error(
        (err as { response?: { data?: { message?: string } } }).response?.data?.message ||
          t("finance:list.reject_error"),
      )
    } finally {
      setIsRejecting(false)
    }
  }

  const executeDeleteVoucher = async () => {
    try {
      await voucherApi.delete(voucherId)
      toast.success(t("finance:list.delete_success"))
      onRefresh()
      onClose()
    } catch {
      toast.error(t("finance:list.delete_error"))
    } finally {
      setDeleteVoucherConfirmOpen(false)
    }
  }

  const handleDeleteVoucher = () => {
    setDeleteVoucherConfirmOpen(true)
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
    <>
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
                label: t("finance:list.actions.approve"),
                onClick: () => void handleApprove(),
              }
            : undefined
        }
        extraActions={
          canApprove && isPending
            ? [
                {
                  label: t("finance:list.actions.reject"),
                  onClick: () => setRejectOpen(true),
                  variant: "destructive",
                },
              ]
            : undefined
        }
        cancelAction={{
          label: t("common:actions.cancel"),
          onClick: onClose,
        }}
      >
        <div className="space-y-8 pb-12">
          {/* Actions (if owner/editor) */}
          {canEdit && isDraftOrPending && (
            <div className="flex flex-wrap items-center gap-3 p-3 rounded-xl bg-card border shadow-sm">
              <span className="text-sm font-medium text-muted-foreground mr-auto px-1">
                {t("finance:detail.actions_title", { defaultValue: "Thao tác chứng từ" })}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="hover:bg-primary/5 hover:text-primary hover:border-primary/30 transition-colors"
                onClick={() => {
                  onClose()
                  onEdit?.(voucher)
                }}
              >
                <Edit2 className="size-4 mr-2" />
                {t("finance:list.actions.edit", { defaultValue: "Chỉnh sửa chứng từ" })}
              </Button>
              {canDelete && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors"
                  onClick={() => void handleDeleteVoucher()}
                >
                  <Trash2 className="size-4 mr-2" />
                  {t("finance:list.actions.delete", { defaultValue: "Xóa chứng từ" })}
                </Button>
              )}
            </div>
          )}

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
            <div>
              <p className="text-sm text-muted-foreground mb-1">{t("finance:detail.creator")}</p>
              <p className="font-medium text-foreground truncate">
                {voucher.creator?.full_name || "—"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">{t("finance:detail.approver")}</p>
              <p className="font-medium text-foreground truncate">
                {voucher.approver?.full_name || "—"}
              </p>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-2">{t("finance:form.description")}</h3>
            <p className="text-foreground whitespace-pre-wrap">{voucher.description}</p>
            {voucher.notes && (
              <div
                className={`mt-4 p-4 rounded-lg ${voucher.status === "rejected" ? "bg-destructive/10 text-destructive" : "bg-orange-50 dark:bg-orange-950/20 text-orange-800 dark:text-orange-200"}`}
              >
                <span className="font-semibold">
                  {voucher.status === "rejected"
                    ? t("finance:detail.rejection_reason")
                    : t("finance:form.notes")}
                  :
                </span>{" "}
                {voucher.notes}
              </div>
            )}
          </div>

          <Separator />

          {/* Attachments Section */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Paperclip className="size-5 text-primary" />
              <h3 className="font-semibold text-lg">{t("finance:attachments.list_title")}</h3>
            </div>

            <div className="space-y-4">
              {canEdit && isDraftOrPending && (
                <FileUploadInput
                  accept=".pdf,.jpg,.jpeg,.png,.xlsx,.xls,.docx,.doc"
                  hint={t("finance:attachments.select_hint")}
                  disabled={isUploading}
                  onChange={(file) => {
                    if (file) {
                      void handleUploadDirect({
                        target: { files: [file], value: "" },
                      } as unknown as React.ChangeEvent<HTMLInputElement>)
                    }
                  }}
                />
              )}

              {!voucher.files || voucher.files.length === 0 ? (
                <div className="flex items-center justify-center p-8 text-sm text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
                  {t("finance:attachments.empty")}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {voucher.files.map((file) => {
                    const ext = file.name.split(".").pop()?.toLowerCase() || ""
                    const isImage = ["jpg", "jpeg", "png"].includes(ext)
                    const isPdf = ext === "pdf"

                    return (
                      <div
                        key={file.id}
                        className="flex items-center justify-between p-3 rounded-xl border bg-background overflow-hidden shadow-sm"
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          {isImage ? (
                            <a
                              href={file.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="shrink-0 rounded-lg overflow-hidden border border-border hover:ring-2 hover:ring-primary/50 transition-all"
                            >
                              <img
                                src={file.url}
                                alt={file.name}
                                className="size-12 object-cover"
                                loading="lazy"
                              />
                            </a>
                          ) : isPdf ? (
                            <a
                              href={file.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="shrink-0 flex items-center justify-center size-12 rounded-lg bg-rose-50 dark:bg-rose-950/20 text-rose-600 hover:ring-2 hover:ring-primary/50 transition-all"
                            >
                              <FileText className="size-6" />
                            </a>
                          ) : (
                            <div className="shrink-0 flex items-center justify-center size-12 rounded-lg bg-muted">
                              <FileText className="size-5 text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex flex-col gap-0.5 overflow-hidden">
                            <span className="text-sm truncate font-medium text-foreground">
                              {file.name}
                            </span>
                            {(isImage || isPdf) && (
                              <a
                                href={file.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-primary hover:underline flex items-center gap-1"
                              >
                                <ExternalLink className="size-3" />
                                {isImage
                                  ? t("finance:attachments.click_preview")
                                  : t("finance:attachments.open_pdf")}
                              </a>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button variant="ghost" size="icon" asChild className="size-10 md:size-8">
                            <a href={file.url} download target="_blank" rel="noopener noreferrer">
                              <Download className="size-4" />
                            </a>
                          </Button>
                          {canEdit && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-10 md:size-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              onClick={() => void handleDeleteFile(file.id)}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* History Section */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <HistoryIcon className="size-5 text-primary" />
              <h3 className="font-semibold text-lg">
                {t("finance:history.title", { code: voucher.voucher_code })}
              </h3>
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
                          {t(`finance:history.actions.${log.action}`, { defaultValue: log.action })}
                        </div>
                        <time className="text-xs text-muted-foreground font-mono">
                          {new Date(log.created_at).toLocaleString("vi-VN")}
                        </time>
                      </div>
                      <div className="text-sm text-foreground">
                        {log.user?.full_name || "System"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </CommonDialog>

      <VoucherRejectDialog
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        onConfirm={(reason) => void handleReject(reason)}
        isSubmitting={isRejecting}
      />

      <ConfirmDialog
        open={deleteFileConfirmId !== null}
        onClose={() => setDeleteFileConfirmId(null)}
        onConfirm={() => {
          if (deleteFileConfirmId !== null) return executeDeleteFile(deleteFileConfirmId)
        }}
        title={t("finance:attachments.delete_confirm")}
      />

      <ConfirmDialog
        open={deleteVoucherConfirmOpen}
        onClose={() => setDeleteVoucherConfirmOpen(false)}
        onConfirm={() => executeDeleteVoucher()}
        title={t("finance:list.delete_confirm")}
      />
    </>
  )
}
