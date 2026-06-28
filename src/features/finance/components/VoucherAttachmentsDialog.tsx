import { useState, useEffect, useCallback } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { CommonDialog } from "@/components/common/CommonDialog"
import { FileUploadField } from "@/components/common/FileUploadField"
import { Form } from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { Download, Trash2, FileText, Upload } from "lucide-react"
import { voucherApi } from "../api/voucherApi"
import type { Voucher } from "../types/voucher"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"

interface VoucherAttachmentsDialogProps {
  open: boolean
  onClose: () => void
  voucherId: number
  voucherCode: string
  onRefresh: () => void
}

const getFileSchema = (t: (key: string) => string) =>
  z.object({
    file: z.custom<File>(
      (val) => val instanceof File,
      t("finance:attachments.validation.file_required"),
    ),
  })

export function VoucherAttachmentsDialog({
  open,
  onClose,
  voucherId,
  voucherCode,
  onRefresh,
}: VoucherAttachmentsDialogProps) {
  const { t } = useTranslation(["finance", "common"])
  const [voucher, setVoucher] = useState<Voucher | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const form = useForm({
    resolver: zodResolver(getFileSchema(t)),
    defaultValues: {
      file: undefined,
    },
  })

  const {
    handleSubmit,
    control,
    reset,
    formState: { isSubmitting },
  } = form

  const loadVoucher = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await voucherApi.get(voucherId)
      setVoucher(data)
    } catch {
      toast.error(t("finance:attachments.fetch_error"))
    } finally {
      setIsLoading(false)
    }
  }, [voucherId, t])

  useEffect(() => {
    if (open && voucherId) {
      void loadVoucher()
    }
  }, [open, voucherId, loadVoucher])

  const handleUpload = async (data: { file: File }) => {
    try {
      await voucherApi.uploadFile(voucherId, data.file)
      toast.success(t("finance:attachments.upload_success"))
      reset({ file: undefined } as unknown as { file: File })
      void loadVoucher()
      onRefresh()
    } catch {
      toast.error(t("finance:attachments.upload_error"))
    }
  }

  const handleDelete = async (fileId: number) => {
    if (!window.confirm(t("finance:attachments.delete_confirm"))) return
    try {
      await voucherApi.deleteFile(voucherId, fileId)
      toast.success(t("finance:attachments.delete_success"))
      void loadVoucher()
      onRefresh()
    } catch {
      toast.error(t("finance:attachments.delete_error"))
    }
  }

  return (
    <CommonDialog
      open={open}
      onClose={onClose}
      title={t("finance:attachments.title", { code: voucherCode })}
      size="lg"
      cancelAction={{
        label: t("finance:attachments.close"),
        onClick: onClose,
      }}
    >
      <div className="space-y-6 py-2">
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
                size="sm"
                className="gap-2 min-h-11 md:min-h-9"
              >
                <Upload className="size-4" />
                {isSubmitting
                  ? t("finance:attachments.uploading")
                  : t("finance:attachments.upload_button")}
              </Button>
            </div>
          </form>
        </Form>

        <div className="border-t pt-4">
          <h4 className="font-semibold text-sm mb-3">{t("finance:attachments.list_title")}</h4>
          {isLoading ? (
            <div className="flex h-20 items-center justify-center">
              <div className="size-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : !voucher?.files || voucher.files.length === 0 ? (
            <p className="text-center text-xs text-muted-foreground py-4">
              {t("finance:attachments.empty")}
            </p>
          ) : (
            <div className="divide-y rounded-lg border bg-background">
              {voucher.files.map((file) => (
                <div key={file.id} className="flex items-center justify-between p-3">
                  <div className="flex items-center gap-2 truncate">
                    <FileText className="size-4 text-muted-foreground shrink-0" />
                    <span className="text-sm truncate font-medium text-foreground">
                      {file.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" asChild className="size-11 md:size-8">
                      <a href={file.url} download target="_blank" rel="noopener noreferrer">
                        <Download className="size-4" />
                      </a>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-11 md:size-8 text-muted-foreground hover:text-destructive"
                      onClick={() => void handleDelete(file.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
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
