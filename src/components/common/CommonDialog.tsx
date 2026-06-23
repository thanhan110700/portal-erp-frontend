import * as React from "react"

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

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Predefined max-width sizes for the dialog. */
export type DialogSize = "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "full"

/** A single action button rendered in the footer. */
export interface DialogAction {
  /** Button label */
  label: string
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
  full: "sm:max-w-[calc(100vw-2rem)] sm:max-h-[calc(100vh-2rem)]",
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
  size = "sm",
  showCloseButton = true,
  contentClassName,
  headerClassName,
  footerClassName,
}: CommonDialogProps) {
  // Resolve action configs
  const primary = primaryAction
    ? resolveAction(primaryAction, { label: "Confirm", variant: "default" })
    : null

  const cancel =
    cancelAction !== false && cancelAction !== undefined
      ? resolveAction(cancelAction === true ? true : cancelAction, {
          label: "Cancel",
          variant: "outline",
        })
      : null

  const hasFooter = primary || cancel || (extraActions && extraActions.length > 0)

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        showCloseButton={showCloseButton}
        className={cn(sizeClass[size], contentClassName)}
      >
        {/* Header */}
        {(title || description) && (
          <DialogHeader className={headerClassName}>
            {title && <DialogTitle>{title}</DialogTitle>}
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
        )}

        {/* Body */}
        {children}

        {/* Footer */}
        {hasFooter && (
          <DialogFooter className={footerClassName}>
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

function ActionButton({ action, onClose }: { action: DialogAction; onClose: () => void }) {
  const {
    label,
    onClick,
    variant = "default",
    disabled,
    loading,
    className,
    closeOnClick,
    type = "button",
  } = action

  async function handleClick() {
    // eslint-disable-next-line @typescript-eslint/await-thenable
    await onClick?.()
    if (closeOnClick) onClose()
  }

  return (
    <Button
      type={type}
      variant={variant}
      disabled={disabled || loading}
      className={cn("min-w-[80px]", className)}
      onClick={onClick ? handleClick : undefined}
    >
      {loading ? <LoadingSpinner /> : null}
      {label}
    </Button>
  )
}

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
