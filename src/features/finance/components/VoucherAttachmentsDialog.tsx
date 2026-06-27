import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { CommonDialog } from "@/components/common/CommonDialog"
import { FileUploadField } from "@/components/common/FileUploadField"
import { Button } from "@/components/ui/button"
import { Download, Trash2, FileText, Upload } from "lucide-react"
import { voucherApi } from "../api/voucherApi"
import type { Voucher } from "../types/voucher"
import { toast } from "sonner"

interface VoucherAttachmentsDialogProps {
  open: boolean
  onClose: () => void
  voucherId: number
  voucherCode: string
  onRefresh: () => void
}

const fileSchema = z.object({
  file: z.any().refine((val) => val instanceof File, "Vui lòng chọn tệp tin"),
})

export function VoucherAttachmentsDialog({
  open,
  onClose,
  voucherId,
  voucherCode,
  onRefresh,
}: VoucherAttachmentsDialogProps) {
  const [voucher, setVoucher] = useState<Voucher | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const {
    handleSubmit,
    control,
    reset,
    formState: { isSubmitting },
  } = useForm({
    resolver: zodResolver(fileSchema),
    defaultValues: {
      file: null,
    },
  })

  const loadVoucher = async () => {
    setIsLoading(true)
    try {
      const data = await voucherApi.get(voucherId)
      setVoucher(data)
    } catch {
      toast.error("Không thể tải tài liệu chứng từ")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (open && voucherId) {
      loadVoucher()
    }
  }, [open, voucherId])

  const handleUpload = async (data: any) => {
    try {
      await voucherApi.uploadFile(voucherId, data.file)
      toast.success("Tải đính kèm thành công")
      reset({ file: null })
      loadVoucher()
      onRefresh()
    } catch {
      toast.error("Tải đính kèm thất bại")
    }
  }

  const handleDelete = async (fileId: number) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa tài liệu đính kèm này?")) return
    try {
      await voucherApi.deleteFile(voucherId, fileId)
      toast.success("Đã xóa tài liệu đính kèm")
      loadVoucher()
      onRefresh()
    } catch {
      toast.error("Xóa tài liệu thất bại")
    }
  }

  return (
    <CommonDialog
      open={open}
      onClose={onClose}
      title={`Tài liệu đính kèm: ${voucherCode}`}
      size="lg"
      cancelAction={{
        label: "Đóng",
        onClick: onClose,
      }}
    >
      <div className="space-y-6 py-2">
        <form onSubmit={handleSubmit(handleUpload)} className="space-y-3">
          <FileUploadField
            control={control}
            name="file"
            label="Chọn tài liệu chứng từ mới"
            accept=".pdf,.jpg,.jpeg,.png,.xlsx,.xls,.docx,.doc"
            hint="Hỗ trợ PDF, hình ảnh hoặc bảng tính Excel lên đến 10 MB"
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
              {isSubmitting ? "Đang tải lên..." : "Tải lên tài liệu"}
            </Button>
          </div>
        </form>

        <div className="border-t pt-4">
          <h4 className="font-semibold text-sm mb-3">Danh sách đính kèm hiện tại</h4>
          {isLoading ? (
            <div className="flex h-20 items-center justify-center">
              <div className="size-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : !voucher?.files || voucher.files.length === 0 ? (
            <p className="text-center text-xs text-muted-foreground py-4">
              Chưa có tài liệu đính kèm nào.
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
