import { useEffect, useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { Info } from "lucide-react"
import { CommonDialog } from "@/components/common/CommonDialog"
import { CommonDatePicker } from "@/components/common/CommonDatePicker"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { SubmitTimesheetPayload } from "../types/timesheet"
import { useTranslation, Trans } from "react-i18next"
import { toast } from "sonner"

interface TimesheetFormData {
  timesheet_date: string
  check_in_time: string // "HH:mm" from time input — we'll convert
  check_out_time: string
  notes: string
}

interface SubmitTimesheetModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (payload: SubmitTimesheetPayload) => Promise<void>
}

/** Convert date + HH:mm → "YYYY-MM-DD HH:mm:ss" for backend */
function toDateTimeString(date: string, time: string): string | null {
  if (!date || !time) return null
  return `${date} ${time}:00`
}

/** Auto-calculate working hours from check-in/out time strings */
function calcWorkingHours(date: string, checkIn: string, checkOut: string): number | null {
  if (!date || !checkIn || !checkOut) return null
  const inMs = new Date(`${date}T${checkIn}:00`).getTime()
  const outMs = new Date(`${date}T${checkOut}:00`).getTime()
  if (outMs <= inMs) return null
  return Math.round(((outMs - inMs) / 3_600_000) * 100) / 100
}

export function SubmitTimesheetModal({ open, onClose, onSubmit }: SubmitTimesheetModalProps) {
  const { t } = useTranslation(["hr", "common"])
  const [previewHours, setPreviewHours] = useState<number | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    reset,
    control,
    formState: { isSubmitting },
  } = useForm<TimesheetFormData>({
    defaultValues: {
      timesheet_date: new Date().toISOString().split("T")[0], // today
      check_in_time: "",
      check_out_time: "",
      notes: "",
    },
  })

  // Live preview of working hours
  const watchedDate = watch("timesheet_date")
  const watchedIn = watch("check_in_time")
  const watchedOut = watch("check_out_time")

  useEffect(() => {
    setPreviewHours(calcWorkingHours(watchedDate, watchedIn, watchedOut))
  }, [watchedDate, watchedIn, watchedOut])

  useEffect(() => {
    if (open) {
      reset({
        timesheet_date: new Date().toISOString().split("T")[0],
        check_in_time: "",
        check_out_time: "",
        notes: "",
      })
      setPreviewHours(null)
    }
  }, [open, reset])

  const handleFormSubmit = async (data: TimesheetFormData) => {
    if (data.check_in_time && data.check_out_time) {
      if (data.check_out_time <= data.check_in_time) {
        toast.error(
          t("hr:timesheet.form.validation.time_invalid", {
            defaultValue: "Giờ ra phải sau giờ vào",
          }),
        )
        return
      }
    }

    const payload: SubmitTimesheetPayload = {
      timesheet_date: data.timesheet_date,
      check_in_time: toDateTimeString(data.timesheet_date, data.check_in_time),
      check_out_time: toDateTimeString(data.timesheet_date, data.check_out_time),
      notes: data.notes || null,
    }
    await onSubmit(payload)
  }

  return (
    <CommonDialog
      open={open}
      onClose={onClose}
      title={t("hr:timesheet.form.title")}
      size="md"
      primaryAction={{
        label: isSubmitting ? t("common:table.loading") : t("hr:timesheet.form.submit"),
        type: "submit",
        form: "timesheet-form",
        disabled: isSubmitting,
      }}
      cancelAction={{
        label: t("common:actions.cancel"),
        disabled: isSubmitting,
        onClick: onClose,
      }}
    >
      <form
        id="timesheet-form"
        onSubmit={handleSubmit(handleFormSubmit)}
        className="flex flex-col gap-4 py-2"
      >
        {/* Date */}
        <div className="flex flex-col gap-1.5">
          <Controller
            name="timesheet_date"
            control={control}
            rules={{ required: t("hr:timesheet.form.date_required") }}
            render={({ field, fieldState }) => (
              <CommonDatePicker
                label={t("hr:timesheet.form.date")}
                value={field.value || null}
                onChange={field.onChange}
                error={fieldState.error?.message}
                required
              />
            )}
          />
        </div>

        {/* Time row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ts-in" className="text-sm font-medium">
              {t("hr:timesheet.form.check_in")}
            </Label>
            <Input id="ts-in" type="time" {...register("check_in_time")} className="h-9" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ts-out" className="text-sm font-medium">
              {t("hr:timesheet.form.check_out")}
            </Label>
            <Input id="ts-out" type="time" {...register("check_out_time")} className="h-9" />
          </div>
        </div>

        {/* Live working hours preview */}
        {previewHours !== null && (
          <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2">
            <Info className="size-4 text-primary shrink-0" />
            <span className="text-sm text-primary font-medium">
              {t("hr:timesheet.summary_hours")}: <strong>{previewHours}h</strong>
            </span>
          </div>
        )}

        {/* Notes */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ts-notes" className="text-sm font-medium">
            {t("hr:timesheet.form.notes")}
          </Label>
          <Textarea
            id="ts-notes"
            placeholder={t("hr:timesheet.form.notes_placeholder")}
            rows={3}
            {...register("notes")}
            className="resize-none text-sm"
          />
        </div>

        {/* Policy notice */}
        <p className="text-xs text-muted-foreground bg-muted/40 rounded-lg px-3 py-2">
          📌 <Trans i18nKey="hr:timesheet.form.policy_notice" components={{ 1: <strong /> }} />
        </p>
      </form>
    </CommonDialog>
  )
}
