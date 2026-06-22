import { useState, useMemo, memo } from "react";
import { Layout, Menu } from "antd";
import { Link, useNavigation, Outlet } from "react-router-dom";

import { Header } from "@/components/common/Header";
import { ScreenTitle } from "@/components/common/ScreenTitle";
import { NAVIGATION_ITEMS, type NavItem } from "@/constants/header";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";

import logoRed from "@/assets/logo-s-red.png";
import logoWhite from "@/assets/logo-s-white.png";

const { Content, Sider } = Layout;

function NavigationProgress() {
  const { state } = useNavigation();
  if (state !== "loading") return null;
  return (
    <div className="nav-progress-bar">
      <div className="nav-progress-bar__inner" />
    </div>
  );
}

function filterNavItemsForUser(items: NavItem[]): NavItem[] {
  return items;
}

function DashboardLayoutInner() {
  const [collapsed, setCollapsed] = useState(false);
  const { theme } = useTheme();

  const navItems = useMemo(() => {
    return filterNavItemsForUser(NAVIGATION_ITEMS);
  }, []);

  // Build vertical menu items
  const menuItems = useMemo(() => {
    return navItems.map((item) => {
      const Icon = item.icon;
      if (item.items?.length) {
        return {
          key: item.name,
          icon: Icon ? <Icon /> : null,
          label: item.name,
          children: item.items.map((sub) => {
            const SubIcon = sub.icon;
            return {
              key: sub.href,
              icon: SubIcon ? <SubIcon /> : null,
              label: <Link to={sub.href}>{sub.name}</Link>,
            };
          }),
        };
      }
      return {
        key: item.href ?? item.name,
        icon: Icon ? <Icon /> : null,
        label: item.href ? <Link to={item.href}>{item.name}</Link> : item.name,
      };
    });
  }, [navItems]);

  const isDark = theme === "dark";
  const logoSrc = isDark ? logoWhite : logoRed;

  return (
    <Layout className="min-h-screen">
      <NavigationProgress />

      {/* Sider (Sidebar Menu) */}
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={(value) => setCollapsed(value)}
        trigger={null}
        theme={theme}
        className="border-r border-border/50 bg-card sticky top-0 h-screen left-0"
      >
        {/* Brand / Logo section */}
        <div
          className={cn(
            "h-16 flex items-center gap-3 border-b border-border/50 overflow-hidden",
            collapsed ? "justify-center p-0" : "justify-start px-5",
          )}
        >
          <img
            src={logoSrc}
            alt="Logo"
            className={cn(
              "h-6 w-auto object-contain shrink-0",
              !isDark && "[filter:hue-rotate(215deg)_saturate(1.5)]",
            )}
          />
        </div>

        {/* Sidebar Menu */}
        <Menu
          mode="inline"
          theme={theme}
          items={menuItems}
          className="!border-r-0"
        />
      </Sider>

      {/* Main Layout containing Topbar and Content */}
      <Layout>
        <Header
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed(!collapsed)}
        />

        <Content className="p-6 bg-background min-h-[calc(100vh-64px)] [overflow:initial]">
          <ScreenTitle />
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}

export const DashboardLayout = memo(DashboardLayoutInner);
