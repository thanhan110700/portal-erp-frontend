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
import { StatusBadge } from "@/components/common/StatusBadge"
import { SearchableSelect } from "@/components/common/SearchableSelect"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Form } from "@/components/ui/form"
import { FileUploadField } from "@/components/common/FileUploadField"
import { useAuthStore } from "@/hooks/useAuthStore"
import { hasPermission, PermissionSlugs } from "@/constants/permissions"

import { contractApi } from "../api/contractApi"
import type { Contract } from "../types/sales"

interface ContractDetailDialogProps {
  open: boolean
  onClose: () => void
  contractId: number
  onRefresh: () => void
}

const CONTRACT_STATUS_OPTIONS = [
  { value: "Draft", label: "Nháp" },
  { value: "Signed", label: "Đã ký" },
  { value: "Ongoing", label: "Đang thực hiện" },
  { value: "Completed", label: "Hoàn tất" },
]

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
  const [isLoading, setIsLoading] = useState(true)
  const [statusUpdating, setStatusUpdating] = useState(false)

  const form = useForm({
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
      const data = await contractApi.get(contractId)
      setContract(data)
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

  const handleUpload = async (data: any) => {
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

  const handleDeleteFile = async (fileId: number) => {
    if (!window.confirm(t("sales:contract.delete_file_confirm"))) return
    try {
      await contractApi.deleteFile(contractId, fileId)
      toast.success(t("sales:contract.delete_file_success"))
      await loadData()
      onRefresh()
    } catch {
      toast.error(t("sales:contract.delete_file_error"))
    }
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

  return (
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
              {contract.customer?.customer_name || contract.customer?.name || "—"}{" "}
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
            <h3 className="font-semibold text-sm mb-2">{t("sales:contract.form.fields.terms")}</h3>
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
                      hint={t("sales:contract.upload_hint", { defaultValue: "PDF, Word, Images" })}
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
                          ? t("common:action.saving")
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
    </CommonDialog>
  )
}
