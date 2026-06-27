import { useState } from "react"
import dayjs from "@/lib/dayjs"
import { CalendarIcon, X } from "lucide-react"
import type { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { useIsMobile } from "@/hooks/useMobile"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Drawer,
  DrawerContent,
  DrawerTrigger,
  DrawerClose,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"

type DateRangePickerProps = {
  /** ISO date string YYYY-MM-DD or null */
  from: string | null
  to: string | null
  onChange: (from: string | null, to: string | null) => void
  placeholder?: string
  className?: string
}

export function DateRangePicker({
  from,
  to,
  onChange,
  placeholder = "Chọn khoảng ngày",
  className,
}: DateRangePickerProps) {
  const isMobile = useIsMobile()
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<DateRange>({ from: undefined, to: undefined })

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setDraft({
        from: from ? dayjs(from).toDate() : undefined,
        to: to ? dayjs(to).toDate() : undefined,
      })
    }
    setOpen(isOpen)
  }

  const selected: DateRange = {
    from: from ? dayjs(from).toDate() : undefined,
    to: to ? dayjs(to).toDate() : undefined,
  }

  const hasValue = from != null || to != null

  function label() {
    if (from && to) return `${dayjs(from).format("DD/MM/YYYY")} - ${dayjs(to).format("DD/MM/YYYY")}`
    if (from) return `${dayjs(from).format("DD/MM/YYYY")} →`
    if (to) return `→ ${dayjs(to).format("DD/MM/YYYY")}`
    return null
  }

  const triggerButton = (
    <Button
      variant="outline"
      className={cn(
        "h-8 justify-start gap-1.5 px-2.5 text-xs font-normal",
        !hasValue && "text-muted-foreground",
        className,
      )}
    >
      <CalendarIcon className="h-3.5 w-3.5 shrink-0" />
      <span className="flex-1 text-left truncate">{label() ?? placeholder}</span>
      {hasValue ? (
        <span
          role="button"
          aria-label="Clear date range"
          onClick={(e) => {
            e.stopPropagation()
            onChange(null, null)
          }}
          className="ml-auto text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-3 w-3" />
        </span>
      ) : null}
    </Button>
  )

  const handleApply = () => {
    onChange(
      draft.from ? dayjs(draft.from).format("YYYY-MM-DD") : null,
      draft.to ? dayjs(draft.to).format("YYYY-MM-DD") : null,
    )
    setOpen(false)
  }

  const draftLabel = (() => {
    if (draft.from && draft.to) {
      return `${dayjs(draft.from).format("DD/MM/YYYY")} - ${dayjs(draft.to).format("DD/MM/YYYY")}`
    }
    if (draft.from) return dayjs(draft.from).format("DD/MM/YYYY")
    if (draft.to) return `→ ${dayjs(draft.to).format("DD/MM/YYYY")}`
    return ""
  })()

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={handleOpenChange}>
        <DrawerTrigger asChild>{triggerButton}</DrawerTrigger>
        <DrawerContent className="p-0 flex flex-col max-h-[85dvh] overflow-hidden">
          <DrawerHeader className="border-b border-border pb-3 shrink-0">
            <DrawerTitle className="text-center text-sm font-medium">Chọn khoảng ngày</DrawerTitle>
          </DrawerHeader>

          <div className="flex-1 overflow-y-auto flex items-center justify-center p-4 min-h-0">
            <Calendar
              mode="range"
              selected={draft}
              onSelect={(range) => {
                setDraft(range ?? { from: undefined, to: undefined })
              }}
              numberOfMonths={1}
              className="[--cell-size:--spacing(10)]"
            />
          </div>

          <div className="border-t border-border p-4 flex items-center justify-between gap-3 shrink-0">
            <span className="font-mono text-sm text-muted-foreground truncate">
              {draftLabel || "Chọn ngày"}
            </span>
            <div className="flex gap-2 shrink-0">
              <DrawerClose asChild>
                <Button type="button" variant="outline" size="sm" className="h-9 px-4 text-sm">
                  Hủy
                </Button>
              </DrawerClose>
              <Button type="button" size="sm" className="h-9 px-4 text-sm" onClick={handleApply}>
                Áp dụng
              </Button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>{triggerButton}</PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          selected={selected}
          onSelect={(range) => {
            onChange(
              range?.from ? dayjs(range.from).format("YYYY-MM-DD") : null,
              range?.to ? dayjs(range.to).format("YYYY-MM-DD") : null,
            )
            // Auto close on desktop once range is fully selected
            if (range?.from && range?.to) {
              setOpen(false)
            }
          }}
          numberOfMonths={2}
        />
      </PopoverContent>
    </Popover>
  )
}
