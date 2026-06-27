import { useState } from "react"
import { MoreHorizontal } from "lucide-react"
import { useIsMobile } from "@/hooks/useMobile"
import { Button } from "@/components/ui/button"
import { CommonDrawer } from "@/components/common/CommonDrawer"
import { cn } from "@/lib/utils"
import { useTranslation } from "react-i18next"

export type RowAction = {
  label: string
  icon: React.ReactNode
  onClick: () => void
  variant?: "default" | "destructive" | "outline" | "ghost"
  disabled?: boolean
  className?: string
}

interface RowActionsProps {
  actions: RowAction[]
}

export function RowActions({ actions }: RowActionsProps) {
  const isMobile = useIsMobile()
  const [open, setOpen] = useState(false)
  const { t } = useTranslation()

  if (actions.length === 0) return null

  if (!isMobile) {
    return (
      <div className="flex items-center gap-1 justify-end">
        {actions.map((action, idx) => (
          <Button
            key={idx}
            variant="ghost"
            size="icon-sm"
            onClick={action.onClick}
            disabled={action.disabled}
            className={action.className}
            title={action.label}
          >
            {action.icon}
          </Button>
        ))}
      </div>
    )
  }

  return (
    <>
      <div className="flex justify-end">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setOpen(true)}
          className="text-muted-foreground hover:bg-muted/50"
        >
          <MoreHorizontal className="size-4" />
        </Button>
      </div>

      <CommonDrawer
        open={open}
        onClose={() => setOpen(false)}
        direction="bottom"
        title={t("common:actions.title", { defaultValue: "Thao tác" })}
        cancelAction={false}
        bodyClassName="p-2"
        showCloseButton={true}
      >
        <div className="flex flex-col gap-2 p-2">
          {actions.map((action, idx) => {
            return (
              <Button
                key={idx}
                variant="ghost"
                disabled={action.disabled}
                className={cn(
                  "w-full justify-start h-12 text-base px-4 border border-border/50",
                  action.className,
                )}
                onClick={() => {
                  setOpen(false)
                  action.onClick()
                }}
              >
                <div className="mr-3 opacity-80">{action.icon}</div>
                {action.label}
              </Button>
            )
          })}
        </div>
      </CommonDrawer>
    </>
  )
}
