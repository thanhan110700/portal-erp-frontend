import { useEffect, useState, useCallback } from "react"
import { useParams, useNavigate } from "react-router-dom"
import {
  ArrowLeft,
  Briefcase,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Percent,
  Compass,
  ArrowRightLeft,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SearchableSelect } from "@/components/common/SearchableSelect"
import { PageLoader } from "@/components/common/PageLoader"
import { useAuthStore } from "@/hooks/useAuthStore"
import { hasPermission, PermissionSlugs } from "@/constants/permissions"

import { projectApi } from "../api/projectApi"
import type { Project } from "../types/project"
import { useTranslation } from "react-i18next"

import { ProjectMembersTab } from "../components/ProjectMembersTab"
import { ProjectMilestonesTab } from "../components/ProjectMilestonesTab"
import { ProjectExpensesTab } from "../components/ProjectExpensesTab"
import { ProjectFilesTab } from "../components/ProjectFilesTab"
import { ProjectVouchersTab } from "../components/ProjectVouchersTab"

const STATUS_VARIANTS: Record<
  string,
  "default" | "secondary" | "success" | "warning" | "destructive" | "outline"
> = {
  planning: "secondary",
  quoting: "secondary",
  signed: "default",
  ongoing: "warning",
  testing: "warning",
  settled: "success",
  completed: "success",
}

const STATUS_OPTIONS = [
  { value: "planning", label: "Đang báo giá" },
  { value: "quoting", label: "Báo giá" },
  { value: "signed", label: "Đã ký" },
  { value: "ongoing", label: "Đang làm" },
  { value: "testing", label: "Nghiệm thu" },
  { value: "settled", label: "Quyết toán" },
  { value: "completed", label: "Hoàn tất" },
]

