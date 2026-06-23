import * as React from "react"

import { cn } from "@/lib/utils"
import { DateRangePicker } from "@/components/ui/date-range-picker"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Value shape used when integrating with React Hook Form as a single field. */
export interface DateRangeValue {
  from: string | null
  to: string | null
}

export interface CommonDateRangePickerProps {
  /** ISO date string YYYY-MM-DD or null */
  from: string | null
  to: string | null
  /**
   * Two-arg callback for standalone usage.
   * For React Hook Form, use `onValueChange` instead.
   */
  onChange: (from: string | null, to: string | null) => void
  /**
   * Single-value callback for React Hook Form Controller.
   * Pass `field.onChange` here directly.
   *
   * @example
   * ```tsx
   * <Controller
   *   name="dateRange"
   *   control={control}
   *   render={({ field, fieldState }) => (
   *     <CommonDateRangePicker
   *       from={field.value?.from ?? null}
   *       to={field.value?.to ?? null}
   *       onChange={() => {}}          // unused when onValueChange is set
   *       onValueChange={field.onChange}
   *       onBlur={field.onBlur}
   *       error={fieldState.error?.message}
   *     />
   *   )}
   * />
   * ```
   */
  onValueChange?: (value: DateRangeValue) => void
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
  /** Extra className forwarded to the DateRangePicker trigger button */
  pickerClassName?: string
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * `CommonDateRangePicker` — reusable date range picker for the entire application.
 *
 * ### Standalone
 * ```tsx
 * <CommonDateRangePicker
 *   label="Date Range"
 *   from={from}
 *   to={to}
 *   onChange={(f, t) => { setFrom(f); setTo(t) }}
 * />
 * ```
 *
 * ### React Hook Form (Controller) — store as `{ from, to }` object
 * ```tsx
 * // Form type:
 * // type FormValues = { dateRange: DateRangeValue }
 *
 * <Controller
 *   name="dateRange"
 *   control={control}
 *   render={({ field, fieldState }) => (
 *     <CommonDateRangePicker
 *       from={field.value?.from ?? null}
 *       to={field.value?.to ?? null}
 *       onChange={() => {}}          // ignored when onValueChange is provided
 *       onValueChange={field.onChange}
 *       onBlur={field.onBlur}
 *       label="Date Range"
 *       error={fieldState.error?.message}
 *       required
 *     />
 *   )}
 * />
 * ```
 */
export function CommonDateRangePicker({
  from,
  to,
  onChange,
  onValueChange,
  onBlur,
  label,
  placeholder,
  error,
  hint,
  disabled,
  required,
  className,
  pickerClassName,
}: CommonDateRangePickerProps) {
  const id = React.useId()

  function handleChange(f: string | null, t: string | null) {
    if (onValueChange) {
      onValueChange({ from: f, to: t })
    } else {
      onChange(f, t)
    }
  }

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
        <DateRangePicker
          from={from}
          to={to}
          onChange={handleChange}
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
