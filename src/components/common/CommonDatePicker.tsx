import * as React from "react"

import { cn } from "@/lib/utils"
import { DatePicker } from "@/components/ui/date-picker"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CommonDatePickerProps {
  /** ISO date string YYYY-MM-DD or null */
  value: string | null
  onChange: (value: string | null) => void
  /**
   * Called when the picker loses focus.
   * Pass `field.onBlur` from React Hook Form Controller to enable
   * touched / dirty state tracking.
   */
  onBlur?: () => void

  // ── Customisation ────────────────────────────────────────────────────────
  /** Label rendered above the picker */
  label?: string
  /** Placeholder text inside the trigger button */
  placeholder?: string
  /** Validation error message rendered below the picker */
  error?: string
  /** Helper / hint text rendered below the picker (hidden when error is set) */
  hint?: string
  /** Disable the entire picker */
  disabled?: boolean
  /** Mark the field as required (adds an asterisk to the label) */
  required?: boolean
  /** Extra className forwarded to the root wrapper div */
  className?: string
  /** Extra className forwarded to the DatePicker trigger button */
  pickerClassName?: string
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * `CommonDatePicker` — reusable date picker for the entire application.
 *
 * ### Standalone
 * ```tsx
 * <CommonDatePicker
 *   label="Start Date"
 *   value={date}
 *   onChange={setDate}
 *   required
 *   error="Date is required"
 * />
 * ```
 *
 * ### React Hook Form (Controller)
 * ```tsx
 * <Controller
 *   name="startDate"
 *   control={control}
 *   render={({ field, fieldState }) => (
 *     <CommonDatePicker
 *       label="Start Date"
 *       value={field.value}
 *       onChange={field.onChange}
 *       onBlur={field.onBlur}
 *       error={fieldState.error?.message}
 *       required
 *     />
 *   )}
 * />
 * ```
 */
export function CommonDatePicker({
  value,
  onChange,
  onBlur,
  label,
  placeholder,
  error,
  hint,
  disabled,
  required,
  className,
  pickerClassName,
}: CommonDatePickerProps) {
  const id = React.useId()

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      {/* Label */}
      {label && (
        <label htmlFor={id} className="text-sm font-medium leading-none text-foreground">
          {label}
          {required && <span className="ml-0.5 text-destructive">*</span>}
        </label>
      )}

      {/* Picker */}
      {/* onBlur on the wrapper div captures focus-out from the popover trigger */}
      <div id={id} className={cn(disabled && "pointer-events-none opacity-50")} onBlur={onBlur}>
        <DatePicker
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={cn(
            "w-full",
            error && "border-destructive ring-destructive/20 focus-visible:ring-destructive/20",
            pickerClassName,
          )}
        />
      </div>

      {/* Error / hint */}
      {error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  )
}
