import { memo, useMemo, useState } from "react"
import { ChevronDown, ChevronUp, Filter, RotateCcw, Search, X } from "lucide-react"
import { useIsMobile } from "@/hooks/useMobile"
import { CommonDrawer } from "@/components/common/CommonDrawer"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { DatePicker } from "@/components/ui/date-picker"
import { DateRangePickerPresets } from "@/components/ui/date-range-picker-presets"
import type { DateRangeValue } from "@/components/ui/date-range-picker-presets"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Switch } from "@/components/ui/switch"
import { SearchableSelect } from "@/components/common/SearchableSelect"
import { useTranslation } from "react-i18next"

// ─── Field type definitions ───────────────────────────────────────────────────

export type SelectOption = { label: string; value: string }

type BaseField = {
  field: string
  label: string
  placeholder?: string
  className?: string
  hidden?: boolean
}

export type SelectFilterField = BaseField & {
  type: "select"
  value: string | null
  options: SelectOption[]
  hideAllOption?: boolean
}

export type MultiSelectFilterField = BaseField & {
  type: "multiselect"
  value: string[]
  options: SelectOption[]
  disabled?: boolean
}

export type InputFilterField = BaseField & {
  type: "input"
  value: string | null
}

export type DatePickerFilterField = BaseField & {
  type: "datepicker"
  value: string | null
}

export type DateRangeFilterField = BaseField & {
  type: "daterange"
  value: DateRangeValue | null
}

export type ToggleFilterField = BaseField & {
  type: "toggle"
  value: boolean
  onLabel?: string
  offLabel?: string
}

export type FilterFieldDef =
  | SelectFilterField
  | MultiSelectFilterField
  | InputFilterField
  | DatePickerFilterField
  | DateRangeFilterField
  | ToggleFilterField

// ─── Panel props ──────────────────────────────────────────────────────────────

type AutoModeProps = {
  applyMode?: false
  onFieldChange: (field: string, value: unknown) => void
  onApply?: never
}

type ApplyModeProps = {
  applyMode: true
  onFieldChange?: never
  onApply: (values: Record<string, unknown>) => void
  onDraftFieldChange?: (field: string, value: unknown) => void
}

export type FilterPanelProps = (AutoModeProps | ApplyModeProps) & {
  fields: FilterFieldDef[]
  onReset: () => void
  defaultOpen?: boolean
  title?: string
  className?: string
}

// ─── Field renderers (module-scope, no inline components) ─────────────────────

type FieldRendererProps<T extends FilterFieldDef = FilterFieldDef> = {
  field: T
  onChange: (value: unknown) => void
}

function SelectFieldRenderer({ field, onChange }: FieldRendererProps<SelectFilterField>) {
  const { t } = useTranslation()
  const hasAll = !field.hideAllOption
  const allOption = hasAll
    ? [{ label: field.placeholder ?? t("common:filter.all"), value: "" }]
    : []
  const options = [...allOption, ...field.options]
  const val = field.value ?? (hasAll ? "" : undefined)

  return (
    <SearchableSelect
      value={val}
      onValueChange={(v) => onChange(v)}
      options={options}
      placeholder={field.placeholder ?? t("common:filter.select")}
      className={cn("h-8 text-xs", field.className)}
    />
  )
}