export function ProjectDetailPage() {
  const { t } = useTranslation(["projects", "common"])
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const projectId = parseInt(id || "0")

  const user = useAuthStore((s) => s.user)
  const canEdit = hasPermission(user?.permissions, PermissionSlugs.EditProjects)

  // Members
  const canCreateMember = hasPermission(user?.permissions, PermissionSlugs.CreateProjectMembers)
  const canEditMember = hasPermission(user?.permissions, PermissionSlugs.EditProjectMembers)
  const canDeleteMember = hasPermission(user?.permissions, PermissionSlugs.DeleteProjectMembers)

  // Expenses
  const canCreateExpense = hasPermission(user?.permissions, PermissionSlugs.CreateProjectExpenses)
  const canApproveExpense = hasPermission(user?.permissions, PermissionSlugs.ApproveProjectExpenses)
  const canDeleteExpense = hasPermission(user?.permissions, PermissionSlugs.DeleteProjectExpenses)

  const [project, setProject] = useState<Project | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [statusUpdating, setStatusUpdating] = useState(false)

  const loadProjectData = useCallback(async () => {
    if (!projectId) return
    setIsLoading(true)
    try {
      const data = await projectApi.get(projectId)
      setProject(data)
    } catch {
      toast.error(t("projects:detail.fetch_error"))
      void navigate("/projects")
    } finally {
      setIsLoading(false)
    }
  }, [projectId, navigate])

  useEffect(() => {
    void loadProjectData()
  }, [loadProjectData])

  const handleStatusChange = async (newStatus: string) => {
    if (!project) return
    setStatusUpdating(true)
    try {
      const updated = await projectApi.updateStatus(project.id, newStatus)
      setProject((prev) => (prev ? { ...prev, status: updated.status } : null))
      toast.success(t("projects:detail.status_update_success"))
      // Soft refresh other stats that might be recalculated
      const data = await projectApi.get(projectId)
      setProject(data)
    } catch (err: any) {
      const errMsg = err.response?.data?.message || t("projects:detail.status_update_error")
      toast.error(errMsg)
    } finally {
      setStatusUpdating(false)
    }
  }

  if (isLoading) {
    return <PageLoader />
  }

  if (!project) {
    return (
      <div className="p-6 text-center text-muted-foreground">{t("projects:detail.not_found")}</div>
    )
  }

  const contractVal = Number(project.contract_value || 0)
  const receivedVal = Number(project.total_received || 0)
  const spentVal = Number(project.total_spent || 0)
  const profitVal = Number(project.profit || 0)

  // Profit Margin
  const profitMargin = contractVal > 0 ? (profitVal / contractVal) * 100 : 0
  const isProfitPositive = profitVal >= 0

  return (
    <div className="flex flex-col gap-6">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/projects")}
          className="size-11 md:size-9"
        >
          <ArrowLeft className="size-5" />
        </Button>
        <div className="flex flex-1 flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Briefcase className="size-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                {project.project_name}
                <Badge variant="outline" className="font-mono text-xs uppercase">
                  {project.project_code}
                </Badge>
              </h1>
              <p className="text-sm text-muted-foreground">
                {t("projects:detail.customer")}{" "}
                <span className="font-medium text-foreground">{project.customer?.name || "—"}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant={STATUS_VARIANTS[project.status] || "outline"}
              className="text-sm px-3 py-1"
            >
              {t(`common:status.${project.status}`, {
                defaultValue: project.status,
              })}
            </Badge>
          </div>
        </div>
      </div>

      {/* ── Financial Cards & Progress ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border bg-card p-5 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
            <span>{t("projects:detail.contract_value_title")}</span>
            <DollarSign className="size-4 text-primary" />
          </div>
          <p className="text-xl font-bold font-mono text-foreground">
            {contractVal.toLocaleString("vi-VN")}{" "}
            <span className="text-xs">{t("projects:detail.currency_unit")}</span>
          </p>
          <div className="text-xs text-muted-foreground">
            {t("projects:detail.contract")}{" "}
            <span className="font-semibold">{project.contract?.name || "—"}</span>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-5 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
            <span>{t("projects:detail.received_title")}</span>
            <TrendingUp className="size-4 text-emerald-500" />
          </div>
          <p className="text-xl font-bold font-mono text-emerald-600">
            {receivedVal.toLocaleString("vi-VN")}{" "}
            <span className="text-xs">{t("projects:detail.currency_unit")}</span>
          </p>
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <Percent className="size-3" />
            <span>
              {t("projects:detail.received_progress")}{" "}
              {contractVal > 0 ? ((receivedVal / contractVal) * 100).toFixed(1) : 0}%
            </span>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-5 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
            <span>{t("projects:detail.spent_title")}</span>
            <TrendingDown className="size-4 text-rose-500" />
          </div>
          <p className="text-xl font-bold font-mono text-rose-600">
            {spentVal.toLocaleString("vi-VN")}{" "}
            <span className="text-xs">{t("projects:detail.currency_unit")}</span>
          </p>
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <Percent className="size-3" />
            <span>
              {t("projects:detail.spent_ratio")}{" "}
              {contractVal > 0 ? ((spentVal / contractVal) * 100).toFixed(1) : 0}%
            </span>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-5 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
            <span>{t("projects:detail.profit_title")}</span>
            {isProfitPositive ? (
              <TrendingUp className="size-4 text-emerald-500" />
            ) : (
              <TrendingDown className="size-4 text-rose-500" />
            )}
          </div>
          <p
            className={`text-xl font-bold font-mono ${isProfitPositive ? "text-emerald-600" : "text-rose-600"}`}
          >
            {profitVal.toLocaleString("vi-VN")}{" "}
            <span className="text-xs">{t("projects:detail.currency_unit")}</span>
          </p>
          <div className="text-xs text-muted-foreground">
            {t("projects:detail.profit_margin")}{" "}
            <span
              className={`font-semibold ${isProfitPositive ? "text-emerald-600" : "text-rose-600"}`}
            >
              {profitMargin.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left Sidebar: General Info & Actions ─────────────────────────── */}
        <div className="col-span-1 space-y-4">
          {canEdit && (
            <div className="rounded-xl border bg-card p-5 space-y-4 shadow-sm">
              <h3 className="font-semibold text-sm border-b pb-2 flex items-center gap-2">
                <ArrowRightLeft className="size-4 text-muted-foreground" />
                {t("projects:detail.change_status")}
              </h3>
              <div className="flex flex-col gap-2">
                <SearchableSelect
                  value={project.status}
                  onValueChange={handleStatusChange}
                  options={STATUS_OPTIONS.map((s) => ({
                    ...s,
                    label: t(`common:status.${s.value}`, { defaultValue: s.label }),
                  }))}
                  placeholder={t("projects:detail.select_status")}
                  disabled={statusUpdating}
                />
              </div>
            </div>
          )}

          <div className="rounded-xl border bg-card p-5 space-y-4 shadow-sm">
            <h3 className="font-semibold text-sm border-b pb-2 flex items-center gap-2">
              <Calendar className="size-4 text-muted-foreground" />
              {t("projects:detail.time_info")}
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">{t("projects:detail.start_date")}</span>
                <span className="font-medium text-foreground">{project.start_date || "—"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">
                  {t("projects:detail.end_date_expected")}
                </span>
                <span className="font-medium text-foreground">{project.end_date || "—"}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="text-muted-foreground">{t("projects:detail.progress")}</span>
                <span className="font-semibold text-primary">{project.progress_percent || 0}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <div
                  className="bg-primary h-full transition-all duration-300"
                  style={{ width: `${project.progress_percent || 0}%` }}
                />
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-card p-5 space-y-3 shadow-sm">
            <h3 className="font-semibold text-sm border-b pb-2 flex items-center gap-2">
              <Compass className="size-4 text-muted-foreground" />
              {t("projects:detail.description")}
            </h3>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
              {project.description || t("projects:detail.no_description")}
            </p>
          </div>
        </div>

        {/* ── Main Area: Tabs for Members, Milestones, Expenses, Files, Vouchers ── */}
        <div className="col-span-1 lg:col-span-2">
          <Tabs defaultValue="members" className="w-full">
            <TabsList className="w-full grid grid-cols-5 p-1 rounded-xl bg-muted/50 h-12 overflow-x-auto scrollbar-none whitespace-nowrap">
              <TabsTrigger value="members" className="rounded-lg py-2 text-xs md:text-sm">
                {t("projects:detail.tabs.members")}
              </TabsTrigger>
              <TabsTrigger value="milestones" className="rounded-lg py-2 text-xs md:text-sm">
                {t("projects:detail.tabs.milestones")}
              </TabsTrigger>
              <TabsTrigger value="expenses" className="rounded-lg py-2 text-xs md:text-sm">
                {t("projects:detail.tabs.expenses")}
              </TabsTrigger>
              <TabsTrigger value="files" className="rounded-lg py-2 text-xs md:text-sm">
                {t("projects:detail.tabs.files")}
              </TabsTrigger>
              <TabsTrigger value="vouchers" className="rounded-lg py-2 text-xs md:text-sm">
                {t("projects:detail.tabs.vouchers")}
              </TabsTrigger>
            </TabsList>

            <div className="mt-4 p-5 rounded-xl border bg-card min-h-[400px]">
              <TabsContent value="members" className="m-0 focus-visible:outline-none">
                <ProjectMembersTab
                  projectId={project.id}
                  members={project.members || []}
                  onRefresh={loadProjectData}
                  canCreate={canCreateMember}
                  canEdit={canEditMember}
                  canDelete={canDeleteMember}
                />
              </TabsContent>

              <TabsContent value="milestones" className="m-0 focus-visible:outline-none">
                <ProjectMilestonesTab
                  projectId={project.id}
                  milestones={project.milestones || []}
                  onRefresh={loadProjectData}
                  canEdit={canEdit}
                />
              </TabsContent>

              <TabsContent value="expenses" className="m-0 focus-visible:outline-none">
                <ProjectExpensesTab
                  projectId={project.id}
                  expenses={project.expenses || []}
                  onRefresh={loadProjectData}
                  canCreate={canCreateExpense}
                  canApprove={canApproveExpense}
                  canDelete={canDeleteExpense}
                />
              </TabsContent>

              <TabsContent value="files" className="m-0 focus-visible:outline-none">
                <ProjectFilesTab
                  projectId={project.id}
                  files={project.files || []}
                  onRefresh={loadProjectData}
                  canEdit={canEdit}
                  isAdmin={canEdit} // Reusing canEdit for admin file powers for now
                />
              </TabsContent>

              <TabsContent value="vouchers" className="m-0 focus-visible:outline-none">
                <ProjectVouchersTab projectId={project.id} />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
