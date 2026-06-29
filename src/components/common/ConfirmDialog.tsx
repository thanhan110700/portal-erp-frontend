import { useTranslation } from "react-i18next"
import { CommonDialog } from "./CommonDialog"

interface ConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void | Promise<void>
  title?: string
  description?: string
  confirmText?: string
  cancelText?: string
  isDangerous?: boolean
  loading?: boolean
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmText,
  cancelText,
  isDangerous = true,
  loading = false,
}: ConfirmDialogProps) {
  const { t } = useTranslation("common")

  const handleConfirm = async () => {
    await onConfirm()
  }

  return (
    <CommonDialog
      open={open}
      onClose={onClose}
      title={title || t("messages.deleteConfirm")}
      description={description}
      size="sm"
      primaryAction={{
        label: confirmText || t("actions.confirm"),
        onClick: () => void handleConfirm(),
        variant: isDangerous ? "destructive" : "default",
        loading: loading,
      }}
      cancelAction={{
        label: cancelText || t("actions.cancel"),
        onClick: onClose,
        disabled: loading,
      }}
    />
  )
}
