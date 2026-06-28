import { Link, useLocation } from "react-router-dom"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { ChevronRightIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: React.ReactNode
    isActive?: boolean
    items?: {
      title: string
      url: string
      icon?: React.ReactNode
    }[]
  }[]
}) {
  const { pathname } = useLocation()
  const { state, isMobile, setOpenMobile } = useSidebar()
  const isCollapsed = state === "collapsed" && !isMobile

  const handleNavigate = () => {
    if (isMobile) setOpenMobile(false)
  }

  const isRouteActive = (url: string) => {
    if (url === "/") {
      return pathname === "/"
    }
    return pathname === url || pathname.startsWith(url + "/")
  }

  return (
    <SidebarGroup>
      {!isCollapsed && (
        <SidebarGroupLabel className="px-3 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/50 mb-2">
          Menu
        </SidebarGroupLabel>
      )}
      <SidebarMenu>
        {items.map((item) => {
          const hasChildren = item.items && item.items.length > 0
          const isCurrentActive =
            isRouteActive(item.url) || (item.items?.some((sub) => isRouteActive(sub.url)) ?? false)

          if (!hasChildren) {
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  tooltip={item.title}
                  isActive={isRouteActive(item.url)}
                  className="group/menu-btn h-10 px-3 transition-all duration-300 hover:bg-sidebar-accent hover:text-sidebar-foreground data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-foreground"
                >
                  <Link to={item.url} onClick={handleNavigate}>
                    <div
                      className={cn(
                        "flex items-center gap-3 w-full",
                        isCollapsed && "justify-center gap-0",
                      )}
                    >
                      <div className="text-sidebar-foreground/60 transition-colors duration-300 group-hover/menu-btn:text-sidebar-foreground group-data-[active=true]/menu-btn:text-primary">
                        {item.icon}
                      </div>
                      <span
                        className={cn(
                          "truncate font-medium text-sm transition-colors duration-300",
                          isCollapsed && "hidden",
                        )}
                      >
                        {item.title}
                      </span>
                    </div>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          }

          return (
            <Collapsible
              key={item.title}
              asChild
              defaultOpen={item.isActive || isCurrentActive}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton
                    tooltip={item.title}
                    isActive={isCurrentActive}
                    className="group/menu-btn h-10 px-3 transition-all duration-300 hover:bg-sidebar-accent hover:text-sidebar-foreground data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-foreground"
                  >
                    <div
                      className={cn(
                        "flex items-center gap-3 w-full",
                        isCollapsed && "justify-center gap-0",
                      )}
                    >
                      <div className="text-sidebar-foreground/60 transition-colors duration-300 group-hover/menu-btn:text-sidebar-foreground group-data-[active=true]/menu-btn:text-primary">
                        {item.icon}
                      </div>
                      <span
                        className={cn(
                          "truncate font-medium text-sm flex-1 text-left transition-colors duration-300",
                          isCollapsed && "hidden",
                        )}
                      >
                        {item.title}
                      </span>
                      <ChevronRightIcon
                        className={cn(
                          "ml-auto size-4 text-sidebar-foreground/40 transition-transform duration-300 ease-in-out group-data-[state=open]/collapsible:rotate-90 group-hover/menu-btn:text-sidebar-foreground",
                          isCollapsed && "hidden",
                        )}
                      />
                    </div>
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent className="overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2">
                  <SidebarMenuSub className="mt-1 flex flex-col gap-1 border-l-2 border-sidebar-border/50 ml-4 pl-3 relative before:absolute before:left-[-2px] before:top-0 before:bottom-0 before:w-[2px] before:bg-gradient-to-b before:from-transparent before:via-primary/20 before:to-transparent">
                    {item.items?.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.title}>
                        <SidebarMenuSubButton
                          asChild
                          isActive={isRouteActive(subItem.url)}
                          className="group/sub-btn h-9 rounded-md transition-all duration-300 hover:bg-sidebar-accent hover:translate-x-1"
                        >
                          <Link
                            to={subItem.url}
                            onClick={handleNavigate}
                            className="flex items-center gap-2"
                          >
                            {subItem.icon && (
                              <div className="text-sidebar-foreground/50 transition-colors duration-300 group-hover/sub-btn:text-sidebar-foreground group-data-[active=true]/sub-btn:text-primary">
                                {subItem.icon}
                              </div>
                            )}
                            <span className="font-medium text-sm text-sidebar-foreground/80 transition-colors duration-300 group-hover/sub-btn:text-sidebar-foreground group-data-[active=true]/sub-btn:text-sidebar-foreground">
                              {subItem.title}
                            </span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
