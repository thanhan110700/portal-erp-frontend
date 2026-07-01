export const apiURL = import.meta.env.VITE_API_URL || "http://localhost:8000/api"

export const strictMode = import.meta.env.VITE_STRICT_MODE === "true"

export const appTitle = import.meta.env.VITE_APP_TITLE?.trim() || "Portal ERP"

export const siteName = import.meta.env.VITE_SITE_NAME?.trim() || "Portal ERP"

export const siteDomain = "portal-erp"