function MultiSelectFieldRenderer({ field, onChange }: FieldRendererProps<MultiSelectFilterField>) {
  const { t } = useTranslation()
  const [search, setSearch] = useState("")
  const [open, setOpen] = useState(false)
  const isDisabled = field.disabled ?? false

  const filtered = useMemo(
    () =>
      search.trim()
        ? field.options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()))
        : field.options,
    [field.options, search],
  )

  function toggle(value: string) {
    const next = field.value.includes(value)
      ? field.value.filter((v) => v !== value)
      : [...field.value, value]
    onChange(next)
  }

  const selectedLabels = field.options
    .filter((o) => field.value.includes(o.value))
    .map((o) => o.label)

  const triggerText =
    selectedLabels.length === 0
      ? (field.placeholder ?? t("common:filter.select"))
      : selectedLabels.length === 1
        ? selectedLabels[0]
        : t("common:filter.selected_n", { count: selectedLabels.length })

  return (
    <Popover
      open={isDisabled ? false : open}
      onOpenChange={(nextOpen) => {
        if (!isDisabled) {
          setOpen(nextOpen)
        }
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={isDisabled}
          className={cn(
            "h-8 w-full justify-between gap-1.5 px-2.5 text-xs font-normal",
            field.value.length === 0 && "text-muted-foreground",
            field.className,
          )}
        >
          <span className="flex-1 truncate text-left">{triggerText}</span>
          {field.value.length > 0 && !isDisabled ? (
            <span
              role="button"
              aria-label="Clear selection"
              onClick={(e) => {
                e.stopPropagation()
                onChange([])
              }}
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="h-3 w-3" />
            </span>
          ) : (
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-0" align="start">
        <div className="flex items-center gap-2 border-b px-3 py-2">
          <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <input
            className="flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
            placeholder={t("common:actions.search")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div
          className="max-h-52 overflow-y-auto py-1"
          onWheel={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
        >
          {filtered.length === 0 ? (
            <p className="py-4 text-center text-xs text-muted-foreground">
              {t("common:filter.no_results")}
            </p>
          ) : (
            filtered.map((opt) => (
              <label
                key={opt.value}
                className="flex cursor-pointer items-center gap-2.5 px-3 py-1.5 text-xs hover:bg-muted"
              >
                <Checkbox
                  checked={field.value.includes(opt.value)}
                  onCheckedChange={() => toggle(opt.value)}
                />
                {opt.label}
              </label>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

function InputFieldRenderer({ field, onChange }: FieldRendererProps<InputFilterField>) {
  const { t } = useTranslation()
  return (
    <Input
      className={cn("h-8 w-full text-xs", field.className)}
      placeholder={field.placeholder ?? t("common:actions.search")}
      value={field.value ?? ""}
      onChange={(e) => onChange(e.target.value)}
    />
  )
}

function DatePickerFieldRenderer({ field, onChange }: FieldRendererProps<DatePickerFilterField>) {
  return (
    <DatePicker
      className={cn("w-full", field.className)}
      value={field.value}
      onChange={(v) => onChange(v)}
      placeholder={field.placeholder}
    />
  )
}

function DateRangeFieldRenderer({ field, onChange }: FieldRendererProps<DateRangeFilterField>) {
  const { t } = useTranslation()
  return (
    <DateRangePickerPresets
      className={field.className}
      from={field.value?.from ?? null}
      to={field.value?.to ?? null}
      placeholder={field.placeholder ?? t("common:filter.select_date_range")}
      onChange={(from, to) => onChange({ from, to })}
    />
  )
}

function ToggleFieldRenderer({ field, onChange }: FieldRendererProps<ToggleFilterField>) {
  const { t } = useTranslation()
  return (
    <div className={cn("flex items-center gap-2", field.className)}>
      <Switch size="sm" checked={field.value} onCheckedChange={(checked) => onChange(checked)} />
      <span className="text-xs text-muted-foreground">
        {field.value
          ? (field.onLabel ?? t("common:filter.on"))
          : (field.offLabel ?? t("common:filter.off"))}
      </span>
    </div>
  )
}

function renderField(field: FilterFieldDef, onChange: (value: unknown) => void) {
  switch (field.type) {
    case "select":
      return <SelectFieldRenderer field={field} onChange={onChange} />
    case "multiselect":
      return <MultiSelectFieldRenderer field={field} onChange={onChange} />
    case "input":
      return <InputFieldRenderer field={field} onChange={onChange} />
    case "datepicker":
      return <DatePickerFieldRenderer field={field} onChange={onChange} />
    case "daterange":
      return <DateRangeFieldRenderer field={field} onChange={onChange} />
    case "toggle":
      return <ToggleFieldRenderer field={field} onChange={onChange} />
    default:
      return null
  }
}

// ─── Main component ───────────────────────────────────────────────────────────

function fieldsToRecord(fields: FilterFieldDef[]): Record<string, unknown> {
  return Object.fromEntries(fields.map((f) => [f.field, f.value]))
}

function FilterPanelInner(props: FilterPanelProps) {
  const { t } = useTranslation()
  const { fields, onReset, defaultOpen = true, title = t("common:filter.title"), className } = props
  const isMobile = useIsMobile()
  const [open, setOpen] = useState(isMobile ? false : defaultOpen)

  const [draft, setDraft] = useState<Record<string, unknown>>(() => fieldsToRecord(fields))
  const [prevFields, setPrevFields] = useState(fields)

  if (fields !== prevFields) {
    const newRecord = fieldsToRecord(fields)
    setPrevFields(fields)
    setDraft(newRecord)
  }

  function handleChange(field: string, value: unknown) {
    if (props.applyMode) {
      setDraft((prev) => ({ ...prev, [field]: value }))
      props.onDraftFieldChange?.(field, value)
    } else {
      props.onFieldChange?.(field, value)
    }
  }

  function handleApply() {
    if (props.applyMode) {
      props.onApply?.(draft)
    }
  }

  // In apply mode, render draft values; in auto mode, render the live field values
  const displayFields: FilterFieldDef[] = props.applyMode
    ? fields.map(
        (f) => ({ ...f, value: f.field in draft ? draft[f.field] : f.value }) as FilterFieldDef,
      )
    : fields

  if (isMobile) {
    return (
      <div className={cn("w-full mb-4", className)}>
        <Button
          type="button"
          variant="outline"
          className="w-full flex items-center justify-between text-muted-foreground bg-background/60 shadow-sm border-border/50 h-11 px-4 rounded-lg"
          onClick={() => setOpen(true)}
        >
          <div className="flex items-center gap-2 font-bold text-sm">
            <Filter className="h-4 w-4" />
            {title}
          </div>
          <ChevronDown className="h-4 w-4" />
        </Button>

        <CommonDrawer
          open={open}
          onClose={() => setOpen(false)}
          title={title}
          direction="bottom"
          showCloseButton={true}
          primaryAction={
            props.applyMode
              ? {
                  label: t("common:filter.apply"),
                  onClick: () => {
                    handleApply()
                    setOpen(false)
                  },
                }
              : undefined
          }
          extraActions={[
            {
              label: t("common:filter.reset"),
              variant: "outline",
              onClick: () => {
                onReset()
                // Do not close so user can see it reset, or close if applyMode is false
                if (!props.applyMode) setOpen(false)
              },
            },
          ]}
          cancelAction={false}
          contentClassName="max-h-[90dvh]"
        >
          <div className="flex flex-col gap-5 py-2 px-1">
            {displayFields.map((field) => {
              if (field.hidden) return null

              return (
                <div
                  key={field.field}
                  className={cn("flex flex-col gap-2", field.type === "toggle" && "justify-end")}
                >
                  <label className="text-sm font-semibold text-muted-foreground">
                    {field.label}
                  </label>
                  {renderField(field, (value) => handleChange(field.field, value))}
                </div>
              )
            })}
          </div>
        </CommonDrawer>
      </div>
    )
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen} className={cn("w-full", className)}>
      <div className="flex flex-col gap-4 rounded-lg border bg-background/60 p-4 shadow-sm">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 pb-2">
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors"
            >
              <Filter className="h-3.5 w-3.5" />
              {title}
              {open ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
            </button>
          </CollapsibleTrigger>

          <div className="flex flex-wrap items-center justify-end gap-2">
            {props.applyMode && (
              <Button
                type="button"
                size="sm"
                className="h-7 gap-1.5 px-3 text-xs font-semibold"
                onClick={handleApply}
              >
                {t("common:filter.apply")}
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 gap-1.5 px-2.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
              onClick={onReset}
            >
              <RotateCcw className="h-3 w-3" />
              {t("common:filter.reset")}
            </Button>
          </div>
        </div>

        {/* Fields grid */}
        <CollapsibleContent>
          <div className="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
            {displayFields.map((field) => {
              if (field.hidden) return null

              return (
                <div
                  key={field.field}
                  className={cn("flex flex-col gap-1.5", field.type === "toggle" && "justify-end")}
                >
                  <label className="text-xs font-medium text-muted-foreground">{field.label}</label>
                  {renderField(field, (value) => handleChange(field.field, value))}
                </div>
              )
            })}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  )
}

export const FilterPanel = memo(FilterPanelInner)
