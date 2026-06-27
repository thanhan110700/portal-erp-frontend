import { useEffect, useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { CommonDialog } from "@/components/common/CommonDialog"
import { CommonDatePicker } from "@/components/common/CommonDatePicker"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { SearchableSelect } from "@/components/common/SearchableSelect"
import { optionApi, type OptionItem } from "@/shared/api/optionApi"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"

const getExpenseSchema = (t: any) =>
  z.object({
    expense_type: z.string().min(1, t("projects:expenses.form.validation.type_required")),
    amount: z
      .number({ message: t("projects:expenses.form.validation.amount_invalid") })
      .gt(0, t("projects:expenses.form.validation.amount_gt0")),
    expense_date: z.string().min(1, t("projects:expenses.form.validation.date_required")),
    description: z
      .string()
      .min(1, t("projects:expenses.form.validation.description_required"))
      .max(1000, t("projects:expenses.form.validation.description_max")),
  })

interface ProjectExpenseFormModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (payload: any) => Promise<void>
}

export function ProjectExpenseFormModal({ open, onClose, onSubmit }: ProjectExpenseFormModalProps) {
  const { t } = useTranslation(["projects", "common"])
  const [expenseTypes, setExpenseTypes] = useState<OptionItem[]>([])

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(getExpenseSchema(t)),
    defaultValues: {
      expense_type: "",
      amount: 0,
      expense_date: "",
      description: "",
    },
  })

  useEffect(() => {
    if (open) {
      optionApi.getExpenseTypes().then(setExpenseTypes).catch(console.error)

      reset({
        expense_type: "",
        amount: 0,
        expense_date: new Date().toISOString().split("T")[0],
        description: "",
      })
    }
  }, [open, reset])

  const handleFormSubmit = async (data: any) => {
    try {
      const payload = {
        expense_type: data.expense_type,
        amount: data.amount,
        expense_date: data.expense_date,
        description: data.description,
      }
      await onSubmit(payload)
    } catch (error) {
      console.error(error)
      toast.error(t("projects:expenses.form.validation.save_error"))
    }
  }

  return (
    <CommonDialog
      open={open}
      onClose={onClose}
      title={t("projects:expenses.form.title")}
      size="lg"
      primaryAction={{
        label: isSubmitting
          ? t("projects:expenses.form.submitting")
          : t("projects:expenses.form.submit"),
        type: "submit",
        form: "project-expense-form",
        disabled: isSubmitting,
      }}
      cancelAction={{
        label: t("common:action.cancel"),
        disabled: isSubmitting,
        onClick: onClose,
      }}
    >
      <form
        id="project-expense-form"
        onSubmit={handleSubmit(handleFormSubmit)}
        className="grid gap-4 py-2"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>{t("projects:expenses.form.type")}</Label>
            <Controller
              name="expense_type"
              control={control}
              render={({ field }) => (
                <SearchableSelect
                  value={field.value}
                  onValueChange={field.onChange}
                  options={expenseTypes.map((t) => ({
                    label: t.label,
                    value: t.value?.toString() || t.id?.toString() || "",
                  }))}
                  placeholder={t("projects:expenses.form.type_placeholder")}
                />
              )}
            />
            {errors.expense_type && (
              <p className="text-xs text-destructive">{errors.expense_type.message as string}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ex-amount">{t("projects:expenses.form.amount")}</Label>
            <Input
              id="ex-amount"
              type="number"
              inputMode="decimal"
              min="0"
              placeholder={t("projects:expenses.form.amount_placeholder")}
              {...register("amount", { valueAsNumber: true })}
            />
            {errors.amount && (
              <p className="text-xs text-destructive">{errors.amount.message as string}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Controller
              name="expense_date"
              control={control}
              render={({ field, fieldState }) => (
                <CommonDatePicker
                  label={t("projects:expenses.form.date")}
                  value={field.value || null}
                  onChange={field.onChange}
                  error={fieldState.error?.message}
                  required
                />
              )}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="ex-desc">{t("projects:expenses.form.description")}</Label>
          <Textarea
            id="ex-desc"
            rows={3}
            placeholder={t("projects:expenses.form.description_placeholder")}
            {...register("description")}
            className="resize-none"
          />
          {errors.description && (
            <p className="text-xs text-destructive">{errors.description.message as string}</p>
          )}
        </div>
      </form>
    </CommonDialog>
  )
}
