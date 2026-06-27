import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { CommonDialog } from "@/components/common/CommonDialog"
import { FileUploadField } from "@/components/common/FileUploadField"
import { Form } from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { Download, Trash2, FileText, Upload } from "lucide-react"
import { quoteApi } from "../api/quoteApi"
import type { Quote } from "../types/sales"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"
import type { TFunction } from "i18next"

interface QuoteFilesDialogProps {
  open: boolean
  onClose: () => void
  quoteId: number
  quoteTitle: string
  onRefresh: () => void
}

const createFileSchema = (t: TFunction) =>
  z.object({
    file: z
      .any()
      .refine((val) => val instanceof File, t("sales:quote.files.validation.file_required")),
  })

export function QuoteFilesDialog({
  open,
  onClose,
  quoteId,
  quoteTitle,
  onRefresh,
}: QuoteFilesDialogProps) {
  const { t } = useTranslation()
  const [quote, setQuote] = useState<Quote | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const form = useForm({
    resolver: zodResolver(createFileSchema(t)),
    defaultValues: {
      file: null,
    },
  })

  const {
    handleSubmit,
    control,
    reset,
    formState: { isSubmitting },
  } = form

  const loadQuote = async () => {
    setIsLoading(true)
    try {
      const data = await quoteApi.get(quoteId)
      setQuote(data)
    } catch {
      toast.error(t("sales:quote.files.fetch_error"))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (open && quoteId) {
      loadQuote()
    }
  }, [open, quoteId])

  const handleUpload = async (data: any) => {
    try {
      await quoteApi.uploadFile(quoteId, data.file)
      toast.success(t("sales:quote.files.upload_success"))
      reset({ file: null })
      loadQuote()
      onRefresh()
    } catch {
      toast.error(t("sales:quote.files.upload_error"))
    }
  }

  const handleDelete = async (fileId: number) => {
    if (!window.confirm(t("sales:quote.files.delete_confirm"))) return
    try {
      await quoteApi.deleteFile(quoteId, fileId)
      toast.success(t("sales:quote.files.delete_success"))
      loadQuote()
      onRefresh()
    } catch {
      toast.error(t("sales:quote.files.delete_error"))
    }
  }

  return (
    <CommonDialog
      open={open}
      onClose={onClose}
      title={t("sales:quote.files.title", { code: quoteTitle })}
      size="lg"
      cancelAction={{
        label: t("common:actions.close"),
        onClick: onClose,
      }}
    >
      <div className="space-y-6 py-2">
        <Form {...form}>
          <form onSubmit={handleSubmit(handleUpload)} className="space-y-3">
            <FileUploadField
              control={control}
              name="file"
              label={t("sales:quote.files.select_file")}
              accept=".pdf,.jpg,.jpeg,.png,.xlsx,.xls,.docx,.doc"
              hint={t("sales:quote.files.file_hint")}
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
                {isSubmitting ? t("sales:quote.files.uploading") : t("sales:quote.files.upload")}
              </Button>
            </div>
          </form>
        </Form>

        <div className="border-t pt-4">
          <h4 className="font-semibold text-sm mb-3">{t("sales:quote.files.current_files")}</h4>
          {isLoading ? (
            <div className="flex h-20 items-center justify-center">
              <div className="size-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : !quote?.files || quote.files.length === 0 ? (
            <p className="text-center text-xs text-muted-foreground py-4">
              {t("sales:quote.files.no_files")}
            </p>
          ) : (
            <div className="divide-y rounded-lg border bg-background">
              {quote.files.map((file) => (
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
                      onClick={() => handleDelete(file.id)}
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
