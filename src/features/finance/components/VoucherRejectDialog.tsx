import { useState } from "react"
import { CommonDialog } from "@/components/common/CommonDialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useTranslation } from "react-i18next"

interface VoucherRejectDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: (reason: string) => void
  isSubmitting?: boolean
}

export function VoucherRejectDialog({
  open,
  onClose,
  onConfirm,
  isSubmitting,
}: VoucherRejectDialogProps) {
  const { t } = useTranslation(["finance", "common"])
  const [reason, setReason] = useState("")

  // Reset state when opening
  if (open && reason === "" && isSubmitting === false) {
    // This is safe here because we only set state if needed, but useEffect is better
  }

  const handleConfirm = () => {
    if (!reason.trim()) return
    onConfirm(reason)
  }

  return (
    <CommonDialog
      open={open}
      onClose={() => {
        setReason("")
        onClose()
      }}
      title={t("finance:reject_dialog.title")}
      size="sm"
      primaryAction={{
        label: t("finance:reject_dialog.confirm"),
        onClick: handleConfirm,
        disabled: !reason.trim() || isSubmitting,
        loading: isSubmitting,
        variant: "destructive",
      }}
      cancelAction={{
        label: t("finance:reject_dialog.cancel"),
        onClick: () => {
          setReason("")
          onClose()
        },
      }}
    >
      <div className="space-y-4 py-2">
        <div className="space-y-2">
          <Label htmlFor="reject_reason" required className="text-destructive font-semibold">
            {t("finance:reject_dialog.reason_label")}
          </Label>
          <Textarea
            id="reject_reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={t("finance:reject_dialog.reason_placeholder")}
            className="resize-none h-24"
            disabled={isSubmitting}
            autoFocus
          />
        </div>
      </div>
    </CommonDialog>
  )
}
