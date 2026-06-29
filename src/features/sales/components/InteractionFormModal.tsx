import { useEffect, useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { CommonDialog } from "@/components/common/CommonDialog"
import { CommonDatePicker } from "@/components/common/CommonDatePicker"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { SearchableSelect } from "@/components/common/SearchableSelect"
import type { CreateInteractionPayload } from "../types/sales"
import { optionApi, type OptionItem } from "@/shared/api/optionApi"
import { useAuthStore } from "@/hooks/useAuthStore"
import { useTranslation } from "react-i18next"

interface InteractionFormModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (payload: CreateInteractionPayload) => Promise<void>
}

export function InteractionFormModal({ open, onClose, onSubmit }: InteractionFormModalProps) {
  const { t } = useTranslation()
  const [types, setTypes] = useState<OptionItem[]>([])
  const user = useAuthStore((s) => s.user)

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CreateInteractionPayload>({
    defaultValues: {
      type: "Call",
      interaction_date: new Date().toISOString().split("T")[0],
      content: "",
      user_id: user?.id || 0,
    },
  })

  useEffect(() => {
    if (open) {
      optionApi.getInteractionTypes().then(setTypes).catch(console.error)
    }
  }, [open])

  return (
    <CommonDialog
      open={open}
      onClose={onClose}
      title={t("sales:interaction.add_title")}
      size="md"
      primaryAction={{
        label: t("sales:interaction.save"),
        type: "submit",
        form: "interaction-form",
        disabled: isSubmitting,
      }}
      cancelAction={{
        label: t("common:actions.cancel"),
        disabled: isSubmitting,
        onClick: onClose,
      }}
    >
      <form id="interaction-form" onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-2">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="i-type" required>
              {t("sales:interaction.fields.type")}
            </Label>
            <Controller
              name="type"
              control={control}
              rules={{ required: t("sales:interaction.validation.type_required") }}
              render={({ field }) => (
                <SearchableSelect
                  value={field.value || ""}
                  onValueChange={field.onChange}
                  options={
                    types.length > 0
                      ? types.map((item) => ({
                          label: item.label,
                          value: item.value.toString(),
                        }))
                      : [
                          { label: t("sales:interaction.default_types.call"), value: "Call" },
                          { label: t("sales:interaction.default_types.email"), value: "Email" },
                          { label: t("sales:interaction.default_types.meeting"), value: "Meeting" },
                          { label: t("sales:interaction.default_types.zalo"), value: "Zalo" },
                        ]
                  }
                  placeholder={t("sales:interaction.fields.type_placeholder")}
                />
              )}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Controller
              name="interaction_date"
              control={control}
              rules={{ required: t("sales:interaction.validation.date_required") }}
              render={({ field, fieldState }) => (
                <CommonDatePicker
                  label={t("sales:interaction.fields.date")}
                  value={field.value || null}
                  onChange={field.onChange}
                  error={fieldState.error?.message}
                  required
                />
              )}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="i-content" required>
            {t("sales:interaction.fields.content")}
          </Label>
          <Textarea
            id="i-content"
            rows={4}
            placeholder={t("sales:interaction.fields.content_placeholder")}
            {...register("content", {
              required: t("sales:interaction.validation.content_required"),
            })}
            aria-invalid={!!errors.content}
          />
          {errors.content && <p className="text-xs text-destructive">{errors.content.message}</p>}
        </div>
      </form>
    </CommonDialog>
  )
}
