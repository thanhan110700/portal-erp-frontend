import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useTranslation } from "react-i18next"

export type StatusType = string

interface StatusBadgeProps {
  status: StatusType | boolean | number | null | undefined
  label?: string
  className?: string
  pulse?: boolean
}

const DEFAULT_STATUS_MAP: Record<
  string,
  {
    variant: "success" | "secondary" | "destructive" | "warning" | "default"
    label: string
    pulse?: boolean
  }
> = {
  // Success states
  active: { variant: "success", label: "Active", pulse: true },
  published: { variant: "success", label: "Published" },
  visible: { variant: "success", label: "Visible" },
  wordpress: { variant: "success", label: "WordPress" },
  facebook: { variant: "success", label: "Facebook" },
  completed: { variant: "success", label: "Completed" },
  won: { variant: "success", label: "Won" },
  approved: { variant: "success", label: "Approved" },
  paid: { variant: "success", label: "Paid" },

  // Warning states
  archived: { variant: "warning", label: "Archived" },
  hidden: { variant: "warning", label: "Hidden" },
  ai: { variant: "warning", label: "AI" },
  google: { variant: "warning", label: "Google" },
  overdue: { variant: "warning", label: "Overdue" },
  reviewing: { variant: "warning", label: "Reviewing" },
  unpaid: { variant: "warning", label: "Unpaid" },
  partial: { variant: "warning", label: "Partial" },
  vip: { variant: "warning", label: "VIP", pulse: true },

  // Secondary/Info states
  paused: { variant: "secondary", label: "Paused" },
  draft: { variant: "secondary", label: "Draft" },
  maintenance: { variant: "secondary", label: "Maintenance" },
  pending: { variant: "secondary", label: "Pending", pulse: true },
  normal: { variant: "secondary", label: "Normal" },
  processing: { variant: "secondary", label: "Processing", pulse: true },
  new: { variant: "secondary", label: "New", pulse: true },
  open: { variant: "secondary", label: "Open" },
  regular: { variant: "secondary", label: "Regular" },

  // Destructive/Error states
  inactive: { variant: "destructive", label: "Inactive" },
  suspended: { variant: "destructive", label: "Suspended" },
  trash: { variant: "destructive", label: "Trash" },
  error: { variant: "destructive", label: "Error" },
  failed: { variant: "destructive", label: "Failed" },
  lost: { variant: "destructive", label: "Lost" },
  rejected: { variant: "destructive", label: "Rejected" },
  cancelled: { variant: "destructive", label: "Cancelled" },

  // Default
  unknown: { variant: "default", label: "Unknown" },
}

export function StatusBadge({ status, label, className, pulse: explicitPulse }: StatusBadgeProps) {
  const { t } = useTranslation()

  if (status === null || status === undefined) {
    return <span className="text-muted-foreground/50">—</span>
  }

  // Handle boolean/number (e.g. is_hidden)
  const normalizedStatus = String(status).toLowerCase()

  const config = DEFAULT_STATUS_MAP[normalizedStatus]
  const variant = config?.variant || "outline"
  const shouldPulse = explicitPulse !== undefined ? explicitPulse : config?.pulse

  // Try to find translation for the status
  // i18next will return the key if not found, so we check if the returned string equals the key
  const translationKey = `common:status.${normalizedStatus}`
  const translatedLabel = t(translationKey)
  const displayLabel =
    label ||
    (translatedLabel !== translationKey ? translatedLabel : config?.label || normalizedStatus)

  return (
    <Badge
      variant={variant}
      className={cn(
        "capitalize px-2.5 py-0.5 font-medium shadow-none transition-all duration-200",
        "hover:shadow-sm",
        className,
      )}
    >
      {shouldPulse ? (
        <span className="relative flex h-1.5 w-1.5 shrink-0 mr-0.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-50"></span>
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-current"></span>
        </span>
      ) : (
        <span className="h-1.5 w-1.5 rounded-full bg-current shrink-0 mr-0.5" />
      )}
      {displayLabel}
    </Badge>
  )
}
