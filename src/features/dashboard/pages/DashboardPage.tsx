import {
  Sparkles,
  ReceiptText,
  BarChart3,
  FileText,
  FolderPlus,
  TrendingUp,
  TrendingDown,
  Wallet,
  ListChecks,
} from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useAuthStore } from "@/hooks/useAuthStore"
import { useTranslation } from "react-i18next"

export function DashboardPage() {
  const { t } = useTranslation(["dashboard", "common"])
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()

  return (
    <div className="flex flex-col gap-6 pb-8 animate-in fade-in duration-500">
      {/* ── Welcome Banner ── */}
      <div className="relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6 p-6 sm:p-10 rounded-3xl border border-border/50 shadow-sm bg-zinc-950 text-white">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-500/20 blur-[80px] rounded-full mix-blend-screen pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-[300px] h-[300px] bg-emerald-500/20 blur-[80px] rounded-full mix-blend-screen pointer-events-none" />

        <div className="relative z-10 w-full lg:w-2/3">
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 rounded-full bg-white/10 border border-white/20 backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-xs font-semibold tracking-wide uppercase text-zinc-100">
              {t("dashboard:live")}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-5xl font-bold tracking-tight mb-3">
            {t("dashboard:welcome", { name: user?.name || "User" })}
          </h1>
          <p className="text-zinc-300 text-sm sm:text-base max-w-xl leading-relaxed">
            {t("dashboard:description")}
          </p>
        </div>
      </div>

      {/* ── Summary Cards (Horizontal Scroll on Mobile) ── */}
      <div className="flex overflow-x-auto gap-4 pb-2 -mx-2 px-2 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-4 no-scrollbar snap-x snap-mandatory">
        {/* Income Card */}
        <div className="min-w-[240px] flex-none snap-start p-5 rounded-2xl border bg-card shadow-sm flex flex-col justify-between space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-muted-foreground">
              {t("dashboard:summaryCards.totalIncome")}
            </span>
            <div className="size-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="size-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-emerald-600">345.000.000 ₫</div>
            <div className="text-xs text-muted-foreground mt-1">+12% so với tháng trước</div>
          </div>
        </div>

        {/* Expense Card */}
        <div className="min-w-[240px] flex-none snap-start p-5 rounded-2xl border bg-card shadow-sm flex flex-col justify-between space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-muted-foreground">
              {t("dashboard:summaryCards.totalExpense")}
            </span>
            <div className="size-8 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
              <TrendingDown className="size-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-rose-600">128.500.000 ₫</div>
            <div className="text-xs text-muted-foreground mt-1">-5% so với tháng trước</div>
          </div>
        </div>

        {/* Balance Card */}
        <div className="min-w-[240px] flex-none snap-start p-5 rounded-2xl border bg-card shadow-sm flex flex-col justify-between space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-muted-foreground">
              {t("dashboard:summaryCards.balance")}
            </span>
            <div className="size-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
              <Wallet className="size-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-blue-600">1.250.000.000 ₫</div>
            <div className="text-xs text-muted-foreground mt-1">Cập nhật lúc 08:30</div>
          </div>
        </div>

        {/* Pending Tasks Card */}
        <div className="min-w-[240px] flex-none snap-start p-5 rounded-2xl border bg-card shadow-sm flex flex-col justify-between space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-muted-foreground">
              {t("dashboard:summaryCards.pendingTasks")}
            </span>
            <div className="size-8 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center">
              <ListChecks className="size-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-foreground">12</div>
            <div className="text-xs text-muted-foreground mt-1">Cần xử lý trong tuần</div>
          </div>
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <div>
        <h2 className="text-lg font-bold tracking-tight mb-4">
          {t("dashboard:quickActions.title")}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            type="button"
            onClick={() => navigate("/finance/vouchers?create=true")}
            className="flex flex-col items-center justify-center gap-3 p-5 rounded-2xl border bg-card hover:bg-accent hover:border-accent shadow-sm transition-all active:scale-95"
          >
            <div className="size-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <ReceiptText className="size-6" />
            </div>
            <span className="text-sm font-medium text-center">
              {t("dashboard:quickActions.createVoucher")}
            </span>
          </button>

          <button
            type="button"
            onClick={() => navigate("/sales/quotes?create=true")}
            className="flex flex-col items-center justify-center gap-3 p-5 rounded-2xl border bg-card hover:bg-accent hover:border-accent shadow-sm transition-all active:scale-95"
          >
            <div className="size-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
              <FileText className="size-6" />
            </div>
            <span className="text-sm font-medium text-center">
              {t("dashboard:quickActions.newQuote")}
            </span>
          </button>

          <button
            type="button"
            onClick={() => navigate("/projects?create=true")}
            className="flex flex-col items-center justify-center gap-3 p-5 rounded-2xl border bg-card hover:bg-accent hover:border-accent shadow-sm transition-all active:scale-95"
          >
            <div className="size-12 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
              <FolderPlus className="size-6" />
            </div>
            <span className="text-sm font-medium text-center">
              {t("dashboard:quickActions.createProject")}
            </span>
          </button>

          <button
            type="button"
            onClick={() => navigate("/hr/kpi")}
            className="flex flex-col items-center justify-center gap-3 p-5 rounded-2xl border bg-card hover:bg-accent hover:border-accent shadow-sm transition-all active:scale-95"
          >
            <div className="size-12 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center">
              <BarChart3 className="size-6" />
            </div>
            <span className="text-sm font-medium text-center">
              {t("dashboard:quickActions.viewKpi")}
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}
