import * as React from "react"
import { useIsMobile } from "@/hooks/useMobile"
import { CommonDrawer } from "@/components/common/CommonDrawer"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useTranslation } from "react-i18next"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Predefined max-width sizes for the dialog. */
export type DialogSize = "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "full"

/** A single action button rendered in the footer. */
export interface DialogAction {
  /** Button label */
  label: string
  /** Optional icon to display before the label */
  icon?: React.ReactNode
  /** Called when the button is clicked */
  onClick?: () => void
  /** Button variant forwarded to <Button> */
  variant?: "default" | "outline" | "secondary" | "ghost" | "destructive" | "link"
  /** Disable the button */
  disabled?: boolean
  /** Show a loading spinner and disable interaction */
  loading?: boolean
  /** Extra className applied to the button */
  className?: string
  /** Closes the dialog automatically after onClick resolves (default: false) */
  closeOnClick?: boolean
  /** HTML button type (default: "button") */
  type?: "button" | "submit" | "reset"
  /** Associated HTML form ID to submit */
  form?: string
}

export interface CommonDialogProps {
  // ── Visibility ──────────────────────────────────────────────────────────
  /** Controlled open state */
  open: boolean
  /** Called when the user requests to close the dialog (overlay click, Escape, close button, cancel action) */
  onClose: () => void

  // ── Content ─────────────────────────────────────────────────────────────
  /** Dialog heading */
  title?: React.ReactNode
  /** Optional sub-heading / description shown below the title */
  description?: React.ReactNode
  /** Main dialog body */
  children?: React.ReactNode

  // ── Footer actions ───────────────────────────────────────────────────────
  /**
   * Primary action button. Defaults to a "Confirm" button when provided as `true`.
   * Pass an object to fully customise the button.
   */
  primaryAction?: DialogAction | true
  /**
   * Secondary (cancel) action button. Defaults to a "Cancel" button when provided as `true`.
   * Pass an object to fully customise the button.
   */
  cancelAction?: DialogAction | true | false
  /** Arbitrary extra buttons rendered before the primary action */
  extraActions?: DialogAction[]

  // ── Layout / style ──────────────────────────────────────────────────────
  /** Controls the max-width of the dialog (default: "sm") */
  size?: DialogSize
  /** Whether to show the X close button in the top-right corner (default: true) */
  showCloseButton?: boolean
  /** Extra className forwarded to DialogContent */
  contentClassName?: string
  /** Extra className forwarded to DialogHeader */
  headerClassName?: string
  /** Extra className forwarded to DialogFooter */
  footerClassName?: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const sizeClass: Record<DialogSize, string> = {
  xs: "sm:max-w-xs",
  sm: "sm:max-w-sm",
  md: "sm:max-w-md",
  lg: "sm:max-w-lg",
  xl: "sm:max-w-xl",
  "2xl": "sm:max-w-2xl",
  full: "sm:max-w-[calc(100vw-2rem)]",
}

function resolveAction(action: DialogAction | true, defaults: Partial<DialogAction>): DialogAction {
  if (action === true) return { label: defaults.label ?? "", ...defaults }
  return { ...defaults, ...action }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * `CommonDialog` — reusable dialog wrapper for the entire application.
 *
 * @example
 * <CommonDialog
 *   open={open}
 *   onClose={() => setOpen(false)}
 *   title="Confirm Delete"
 *   description="This action cannot be undone."
 *   size="md"
 *   primaryAction={{ label: 'Delete', variant: 'destructive', onClick: handleDelete }}
 *   cancelAction
 * >
 *   <p>Are you sure you want to delete this record?</p>
 * </CommonDialog>
 */
export function CommonDialog({
  open,
  onClose,
  title,
  description,
  children,
  primaryAction,
  cancelAction = true,
  extraActions,
  size = "2xl",
  showCloseButton = true,
  contentClassName,
  headerClassName,
  footerClassName,
}: CommonDialogProps) {
  const isMobile = useIsMobile()
  const { t } = useTranslation(["common"])

  if (isMobile) {
    return (
      <CommonDrawer
        open={open}
        onClose={onClose}
        title={title}
        description={description}
        primaryAction={primaryAction}
        cancelAction={cancelAction}
        extraActions={extraActions}
        showCloseButton={showCloseButton}
        direction="bottom"
        contentClassName={cn("max-h-[95dvh]", contentClassName)}
        headerClassName={headerClassName}
        footerClassName={footerClassName}
      >
        {children}
      </CommonDrawer>
    )
  }

  // Resolve action configs
  const primary = primaryAction
    ? resolveAction(primaryAction, {
        label: t("common:actions.confirm", { defaultValue: "Xác nhận" }),
        variant: "default",
      })
    : null

  const cancel =
    cancelAction !== false && cancelAction !== undefined
      ? resolveAction(cancelAction === true ? true : cancelAction, {
          label: t("common:actions.cancel", { defaultValue: "Thoát" }),
          variant: "outline",
        })
      : null

  const hasFooter = primary || cancel || (extraActions && extraActions.length > 0)

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        showCloseButton={showCloseButton}
        className={cn(
          "flex max-h-[calc(100dvh-2rem)] flex-col overflow-hidden",
          sizeClass[size],
          contentClassName,
        )}
      >
        {/* Header */}
        {(title || description) && (
          <DialogHeader className={cn("shrink-0 pr-10", headerClassName)}>
            {title && <DialogTitle>{title}</DialogTitle>}
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
        )}

        {/* Body */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1">{children}</div>

        {/* Footer */}
        {hasFooter && (
          <DialogFooter className={cn("shrink-0", footerClassName)}>
            {/* Extra actions (leftmost) */}
            {extraActions?.map((action, idx) => (
              <ActionButton key={idx} action={action} onClose={onClose} />
            ))}

            {/* Cancel */}
            {cancel && (
              <DialogClose asChild>
                <ActionButton action={cancel} onClose={onClose} />
              </DialogClose>
            )}

            {/* Primary */}
            {primary && <ActionButton action={primary} onClose={onClose} />}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Internal ActionButton
// ---------------------------------------------------------------------------

const ActionButton = React.forwardRef<
  HTMLButtonElement,
  { action: DialogAction; onClose: () => void } & React.ComponentPropsWithoutRef<typeof Button>
>(({ action, onClose, ...props }, ref) => {
  const {
    label,
    icon,
    onClick,
    variant = "default",
    disabled,
    loading,
    className,
    closeOnClick,
    type = "button",
    form,
  } = action

  async function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
    props.onClick?.(e)
    if (onClick) {
      // eslint-disable-next-line @typescript-eslint/await-thenable
      await onClick()
    }
    if (closeOnClick) onClose()
  }

  return (
    <Button
      ref={ref}
      type={type}
      form={form}
      variant={variant}
      disabled={disabled || loading}
      className={cn("min-w-[80px]", className)}
      {...props}
      onClick={handleClick}
    >
      {loading ? <LoadingSpinner /> : null}
      {icon ? <span className="mr-1.5">{icon}</span> : null}
      {label}
    </Button>
  )
})
ActionButton.displayName = "ActionButton"

function LoadingSpinner() {
  return (
    <svg
      className="mr-1.5 size-3.5 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  )
}
