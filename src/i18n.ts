import i18n from "i18next"
import LanguageDetector from "i18next-browser-languagedetector"
import { initReactI18next } from "react-i18next"

// EN Locales
import authEN from "./locales/en/auth.json"
import commonEN from "./locales/en/common.json"
import dashboardEN from "./locales/en/dashboard.json"
import errorsEN from "./locales/en/errors.json"
import financeEN from "./locales/en/finance.json"
import hrEN from "./locales/en/hr.json"
import projectsEN from "./locales/en/projects.json"
import reportsEN from "./locales/en/reports.json"
import salesEN from "./locales/en/sales.json"

// VI Locales
import authVI from "./locales/vi/auth.json"
import commonVI from "./locales/vi/common.json"
import dashboardVI from "./locales/vi/dashboard.json"
import errorsVI from "./locales/vi/errors.json"
import financeVI from "./locales/vi/finance.json"
import hrVI from "./locales/vi/hr.json"
import projectsVI from "./locales/vi/projects.json"
import reportsVI from "./locales/vi/reports.json"
import salesVI from "./locales/vi/sales.json"

const resources = {
  en: {
    common: commonEN,
    auth: authEN,
    dashboard: dashboardEN,
    errors: errorsEN,
    finance: financeEN,
    hr: hrEN,
    projects: projectsEN,
    reports: reportsEN,
    sales: salesEN,
  },
  vi: {
    common: commonVI,
    auth: authVI,
    dashboard: dashboardVI,
    errors: errorsVI,
    finance: financeVI,
    hr: hrVI,
    projects: projectsVI,
    reports: reportsVI,
    sales: salesVI,
  },
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    ns: ["common", "auth", "dashboard", "errors", "finance", "hr", "projects", "reports", "sales"],
    defaultNS: "common",
    fallbackLng: "vi",
    supportedLngs: ["vi", "en"],
    debug: false,
    interpolation: {
      escapeValue: false,
    },
  })
  .catch(console.error)

export default i18n
