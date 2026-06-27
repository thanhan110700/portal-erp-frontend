import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

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
  if (actions.length === 0) return null

  return (
    <div className="flex items-center gap-2">
      {actions.map((action, idx) => (
        <Button
          key={idx}
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            action.onClick()
          }}
          disabled={action.disabled}
          className={cn("gap-1.5 h-8 px-2 text-xs", action.className)}
          title={action.label}
        >
          {action.icon}
          <span className="font-medium whitespace-nowrap">{action.label}</span>
        </Button>
      ))}
    </div>
  )
}
