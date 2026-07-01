import { useState } from "react"
import { useTranslation } from "react-i18next"
import dayjs from "@/lib/dayjs"
import { CalendarIcon, X } from "lucide-react"

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

type DatePickerProps = {
  /** ISO date string YYYY-MM-DD or null */
  value: string | null
  onChange: (value: string | null) => void
  placeholder?: string
  className?: string
}

export function DatePicker({ value, onChange, placeholder, className }: DatePickerProps) {
  const { t } = useTranslation(["common"])
  const isMobile = useIsMobile()
  const [open, setOpen] = useState(false)
  const selected = value ? dayjs(value).toDate() : undefined
  const finalPlaceholder = placeholder ?? t("common:datePicker.selectDate")

  const handleSelect = (date: Date | undefined) => {
    onChange(date ? dayjs(date).format("YYYY-MM-DD") : null)
    setOpen(false)
  }

  const handleSelectToday = () => {
    onChange(dayjs().format("YYYY-MM-DD"))
    setOpen(false)
  }

  const triggerButton = (
    <Button
      variant="outline"
      className={cn(
        "h-8 justify-start gap-1.5 px-2.5 text-xs font-normal",
        !value && "text-muted-foreground",
        className,
      )}
    >
      <CalendarIcon className="h-3.5 w-3.5 shrink-0" />
      <span className="flex-1 text-left truncate">
        {selected ? dayjs(selected).format("DD/MM/YYYY") : finalPlaceholder}
      </span>
      {value ? (
        <span
          role="button"
          aria-label="Clear date"
          onClick={(e) => {
            e.stopPropagation()
            onChange(null)
          }}
          className="ml-auto text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-3 w-3" />
        </span>
      ) : null}
    </Button>
  )

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>{triggerButton}</DrawerTrigger>
        <DrawerContent className="p-0 flex flex-col max-h-[85dvh] overflow-hidden">
          <DrawerHeader className="border-b border-border pb-3 shrink-0">
            <DrawerTitle className="text-center text-sm font-medium">
              {t("common:datePicker.selectDate")}
            </DrawerTitle>
          </DrawerHeader>
          <div className="flex-1 overflow-y-auto flex items-center justify-center p-4 min-h-0">
            <Calendar
              mode="single"
              selected={selected}
              onSelect={handleSelect}
              className="[--cell-size:--spacing(10)]"
            />
          </div>
          <div className="border-t border-border p-4 flex gap-2 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              className="h-9 flex-1 text-sm"
              onClick={handleSelectToday}
            >
              {t("common:datePicker.today")}
            </Button>
            <DrawerClose asChild>
              <Button variant="outline" size="sm" className="h-9 flex-1 text-sm">
                {t("common:actions.cancel")}
              </Button>
            </DrawerClose>
          </div>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{triggerButton}</PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar mode="single" selected={selected} onSelect={handleSelect} />
        <div className="border-t border-border p-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-full text-xs"
            onClick={handleSelectToday}
          >
            {t("common:datePicker.today")}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
