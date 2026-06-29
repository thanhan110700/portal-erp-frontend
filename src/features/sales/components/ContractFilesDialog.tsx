import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { CommonDialog } from "@/components/common/CommonDialog"
import { ConfirmDialog } from "@/components/common/ConfirmDialog"
import { FileUploadField } from "@/components/common/FileUploadField"
import { Form } from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { Download, Trash2, FileText, Upload } from "lucide-react"
import { contractApi } from "../api/contractApi"
import type { Contract } from "../types/sales"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"
import type { TFunction } from "i18next"

interface ContractFilesDialogProps {
  open: boolean
  onClose: () => void
  contractId: number
  contractTitle: string
  onRefresh: () => void
}

const createFileSchema = (t: TFunction) =>
  z.object({
    file: z
      .any()
      .refine((val) => val instanceof File, t("sales:contract.files.validation.file_required")),
  })

export function ContractFilesDialog({
  open,
  onClose,
  contractId,
  contractTitle,
  onRefresh,
}: ContractFilesDialogProps) {
  const { t } = useTranslation()
  const [contract, setContract] = useState<Contract | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null)

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

  const loadContract = async () => {
    setIsLoading(true)
    try {
      const data = await contractApi.get(contractId)
      setContract(data)
    } catch {
      toast.error(t("sales:contract.files.fetch_error"))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (open && contractId) {
      loadContract()
    }
  }, [open, contractId])

  const handleUpload = async (data: any) => {
    try {
      await contractApi.uploadFile(contractId, data.file)
      toast.success(t("sales:contract.files.upload_success"))
      reset({ file: null })
      loadContract()
      onRefresh()
    } catch {
      toast.error(t("sales:contract.files.upload_error"))
    }
  }

  const executeDelete = async (fileId: number) => {
    try {
      await contractApi.deleteFile(contractId, fileId)
      toast.success(t("sales:contract.files.delete_success"))
      loadContract()
      onRefresh()
    } catch {
      toast.error(t("sales:contract.files.delete_error"))
    } finally {
      setDeleteConfirmId(null)
    }
  }

  const handleDelete = (fileId: number) => {
    setDeleteConfirmId(fileId)
  }

  return (
    <CommonDialog
      open={open}
      onClose={onClose}
      title={t("sales:contract.files.title", { code: contractTitle })}
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
              label={t("sales:contract.files.select_file")}
              accept=".pdf,.jpg,.jpeg,.png,.xlsx,.xls,.docx,.doc"
              hint={t("sales:contract.files.file_hint")}
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
                  ? t("sales:contract.files.uploading")
                  : t("sales:contract.files.upload")}
              </Button>
            </div>
          </form>
        </Form>

        <div className="border-t pt-4">
          <h4 className="font-semibold text-sm mb-3">{t("sales:contract.files.current_files")}</h4>
          {isLoading ? (
            <div className="flex h-20 items-center justify-center">
              <div className="size-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : !contract?.files || contract.files.length === 0 ? (
            <p className="text-center text-xs text-muted-foreground py-4">
              {t("sales:contract.files.no_files")}
            </p>
          ) : (
            <div className="divide-y rounded-lg border bg-background">
              {contract.files.map((file) => (
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
      <ConfirmDialog
        open={deleteConfirmId !== null}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={() => {
          if (deleteConfirmId !== null) return executeDelete(deleteConfirmId)
        }}
        title={t("sales:contract.files.delete_confirm")}
      />
    </CommonDialog>
  )
}
