import { memo, useEffect } from "react"
import { useMatches } from "react-router-dom"
import { useTranslation } from "react-i18next"

import { appTitle } from "@/config"

function routeHandlePageTitle(handle: unknown): string {
  if (handle == null || typeof handle !== "object" || !("title" in handle)) {
    return ""
  }
  const raw = (handle as { title: unknown }).title
  return typeof raw === "string" ? raw.trim() : ""
}

function DocumentTitleInner() {
  const matches = useMatches()
  const leaf = matches.at(-1)
  const rawTitle = routeHandlePageTitle(leaf?.handle)
  const { t } = useTranslation()
  const pageTitle = rawTitle ? t(rawTitle) : ""

  useEffect(() => {
    document.title = pageTitle ? `${pageTitle}` : appTitle
  }, [pageTitle])

  return null
}

export const DocumentTitle = memo(DocumentTitleInner)
