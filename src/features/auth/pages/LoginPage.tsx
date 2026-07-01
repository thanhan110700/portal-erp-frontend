import { useNavigate, Navigate } from "react-router-dom"
import { LockKeyhole, Shield, Server, Building2 } from "lucide-react"

import { ThemeToggle } from "@/components/common/ThemeToggle"
import { PageLoader } from "@/components/common/PageLoader"
import { LoginForm } from "@/features/auth/components/LoginForm"
import { PATHS } from "@/constants/paths"
import { useAuthStore } from "@/hooks/useAuthStore"
import { useSessionStore } from "@/hooks/useSessionStore"
import { siteName } from "@/config"
import type { User } from "@/shared/types"
import { useTranslation } from "react-i18next"

function LoginBrand({ variant = "default" }: { variant?: "default" | "inverted" }) {
  const isInverted = variant === "inverted"
  return (
    <span className="flex min-w-0 items-center gap-3">
      <span
        className={`flex size-10 shrink-0 items-center justify-center rounded-lg border ${
          isInverted
            ? "border-white/20 bg-white text-zinc-950"
            : "border-border bg-primary text-primary-foreground"
        }`}
        aria-hidden
      >
        <Building2 className="size-5" />
      </span>
      <span className="grid min-w-0 text-left leading-tight">
        <span
          className={`truncate text-lg font-bold ${isInverted ? "text-white" : "text-foreground"}`}
        >
          Portal ERP
        </span>
        <span
          className={`truncate text-xs font-semibold uppercase ${
            isInverted ? "text-zinc-400" : "text-muted-foreground"
          }`}
        >
          Operations Suite
        </span>
      </span>
    </span>
  )
}

export function LoginPage() {
  const { t } = useTranslation(["auth"])
  const navigate = useNavigate()
  const setUser = useAuthStore((s) => s.setUser)
  const setToken = useSessionStore((s) => s.setToken)
  const isLoading = useAuthStore((s) => s.isLoading)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  // Wait for AuthProvider to finish session check before making redirect decisions
  if (isLoading) {
    return <PageLoader />
  }

  if (isAuthenticated) {
    return <Navigate to={PATHS.dashboard} replace />
  }

  const handleSuccess = (user: User, token: string) => {
    setToken(token)
    setUser(user)
    void navigate(PATHS.dashboard)
  }

  return (
    <div className="relative flex min-h-screen w-full bg-background overflow-hidden">
      {/* Hero Section (Left on Desktop) */}
      <div className="relative hidden w-full lg:flex lg:w-[45%] xl:w-[50%] flex-col justify-between bg-zinc-950 overflow-hidden text-white p-12 lg:p-16">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.08)_0%,transparent_32%,rgba(255,255,255,0.06)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:40px_40px]" />

        <div className="relative z-20 flex items-center gap-3 font-bold">
          <LoginBrand variant="inverted" />
        </div>

        <div className="relative z-20 w-full max-w-md mb-36 animate-in slide-in-from-bottom-8 fade-in duration-1000 delay-150">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-md mb-8 shadow-sm">
            <LockKeyhole className="h-4 w-4 text-emerald-400" />
            <span className="text-xs font-semibold text-zinc-100 uppercase">
              {t("auth:login.system_access")}
            </span>
          </div>

          <h1 className="text-3xl lg:text-4xl font-bold text-white mb-6 leading-tight">
            {t("auth:login.hero_title")}
          </h1>
          <p className="text-lg text-zinc-300 font-medium leading-relaxed mb-10">
            {t("auth:login.hero_subtitle")}
          </p>

          <div className="flex gap-4">
            <div className="flex flex-col gap-2 p-5 rounded-lg bg-white/5 border border-white/10 backdrop-blur-md shadow-2xl transition-transform hover:-translate-y-1">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-emerald-400" />
                <span className="text-xl font-bold text-white">{t("auth:login.protected")}</span>
              </div>
              <span className="text-xs font-semibold text-zinc-400 uppercase">
                {t("auth:login.secure_connection")}
              </span>
            </div>
            <div className="flex flex-col gap-2 p-5 rounded-lg bg-white/5 border border-white/10 backdrop-blur-md shadow-2xl transition-transform hover:-translate-y-1">
              <div className="flex items-center gap-2">
                <Server className="h-5 w-5 text-blue-400" />
                <span className="text-xl font-bold text-white">{t("auth:login.online")}</span>
              </div>
              <span className="text-xs font-semibold text-zinc-400 uppercase">
                {t("auth:login.system_status")}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Form Section */}
      <div className="relative flex w-full lg:w-[55%] xl:w-[50%] flex-col justify-center bg-background px-6 sm:px-12 py-12 animate-in fade-in zoom-in-95 duration-500 shadow-[-20px_0_40px_-20px_rgba(0,0,0,0.1)]">
        <div className="absolute right-6 top-6 md:right-8 md:top-8 z-50">
          <ThemeToggle />
        </div>

        <div className="mx-auto w-full max-w-[400px]">
          <div className="flex justify-center lg:hidden mb-12">
            <LoginBrand />
          </div>

          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-3xl font-bold text-foreground">{t("auth:login.welcome_title")}</h2>
            <p className="text-muted-foreground mt-2 text-sm sm:text-base">
              {t("auth:login.welcome_subtitle")}
            </p>
          </div>

          <LoginForm onSuccess={handleSuccess} />

          <div className="mt-10 text-center">
            <p className="text-sm text-muted-foreground font-medium">
              {t("auth:login.provided_by", { name: siteName })}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
