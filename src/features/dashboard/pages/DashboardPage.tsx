import { Sparkles } from "lucide-react"
import { useAuthStore } from "@/hooks/useAuthStore"
import { useTranslation } from "react-i18next"

export function DashboardPage() {
  const { t } = useTranslation(["dashboard"])
  const user = useAuthStore((s) => s.user)

  return (
    <div className="flex flex-col gap-6 pb-8 animate-in fade-in duration-500">
      <div className="relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-8 p-8 sm:p-10 rounded-3xl border border-border/50 shadow-sm bg-zinc-950 text-white">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/20 blur-[100px] rounded-full mix-blend-screen pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-[400px] h-[400px] bg-emerald-500/20 blur-[100px] rounded-full mix-blend-screen pointer-events-none" />

        <div className="relative z-10 w-full lg:w-2/3">
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-5 rounded-full bg-white/10 border border-white/20 backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-xs font-semibold tracking-wide uppercase text-zinc-100">
              {t("dashboard:live")}
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
            {t("dashboard:welcome", { name: user?.name || "User" })}
          </h1>
          <p className="text-zinc-300 text-base sm:text-lg max-w-xl leading-relaxed">
            {t("dashboard:description")}
          </p>
        </div>
      </div>
    </div>
  )
}
