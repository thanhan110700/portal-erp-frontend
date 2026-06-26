import { memo } from "react"
import { Outlet, useMatches, useNavigation } from "react-router-dom"

import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/sidebar/app-sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Separator } from "@/components/ui/separator"
import { ThemeToggle } from "@/components/common/ThemeToggle"
import { MobileBottomNav } from "@/components/common/MobileBottomNav"
import { useIsMobile } from "@/hooks/useMobile"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb"

type RouteTitleHandle = { title?: string }

function useRouteTitle() {
  const matches = useMatches()
  const leaf = matches[matches.length - 1]
  return (leaf?.handle as RouteTitleHandle | undefined)?.title?.trim() ?? ""
}

function NavigationProgress() {
  const { state } = useNavigation()
  if (state !== "loading") return null
  return (
    <div className="fixed top-0 left-0 z-50 h-0.5 w-full overflow-hidden" aria-hidden>
      <div
        className="h-full w-1/4 bg-primary"
        style={{ animation: "nav-progress 1.2s ease-in-out infinite" }}
      />
    </div>
  )
}

function DashboardLayoutInner() {
  const title = useRouteTitle()
  const isMobile = useIsMobile()

  return (
    <TooltipProvider>
      {/* On mobile: no persistent sidebar — just bottom nav + sheet via SidebarTrigger */}
      <SidebarProvider defaultOpen={!isMobile}>
        <NavigationProgress />

        {/* Sidebar only visible on desktop, Sheet on mobile */}
        <AppSidebar />

        <SidebarInset>
          {/* Sticky header */}
          <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center justify-between gap-2 border-b bg-background/95 backdrop-blur px-3 md:px-4 supports-[backdrop-filter]:bg-background/60">
            <div className="flex items-center gap-2">
              {/* On mobile: hamburger opens full sidebar Sheet */}
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-1 h-4" />
              {title && (
                <Breadcrumb>
                  <BreadcrumbList>
                    <BreadcrumbItem>
                      <BreadcrumbPage className="font-medium text-sm">{title}</BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
              )}
            </div>
            <div className="flex items-center gap-1">
              <ThemeToggle />
            </div>
          </header>

          {/* Main content — extra bottom padding on mobile for bottom nav */}
          <main className={`flex-1 min-w-0 px-3 py-4 md:px-6 md:py-6 ${isMobile ? "pb-20" : ""}`}>
            {/* <ScreenTitle /> */}
            <Outlet />
          </main>
        </SidebarInset>
      </SidebarProvider>

      {/* Mobile-only bottom navigation bar */}
      <MobileBottomNav />
    </TooltipProvider>
  )
}

export const DashboardLayout = memo(DashboardLayoutInner)
export default DashboardLayout
