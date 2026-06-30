import * as React from "react"
import { XIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { useTranslation } from "react-i18next"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DrawerDirection = "bottom" | "top" | "left" | "right"

/** A single action button rendered in the footer. */
export interface DrawerAction {
  /** Button label */
  label: string
  /** Optional icon to render before label */
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
  /** Closes the drawer automatically after onClick resolves */
  closeOnClick?: boolean
  /** HTML button type (default: "button") */
  type?: "button" | "submit" | "reset"
  /** Associated HTML form ID to submit */
  form?: string
}

export interface CommonDrawerProps {
  // ── Visibility ──────────────────────────────────────────────────────────
  /** Controlled open state */
  open: boolean
  /** Called when the user requests to close the drawer */
  onClose: () => void

  // ── Content ─────────────────────────────────────────────────────────────
  /** Drawer heading */
  title?: React.ReactNode
  /** Optional sub-heading / description shown below the title */
  description?: React.ReactNode
  /** Main drawer body */
  children?: React.ReactNode

  // ── Footer actions ───────────────────────────────────────────────────────
  /**
   * Primary action button. Defaults to a "Confirm" button when provided as `true`.
   * Pass an object to fully customise the button.
   */
  primaryAction?: DrawerAction | true
  /**
   * Cancel action button. Defaults to a "Cancel" button when provided as `true`.
   * Pass `false` to hide it.
   */
  cancelAction?: DrawerAction | true | false
  /** Arbitrary extra buttons rendered before the primary action */
  extraActions?: DrawerAction[]

  // ── Layout / style ──────────────────────────────────────────────────────
  /**
   * Drawer slide direction (default: "right").
   * - right / left: side panel
   * - bottom / top: sheet style
   */
  direction?: DrawerDirection
  /**
   * Width override for left/right drawers (e.g. "400px", "40rem").
   * Ignored for top/bottom drawers.
   */
  width?: string
  /** Whether to show the X close button in the header (default: true) */
  showCloseButton?: boolean
  /** Extra className forwarded to DrawerContent */
  contentClassName?: string
  /** Extra className forwarded to DrawerHeader */
  headerClassName?: string
  /** Extra className forwarded to DrawerFooter */
  footerClassName?: string
  /** Extra className forwarded to the body area between header and footer */
  bodyClassName?: string
  /** Whether drawer can be closed by swiping / clicking overlay (default: true) */
  dismissible?: boolean
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function resolveAction(action: DrawerAction | true, defaults: Partial<DrawerAction>): DrawerAction {
  if (action === true) return { label: defaults.label ?? "", ...defaults }
  return { ...defaults, ...action }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * `CommonDrawer` — reusable drawer / side-panel for the entire application.
 *
 * ### Right-side panel (default)
 * ```tsx
 * <CommonDrawer
 *   open={open}
 *   onClose={() => setOpen(false)}
 *   title="Edit Record"
 *   primaryAction={{ label: 'Save', onClick: handleSave, loading: isSaving }}
 *   cancelAction
 * >
 *   <MyForm />
 * </CommonDrawer>
 * ```
 *
 * ### Bottom sheet
 * ```tsx
 * <CommonDrawer
 *   open={open}
 *   onClose={() => setOpen(false)}
 *   title="Filters"
 *   direction="bottom"
 * >
 *   <FilterPanel />
 * </CommonDrawer>
 * ```
 */
export function CommonDrawer({
  open,
  onClose,
  title,
  description,
  children,
  primaryAction,
  cancelAction = true,
  extraActions,
  direction = "right",
  width,
  showCloseButton = true,
  contentClassName,
  headerClassName,
  footerClassName,
  bodyClassName,
  dismissible = true,
}: CommonDrawerProps) {
  const { t } = useTranslation(["common"])

  const primary = primaryAction
    ? resolveAction(primaryAction, {
        label: t("common:actions.confirm", { defaultValue: "Xác nhận" }),
        variant: "default",
      })
    : null

  const cancel =
    cancelAction !== false && cancelAction !== undefined
      ? resolveAction(cancelAction === true ? true : cancelAction, {
          label: t("common:actions.cancel", { defaultValue: "Hủy" }),
          variant: "outline",
        })
      : null

  const hasFooter = primary || cancel || (extraActions && extraActions.length > 0)

  // Inline width style for left/right drawers
  const widthStyle: React.CSSProperties =
    width && (direction === "left" || direction === "right") ? { width } : {}

  return (
    <Drawer
      open={open}
      onOpenChange={(v) => !v && onClose()}
      direction={direction}
      dismissible={dismissible}
    >
      <DrawerContent
        style={widthStyle}
        className={cn(
          // For left/right, allow content to fill full height and scroll
          (direction === "left" || direction === "right") && "flex flex-col h-full",
          contentClassName,
        )}
      >
        {/* Header */}
        {(title || description || showCloseButton) && (
          <DrawerHeader
            className={cn(
              "border-b border-border",
              showCloseButton && "pr-10", // room for close button
              headerClassName,
            )}
          >
            {title && <DrawerTitle>{title}</DrawerTitle>}
            {description && <DrawerDescription>{description}</DrawerDescription>}

            {showCloseButton && (
              <DrawerClose asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="absolute top-3 right-3"
                  aria-label="Close"
                >
                  <XIcon />
                </Button>
              </DrawerClose>
            )}
          </DrawerHeader>
        )}

        {/* Body — scrollable */}
        <div className={cn("flex-1 overflow-y-auto p-4", bodyClassName)}>{children}</div>

        {/* Footer */}
        {hasFooter && (
          <DrawerFooter
            className={cn("border-t border-border flex-row justify-end gap-2", footerClassName)}
          >
            {extraActions?.map((action, idx) => (
              <ActionButton key={idx} action={action} onClose={onClose} />
            ))}

            {cancel && (
              <DrawerClose asChild>
                <ActionButton action={cancel} onClose={onClose} />
              </DrawerClose>
            )}

            {primary && <ActionButton action={primary} onClose={onClose} />}
          </DrawerFooter>
        )}
      </DrawerContent>
    </Drawer>
  )
}

// ---------------------------------------------------------------------------
// Internal ActionButton
// ---------------------------------------------------------------------------

const ActionButton = React.forwardRef<
  HTMLButtonElement,
  { action: DrawerAction; onClose: () => void } & React.ComponentPropsWithoutRef<typeof Button>
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
      {loading ? <LoadingSpinner /> : icon}
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
