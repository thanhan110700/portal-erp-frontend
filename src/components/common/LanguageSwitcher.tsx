import { memo } from "react"
import { Button } from "@/components/ui/button"
import { useTranslation } from "react-i18next"

function LanguageSwitcherInner() {
  const { i18n } = useTranslation()

  const toggleLanguage = () => {
    // Determine target language based on current language
    const currentLang = i18n.language || localStorage.getItem("i18nextLng") || "vi"
    const newLang = currentLang.startsWith("vi") ? "en" : "vi"
    void i18n.changeLanguage(newLang)
  }

  const currentLang = i18n.language || localStorage.getItem("i18nextLng") || "vi"
  const isVi = currentLang.startsWith("vi")

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={toggleLanguage}
      aria-label="Toggle language"
      title={isVi ? "Switch to English" : "Chuyển sang Tiếng Việt"}
      className="font-bold text-xs"
    >
      {isVi ? "VI" : "EN"}
    </Button>
  )
}

export const LanguageSwitcher = memo(LanguageSwitcherInner)
