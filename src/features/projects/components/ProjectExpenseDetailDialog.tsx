import { FileText, Calendar, DollarSign, User, AlertCircle } from "lucide-react"

import { CommonDialog } from "@/components/common/CommonDialog"
import { StatusBadge } from "@/components/common/StatusBadge"
import { Separator } from "@/components/ui/separator"
import type { ProjectExpense } from "../types/project"
import { useTranslation } from "react-i18next"

interface ProjectExpenseDetailDialogProps {
  open: boolean
  onClose: () => void
  expense: ProjectExpense | null
  canApprove: boolean
  onApprove: (id: number) => void
  onReject: (id: number) => void
}

export function ProjectExpenseDetailDialog({
  open,
  onClose,
  expense,
  canApprove,
  onApprove,
  onReject,
}: ProjectExpenseDetailDialogProps) {
  const { t } = useTranslation(["projects", "common"])

  if (!expense) return null

  const isPending = expense.status === "pending"

  return (
    <CommonDialog
      open={open}
      onClose={onClose}
      size="md"
      title={
        <div className="flex items-center gap-3">
          <span>{t("projects:expenses.detail_title", { defaultValue: "Chi tiết Chi phí" })}</span>
          <StatusBadge status={expense.status} />
        </div>
      }
      primaryAction={
        canApprove && isPending
          ? {
              label: t("projects:expenses.actions.approve", { defaultValue: "Duyệt" }),
              onClick: () => onApprove(expense.id),
            }
          : undefined
      }
      extraActions={
        canApprove && isPending
          ? [
              {
                label: t("projects:expenses.actions.reject", { defaultValue: "Từ chối" }),
                onClick: () => onReject(expense.id),
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
      <div className="space-y-6 pb-8">
        <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-muted/20 border">
          <div>
            <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1.5">
              <DollarSign className="size-4" /> {t("projects:expenses.form.amount")}
            </p>
            <p className="text-lg font-bold font-mono text-foreground">
              {Number(expense.amount).toLocaleString("vi-VN")} VNĐ
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1.5">
              <Calendar className="size-4" /> {t("projects:expenses.form.date")}
            </p>
            <p className="font-medium text-foreground">{expense.expense_date}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1.5">
              <FileText className="size-4" /> {t("projects:expenses.form.type")}
            </p>
            <p className="font-medium text-foreground">
              {expense.expense_type
                ? t(`projects:expense_types.${expense.expense_type}`, {
                    defaultValue: expense.expense_type,
                  })
                : "—"}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1.5">
              <User className="size-4" /> {t("projects:expenses.approvers.requester")}
            </p>
            <p className="font-medium text-foreground">{expense.user?.full_name || "—"}</p>
          </div>
          {expense.voucher && (
            <div className="col-span-2">
              <Separator className="my-2" />
              <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1.5">
                <FileText className="size-4" />{" "}
                {t("projects:expenses.fields.voucher", { defaultValue: "Phiếu chi liên kết" })}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="font-mono text-sm font-medium">
                  {expense.voucher.voucher_code}
                </span>
                <StatusBadge status={expense.voucher.status} />
              </div>
            </div>
          )}
        </div>

        <div>
          <h3 className="font-semibold text-lg mb-2">{t("projects:expenses.form.description")}</h3>
          <p className="text-foreground whitespace-pre-wrap">
            {expense.description ||
              t("projects:detail.no_description", { defaultValue: "Không có mô tả" })}
          </p>
        </div>

        {expense.approver && (
          <>
            <Separator />
            <div className="space-y-2">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <AlertCircle className="size-4" />
                {t("projects:expenses.approvers.approver", { defaultValue: "Người duyệt" })}
              </h3>
              <p className="text-foreground font-medium">{expense.approver.full_name}</p>
            </div>
          </>
        )}
      </div>
    </CommonDialog>
  )
}
