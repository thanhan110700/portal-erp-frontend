import { memo, useCallback, useMemo, useState } from "react"
import { Check, ChevronDown, Search, X } from "lucide-react"
import { useTranslation } from "react-i18next"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

export type SearchableSelectOption = { label: string; value: string }

type MultiSearchableSelectProps = {
  values: string[]
  onValuesChange: (values: string[]) => void
  options: SearchableSelectOption[]
  placeholder?: string
  searchPlaceholder?: string
  className?: string
  disabled?: boolean
}

function MultiSearchableSelectInner({
  values = [],
  onValuesChange,
  options,
  placeholder,
  searchPlaceholder,
  className,
  disabled = false,
}: MultiSearchableSelectProps) {
  const { t } = useTranslation()
  const finalPlaceholder = placeholder ?? t("common:filter.select", { defaultValue: "Select..." })
  const finalSearchPlaceholder =
    searchPlaceholder ?? t("common:actions.search", { defaultValue: "Search..." })
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")

  const filtered = useMemo(
    () =>
      search.trim()
        ? options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()))
        : options,
    [options, search],
  )

  const selectedOptions = useMemo(() => {
    return values
      .map((v) => options.find((o) => o.value === v))
      .filter(Boolean) as SearchableSelectOption[]
  }, [values, options])

  const handleSelect = useCallback(
    (optValue: string) => {
      const isSelected = values.includes(optValue)
      let newValues
      if (isSelected) {
        newValues = values.filter((v) => v !== optValue)
      } else {
        newValues = [...values, optValue]
      }
      onValuesChange(newValues)
    },
    [values, onValuesChange],
  )

  const handleRemove = useCallback(
    (e: React.MouseEvent, optValue: string) => {
      e.stopPropagation()
      onValuesChange(values.filter((v) => v !== optValue))
    },
    [values, onValuesChange],
  )

  const handleOpenChange = useCallback((next: boolean) => {
    setOpen(next)
    if (!next) setSearch("")
  }, [])

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full h-auto min-h-10 px-3 py-1.5 justify-between gap-1.5 font-normal",
            selectedOptions.length === 0 && "text-muted-foreground",
            className,
          )}
        >
          <div className="flex flex-wrap gap-1 flex-1 text-left items-center justify-start overflow-hidden">
            {selectedOptions.length === 0 ? (
              <span>{finalPlaceholder}</span>
            ) : (
              selectedOptions.map((opt) => (
                <span
                  key={opt.value}
                  className="inline-flex items-center gap-1 rounded bg-secondary px-1.5 py-0.5 text-xs text-secondary-foreground"
                >
                  <span className="truncate max-w-[120px]">{opt.label}</span>
                  <X
                    className="h-3 w-3 cursor-pointer opacity-70 hover:opacity-100 shrink-0"
                    onClick={(e) => handleRemove(e, opt.value)}
                  />
                </span>
              ))
            )}
          </div>
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground self-start mt-1.5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="p-0"
        style={{ width: "var(--radix-popover-trigger-width)" }}
        align="start"
      >
        <div className="flex items-center gap-2 border-b px-3 py-2">
          <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <input
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            placeholder={finalSearchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
        </div>
        <div
          className="max-h-52 overflow-y-auto py-1"
          onWheel={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
        >
          {filtered.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              {t("common:filter.no_results", { defaultValue: "No results" })}
            </p>
          ) : (
            filtered.map((opt) => {
              const isSelected = values.includes(opt.value)
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleSelect(opt.value)}
                  className={cn(
                    "flex w-full items-center gap-2 px-3 py-1.5 text-sm text-left hover:bg-muted",
                    isSelected && "bg-muted/60 font-medium",
                  )}
                >
                  <Check
                    className={cn("h-3.5 w-3.5 shrink-0", isSelected ? "opacity-100" : "opacity-0")}
                  />
                  {opt.label}
                </button>
              )
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

export const MultiSearchableSelect = memo(MultiSearchableSelectInner)
