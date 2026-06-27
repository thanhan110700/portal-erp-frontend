import { memo } from "react"
import { useMatches } from "react-router-dom"
import { useTranslation } from "react-i18next"

import { cn } from "@/lib/utils"

type RouteTitleHandle = { title?: string }

type ScreenTitleProps = {
  className?: string
}

function ScreenTitleInner({ className }: ScreenTitleProps) {
  const matches = useMatches()
  const leaf = matches[matches.length - 1]
  const rawTitle = (leaf?.handle as RouteTitleHandle | undefined)?.title?.trim() ?? ""
  const { t } = useTranslation()
  const title = rawTitle ? t(rawTitle) : ""

  if (!title) {
    return null
  }

  return (
    <div className={cn("mb-6 flex items-center gap-2", className)}>
      <span className="h-5 w-0.5 shrink-0 rounded-full bg-red-600 dark:bg-red-400" aria-hidden />
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
    </div>
  )
}

export const ScreenTitle = memo(ScreenTitleInner)
