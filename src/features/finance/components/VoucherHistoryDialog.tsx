import { useEffect, useState } from "react"
import { CommonDialog } from "@/components/common/CommonDialog"
import { voucherApi } from "../api/voucherApi"
import type { VoucherAuditLog } from "../types/voucher"
import { Calendar, User, Clock, ArrowRight } from "lucide-react"
import dayjs from "dayjs"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"

interface VoucherHistoryDialogProps {
  open: boolean
  onClose: () => void
  voucherId: number
  voucherCode: string
}

export function VoucherHistoryDialog({
  open,
  onClose,
  voucherId,
  voucherCode,
}: VoucherHistoryDialogProps) {
  const { t } = useTranslation(["finance", "common"])
  const [history, setHistory] = useState<VoucherAuditLog[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [prevOpen, setPrevOpen] = useState(false)
  const [prevVoucherId, setPrevVoucherId] = useState<number | null>(null)

  if (open !== prevOpen || voucherId !== prevVoucherId) {
    setPrevOpen(open)
    setPrevVoucherId(voucherId)
    if (open) {
      setIsLoading(true)
      setHistory([])
    }
  }

  useEffect(() => {
    if (open && voucherId) {
      voucherApi
        .getHistory(voucherId)
        .then((data) => {
          setHistory(data || [])
        })
        .catch(() => {
          toast.error(t("finance:history.fetch_error"))
        })
        .finally(() => {
          setIsLoading(false)
        })
    }
  }, [open, voucherId, t])

  return (
    <CommonDialog
      open={open}
      onClose={onClose}
      title={t("finance:history.title", { code: voucherCode })}
      size="lg"
      cancelAction={{
        label: t("finance:history.close"),
        onClick: onClose,
      }}
    >
      {isLoading ? (
        <div className="flex h-32 items-center justify-center">
          <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : history.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground">{t("finance:history.empty")}</div>
      ) : (
        <div className="relative border-l border-muted pl-6 ml-2 py-2 space-y-6">
          {history.map((log) => (
            <div key={log.id} className="relative">
              {/* Timeline dot */}
              <span className="absolute -left-[31px] top-1.5 flex size-4 items-center justify-center rounded-full bg-primary/20 ring-4 ring-background">
                <Clock className="size-2 text-primary" />
              </span>

              <div className="space-y-1.5 bg-muted/20 p-3 rounded-lg border">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5 font-medium text-foreground">
                    <User className="size-3.5 text-muted-foreground" />
                    <span>
                      {log.user?.full_name || t("finance:history.user_id", { id: log.user?.id })}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="size-3.5" />
                    <span>{dayjs(log.created_at).format("DD/MM/YYYY HH:mm")}</span>
                  </div>
                </div>

                <div className="text-sm font-semibold text-foreground">
                  {log.action_label || log.action}
                </div>

                {log.notes && (
                  <p className="text-xs text-muted-foreground bg-background p-2 rounded border-l-2 border-primary/50">
                    {t("finance:history.opinion")} {log.notes}
                  </p>
                )}

                {/* Render differences if changes exist */}
                {log.changes && Object.keys(log.changes).length > 0 && (
                  <div className="mt-2 text-xs space-y-1 bg-background p-2 rounded border border-dashed">
                    <p className="font-semibold text-muted-foreground mb-1">
                      {t("finance:history.changes_title")}
                    </p>
                    {Object.entries(log.changes).map(
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      ([field, delta]: [string, any]) => {
                        const from = delta.old ?? "—"
                        const to = delta.new ?? "—"
                        const fromStr =
                          typeof from === "object"
                            ? JSON.stringify(from)
                            : String(from as string | number | boolean | null | undefined)
                        const toStr =
                          typeof to === "object"
                            ? JSON.stringify(to)
                            : String(to as string | number | boolean | null | undefined)
                        return (
                          <div key={field} className="flex items-center gap-2 truncate">
                            <span className="font-mono text-muted-foreground">{field}:</span>
                            <span className="line-through text-rose-500">{fromStr}</span>
                            <ArrowRight className="size-3 text-muted-foreground shrink-0" />
                            <span className="text-emerald-600 font-semibold">{toStr}</span>
                          </div>
                        )
                      },
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </CommonDialog>
  )
}
