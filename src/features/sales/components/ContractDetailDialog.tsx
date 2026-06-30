import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  FileSignature,
  Download,
  Trash2,
  Upload,
  Calendar,
  DollarSign,
  User,
  ArrowRightLeft,
  Briefcase,
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Form } from "@/components/ui/form"
import { FileUploadField } from "@/components/common/FileUploadField"
import { useAuthStore } from "@/hooks/useAuthStore"
import { hasPermission, PermissionSlugs } from "@/constants/permissions"

import { contractApi } from "../api/contractApi"
import type { Contract, ContractFinancials } from "../types/sales"

interface ContractDetailDialogProps {
  open: boolean
  onClose: () => void
  contractId: number
  onRefresh: () => void
}

const CONTRACT_STATUS_OPTIONS = [
  { value: "draft", label: "Nháp" },
  { value: "signed", label: "Đã ký" },
  { value: "ongoing", label: "Đang thực hiện" },
  { value: "completed", label: "Hoàn tất" },
]

type ContractFileFormValues = {
  file: File | null
}

function formatCurrency(value: number) {
  return `${value.toLocaleString("vi-VN")} VNĐ`
}

export function ContractDetailDialog({
  open,
  onClose,
  contractId,
  onRefresh,
}: ContractDetailDialogProps) {
  const { t } = useTranslation(["sales", "common"])
  const user = useAuthStore((s) => s.user)
  const canEdit = hasPermission(user?.permissions, PermissionSlugs.EditContracts)

  const [contract, setContract] = useState<Contract | null>(null)
  const [financials, setFinancials] = useState<ContractFinancials | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [statusUpdating, setStatusUpdating] = useState(false)
  const [deleteFileConfirmId, setDeleteFileConfirmId] = useState<number | null>(null)
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState("")
  const [paymentSubmitting, setPaymentSubmitting] = useState(false)

  const form = useForm<ContractFileFormValues>({
    resolver: zodResolver(
      z.object({
        file: z
          .any()
          .refine((val) => val instanceof File, t("sales:contract.validation.file_required")),
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
      const [contractData, financialData] = await Promise.all([
        contractApi.get(contractId),
        contractApi.getFinancials(contractId).catch(() => null),
      ])
      setContract(contractData)
      setFinancials(financialData)
    } catch {
      toast.error(t("sales:contract.fetch_error"))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (open && contractId) {
      void loadData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, contractId])

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === contract?.status) return
    if (!contract) return
    setStatusUpdating(true)
    try {
      const updated = await contractApi.update(contract.id, { status: newStatus })
      setContract(updated)
      toast.success(t("sales:contract.status_update_success"))
      onRefresh()
    } catch {
      toast.error(t("sales:contract.status_update_error"))
    } finally {
      setStatusUpdating(false)
    }
  }

  const handleRecordPayment = async () => {
    const amount = Number(paymentAmount)

    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error(
        t("sales:contract.payment.amount_required", {
          defaultValue: "Vui lòng nhập số tiền hợp lệ",
        }),
      )
      return
    }

    if (amount > outstanding) {
      toast.error(t("sales:contract.payment.amount_invalid_range"))
      return
    }

    setPaymentSubmitting(true)
    try {
      const updated = await contractApi.recordPayment(contractId, amount)
      setContract(updated)
      setPaymentOpen(false)
      setPaymentAmount("")
      await loadData()
      onRefresh()
      toast.success(t("sales:contract.payment.success", { defaultValue: "Đã ghi nhận thanh toán" }))
    } catch {
      toast.error(
        t("sales:contract.payment.error", { defaultValue: "Ghi nhận thanh toán thất bại" }),
      )
    } finally {
      setPaymentSubmitting(false)
    }
  }

  const handleUpload = async (data: ContractFileFormValues) => {
    if (!data.file) return
    try {
      await contractApi.uploadFile(contractId, data.file)
      toast.success(t("sales:contract.upload_success"))
      reset({ file: null })
      await loadData()
      onRefresh()
    } catch {
      toast.error(t("sales:contract.upload_error"))
    }
  }

  const executeDeleteFile = async (fileId: number) => {
    try {
      await contractApi.deleteFile(contractId, fileId)
      toast.success(t("sales:contract.delete_file_success"))
      await loadData()
      onRefresh()
    } catch {
      toast.error(t("sales:contract.delete_file_error"))
    } finally {
      setDeleteFileConfirmId(null)
    }
  }

  const handleDeleteFile = (fileId: number) => {
    setDeleteFileConfirmId(fileId)
  }

  if (isLoading || !contract) {
    return (
      <CommonDialog open={open} onClose={onClose} title="Loading..." size="full">
        <div className="flex items-center justify-center h-64">
          <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </CommonDialog>
    )
  }

  const paymentReceived = Number(contract.payment_received || 0)
  const outstanding =
    Number(contract.payment_outstanding || 0) ||
    Math.max(Number(contract.contract_value || 0) - paymentReceived, 0)
  const paymentAmountValue = Number(paymentAmount || 0)
  const isPaymentAmountValid =
    Number.isFinite(paymentAmountValue) &&
    paymentAmountValue > 0 &&
    paymentAmountValue <= outstanding
  const nextReceivedPreview = paymentReceived + (isPaymentAmountValid ? paymentAmountValue : 0)
  const nextOutstandingPreview = Math.max(
    outstanding - (isPaymentAmountValid ? paymentAmountValue : 0),
    0,
  )
  const profit =
    financials?.profit ??
    Number(contract.revenue || contract.contract_value || 0) -
      (financials?.total_project_expenses ?? 0)
  const paymentQuickActions = [
    { key: "half", amount: outstanding / 2 },
    { key: "full", amount: outstanding },
  ].filter((item) => item.amount > 0)

  return (
    <>
      <CommonDialog
        open={open}
        onClose={onClose}
        size="full"
        title={
          <div className="flex items-center gap-3">
            <span>{contract.contract_code}</span>
            <StatusBadge status={contract.status} />
          </div>
        }
        description={t("sales:contract.detail_description", { defaultValue: "Chi tiết Hợp đồng" })}
      >
        <div className="space-y-8 pb-12">
          <div className="flex flex-wrap gap-2">
            {canEdit && (
              <Button variant="outline" size="sm" onClick={() => setPaymentOpen(true)}>
                <DollarSign className="mr-2 size-4" />
                {t("sales:contract.payment.record", { defaultValue: "Ghi nhận thanh toán" })}
              </Button>
            )}
          </div>

          {/* Status Change Bar */}
          {canEdit && (
            <div className="flex items-center gap-4 p-4 rounded-xl border bg-card shadow-sm">
              <h3 className="font-semibold text-sm flex items-center gap-2 whitespace-nowrap">
                <ArrowRightLeft className="size-4 text-muted-foreground" />
                {t("sales:contract.change_status", { defaultValue: "Chuyển trạng thái" })}
              </h3>
              <div className="flex-1 max-w-[200px]">
                <SearchableSelect
                  value={contract.status}
                  onValueChange={handleStatusChange}
                  options={CONTRACT_STATUS_OPTIONS.map((s) => ({
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
                <User className="size-4" /> {t("sales:contract.columns.customer")}
              </p>
              <p className="font-medium text-foreground">
                {contract.customer?.customer_name || "—"}{" "}
                <span className="text-xs text-muted-foreground font-mono ml-2">
                  {contract.customer?.customer_code}
                </span>
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1.5">
                <DollarSign className="size-4" /> {t("sales:contract.columns.value")}
              </p>
              <p className="text-lg font-bold font-mono text-emerald-600">
                {Number(contract.contract_value).toLocaleString("vi-VN")} VNĐ
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1.5">
                <Briefcase className="size-4" /> {t("sales:contract.columns.sales_rep")}
              </p>
              <p className="font-medium text-foreground">{contract.sales_rep?.full_name || "—"}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="rounded-xl border bg-card p-4">
              <p className="text-xs font-semibold text-muted-foreground">
                {t("sales:contract.financials.revenue", { defaultValue: "Doanh thu" })}
              </p>
              <p className="mt-1 font-mono text-lg font-bold">
                {Number(
                  financials?.revenue ?? contract.revenue ?? contract.contract_value,
                ).toLocaleString("vi-VN")}{" "}
                VNĐ
              </p>
            </div>
            <div className="rounded-xl border bg-card p-4">
              <p className="text-xs font-semibold text-muted-foreground">
                {t("sales:contract.financials.received", { defaultValue: "Đã thu" })}
              </p>
              <p className="mt-1 font-mono text-lg font-bold text-emerald-600">
                {paymentReceived.toLocaleString("vi-VN")} VNĐ
              </p>
            </div>
            <div className="rounded-xl border bg-card p-4">
              <p className="text-xs font-semibold text-muted-foreground">
                {t("sales:contract.financials.outstanding", { defaultValue: "Còn phải thu" })}
              </p>
              <p className="mt-1 font-mono text-lg font-bold text-amber-600">
                {outstanding.toLocaleString("vi-VN")} VNĐ
              </p>
            </div>
            <div className="rounded-xl border bg-card p-4">
              <p className="text-xs font-semibold text-muted-foreground">
                {t("sales:contract.financials.profit", { defaultValue: "Lợi nhuận" })}
              </p>
              <p className="mt-1 font-mono text-lg font-bold text-primary">
                {profit.toLocaleString("vi-VN")} VNĐ
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-muted/10 border border-dashed">
            <div>
              <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1.5">
                <Calendar className="size-4" /> {t("sales:contract.form.fields.contract_date")}
              </p>
              <p className="font-medium text-foreground">{contract.contract_date}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1.5">
                <Calendar className="size-4 text-emerald-600" />{" "}
                {t("sales:contract.form.fields.signed_date")}
              </p>
              <p className="font-medium text-emerald-700 dark:text-emerald-400">
                {contract.signed_date || "—"}
              </p>
            </div>
          </div>

          {(contract.quote || (contract.projects && contract.projects.length > 0)) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {contract.quote && (
                <div className="rounded-xl border bg-card p-4">
                  <h3 className="font-semibold text-sm mb-2">
                    {t("sales:contract.linked_quote", { defaultValue: "Báo giá liên kết" })}
                  </h3>
                  <p className="font-mono text-sm text-primary">{contract.quote.quote_code}</p>
                </div>
              )}
              {contract.projects && contract.projects.length > 0 && (
                <div className="rounded-xl border bg-card p-4">
                  <h3 className="font-semibold text-sm mb-2">
                    {t("sales:contract.linked_projects", { defaultValue: "Dự án liên kết" })}
                  </h3>
                  <div className="space-y-1">
                    {contract.projects.map((project) => (
                      <p key={project.id} className="text-sm">
                        {project.name}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Content & Terms */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-sm mb-2">
                {t("sales:contract.form.fields.content")}
              </h3>
              <p className="text-foreground text-sm whitespace-pre-wrap p-4 rounded-lg bg-card border">
                {contract.content ||
                  t("sales:contract.no_content", { defaultValue: "Không có nội dung" })}
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-sm mb-2">
                {t("sales:contract.form.fields.terms")}
              </h3>
              <p className="text-muted-foreground text-sm whitespace-pre-wrap p-4 rounded-lg bg-card border border-dashed">
                {contract.terms ||
                  t("sales:contract.no_terms", { defaultValue: "Không có điều khoản" })}
              </p>
            </div>
          </div>

          <Separator />

          {/* Files Section */}
          <div>
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <FileSignature className="size-5 text-primary" />
              {t("sales:contract.actions.attachments")} ({contract.files?.length || 0})
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {canEdit && (
                <div className="p-4 rounded-xl border border-dashed bg-muted/10">
                  <Form {...form}>
                    <form onSubmit={handleSubmit(handleUpload)} className="space-y-3">
                      <FileUploadField
                        control={control}
                        name="file"
                        label={t("sales:contract.upload_label", {
                          defaultValue: "Chọn hợp đồng đã ký",
                        })}
                        accept=".pdf,.doc,.docx,.jpg,.png"
                        hint={t("sales:contract.upload_hint", {
                          defaultValue: "PDF, Word, Images",
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
                            : t("sales:contract.actions.upload", { defaultValue: "Tải lên" })}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </div>
              )}

              <div className="space-y-2">
                {!contract.files || contract.files.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-sm text-muted-foreground bg-muted/20 rounded-xl border border-dashed min-h-[120px]">
                    {t("common:table.noData")}
                  </div>
                ) : (
                  <div className="divide-y rounded-xl border bg-background overflow-hidden">
                    {contract.files.map((file) => (
                      <div key={file.id} className="flex items-center justify-between p-3">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <FileSignature className="size-4 text-muted-foreground shrink-0" />
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
        <ConfirmDialog
          open={deleteFileConfirmId !== null}
          onClose={() => setDeleteFileConfirmId(null)}
          onConfirm={() => {
            if (deleteFileConfirmId !== null) return executeDeleteFile(deleteFileConfirmId)
          }}
          title={t("sales:contract.delete_file_confirm")}
        />
      </CommonDialog>

      <CommonDialog
        open={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        title={t("sales:contract.payment.title", { defaultValue: "Ghi nhận thanh toán" })}
        size="xl"
        primaryAction={{
          label: t("sales:contract.payment.save", { defaultValue: "Ghi nhận" }),
          onClick: () => void handleRecordPayment(),
          disabled: paymentSubmitting || !isPaymentAmountValid,
        }}
        cancelAction={{
          label: t("common:actions.cancel"),
          onClick: () => setPaymentOpen(false),
          disabled: paymentSubmitting,
        }}
      >
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-lg border bg-muted/20 p-3">
              <p className="text-xs text-muted-foreground">
                {t("sales:contract.financials.revenue")}
              </p>
              <p className="mt-1 font-mono font-semibold">
                {formatCurrency(Number(contract.contract_value || 0))}
              </p>
            </div>
            <div className="rounded-lg border bg-muted/20 p-3">
              <p className="text-xs text-muted-foreground">
                {t("sales:contract.financials.received")}
              </p>
              <p className="mt-1 font-mono font-semibold text-emerald-600">
                {formatCurrency(paymentReceived)}
              </p>
            </div>
            <div className="rounded-lg border bg-muted/20 p-3">
              <p className="text-xs text-muted-foreground">
                {t("sales:contract.financials.outstanding")}
              </p>
              <p className="mt-1 font-mono font-semibold text-amber-600">
                {formatCurrency(outstanding)}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contract-payment" required>
              {t("sales:contract.payment.amount")}
            </Label>
            <Input
              id="contract-payment"
              type="number"
              min="0"
              max={outstanding}
              inputMode="decimal"
              value={paymentAmount}
              onChange={(event) => setPaymentAmount(event.target.value)}
            />
            <p className="text-xs text-muted-foreground">{t("sales:contract.payment.helper")}</p>
          </div>

          {paymentQuickActions.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {paymentQuickActions.map((action) => (
                <Button
                  key={action.key}
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setPaymentAmount(String(Math.round(action.amount)))}
                >
                  {action.key === "full"
                    ? t("sales:contract.payment.use_remaining")
                    : t("sales:contract.payment.use_half_remaining")}
                </Button>
              ))}
            </div>
          )}

          <div className="rounded-lg border border-dashed bg-muted/20 p-4">
            <p className="text-sm font-medium">{t("sales:contract.payment.preview_title")}</p>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground">
                  {t("sales:contract.payment.received_after")}
                </p>
                <p className="mt-1 font-mono font-semibold text-emerald-600">
                  {formatCurrency(nextReceivedPreview)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  {t("sales:contract.payment.outstanding_after")}
                </p>
                <p className="mt-1 font-mono font-semibold text-amber-600">
                  {formatCurrency(nextOutstandingPreview)}
                </p>
              </div>
            </div>
            {paymentAmount && !isPaymentAmountValid && (
              <p className="mt-3 text-xs text-destructive">
                {t("sales:contract.payment.amount_invalid_range")}
              </p>
            )}
          </div>
        </div>
      </CommonDialog>
    </>
  )
}
